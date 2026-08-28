"use client";

import {
  ExternalLink,
  Heart,
  MessageCircle,
  Repeat2,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import {
  hydratePostMediaItems,
  type PostMediaItem,
} from "@/lib/feedMedia";
import { hydratePostMedia } from "@/lib/privateMedia";

type Props = {
  userId: string;
  username: string;
};

type Entry = {
  repostedAt: string;
  post: any;
};

export default function ProfileRepostsTab({
  userId,
  username,
}: Props) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void (async () => {
      setLoading(true);

      const { data: repostRows, error: repostError } =
        await supabase
          .from("post_reposts")
          .select("post_id,created_at")
          .eq("user_id", userId)
          .order("created_at", {
            ascending: false,
          });

      if (repostError) {
        console.error(
          "Error cargando compartidos:",
          repostError
        );

        if (active) {
          setEntries([]);
          setLoading(false);
        }

        return;
      }

      const postIds = (repostRows || []).map(
        (row: any) => row.post_id
      );

      if (!postIds.length) {
        if (active) {
          setEntries([]);
          setLoading(false);
        }
        return;
      }

      const [
        { data: postsData },
        { data: commentsData },
        { data: mediaRaw },
      ] = await Promise.all([
        supabase
          .from("posts")
          .select(`
            *,
            profiles (
              username,
              avatar_url,
              full_name,
              university,
              career
            ),
            likes (
              user_id
            )
          `)
          .in("id", postIds),
        supabase
          .from("comments")
          .select("post_id")
          .in("post_id", postIds),
        supabase
          .from("post_media")
          .select("*")
          .in("post_id", postIds)
          .order("sort_order", {
            ascending: true,
          }),
      ]);

      const hydratedPosts =
        await hydratePostMedia(
          (postsData || []) as any[]
        );

      const mediaRows =
        await hydratePostMediaItems(
          (mediaRaw || []) as any[]
        );

      const postsById = new Map(
        hydratedPosts.map((post: any) => [
          post.id,
          {
            ...post,
            commentsCount:
              (commentsData || []).filter(
                (comment: any) =>
                  comment.post_id === post.id
              ).length,
            mediaItems: mediaRows.filter(
              (item: any) =>
                item.post_id === post.id
            ),
          },
        ])
      );

      const next: Entry[] = [];

      for (const row of repostRows || []) {
        const post = postsById.get(row.post_id);

        if (!post) continue;

        if (
          !post.mediaItems?.length &&
          post.image_url
        ) {
          post.mediaItems = [
            {
              post_id: post.id,
              user_id: post.user_id,
              media_type: "image",
              media_url: post.image_url,
              media_path:
                post.image_path || null,
              media_bucket:
                post.media_bucket ||
                "posts",
              mime_type: null,
              sort_order: 0,
            },
          ];
        }

        next.push({
          repostedAt: row.created_at,
          post,
        });
      }

      if (active) {
        setEntries(next);
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [userId]);

  const countLabel = useMemo(
    () =>
      entries.length === 1
        ? "1 publicación compartida"
        : `${entries.length} publicaciones compartidas`,
    [entries.length]
  );

  if (loading) {
    return (
      <section className="py-12 text-center text-sm text-[var(--app-muted-2)]">
        Cargando compartidos...
      </section>
    );
  }

  if (!entries.length) {
    return (
      <section className="py-14 text-center">
        <Repeat2
          size={25}
          className="mx-auto text-[var(--app-muted-3)]"
        />
        <p className="mt-3 text-sm font-black text-[var(--app-text)]">
          Aún no hay compartidos
        </p>
        <p className="mx-auto mt-1 max-w-sm text-[13px] leading-5 text-[var(--app-muted-2)]">
          Cuando @{username} comparta una publicación,
          aparecerá aquí sin duplicar el contenido original.
        </p>
      </section>
    );
  }

  return (
    <section className="pt-3">
      <div className="pb-3 text-[12px] font-semibold text-[var(--app-muted-2)]">
        {countLabel}
      </div>

      <div className="divide-y divide-[var(--app-border)]">
        {entries.map(({ post }) => {
          const media =
            (post.mediaItems ||
              []) as PostMediaItem[];

          const firstMedia =
            media[0] || null;

          const content =
            String(
              post.content || ""
            ).trim();

          const shortContent =
            content.length > 420
              ? `${content.slice(
                  0,
                  420
                ).trim()}…`
              : content;

          return (
            <article
              key={post.id}
              className="py-5 first:pt-2"
            >
              <div className="mb-3 flex items-center gap-2 pl-[52px] text-[12px] font-bold text-[var(--app-muted-2)]">
                <Repeat2
                  size={16}
                  className="shrink-0"
                />
                <span>
                  @{username} compartió
                </span>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={`/u/${post.profiles?.username}`}
                  className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--app-soft-strong)] text-xs font-black text-[var(--app-text)]"
                >
                  {post.profiles?.avatar_url ? (
                    <img
                      src={
                        post.profiles
                          .avatar_url
                      }
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    post.profiles?.username
                      ?.charAt(0)
                      ?.toUpperCase() ||
                    "A"
                  )}
                </a>

                <div className="min-w-0 flex-1">
                  <a
                    href={`/u/${post.profiles?.username}`}
                    className="truncate text-[14px] font-black text-[var(--app-text)] hover:underline"
                  >
                    @{post.profiles?.username ||
                      "alumni"}
                  </a>

                  <p className="mt-0.5 truncate text-[12px] text-[var(--app-muted-2)]">
                    {[
                      post.profiles?.career,
                      post.profiles
                        ?.university,
                    ]
                      .filter(Boolean)
                      .join(" · ") ||
                      "Comunidad Alumni"}
                  </p>
                </div>
              </div>

              {shortContent && (
                <p className="mt-3 whitespace-pre-wrap text-[15px] leading-6 text-[var(--app-text-soft)]">
                  {shortContent}
                </p>
              )}

              {firstMedia && (
                <a
                  href={`/feed?post=${post.id}`}
                  className="relative mt-3 block overflow-hidden bg-[#05070b]"
                >
                  {firstMedia.media_type ===
                  "video" ? (
                    <video
                      src={
                        firstMedia.media_url ||
                        ""
                      }
                      muted
                      playsInline
                      preload="metadata"
                      className="max-h-[500px] w-full object-contain"
                    />
                  ) : (
                    <img
                      src={
                        firstMedia.media_url ||
                        ""
                      }
                      alt=""
                      loading="lazy"
                      className="max-h-[500px] w-full object-contain"
                    />
                  )}

                  {media.length > 1 && (
                    <span className="absolute right-3 top-3 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-black text-white backdrop-blur">
                      1/{media.length}
                    </span>
                  )}
                </a>
              )}

              <div className="mt-3 flex items-center gap-4 text-[12px] font-semibold text-[var(--app-muted-2)]">
                <span className="inline-flex items-center gap-1.5">
                  <Heart size={15} />
                  {post.likes?.length ||
                    0}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle
                    size={15}
                  />
                  {post.commentsCount ||
                    0}
                </span>

                <a
                  href={`/feed?post=${post.id}`}
                  className="ml-auto inline-flex items-center gap-1.5 font-bold text-[var(--app-text-soft)] hover:text-[var(--app-text)]"
                >
                  Abrir publicación
                  <ExternalLink
                    size={14}
                  />
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* ALUMNI_1_4_1_PROFILE_REPOSTS_TAB */
