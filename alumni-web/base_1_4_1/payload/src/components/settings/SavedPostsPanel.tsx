"use client";

import {
  ArrowLeft,
  BookmarkCheck,
  ExternalLink,
  Heart,
  MessageCircle,
  Trash2,
} from "lucide-react";
import {
  useEffect,
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
  onBack: () => void;
};

export default function SavedPostsPanel({
  userId,
  onBack,
}: Props) {
  const [posts, setPosts] =
    useState<any[]>([]);
  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let active = true;

    void load();

    return () => {
      active = false;
    };

    async function load() {
      setLoading(true);

      const { data: saveRows, error } =
        await supabase
          .from("post_saves")
          .select(
            "post_id,created_at"
          )
          .eq("user_id", userId)
          .order("created_at", {
            ascending: false,
          });

      if (error) {
        console.error(
          "Error cargando guardados:",
          error
        );

        if (active) {
          setPosts([]);
          setLoading(false);
        }

        return;
      }

      const ids = (
        saveRows || []
      ).map(
        (row: any) =>
          row.post_id
      );

      if (!ids.length) {
        if (active) {
          setPosts([]);
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
              career,
              university
            ),
            likes (
              user_id
            )
          `)
          .in("id", ids),
        supabase
          .from("comments")
          .select("post_id")
          .in("post_id", ids),
        supabase
          .from("post_media")
          .select("*")
          .in("post_id", ids)
          .order(
            "sort_order",
            {
              ascending: true,
            }
          ),
      ]);

      const hydrated =
        await hydratePostMedia(
          (postsData ||
            []) as any[]
        );

      const media =
        await hydratePostMediaItems(
          (mediaRaw ||
            []) as any[]
        );

      const byId = new Map(
        hydrated.map(
          (post: any) => [
            post.id,
            {
              ...post,
              commentsCount:
                (
                  commentsData ||
                  []
                ).filter(
                  (
                    comment: any
                  ) =>
                    comment.post_id ===
                    post.id
                ).length,
              mediaItems:
                media.filter(
                  (
                    item: any
                  ) =>
                    item.post_id ===
                    post.id
                ),
            },
          ]
        )
      );

      const ordered = [];

      for (
        const row of
        saveRows || []
      ) {
        const post =
          byId.get(
            row.post_id
          );

        if (!post)
          continue;

        if (
          !post.mediaItems
            ?.length &&
          post.image_url
        ) {
          post.mediaItems =
            [
              {
                post_id:
                  post.id,
                user_id:
                  post.user_id,
                media_type:
                  "image",
                media_url:
                  post.image_url,
                media_path:
                  post.image_path ||
                  null,
                media_bucket:
                  post.media_bucket ||
                  "posts",
                mime_type:
                  null,
                sort_order:
                  0,
              },
            ];
        }

        ordered.push(
          post
        );
      }

      if (active) {
        setPosts(ordered);
        setLoading(false);
      }
    }
  }, [userId]);

  async function removeSaved(
    postId: number
  ) {
    const previous =
      posts;

    setPosts(
      (current) =>
        current.filter(
          (post) =>
            post.id !==
            postId
        )
    );

    const { error } =
      await supabase
        .from(
          "post_saves"
        )
        .delete()
        .eq(
          "post_id",
          postId
        )
        .eq(
          "user_id",
          userId
        );

    if (error) {
      setPosts(
        previous
      );
      alert(
        error.message
      );
    }
  }

  return (
    <div className="alumni-saved-posts-panel">
      <div className="mb-4 flex items-center gap-3 border-b border-[var(--app-border)] pb-4">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--app-muted)] transition hover:bg-[var(--app-soft)] hover:text-[var(--app-text)]"
          aria-label="Volver a Perfil"
        >
          <ArrowLeft
            size={20}
          />
        </button>

        <div className="min-w-0">
          <h3 className="text-[17px] font-black text-[var(--app-text)]">
            Guardados
          </h3>
          <p className="mt-0.5 text-[13px] leading-5 text-[var(--app-muted-2)]">
            Solo tú puedes ver las publicaciones que guardas.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[13px] text-[var(--app-muted-2)]">
          Cargando guardados...
        </div>
      ) : posts.length ===
        0 ? (
        <div className="py-14 text-center">
          <BookmarkCheck
            size={27}
            className="mx-auto text-[var(--app-muted-3)]"
          />
          <p className="mt-3 text-sm font-black text-[var(--app-text)]">
            Aún no tienes publicaciones guardadas
          </p>
          <p className="mx-auto mt-1 max-w-sm text-[13px] leading-5 text-[var(--app-muted-2)]">
            Usa el menú de tres puntos de una publicación y selecciona Guardar publicación.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--app-border)]">
          {posts.map(
            (post) => {
              const media =
                (post.mediaItems ||
                  []) as PostMediaItem[];

              const first =
                media[0] ||
                null;

              const content =
                String(
                  post.content ||
                    ""
                ).trim();

              const short =
                content.length >
                380
                  ? `${content
                      .slice(
                        0,
                        380
                      )
                      .trim()}…`
                  : content;

              return (
                <article
                  key={
                    post.id
                  }
                  className="py-5 first:pt-1"
                >
                  <div className="flex items-center gap-3">
                    <a
                      href={`/u/${post.profiles?.username}`}
                      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--app-soft-strong)] text-xs font-black text-[var(--app-text)]"
                    >
                      {post
                        .profiles
                        ?.avatar_url ? (
                        <img
                          src={
                            post
                              .profiles
                              .avatar_url
                          }
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        post
                          .profiles
                          ?.username
                          ?.charAt(
                            0
                          )
                          ?.toUpperCase() ||
                        "A"
                      )}
                    </a>

                    <div className="min-w-0 flex-1">
                      <a
                        href={`/u/${post.profiles?.username}`}
                        className="truncate text-[14px] font-black text-[var(--app-text)] hover:underline"
                      >
                        @
                        {post
                          .profiles
                          ?.username ||
                          "alumni"}
                      </a>

                      <p className="mt-0.5 truncate text-[12px] text-[var(--app-muted-2)]">
                        {[
                          post
                            .profiles
                            ?.career,
                          post
                            .profiles
                            ?.university,
                        ]
                          .filter(
                            Boolean
                          )
                          .join(
                            " · "
                          ) ||
                          "Comunidad Alumni"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        void removeSaved(
                          post.id
                        )
                      }
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--app-muted-2)] transition hover:bg-red-500/10 hover:text-red-400"
                      aria-label="Quitar de Guardados"
                      title="Quitar de Guardados"
                    >
                      <Trash2
                        size={
                          17
                        }
                      />
                    </button>
                  </div>

                  {short && (
                    <p className="mt-3 whitespace-pre-wrap text-[14px] leading-6 text-[var(--app-text-soft)]">
                      {short}
                    </p>
                  )}

                  {first && (
                    <a
                      href={`/feed?post=${post.id}`}
                      className="relative mt-3 block overflow-hidden bg-[#05070b]"
                    >
                      {first.media_type ===
                      "video" ? (
                        <video
                          src={
                            first.media_url ||
                            ""
                          }
                          muted
                          playsInline
                          preload="metadata"
                          className="max-h-[460px] w-full object-contain"
                        />
                      ) : (
                        <img
                          src={
                            first.media_url ||
                            ""
                          }
                          alt=""
                          loading="lazy"
                          className="max-h-[460px] w-full object-contain"
                        />
                      )}

                      {media.length >
                        1 && (
                        <span className="absolute right-3 top-3 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-black text-white backdrop-blur">
                          1/
                          {
                            media.length
                          }
                        </span>
                      )}
                    </a>
                  )}

                  <div className="mt-3 flex items-center gap-4 text-[12px] font-semibold text-[var(--app-muted-2)]">
                    <span className="inline-flex items-center gap-1.5">
                      <Heart
                        size={
                          15
                        }
                      />
                      {post
                        .likes
                        ?.length ||
                        0}
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <MessageCircle
                        size={
                          15
                        }
                      />
                      {post.commentsCount ||
                        0}
                    </span>

                    <a
                      href={`/feed?post=${post.id}`}
                      className="ml-auto inline-flex items-center gap-1.5 font-bold text-[var(--app-text-soft)] hover:text-[var(--app-text)]"
                    >
                      Abrir
                      <ExternalLink
                        size={
                          14
                        }
                      />
                    </a>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}

/* ALUMNI_1_4_1_SAVED_POSTS_PANEL */
