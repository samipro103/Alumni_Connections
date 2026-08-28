"use client";

import {
  BookmarkCheck,
  ExternalLink,
  Heart,
  MessageCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  hydratePostMediaItems,
  type PostMediaItem,
} from "@/lib/feedMedia";
import { hydratePostMedia } from "@/lib/privateMedia";

export default function ProfileSavedTab({
  userId,
}: {
  userId: string;
}) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void (async () => {
      setLoading(true);

      const { data: savedRows, error } = await supabase
        .from("post_saves")
        .select("post_id,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error cargando Guardados:", error);
        if (active) {
          setPosts([]);
          setLoading(false);
        }
        return;
      }

      const ids = (savedRows || []).map(
        (row: any) => row.post_id
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
          .order("sort_order", { ascending: true }),
      ]);

      const hydrated = await hydratePostMedia(
        (postsData || []) as any[]
      );

      const mediaRows = await hydratePostMediaItems(
        (mediaRaw || []) as any[]
      );

      const byId = new Map(
        hydrated.map((post: any) => [
          post.id,
          {
            ...post,
            commentsCount: (commentsData || []).filter(
              (comment: any) => comment.post_id === post.id
            ).length,
            mediaItems: mediaRows.filter(
              (item: any) => item.post_id === post.id
            ),
          },
        ])
      );

      const ordered = (savedRows || [])
        .map((row: any) => byId.get(row.post_id))
        .filter(Boolean);

      for (const post of ordered) {
        if (!post.mediaItems?.length && post.image_url) {
          post.mediaItems = [
            {
              post_id: post.id,
              user_id: post.user_id,
              media_type: "image",
              media_url: post.image_url,
              media_path: post.image_path || null,
              media_bucket: post.media_bucket || "posts",
              mime_type: null,
              sort_order: 0,
            },
          ];
        }
      }

      if (active) {
        setPosts(ordered);
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [userId]);

  async function removeSaved(postId: number) {
    const previous = posts;

    setPosts((current) =>
      current.filter((post) => post.id !== postId)
    );

    const { error } = await supabase
      .from("post_saves")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);

    if (error) {
      setPosts(previous);
      alert(error.message);
    }
  }

  if (loading) {
    return (
      <section className="py-12 text-center text-[13px] text-[var(--app-muted-2)]">
        Cargando guardados...
      </section>
    );
  }

  if (!posts.length) {
    return (
      <section className="py-14 text-center">
        <BookmarkCheck
          size={28}
          className="mx-auto text-[var(--app-muted-3)]"
        />
        <p className="mt-3 text-[14px] font-black text-[var(--app-text)]">
          No tienes publicaciones guardadas
        </p>
        <p className="mx-auto mt-1 max-w-sm text-[13px] leading-5 text-[var(--app-muted-2)]">
          Los Guardados son privados. Solo tú puedes verlos.
        </p>
      </section>
    );
  }

  return (
    <section className="pt-3">
      <div className="pb-3 text-[13px] font-semibold text-[var(--app-muted-2)]">
        {posts.length}{" "}
        {posts.length === 1
          ? "publicación guardada"
          : "publicaciones guardadas"}
      </div>

      <div className="divide-y divide-[var(--app-border)]">
        {posts.map((post) => {
          const media =
            (post.mediaItems || []) as PostMediaItem[];
          const first = media[0] || null;

          const text = String(post.content || "").trim();
          const short =
            text.length > 420
              ? `${text.slice(0, 420).trim()}…`
              : text;

          return (
            <article
              key={post.id}
              className="py-5 first:pt-2"
            >
              <div className="flex items-center gap-3">
                <a
                  href={`/u/${post.profiles?.username}`}
                  className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--app-soft-strong)] text-xs font-black text-[var(--app-text)]"
                >
                  {post.profiles?.avatar_url ? (
                    <img
                      src={post.profiles.avatar_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    post.profiles?.username
                      ?.charAt(0)
                      ?.toUpperCase() || "A"
                  )}
                </a>

                <div className="min-w-0 flex-1">
                  <a
                    href={`/u/${post.profiles?.username}`}
                    className="truncate text-[14px] font-black text-[var(--app-text)] hover:underline"
                  >
                    @{post.profiles?.username || "alumni"}
                  </a>

                  <p className="mt-0.5 truncate text-[12px] text-[var(--app-muted-2)]">
                    {[
                      post.profiles?.career,
                      post.profiles?.university,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Comunidad Alumni"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void removeSaved(post.id)}
                  className="shrink-0 rounded-full px-3 py-2 text-[12px] font-bold text-[var(--app-muted)] transition hover:bg-[var(--app-soft)] hover:text-[var(--app-text)]"
                >
                  Quitar
                </button>
              </div>

              {short && (
                <p className="mt-3 whitespace-pre-wrap text-[15px] leading-6 text-[var(--app-text-soft)]">
                  {short}
                </p>
              )}

              {first && (
                <a
                  href={`/feed?post=${post.id}`}
                  className="relative mt-3 block overflow-hidden bg-[#05070b]"
                >
                  {first.media_type === "video" ? (
                    <video
                      src={first.media_url || ""}
                      muted
                      playsInline
                      preload="metadata"
                      className="max-h-[500px] w-full object-contain"
                    />
                  ) : (
                    <img
                      src={first.media_url || ""}
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

              <div className="mt-3 flex items-center gap-4 font-mono text-[12px] font-semibold text-[var(--app-muted-2)]">
                <span className="inline-flex items-center gap-1.5">
                  <Heart size={15} />
                  {post.likes?.length || 0}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle size={15} />
                  {post.commentsCount || 0}
                </span>

                <a
                  href={`/feed?post=${post.id}`}
                  className="ml-auto inline-flex items-center gap-1.5 font-bold text-[var(--app-text-soft)] hover:text-[var(--app-text)]"
                >
                  Abrir
                  <ExternalLink size={14} />
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* ALUMNI_1_4_2_PROFILE_SAVED_TAB */
