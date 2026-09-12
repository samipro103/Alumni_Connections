"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import "./feed-pro.css";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/layout/AppShell";
import PostComposer from "@/components/feed/PostComposer";
import StoriesRail from "@/components/feed/StoriesRail";
import FeedPost from "@/components/feed/FeedPost";
import FeedCommentsSheet from "@/components/feed/FeedCommentsSheet";
import FeedEngagementModal from "@/components/feed/FeedEngagementModal";
import { rankForYouPosts } from "@/lib/feedRanking";
import { analyzeImageLocally } from "@/lib/imageModerationClient";
import { hydratePostMedia } from "@/lib/privateMedia";
import {
  hydratePostMediaItems,
  removePostMedia,
  uploadPostMediaFiles,
  type PostMediaItem,
} from "@/lib/feedMedia";

type FeedMode = "for-you" | "following";
type EngagementState = {
  postId: number;
  mode: "likes" | "reposts";
} | null;

function FeedContent() {
  const searchParams = useSearchParams();

  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [commentInputs, setCommentInputs] = useState<
    Record<number, string>
  >({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [feedMode, setFeedMode] =
    useState<FeedMode>("for-you");
  const [loading, setLoading] = useState(true);
  const [focusedPostId, setFocusedPostId] =
    useState<number | null>(null);
  const [focusedCommentId, setFocusedCommentId] =
    useState<number | null>(null);
  const [commentsPostId, setCommentsPostId] =
    useState<number | null>(null);
  const [engagement, setEngagement] =
    useState<EngagementState>(null);
  const [selectedMedia, setSelectedMedia] =
    useState<PostMediaItem | null>(null);
  const [toast, setToast] = useState("");

  const refreshTimerRef = useRef<number | null>(null);
  const feedRequestRef = useRef(0);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    void getPosts({ showLoader: true });
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("feed-pro-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => schedulePostsRefresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "likes" },
        () => schedulePostsRefresh(80)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments" },
        () => schedulePostsRefresh(100)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_reposts" },
        () => schedulePostsRefresh(100)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_media" },
        () => schedulePostsRefresh(100)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_saves" },
        () => schedulePostsRefresh(100)
      )
      .subscribe();

    return () => {
      feedRequestRef.current += 1;

      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }

      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
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
      setCommentsPostId(postId);
    }

    const timer = window.setTimeout(() => {
      document
        .getElementById(`post-${postId}`)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 130);

    const clear = window.setTimeout(() => {
      setFocusedPostId(null);

      if (!commentId) {
        setFocusedCommentId(null);
      }

      const url = new URL(window.location.href);
      url.searchParams.delete("post");

      if (!commentId) {
        url.searchParams.delete("comment");
      }

      window.history.replaceState(
        {},
        "",
        url.pathname + url.search
      );
    }, 2600);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(clear);
    };
  }, [loading, searchParams]);

  function showToast(message: string) {
    setToast(message);

    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = window.setTimeout(() => {
      setToast("");
      toastTimerRef.current = null;
    }, 2200);
  }

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
    const requestId = ++feedRequestRef.current;

    if (showLoader) {
      setLoading(true);
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (requestId !== feedRequestRef.current) return;

    const user = session?.user || null;
    setCurrentUser(user);

    if (user) {
      const [{ data: profileData }, { data: followingData }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select(
              "id,username,full_name,avatar_url,university,education_institution_name,education_program_name,career,city,country,residence_country_code"
            )
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", user.id),
        ]);

      if (requestId !== feedRequestRef.current) return;

      setCurrentProfile(profileData || null);
      setFollowingIds(
        (followingData || []).map(
          (row: any) => row.following_id
        )
      );
    } else {
      setCurrentProfile(null);
      setFollowingIds([]);
    }

    const {
      data: basePosts,
      error: postsError,
    } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (requestId !== feedRequestRef.current) return;

    if (postsError) {
      console.error(
        "[Alumni Feed] posts:",
        postsError
      );

      setPosts([]);
      setLoading(false);
      showToast(
        "No se pudieron cargar las publicaciones."
      );
      return;
    }

    const basePostIds = (basePosts || []).map(
      (post: any) => post.id
    );

    const authorIds = [
      ...new Set(
        (basePosts || [])
          .map((post: any) => post.user_id)
          .filter(Boolean)
      ),
    ];

    const [authorsResult, likesResult] =
      await Promise.all([
        authorIds.length
          ? supabase
              .from("profiles")
              .select(
                "id,username,avatar_url,full_name,university,education_institution_name,education_program_name,career,city,country,residence_country_code"
              )
              .in("id", authorIds)
          : Promise.resolve({
              data: [],
              error: null,
            } as any),

        basePostIds.length
          ? supabase
              .from("likes")
              .select("post_id,user_id")
              .in("post_id", basePostIds)
          : Promise.resolve({
              data: [],
              error: null,
            } as any),
      ]);

    if (requestId !== feedRequestRef.current) return;

    if (authorsResult.error) {
      console.warn(
        "[Alumni Feed] authors:",
        authorsResult.error
      );
    }

    if (likesResult.error) {
      console.warn(
        "[Alumni Feed] likes:",
        likesResult.error
      );
    }

    const authorById = new Map(
      (authorsResult.data || []).map(
        (profile: any) => [
          profile.id,
          profile,
        ]
      )
    );

    const likesByPost =
      new Map<number, any[]>();

    for (const like of likesResult.data || []) {
      const postId = Number(like.post_id);
      const current =
        likesByPost.get(postId) || [];

      current.push({
        user_id: like.user_id,
      });

      likesByPost.set(
        postId,
        current
      );
    }

    const postsData = (basePosts || []).map(
      (post: any) => ({
        ...post,
        profiles:
          authorById.get(post.user_id) || null,
        likes:
          likesByPost.get(Number(post.id)) || [],
      })
    );

    const postIds = (postsData as any[]).map(
      (post: any) => post.id
    );

    const commentsPromise = postIds.length
      ? supabase
          .from("comments")
          .select("*")
          .in("post_id", postIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] } as any);

    const repostPromise = postIds.length
      ? supabase
          .from("post_reposts")
          .select("post_id,user_id,created_at")
          .in("post_id", postIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] } as any);

    const mediaPromise = postIds.length
      ? supabase
          .from("post_media")
          .select("*")
          .in("post_id", postIds)
          .order("sort_order", { ascending: true })
      : Promise.resolve({ data: [] } as any);

    const savesPromise =
      user && postIds.length
        ? supabase
            .from("post_saves")
            .select("post_id")
            .eq("user_id", user.id)
            .in("post_id", postIds)
        : Promise.resolve({ data: [] } as any);

    const hashtagsPromise = postIds.length
      ? supabase
          .from("post_hashtags")
          .select("post_id,tag")
          .in("post_id", postIds)
      : Promise.resolve({ data: [] } as any);

    const discoverySignalsPromise = user
      ? supabase
          .from("discovery_signals")
          .select("signal_type,signal_value,score")
          .eq("user_id", user.id)
          .order("score", { ascending: false })
          .limit(120)
      : Promise.resolve({ data: [] } as any);

    const [
      { data: commentsData },
      { data: repostRows },
      { data: mediaRowsRaw },
      { data: saveRows },
      { data: hashtagRows },
      { data: discoverySignalRows },
    ] = await Promise.all([
      commentsPromise,
      repostPromise,
      mediaPromise,
      savesPromise,
      hashtagsPromise,
      discoverySignalsPromise,
    ]);

    if (requestId !== feedRequestRef.current) return;

    const socialProfileIds = [
      ...new Set(
        [
          ...(commentsData || []).map(
            (comment: any) => comment.user_id
          ),
          ...(repostRows || []).map(
            (repost: any) => repost.user_id
          ),
        ].filter(Boolean)
      ),
    ];

    let socialProfiles: any[] = [];

    if (socialProfileIds.length) {
      const { data } = await supabase
        .from("profiles")
        .select(
          "id,username,full_name,avatar_url,university,career"
        )
        .in("id", socialProfileIds);

      socialProfiles = data || [];
    }

    if (requestId !== feedRequestRef.current) return;

    let mutedUserIds = new Set<string>();

    if (user) {
      const { data: muteRows } = await supabase
        .from("user_mutes")
        .select("muted_user_id")
        .eq("user_id", user.id);

      mutedUserIds = new Set(
        (muteRows || []).map(
          (row: any) => row.muted_user_id
        )
      );
    }

    if (requestId !== feedRequestRef.current) return;

    const visibleBase = (postsData as any[]).filter(
      (post: any) => !mutedUserIds.has(post.user_id)
    );

    let legacyReady = visibleBase;

    try {
      legacyReady =
        await hydratePostMedia(visibleBase);
    } catch (error) {
      console.warn(
        "[Alumni Feed] legacy media:",
        error
      );
    }

    let mediaRows: any[] = [];

    try {
      mediaRows =
        await hydratePostMediaItems(
          (mediaRowsRaw || []) as any[]
        );
    } catch (error) {
      console.warn(
        "[Alumni Feed] media items:",
        error
      );
    }

    if (requestId !== feedRequestRef.current) return;

    const profileById = new Map(
      socialProfiles.map((profile) => [
        profile.id,
        profile,
      ])
    );

    const savedPostIds = new Set(
      (saveRows || []).map((row: any) => row.post_id)
    );

    const hashtagSignalScore = new Map<string, number>();
    const profileSignalScore = new Map<string, number>();
    const postSignalScore = new Map<string, number>();

    for (const signal of discoverySignalRows || []) {
      const score = Number(signal.score || 0);

      if (signal.signal_type === "hashtag") {
        hashtagSignalScore.set(
          String(signal.signal_value).toLowerCase(),
          score
        );
      } else if (signal.signal_type === "profile") {
        profileSignalScore.set(
          String(signal.signal_value),
          score
        );
      } else if (signal.signal_type === "post") {
        postSignalScore.set(
          String(signal.signal_value),
          score
        );
      }
    }

    const hashtagsByPost = new Map<number, string[]>();

    for (const row of hashtagRows || []) {
      const current =
        hashtagsByPost.get(Number(row.post_id)) || [];

      current.push(String(row.tag).toLowerCase());

      hashtagsByPost.set(
        Number(row.post_id),
        current
      );
    }

    const formatted = legacyReady.map((post: any) => {
      const postComments = (commentsData || [])
        .filter(
          (comment: any) => comment.post_id === post.id
        )
        .map((comment: any) => ({
          ...comment,
          profile: profileById.get(comment.user_id),
        }));

      const postReposts = (repostRows || []).filter(
        (repost: any) => repost.post_id === post.id
      );

      const mediaItems = (mediaRows || []).filter(
        (item: any) => item.post_id === post.id
      );

      if (
        !mediaItems.length &&
        post.image_url
      ) {
        mediaItems.push({
          post_id: post.id,
          user_id: post.user_id,
          media_type: "image",
          media_url: post.image_url,
          media_path: post.image_path || null,
          media_bucket:
            post.media_bucket || "posts",
          mime_type: null,
          sort_order: 0,
        });
      }

      const liked = (post.likes || []).some(
        (like: any) => like.user_id === user?.id
      );

      const reposted = postReposts.some(
        (row: any) => row.user_id === user?.id
      );

      const latestRepost = postReposts[0] || null;

      const postTags =
        hashtagsByPost.get(Number(post.id)) || [];

      const hashtagBoost = postTags.reduce(
        (total, tag) =>
          total +
          Math.min(
            Number(hashtagSignalScore.get(tag) || 0),
            6
          ),
        0
      );

      const authorBoost = Math.min(
        Number(profileSignalScore.get(String(post.user_id)) || 0),
        6
      );

      const directPostBoost = Math.min(
        Number(postSignalScore.get(String(post.id)) || 0),
        4
      );

      const discoveryBoost = Math.min(
        hashtagBoost * 0.7 +
          authorBoost * 0.55 +
          directPostBoost * 0.45,
        18
      );

      return {
        ...post,
        liked,
        likesCount: (post.likes || []).length,
        comments: postComments,
        repostsCount: postReposts.length,
        reposted,
        repostUserIds: postReposts.map(
          (row: any) => row.user_id
        ),
        latestRepostAt:
          latestRepost?.created_at || null,
        latestRepostProfile: latestRepost
          ? profileById.get(latestRepost.user_id) || null
          : null,
        saved: savedPostIds.has(post.id),
        mediaItems,
        discoveryTags: postTags,
        _discoveryBoost: discoveryBoost,
      };
    });

    setPosts(formatted);

    if (showLoader) {
      setLoading(false);
    }
  }

  async function createPost(): Promise<boolean> {
    if (!content.trim() && !mediaFiles.length) {
      return false;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;

    if (!user) {
      window.location.href = "/login";
      return false;
    }

    const { data: privacyProfile } = await supabase
      .from("profiles")
      .select("is_private")
      .eq("id", user.id)
      .maybeSingle();

    const {
      data: insertedPost,
      error: postError,
    } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        content: content.trim(),
        image_url: null,
        image_path: null,
        media_bucket: null,
      })
      .select("id")
      .single();

    if (postError || !insertedPost) {
      alert(
        postError?.message ||
          "No se pudo crear la publicación."
      );
      return false;
    }

    try {
      const uploadResult = await uploadPostMediaFiles({
        files: mediaFiles,
        userId: user.id,
        postId: insertedPost.id,
        isPrivate: Boolean(privacyProfile?.is_private),
      });

      if (uploadResult.firstImage) {
        await supabase
          .from("posts")
          .update({
            image_url:
              uploadResult.firstImage.imageUrl,
            image_path:
              uploadResult.firstImage.imagePath,
            media_bucket:
              uploadResult.firstImage.mediaBucket,
          })
          .eq("id", insertedPost.id)
          .eq("user_id", user.id);
      }

      const firstImage = mediaFiles.find((file) =>
        file.type.startsWith("image/")
      );

      void (async () => {
        const imageSignal = firstImage
          ? await analyzeImageLocally(firstImage)
          : null;

        await fetch("/api/moderation/post", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            post_id: insertedPost.id,
            image_signal: imageSignal,
          }),
        });
      })().catch(() => {});

      setContent("");
      setMediaFiles([]);
      schedulePostsRefresh(80);
      showToast("Publicación creada");

      return true;
    } catch (error: any) {
      await supabase
        .from("posts")
        .delete()
        .eq("id", insertedPost.id)
        .eq("user_id", user.id);

      alert(
        error?.message ||
          "No se pudieron cargar las fotos o videos."
      );

      return false;
    }
  }

  async function deletePost(post: any) {
    if (!confirm("¿Eliminar esta publicación?")) return;

    try {
      await removePostMedia(post.mediaItems || []);
    } catch (error) {
      console.warn("No se pudo limpiar todo el media:", error);
    }

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", post.id);

    if (error) {
      alert(error.message);
      return;
    }

    schedulePostsRefresh(70);
    showToast("Publicación eliminada");
  }

  async function toggleLike(post: any) {
    if (!currentUser) {
      window.location.href = "/login";
      return;
    }

    const wasLiked = Boolean(post.liked);

    setPosts((current) =>
      current.map((item) =>
        item.id === post.id
          ? {
              ...item,
              liked: !wasLiked,
              likesCount: Math.max(
                0,
                Number(item.likesCount || 0) +
                  (wasLiked ? -1 : 1)
              ),
            }
          : item
      )
    );

    if (wasLiked) {
      await supabase
        .from("likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", currentUser.id);

      if (post.user_id !== currentUser.id) {
        await supabase
          .from("notifications")
          .delete()
          .eq("user_id", post.user_id)
          .eq("actor_id", currentUser.id)
          .eq("type", "like")
          .eq("post_id", post.id);
      }
    } else {
      const { error } = await supabase
        .from("likes")
        .insert({
          post_id: post.id,
          user_id: currentUser.id,
        });

      if (error) {
        schedulePostsRefresh(20);
        showToast(error.message);
        return;
      }

      if (post.user_id !== currentUser.id) {
        await supabase
          .from("notifications")
          .insert({
            user_id: post.user_id,
            actor_id: currentUser.id,
            type: "like",
            post_id: post.id,
            target_type: "post",
            target_id: String(post.id),
          });
      }
    }

    schedulePostsRefresh(220);
  }

  async function addComment(postId: number) {
    if (!currentUser) {
      window.location.href = "/login";
      return;
    }

    const value = commentInputs[postId]?.trim();
    if (!value) return;

    const { data: inserted, error } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        user_id: currentUser.id,
        content: value,
      })
      .select("id,created_at")
      .single();

    if (error || !inserted) {
      showToast(error?.message || "No se pudo comentar");
      return;
    }

    const post = posts.find((item) => item.id === postId);

    if (post && post.user_id !== currentUser.id) {
      await supabase
        .from("notifications")
        .insert({
          user_id: post.user_id,
          actor_id: currentUser.id,
          type: "comment",
          post_id: postId,
          target_type: "post_comment",
          target_id: String(inserted.id),
        });
    }

    setPosts((current) =>
      current.map((item) =>
        item.id === postId
          ? {
              ...item,
              comments: [
                ...(item.comments || []),
                {
                  id: inserted.id,
                  created_at: inserted.created_at,
                  post_id: postId,
                  user_id: currentUser.id,
                  content: value,
                  profile: {
                    username:
                      currentProfile?.username ||
                      "usuario",
                    full_name:
                      currentProfile?.full_name ||
                      null,
                    avatar_url:
                      currentProfile?.avatar_url ||
                      null,
                  },
                },
              ],
            }
          : item
      )
    );

    setCommentInputs((current) => ({
      ...current,
      [postId]: "",
    }));

    schedulePostsRefresh(260);
  }

  async function toggleRepost(post: any) {
    if (!currentUser) {
      window.location.href = "/login";
      return;
    }

    if (post.user_id === currentUser.id) {
      showToast("No puedes repostear tu propia publicación");
      return;
    }

    const wasReposted = Boolean(post.reposted);

    setPosts((current) =>
      current.map((item) =>
        item.id === post.id
          ? {
              ...item,
              reposted: !wasReposted,
              repostsCount: Math.max(
                0,
                Number(item.repostsCount || 0) +
                  (wasReposted ? -1 : 1)
              ),
              latestRepostAt: !wasReposted
                ? new Date().toISOString()
                : item.latestRepostAt,
              latestRepostProfile: !wasReposted
                ? currentProfile
                : item.latestRepostProfile,
              repostUserIds: wasReposted
                ? (item.repostUserIds || []).filter(
                    (id: string) => id !== currentUser.id
                  )
                : [
                    currentUser.id,
                    ...(item.repostUserIds || []),
                  ],
            }
          : item
      )
    );

    const query = supabase.from("post_reposts");

    const { error } = wasReposted
      ? await query
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUser.id)
      : await query.insert({
          post_id: post.id,
          user_id: currentUser.id,
        });

    if (error) {
      schedulePostsRefresh(20);
      showToast(error.message);
      return;
    }

    showToast(
      wasReposted
        ? "Repost eliminado"
        : "Compartido en Alumni"
    );

    schedulePostsRefresh(220);
  }

  async function toggleSave(post: any) {
    if (!currentUser) {
      window.location.href = "/login";
      return;
    }

    const wasSaved = Boolean(post.saved);

    setPosts((current) =>
      current.map((item) =>
        item.id === post.id
          ? {
              ...item,
              saved: !wasSaved,
            }
          : item
      )
    );

    const table = supabase.from("post_saves");

    const { error } = wasSaved
      ? await table
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUser.id)
      : await table.insert({
          post_id: post.id,
          user_id: currentUser.id,
        });

    if (error) {
      schedulePostsRefresh(20);
      showToast(error.message);
      return;
    }

    showToast(wasSaved ? "Quitado de Guardadas" : "Publicación guardada");
  }

  function sharePostToStory(post: any) {
    const firstImage = (post.mediaItems || []).find(
      (item: PostMediaItem) =>
        item.media_type === "image" && item.media_url
    );

    window.dispatchEvent(
      new CustomEvent("alumni:compose-story-from-post", {
        detail: {
          id: post.id,
          username:
            post.profiles?.username || "Alumni",
          avatar_url:
            post.profiles?.avatar_url || null,
          content: post.content || null,
          image_url:
            firstImage?.media_url ||
            post.image_url ||
            null,
        },
      })
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function sharePost(post: any) {
    const url = `${window.location.origin}/feed?post=${post.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Publicación de @${post.profiles?.username || "Alumni"}`,
          text:
            post.content ||
            "Mira esta publicación en Alumni.",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        showToast("Enlace copiado");
      }
    } catch {}
  }

  async function copyPostLink(post: any) {
    const url = `${window.location.origin}/feed?post=${post.id}`;

    try {
      await navigator.clipboard.writeText(url);
      showToast("Enlace copiado");
    } catch {
      showToast("No se pudo copiar el enlace");
    }
  }

  async function reportPost(post: any) {
    if (!currentUser || post.user_id === currentUser.id) {
      return;
    }

    const approved = confirm(
      "¿Reportar esta publicación por spam o contenido inapropiado?"
    );

    if (!approved) return;

    const { error } = await supabase
      .from("user_reports")
      .insert({
        reporter_id: currentUser.id,
        target_user_id: post.user_id,
        target_type: "post",
        target_id: String(post.id),
        reason: "inappropriate",
        details: "Reportado desde Inicio.",
      });

    showToast(
      error
        ? error.message
        : "Reporte enviado. Gracias por ayudarnos."
    );
  }

  const visiblePosts = useMemo(() => {
    if (feedMode === "following") {
      return posts
        .filter((post) => {
          if (post.user_id === currentUser?.id) {
            return true;
          }

          if (followingIds.includes(post.user_id)) {
            return true;
          }

          return (post.repostUserIds || []).some(
            (id: string) => followingIds.includes(id)
          );
        })
        .sort((a, b) => {
          const aTime = new Date(
            a.latestRepostAt || a.created_at
          ).getTime();

          const bTime = new Date(
            b.latestRepostAt || b.created_at
          ).getTime();

          return bTime - aTime;
        });
    }

    return rankForYouPosts(
      posts,
      currentProfile,
      followingIds
    );
  }, [
    posts,
    feedMode,
    currentProfile,
    followingIds,
    currentUser?.id,
  ]);

  const activeCommentsPost = useMemo(
    () =>
      commentsPostId
        ? posts.find(
            (post) => post.id === commentsPostId
          ) || null
        : null,
    [commentsPostId, posts]
  );

  return (
    <AppShell>
      <div className="alumni-feed-page alumni-feed-pro mx-auto w-full max-w-[780px]">
        <StoriesRail
          focusStoryId={searchParams.get("story")}
        />

        <PostComposer
          content={content}
          setContent={setContent}
          mediaFiles={mediaFiles}
          setMediaFiles={setMediaFiles}
          createPost={createPost}
        />

        <nav className="alumni-pro-feed-tabs">
          {(
            [
              ["for-you", "Para ti"],
              ["following", "Siguiendo"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              data-active={
                feedMode === mode ? "true" : "false"
              }
              onClick={() =>
                setFeedMode(mode as FeedMode)
              }
            >
              {label}
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="alumni-pro-feed-status">
            Cargando publicaciones...
          </div>
        ) : visiblePosts.length === 0 ? (
          <div className="alumni-pro-feed-status">
            {feedMode === "following"
              ? "Todavía no hay publicaciones recientes de tus conexiones."
              : "Todavía no hay publicaciones."}
          </div>
        ) : (
          <div className="alumni-pro-feed-list">
            {visiblePosts.map((post, postIndex) => (
              <div
                key={post.id}
                className={
                  focusedPostId === post.id
                    ? "alumni-pro-post-focus"
                    : ""
                }
              >
                <FeedPost
                  post={post}
                  postIndex={postIndex}
                  currentUserId={currentUser?.id}
                  onLike={() => void toggleLike(post)}
                  onRepost={() =>
                    void toggleRepost(post)
                  }
                  onShare={() =>
                    void sharePost(post)
                  }
                  onStory={() =>
                    sharePostToStory(post)
                  }
                  onSave={() =>
                    void toggleSave(post)
                  }
                  onDelete={() =>
                    void deletePost(post)
                  }
                  onReport={() =>
                    void reportPost(post)
                  }
                  onCopyLink={() =>
                    void copyPostLink(post)
                  }
                  onOpenComments={() => {
                    setCommentsPostId(post.id);
                    setFocusedCommentId(null);
                  }}
                  onOpenEngagement={(mode) =>
                    setEngagement({
                      postId: post.id,
                      mode,
                    })
                  }
                  onOpenMedia={setSelectedMedia}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <FeedCommentsSheet
        post={activeCommentsPost}
        currentUserId={currentUser?.id}
        input={
          activeCommentsPost
            ? commentInputs[activeCommentsPost.id] || ""
            : ""
        }
        setInput={(value) => {
          if (!activeCommentsPost) return;

          setCommentInputs((current) => ({
            ...current,
            [activeCommentsPost.id]: value,
          }));
        }}
        onSend={() => {
          if (!activeCommentsPost) return;
          void addComment(activeCommentsPost.id);
        }}
        onClose={() => {
          setCommentsPostId(null);
          setFocusedCommentId(null);

          const url = new URL(window.location.href);
          url.searchParams.delete("comment");
          window.history.replaceState(
            {},
            "",
            url.pathname + url.search
          );
        }}
        focusedCommentId={focusedCommentId}
      />

      <FeedEngagementModal
        postId={engagement?.postId || null}
        mode={engagement?.mode || "likes"}
        onClose={() => setEngagement(null)}
      />

      {selectedMedia && (
        <div
          className="alumni-pro-media-viewer"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setSelectedMedia(null);
            }
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedMedia(null)}
            aria-label="Cerrar"
          >
            <X size={22} />
          </button>

          {selectedMedia.media_type === "video" ? (
            <video
              src={selectedMedia.media_url || ""}
              controls
              autoPlay
              playsInline
            />
          ) : (
            <img
              src={selectedMedia.media_url || ""}
              alt="Publicación ampliada"
            />
          )}
        </div>
      )}

      {toast && (
        <div className="alumni-pro-toast">
          {toast}
        </div>
      )}
    </AppShell>
  );
}

export default function FeedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] text-sm text-[var(--app-muted)]">
          Cargando Alumni...
        </div>
      }
    >
      <FeedContent />
    </Suspense>
  );
}

/* ALUMNI_1_4_0_FEED_PRO */

/* ALUMNI_1_4_2_THEME_CHAT_PROFILE_POLISH:FEED_NO_SAVED */

/* ALUMNI_1_6_0_EXPLORE_DISCOVERY:FEED_SIGNALS */

/* ALUMNI_2_3_3_PASSPORT_PROFILE_FEED_FIX:FEED_RESILIENT_LOAD */
