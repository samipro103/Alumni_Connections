"use client";

import { supabase } from "@/lib/supabase";
import { preparePostImage } from "@/lib/postImagePipeline";

export type PostMediaItem = {
  id?: number;
  post_id: number;
  user_id: string;
  media_type: "image" | "video";
  media_url: string | null;
  media_path: string | null;
  media_bucket: "posts" | "private-posts";
  mime_type: string | null;
  sort_order: number;
  width?: number | null;
  height?: number | null;
  created_at?: string;
};

type UploadResult = {
  items: PostMediaItem[];
  firstImage:
    | {
        imageUrl: string | null;
        imagePath: string | null;
        mediaBucket: "posts" | "private-posts";
      }
    | null;
};

const MAX_MEDIA = 10;
const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

function safeName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "_")
    .slice(-120);
}

function isVideo(file: File) {
  return file.type.startsWith("video/");
}

export function validatePostMediaFiles(files: File[]) {
  if (files.length > MAX_MEDIA) {
    throw new Error("Puedes agregar hasta 10 fotos o videos.");
  }

  for (const file of files) {
    if (
      !file.type.startsWith("image/") &&
      !file.type.startsWith("video/")
    ) {
      throw new Error("Solo puedes publicar fotos o videos.");
    }

    if (isVideo(file) && file.size > MAX_VIDEO_BYTES) {
      throw new Error("Cada video puede pesar hasta 80 MB.");
    }
  }
}

async function signedMap(bucket: string, paths: string[]) {
  const unique = [...new Set(paths.filter(Boolean))];

  if (!unique.length) {
    return new Map<string, string>();
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(unique, 60 * 60);

  if (error) {
    console.error(`[Alumni feed media] ${bucket}:`, error);
    return new Map<string, string>();
  }

  return new Map(
    (data || []).map((item) => [
      item.path,
      item.signedUrl || "",
    ])
  );
}

export async function hydratePostMediaItems<
  T extends {
    media_bucket?: string | null;
    media_path?: string | null;
    media_url?: string | null;
  }
>(rows: T[]): Promise<T[]> {
  const privatePaths = rows
    .filter(
      (row) =>
        row.media_bucket === "private-posts" &&
        Boolean(row.media_path)
    )
    .map((row) => row.media_path as string);

  const map = await signedMap("private-posts", privatePaths);

  return rows.map((row) => {
    if (
      row.media_bucket !== "private-posts" ||
      !row.media_path
    ) {
      return row;
    }

    return {
      ...row,
      media_url: map.get(row.media_path) || null,
    };
  });
}

export async function uploadPostMediaFiles({
  files,
  userId,
  postId,
  isPrivate,
}: {
  files: File[];
  userId: string;
  postId: number;
  isPrivate: boolean;
}): Promise<UploadResult> {
  validatePostMediaFiles(files);

  if (!files.length) {
    return {
      items: [],
      firstImage: null,
    };
  }

  const bucket: "posts" | "private-posts" =
    isPrivate ? "private-posts" : "posts";

  const uploadedPaths: string[] = [];
  const rows: PostMediaItem[] = [];

  try {
    for (let index = 0; index < files.length; index += 1) {
      const input = files[index];
      const video = isVideo(input);

      const prepared = video
        ? {
            file: input,
            width: null,
            height: null,
          }
        : await preparePostImage(input);

      const file = prepared.file;
      const path = `${userId}/${postId}/${Date.now()}-${index}-${safeName(
        file.name
      )}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: "31536000",
          upsert: false,
          contentType: file.type || undefined,
        });

      if (uploadError) {
        throw uploadError;
      }

      uploadedPaths.push(path);

      const publicUrl = isPrivate
        ? null
        : supabase.storage.from(bucket).getPublicUrl(path).data
            .publicUrl;

      rows.push({
        post_id: postId,
        user_id: userId,
        media_type: video ? "video" : "image",
        media_url: publicUrl,
        media_path: path,
        media_bucket: bucket,
        mime_type: file.type || null,
        sort_order: index,
        width:
          "width" in prepared
            ? Number(prepared.width || 0) || null
            : null,
        height:
          "height" in prepared
            ? Number(prepared.height || 0) || null
            : null,
      });
    }

    const { data, error } = await supabase
      .from("post_media")
      .insert(rows)
      .select("*");

    if (error) {
      throw error;
    }

    const inserted = (data || rows) as PostMediaItem[];

    const firstImageRow = rows.find(
      (row) => row.media_type === "image"
    );

    return {
      items: inserted,
      firstImage: firstImageRow
        ? {
            imageUrl: firstImageRow.media_url,
            imagePath: firstImageRow.media_path,
            mediaBucket: firstImageRow.media_bucket,
          }
        : null,
    };
  } catch (error) {
    if (uploadedPaths.length) {
      await supabase.storage
        .from(bucket)
        .remove(uploadedPaths)
        .catch(() => {});
    }

    throw error;
  }
}

export async function removePostMedia(
  items: PostMediaItem[]
) {
  const byBucket = new Map<string, string[]>();

  for (const item of items) {
    if (!item.media_path) continue;

    const current = byBucket.get(item.media_bucket) || [];
    current.push(item.media_path);
    byBucket.set(item.media_bucket, current);
  }

  await Promise.all(
    [...byBucket.entries()].map(([bucket, paths]) =>
      supabase.storage.from(bucket).remove(paths)
    )
  );
}

/* ALUMNI_1_4_0_FEED_MEDIA */
