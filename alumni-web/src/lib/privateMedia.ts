import { supabase } from "@/lib/supabase";

type PostMediaRow = {
  image_url?: string | null;
  image_path?: string | null;
  media_bucket?: string | null;
};

type StoryMediaRow = {
  media_url?: string | null;
  media_path?: string | null;
  media_bucket?: string | null;
};

async function signedMap(
  bucket: string,
  paths: string[]
) {
  const unique = [
    ...new Set(
      paths.filter(Boolean)
    ),
  ];

  if (!unique.length) {
    return new Map<string, string>();
  }

  const { data, error } =
    await supabase.storage
      .from(bucket)
      .createSignedUrls(
        unique,
        60 * 60
      );

  if (error) {
    console.error(
      `[Alumni media] ${bucket}:`,
      error
    );
    return new Map<string, string>();
  }

  return new Map(
    (data || []).map((item) => [
      item.path,
      item.signedUrl || "",
    ])
  );
}

export async function hydratePostMedia<
  T extends PostMediaRow
>(
  rows: T[]
): Promise<T[]> {
  const paths = rows
    .filter(
      (row) =>
        row.media_bucket ===
          "private-posts" &&
        Boolean(row.image_path)
    )
    .map(
      (row) =>
        row.image_path as string
    );

  const map = await signedMap(
    "private-posts",
    paths
  );

  return rows.map((row) => {
    if (
      row.media_bucket !==
        "private-posts" ||
      !row.image_path
    ) {
      return row;
    }

    return {
      ...row,
      image_url:
        map.get(row.image_path) ||
        null,
    };
  });
}

export async function hydrateStoryMedia<
  T extends StoryMediaRow
>(
  rows: T[]
): Promise<T[]> {
  const paths = rows
    .filter(
      (row) =>
        row.media_bucket ===
          "private-stories" &&
        Boolean(row.media_path)
    )
    .map(
      (row) =>
        row.media_path as string
    );

  const map = await signedMap(
    "private-stories",
    paths
  );

  return rows.map((row) => {
    if (
      row.media_bucket !==
        "private-stories" ||
      !row.media_path
    ) {
      return row;
    }

    return {
      ...row,
      media_url:
        map.get(row.media_path) ||
        "",
    };
  });
}
