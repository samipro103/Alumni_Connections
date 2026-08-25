"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Heart,
  MessageCircle,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/layout/AppShell";
import PostComposer from "@/components/feed/PostComposer";
import StoriesRail from "@/components/feed/StoriesRail";
import CommentLikeButton from "@/components/social/CommentLikeButton";
import { rankForYouPosts } from "@/lib/feedRanking";
import { analyzeImageLocally } from "@/lib/imageModerationClient";
import { preparePostImage } from "@/lib/postImagePipeline";

type FeedMode = "for-you" | "following";

function FeedContent() {
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [openComments, setOpenComments] = useState<Record<number, boolean>>({});
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [feedMode, setFeedMode] = useState<FeedMode>("for-you");
  const [loading, setLoading] = useState(true);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [focusedPostId, setFocusedPostId] = useState<number | null>(null);
  const [focusedCommentId, setFocusedCommentId] = useState<number | null>(null);
  const refreshTimerRef = useRef<number | null>(null);

  useEffect(() => {
    void getPosts({ showLoader: true });
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("feed-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => schedulePostsRefresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "likes" },
        () => schedulePostsRefresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments" },
        () => schedulePostsRefresh()
      )
      .subscribe();

    return () => {
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const postId = Number(searchParams.get("post"));
    const commentId = Number(searchParams.get("comment"));

    if (!Number.isFinite(postId) || postId <= 0) return;

    setFocusedPostId(postId);

    if (Number.isFinite(commentId) && commentId > 0) {
      setFocusedCommentId(commentId);
      setOpenComments((current) => ({
        ...current,
        [postId]: true,
      }));
    }

    const timer = window.setTimeout(() => {
      document
        .getElementById(`post-${postId}`)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 120);

    const clearHighlight = window.setTimeout(() => {
      setFocusedPostId(null);
      setFocusedCommentId(null);

      const url = new URL(window.location.href);
      url.searchParams.delete("post");
      url.searchParams.delete("comment");
      window.history.replaceState({}, "", url.pathname + url.search);
    }, 2600);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(clearHighlight);
    };
  }, [loading, searchParams]);

  function schedulePostsRefresh(delay = 140) {
    if (refreshTimerRef.current !== null) {
      window.clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = window.setTimeout(() => {
      refreshTimerRef.current = null;
      void getPosts({ showLoader: false });
    }, delay);
  }

  async function getPosts({
    showLoader = false,
  }: {
    showLoader?: boolean;
  } = {}) {
    if (showLoader) {
      setLoading(true);
    }

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    setCurrentUser(user || null);

    if (user) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, university, education_institution_name, education_program_name, career, city, country, residence_country_code")
        .eq("id", user.id)
        .maybeSingle();

      setCurrentProfile(profileData || null);
    } else {
      setCurrentProfile(null);
    }

    if (user) {
      const { data: followingData } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      setFollowingIds((followingData || []).map((row: any) => row.following_id));
    } else {
      setFollowingIds([]);
    }

    const { data: postsData } = await supabase
      .from("posts")
      .select(`
        *,
        profiles (
          username,
          avatar_url,
          full_name,
          university,
          education_institution_name,
          education_program_name,
          career,
          city,
          country,
          residence_country_code
        ),
        likes (
          user_id
        )
      `)
      .order("created_at", { ascending: false });

    if (!postsData) {
      if (showLoader) {
        setPosts([]);
        setLoading(false);
      }
      return;
    }

    const { data: commentsData } = await supabase
      .from("comments")
      .select("*")
      .order("created_at", { ascending: true });

    const commentUserIds = [
      ...new Set((commentsData || []).map((comment: any) => comment.user_id)),
    ];

    let commentProfiles: any[] = [];

    if (commentUserIds.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", commentUserIds);

      commentProfiles = data || [];
    }

    const formattedPosts = postsData.map((post: any) => {
      const liked = post.likes.some((like: any) => like.user_id === user?.id);

      const postComments = (commentsData || [])
        .filter((comment: any) => comment.post_id === post.id)
        .map((comment: any) => ({
          ...comment,
          profile: commentProfiles.find((profile) => profile.id === comment.user_id),
        }));

      return {
        ...post,
        likesCount: post.likes.length,
        liked,
        comments: postComments,
      };
    });

    setPosts(formattedPosts);

    if (showLoader) {
      setLoading(false);
    }
  }

  async function uploadPostImage() {
    if (!image) return null;

    try {
      const prepared =
        await preparePostImage(
          image
        );

      const safeName =
        prepared.file.name
          .normalize("NFKD")
          .replace(
            /[^\w.\-]+/g,
            "_"
          )
          .slice(-120);

      const fileName =
        `${currentUser?.id || "user"}/${Date.now()}-${safeName}`;

      const { error } =
        await supabase.storage
          .from("posts")
          .upload(
            fileName,
            prepared.file,
            {
              cacheControl:
                "31536000",
              upsert: false,
              contentType:
                prepared.file.type ||
                undefined,
            }
          );

      if (error) {
        throw error;
      }

      const { data } =
        supabase.storage
          .from("posts")
          .getPublicUrl(
            fileName
          );

      return data.publicUrl;
    } catch (error: any) {
      console.error(error);
      alert(
        error?.message ||
          "No se pudo preparar la fotografía."
      );
      return null;
    }
  }

  async function createPost() {
    if (!content.trim() && !image) return;

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      window.location.href = "/login";
      return;
    }

    let imageUrl = null;

    if (image) {
      imageUrl = await uploadPostImage();
      if (!imageUrl) return;
    }

    const {
      data: insertedPost,
      error,
    } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        content: content.trim(),
        image_url: imageUrl,
      })
      .select("id")
      .single();

    if (error || !insertedPost) {
      alert(
        error?.message ||
          "No se pudo crear la publicación."
      );
      return;
    }

    const imageForModeration = image;

    /*
     * Alumni Shield 8.1:
     * La publicación no espera el análisis.
     * Texto = reglas Alumni en servidor.
     * Imagen = NSFWJS/TensorFlow.js local, solo señal de calibración.
     */
    void (async () => {
      const imageSignal = imageForModeration
        ? await analyzeImageLocally(imageForModeration)
        : null;

      await fetch("/api/moderation/post", {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_id: insertedPost.id,
          image_signal: imageSignal,
        }),
      });
    })().catch(() => {});

    setContent("");
    setImage(null);
    schedulePostsRefresh(60);
  }

  async function deletePost(postId: number) {
    if (!confirm("¿Eliminar esta publicación?")) return;

    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      alert(error.message);
      return;
    }

    schedulePostsRefresh(60);
  }

  async function toggleLike(postId: number, liked: boolean) {
    if (!currentUser) {
      window.location.href = "/login";
      return;
    }

    const post = posts.find((item: any) => item.id === postId);

    // Actualizacion optimista: el usuario ve el cambio al instante.
    setPosts((current) =>
      current.map((item: any) =>
        item.id === postId
          ? {
              ...item,
              liked: !liked,
              likesCount: Math.max(
                0,
                (item.likesCount || 0) + (liked ? -1 : 1)
              ),
            }
          : item
      )
    );

    if (liked) {
      await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", currentUser.id);

      if (post && post.user_id !== currentUser.id) {
        await supabase
          .from("notifications")
          .delete()
          .eq("user_id", post.user_id)
          .eq("actor_id", currentUser.id)
          .eq("type", "like")
          .eq("post_id", postId);
      }
    } else {
      const { error } = await supabase.from("likes").insert({
        post_id: postId,
        user_id: currentUser.id,
      });

      if (error) {
        setPosts((current) =>
          current.map((item: any) =>
            item.id === postId
              ? {
                  ...item,
                  liked,
                  likesCount: Math.max(
                    0,
                    (item.likesCount || 0) + (liked ? 1 : -1)
                  ),
                }
              : item
          )
        );
        alert(error.message);
        return;
      }

      if (post && post.user_id !== currentUser.id) {
        await supabase.from("notifications").insert({
          user_id: post.user_id,
          actor_id: currentUser.id,
          type: "like",
          post_id: postId,
          target_type: "post",
          target_id: String(postId),
        });
      }
    }

    schedulePostsRefresh(60);
  }

  async function addComment(postId: number) {
    if (!currentUser) {
      window.location.href = "/login";
      return;
    }

    const comment = commentInputs[postId]?.trim();
    if (!comment) return;

    const { data: insertedComment, error } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        user_id: currentUser.id,
        content: comment,
      })
      .select("id")
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    const post = posts.find((item: any) => item.id === postId);

    if (post && post.user_id !== currentUser.id) {
      await supabase.from("notifications").insert({
        user_id: post.user_id,
        actor_id: currentUser.id,
        type: "comment",
        post_id: postId,
        target_type: "post_comment",
        target_id: String(insertedComment.id),
      });
    }

    setPosts((current) =>
      current.map((item: any) =>
        item.id === postId
          ? {
              ...item,
              comments: [
                ...(item.comments || []),
                {
                  id: insertedComment.id,
                  post_id: postId,
                  user_id: currentUser.id,
                  content: comment,
                  created_at: new Date().toISOString(),
                  profile: {
                    username: currentProfile?.username || "usuario",
                    avatar_url: currentProfile?.avatar_url || null,
                  },
                },
              ],
            }
          : item
      )
    );

    setCommentInputs((current) => ({ ...current, [postId]: "" }));
    setOpenComments((current) => ({ ...current, [postId]: true }));
    schedulePostsRefresh(220);
  }

  async function sharePost(post: any) {
    const url = `${window.location.origin}/feed?post=${post.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Publicación de @${post.profiles?.username || "Alumni"}`,
          text: post.content || "Mira esta publicación en Alumni.",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert("Enlace copiado");
      }
    } catch { }
  }

  const visiblePosts = useMemo(() => {
    if (feedMode === "following") {
      return posts
        .filter((post: any) => followingIds.includes(post.user_id))
        .sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );
    }

    return rankForYouPosts(posts, currentProfile, followingIds);
  }, [posts, followingIds, feedMode, currentProfile]);

  return (
    <AppShell>
      <div className="alumni-feed-page mx-auto w-full max-w-[780px]">
        <StoriesRail focusStoryId={searchParams.get("story")} />

        <PostComposer
          content={content}
          setContent={setContent}
          image={image}
          setImage={setImage}
          createPost={createPost}
        />

        <div className="alumni-section-tabs alumni-feed-tabs mb-4 flex items-center border-b border-white/[0.07]">
          {(["for-you", "following"] as FeedMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setFeedMode(mode)}
              className={`relative px-4 pb-3 text-sm font-bold transition ${feedMode === mode ? "text-white" : "text-zinc-600 hover:text-zinc-300"
                }`}
            >
              {mode === "for-you" ? "Para ti" : "Siguiendo"}
              {feedMode === mode && (
                <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-[#7f8cff]" />
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-zinc-600">Cargando publicaciones...</div>
        ) : visiblePosts.length === 0 ? (
          <div className="alumni-empty-state rounded-2xl border border-dashed border-white/[0.09] px-6 py-12 text-center">
            <p className="font-semibold text-zinc-300">
              {feedMode === "following"
                ? "Todavía no hay publicaciones de las personas que sigues."
                : "Todavía no hay publicaciones."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visiblePosts.map((post: any, postIndex: number) => {
              const commentsOpen = Boolean(openComments[post.id]);

              return (
                <article
                  id={`post-${post.id}`}
                  key={post.id}
                  className={`alumni-post-card overflow-hidden rounded-[24px] border transition-[border-color,box-shadow,background-color] duration-500 ${focusedPostId === post.id
                      ? "border-[#8d98ff]/70 bg-[#6d7cff]/[0.06] shadow-[0_0_0_3px_rgba(109,124,255,.10),0_16px_45px_rgba(0,0,0,.18)]"
                      : "border-white/[0.07]"
                    }`}
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <a
                        href={`/u/${post.profiles?.username}`}
                        className="alumni-post-avatar flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1a1f29] text-sm font-bold text-white"
                      >
                        {post.profiles?.avatar_url ? (
                          <img
                            src={post.profiles.avatar_url}
                            alt="Avatar"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          post.profiles?.username?.charAt(0)?.toUpperCase() || "U"
                        )}
                      </a>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <a
                            href={`/u/${post.profiles?.username}`}
                            className="truncate text-sm font-bold text-white hover:underline"
                          >
                            @{post.profiles?.username || "alumni"}
                          </a>
                          <span className="text-zinc-700">·</span>
                          <span className="shrink-0 text-xs text-zinc-600">
                            {formatDistanceToNow(new Date(post.created_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-zinc-600">
                          {[post.profiles?.career, post.profiles?.university]
                            .filter(Boolean)
                            .join(" · ") || "Comunidad Alumni"}
                        </p>
                      </div>

                      {post.user_id === currentUser?.id && (
                        <button
                          onClick={() => deletePost(post.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-700 transition hover:bg-red-500/10 hover:text-red-400"
                          aria-label="Eliminar publicación"
                        >
                          <Trash2 size={17} />
                        </button>
                      )}
                    </div>

                    {post.content && (
                      <p className="alumni-post-copy mt-4 whitespace-pre-wrap text-[15px] leading-6 text-zinc-200">
                        {post.content}
                      </p>
                    )}
                  </div>

                  {post.image_url && (
                    <button
                      onClick={() => setSelectedImage(post.image_url)}
                      className="alumni-post-media block w-full"
                    >
                      <img
                        src={post.image_url}
                        alt="Publicación"
                        loading={
                          postIndex < 2
                            ? "eager"
                            : "lazy"
                        }
                        decoding="async"
                        fetchPriority={
                          postIndex === 0
                            ? "high"
                            : "auto"
                        }
                        draggable={false}
                        className="max-h-[680px] w-full object-contain"
                      />
                    </button>
                  )}

                  <div className="alumni-post-footer px-4 pb-4 pt-3 sm:px-5">
                    {(post.likesCount > 0 || (post.comments?.length || 0) > 0) && (
                      <div className="alumni-post-stats mb-2 flex items-center gap-3 px-1 text-[11px] font-semibold">
                        {post.likesCount > 0 && (
                          <span>
                            {post.likesCount} {post.likesCount === 1 ? "me gusta" : "me gusta"}
                          </span>
                        )}
                        {(post.comments?.length || 0) > 0 && (
                          <span className="ml-auto">
                            {post.comments.length} {post.comments.length === 1 ? "comentario" : "comentarios"}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="alumni-post-actions flex items-center gap-1 border-b border-white/[0.06] pb-3">
                      <button
                        onClick={() => toggleLike(post.id, post.liked)}
                        className={`flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${post.liked
                            ? "bg-red-500/10 text-red-400"
                            : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
                          }`}
                      >
                        <Heart fill={post.liked ? "currentColor" : "none"} size={18} />
                        <span>{post.likesCount}</span>
                      </button>

                      <button
                        onClick={() =>
                          setOpenComments((current) => ({
                            ...current,
                            [post.id]: !current[post.id],
                          }))
                        }
                        className="flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200"
                      >
                        <MessageCircle size={18} />
                        <span>{post.comments?.length || 0}</span>
                      </button>

                      <button
                        onClick={() => sharePost(post)}
                        className="ml-auto flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200"
                      >
                        <Share2 size={18} />
                        <span className="hidden sm:inline">Compartir</span>
                      </button>
                    </div>

                    {commentsOpen && (
                      <div className="pt-4">
                        {post.comments?.length > 0 ? (
                          <div className="space-y-4">
                            {post.comments.map((comment: any) => (
                              <div
                                id={`comment-${comment.id}`}
                                key={comment.id}
                                className={`flex gap-3 rounded-2xl transition-[background-color,box-shadow] duration-500 ${focusedCommentId === comment.id
                                    ? "bg-[#6d7cff]/10 shadow-[0_0_0_2px_rgba(109,124,255,.16)]"
                                    : ""
                                  }`}
                              >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1a1f29] text-[11px] font-bold">
                                  {comment.profile?.avatar_url ? (
                                    <img
                                      src={comment.profile.avatar_url}
                                      alt="Avatar"
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    comment.profile?.username?.charAt(0)?.toUpperCase() || "U"
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="alumni-comment-bubble rounded-2xl bg-white/[0.035] px-3.5 py-2.5">
                                    <p className="text-xs font-bold text-zinc-300">
                                      @{comment.profile?.username || "usuario"}
                                    </p>
                                    <p className="mt-1 text-sm leading-5 text-zinc-400">
                                      {comment.content}
                                    </p>
                                  </div>

                                  <CommentLikeButton
                                    commentId={comment.id}
                                    commentOwnerId={comment.user_id}
                                    currentUserId={currentUser?.id}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-zinc-600">Sé la primera persona en comentar.</p>
                        )}

                        <div className="mt-4 flex gap-2">
                          <input
                            type="text"
                            placeholder={currentUser ? "Escribe un comentario..." : "Inicia sesión para comentar"}
                            value={commentInputs[post.id] || ""}
                            disabled={!currentUser}
                            onChange={(e) =>
                              setCommentInputs((current) => ({
                                ...current,
                                [post.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") addComment(post.id);
                            }}
                            className="alumni-comment-input h-10 flex-1 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-[#6d7cff]/40 disabled:opacity-50"
                          />

                          <button
                            onClick={() => addComment(post.id)}
                            disabled={!currentUser || !commentInputs[post.id]?.trim()}
                            className="h-10 rounded-xl bg-white/[0.06] px-4 text-xs font-bold text-zinc-300 transition hover:bg-[#6d7cff] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Enviar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="alumni-media-viewer fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 sm:p-8"
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur"
            aria-label="Cerrar imagen"
          >
            <X size={22} />
          </button>
          <img
            src={selectedImage}
            alt="Publicación ampliada"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            draggable={false}
            className="max-h-[92vh] max-w-[94vw] rounded-2xl object-contain"
          />
        </div>
      )}
    </AppShell>
  );
}

export default function FeedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#090b0f] text-sm text-zinc-500">
          Cargando Alumni...
        </div>
      }
    >
      <FeedContent />
    </Suspense>
  );
}

