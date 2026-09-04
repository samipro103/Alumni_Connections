"use client";

import {
  Fragment,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import "./feed-pro.css";
import "./feed-visual-2-4.css";
import "./feed-visual-2-5.css";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/layout/AppShell";
import { FeedLoadingSkeleton, AlumniEmptyState } from "@/components/ui/AlumniLoading";
import PostComposer, {
  type PostPublishStage,
} from "@/components/feed/PostComposer";
import StoriesRail from "@/components/feed/StoriesRail";
import FeedPost from "@/components/feed/FeedPost";
import AdSenseSlot from "@/components/ads/AdSenseSlot";
import { rankForYouPosts } from "@/lib/feedRanking";
import { analyzeImageLocally } from "@/lib/imageModerationClient";
import { hydratePostMedia } from "@/lib/privateMedia";
import { shareAlumniContent } from "@/lib/nativeExperience";
import {
  hydratePostMediaItems,
  removePostMedia,
  uploadPostMediaFiles,
  type PostMediaItem,
} from "@/lib/feedMedia";

const FeedCommentsSheet = dynamic(
  () => import("@/components/feed/FeedCommentsSheet"),
  {
    ssr: false,
    loading: () => null,
  }
);

const FeedEngagementModal = dynamic(
  () => import("@/components/feed/FeedEngagementModal"),
  {
    ssr: false,
    loading: () => null,
  }
);

const AlumniMediaViewer = dynamic(
  () => import("@/components/ui/AlumniMediaViewer"),
  {
    ssr: false,
    loading: () => null,
  }
);

type FeedMode = "for-you" | "following";
type EngagementState = {
  postId: number;
  mode: "likes" | "reposts";
} | null;

const FEED_PAGE_SIZE = 30;

function shouldShowFeedAd(
  postIndex: number
) {
  const position = postIndex + 1;

  if (position < 5) {
    return false;
  }

  return (position - 5) % 7 === 0;
}

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
  const [commentsLoading, setCommentsLoading] =
    useState(false);
  const [engagement, setEngagement] =
    useState<EngagementState>(null);
  const [selectedMedia, setSelectedMedia] =
    useState<PostMediaItem | null>(null);
  const [toast, setToast] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newPostsAvailable, setNewPostsAvailable] =
    useState(false);

  const refreshTimerRef = useRef<number | null>(null);
  const feedRequestRef = useRef(0);
  const toastTimerRef = useRef<number | null>(null);
  const oldestPostIdRef = useRef<number | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const pendingPostActionsRef =
    useRef<Set<string>>(new Set());
  const optimisticCommentIdRef = useRef(-1);
  const loadedPostIdsRef =
    useRef<Set<number>>(new Set());

  useEffect(() => {
    void refreshPosts({
      showLoader: true,
      limit: FEED_PAGE_SIZE,
    });
  }, []);

  useEffect(() => {
    async function checkForNewPosts() {
      if (
        typeof document !== "undefined" &&
        document.visibilityState !== "visible"
      ) {
        return;
      }

      const loadedIds =
        Array.from(loadedPostIdsRef.current);

      if (!loadedIds.length) {
        return;
      }

      const newestLoadedId =
        Math.max(...loadedIds);

      const { data, error } = await supabase
        .from("posts")
        .select("id")
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (
        !error &&
        data?.id &&
        Number(data.id) > newestLoadedId
      ) {
        setNewPostsAvailable(true);
      }
    }

    function handleNewPost(payload: any) {
      const postId = Number(
        payload?.new?.id
      );

      if (
        Number.isFinite(postId) &&
        postId > 0 &&
        !loadedPostIdsRef.current.has(postId)
      ) {
        setNewPostsAvailable(true);
      }
    }

    function handleVisibility() {
      if (
        document.visibilityState === "visible"
      ) {
        void checkForNewPosts();
      }
    }

    function handleOnline() {
      void checkForNewPosts();
    }

    const channel = supabase
      .channel("feed-pro-new-posts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
        },
        handleNewPost
      )
      .subscribe();

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );
    window.addEventListener(
      "online",
      handleOnline
    );

    return () => {
      feedRequestRef.current += 1;

      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }

      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
      window.removeEventListener(
        "online",
        handleOnline
      );

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

  useEffect(() => {
    if (
      loading ||
      searchParams.get(
        "compose"
      ) !== "1"
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          window.dispatchEvent(
            new CustomEvent(
              "alumni:open-composer"
            )
          );

          document
            .getElementById(
              "composer"
            )
            ?.scrollIntoView({
              behavior:
                "smooth",
              block:
                "center",
            });

          const url =
            new URL(
              window.location.href
            );

          url.searchParams.delete(
            "compose"
          );

          window.history.replaceState(
            {},
            "",
            url.pathname +
              url.search +
              url.hash
          );
        },
        120
      );

    return () =>
      window.clearTimeout(
        timer
      );
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

  function schedulePostsRefresh(delay = 320) {
    if (
      typeof document !== "undefined" &&
      document.visibilityState !== "visible"
    ) {
      return;
    }

    if (refreshTimerRef.current !== null) {
      window.clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = window.setTimeout(() => {
      refreshTimerRef.current = null;

      void refreshPosts({
        showLoader: false,
        limit: FEED_PAGE_SIZE,
      }).then((ok) => {
        if (ok) {
          setNewPostsAvailable(false);
        }
      });
    }, delay);
  }

  async function refreshNewestPosts() {
    const ok = await refreshPosts({
      showLoader: false,
      limit: FEED_PAGE_SIZE,
    });

    if (!ok) {
      return;
    }

    setNewPostsAvailable(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function refreshPosts(options: {
    showLoader?: boolean;
    limit?: number;
    append?: boolean;
    beforePostId?: number | null;
  } = {}) {
    try {
      const result = await getPosts(options);
      return result !== false;
    } catch (error) {
      console.error(
        "[Alumni Feed] unexpected load error:",
        error
      );

      if (options.showLoader) {
        setLoading(false);
      }

      showToast(
        options.showLoader
          ? "No se pudieron cargar las publicaciones."
          : "No se pudo actualizar el Feed."
      );

      return false;
    }
  }

  async function loadMorePosts() {
    if (loadingMore || !hasMore) {
      return;
    }

    const beforePostId =
      oldestPostIdRef.current;

    if (!beforePostId) {
      setHasMore(false);
      return;
    }

    setLoadingMore(true);

    await refreshPosts({
      showLoader: false,
      limit: FEED_PAGE_SIZE,
      append: true,
      beforePostId,
    });

    setLoadingMore(false);
  }

  async function getPosts(options: {
    showLoader?: boolean;
    limit?: number;
    append?: boolean;
    beforePostId?: number | null;
  } = {}) {
    const {
      showLoader = false,
      limit = FEED_PAGE_SIZE,
      append = false,
      beforePostId = null,
    } = options;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return getPostsLegacy(options);
    }

    const safeLimit = Math.min(
      50,
      Math.max(
        FEED_PAGE_SIZE,
        Number(limit) || FEED_PAGE_SIZE
      )
    );

    const requestId = ++feedRequestRef.current;

    if (showLoader) {
      setLoading(true);
    }

    const requestedPostId = Number(
      searchParams.get("post")
    );

    const { data, error } = await supabase.rpc(
      "alumni_feed_page_v2",
      {
        p_before_id:
          append && beforePostId
            ? Number(beforePostId)
            : null,
        p_limit: safeLimit,
        p_focus_post_id:
          !append &&
          Number.isFinite(requestedPostId) &&
          requestedPostId > 0
            ? requestedPostId
            : null,
      }
    );

    if (requestId !== feedRequestRef.current) {
      return;
    }

    if (error || !data) {
      console.warn(
        "[Alumni Feed] fast RPC fallback:",
        error
      );
      return getPostsLegacy(options);
    }

    const payload = data as any;
    const rawPosts = Array.isArray(payload.posts)
      ? payload.posts
      : [];

    let legacyReady = rawPosts;

    try {
      legacyReady = await hydratePostMedia(rawPosts);
    } catch (mediaError) {
      console.warn(
        "[Alumni Feed] fast legacy media:",
        mediaError
      );
    }

    const allMedia = legacyReady.flatMap(
      (item: any) =>
        Array.isArray(item.mediaItems)
          ? item.mediaItems
          : []
    );

    let hydratedMedia = allMedia;

    try {
      hydratedMedia = await hydratePostMediaItems(
        allMedia
      );
    } catch (mediaError) {
      console.warn(
        "[Alumni Feed] fast media items:",
        mediaError
      );
    }

    const mediaByPost = new Map<number, any[]>();

    for (const item of hydratedMedia) {
      const postId = Number(item.post_id);
      const current =
        mediaByPost.get(postId) || [];
      current.push(item);
      mediaByPost.set(postId, current);
    }

    const formatted = legacyReady.map(
      (item: any) => {
        const mediaItems =
          mediaByPost.get(Number(item.id)) || [];

        if (
          !mediaItems.length &&
          item.image_url
        ) {
          mediaItems.push({
            post_id: item.id,
            user_id: item.user_id,
            media_type: "image",
            media_url: item.image_url,
            media_path: item.image_path || null,
            media_bucket:
              item.media_bucket || "posts",
            mime_type: null,
            sort_order: 0,
          });
        }

        return {
          ...item,
          comments:
            Array.isArray(item.comments)
              ? item.comments
              : [],
          commentsCount:
            Number(item.commentsCount || 0),
          mediaItems,
        };
      }
    );

    setCurrentUser(session.user);
    setCurrentProfile(
      payload.currentProfile || null
    );
    setFollowingIds(
      Array.isArray(payload.followingIds)
        ? payload.followingIds
        : []
    );

    const nextCursor = Number(
      payload.nextCursor
    );

    if (
      Number.isFinite(nextCursor) &&
      nextCursor > 0
    ) {
      oldestPostIdRef.current =
        append && oldestPostIdRef.current
          ? Math.min(
              oldestPostIdRef.current,
              nextCursor
            )
          : nextCursor;
    } else if (!append) {
      oldestPostIdRef.current = null;
    }

    if (append) {
      const nextLoaded =
        new Set(loadedPostIdsRef.current);

      for (const item of formatted) {
        nextLoaded.add(Number(item.id));
      }

      loadedPostIdsRef.current = nextLoaded;

      setPosts((current) => {
        const byId = new Map(
          current.map((item: any) => [
            Number(item.id),
            item,
          ])
        );

        for (const item of formatted) {
          byId.set(Number(item.id), item);
        }

        return Array.from(byId.values());
      });
    } else {
      loadedPostIdsRef.current =
        new Set(
          formatted.map((item: any) =>
            Number(item.id)
          )
        );
      setPosts(formatted);
    }

    setHasMore(Boolean(payload.hasMore));

    if (showLoader) {
      setLoading(false);
    }

    return true;
  }

  async function getPostsLegacy({
    showLoader = false,
    limit = FEED_PAGE_SIZE,
    append = false,
    beforePostId = null,
  }: {
    showLoader?: boolean;
    limit?: number;
    append?: boolean;
    beforePostId?: number | null;
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

    const safeLimit = Math.max(
      FEED_PAGE_SIZE,
      Number(limit) || FEED_PAGE_SIZE
    );

    let postsQuery = supabase
      .from("posts")
      .select(
        "id,user_id,content,image_url,created_at,image_path,media_bucket,edited_at"
      )
      .order("id", { ascending: false })
      .limit(safeLimit);

    if (
      append &&
      Number.isFinite(beforePostId) &&
      Number(beforePostId) > 0
    ) {
      postsQuery = postsQuery.lt(
        "id",
        Number(beforePostId)
      );
    }

    const {
      data: basePosts,
      error: postsError,
    } = await postsQuery;

    if (requestId !== feedRequestRef.current) return;

    if (postsError) {
      console.error(
        "[Alumni Feed] posts:",
        postsError
      );

      if (showLoader) {
        setPosts([]);
        setLoading(false);
      }

      showToast(
        showLoader
          ? "No se pudieron cargar las publicaciones."
          : "No se pudo actualizar el Feed."
      );

      return false;
    }

    const pagePostCount =
      (basePosts || []).length;

    const pagePostIds = (basePosts || [])
      .map((post: any) => Number(post.id))
      .filter(
        (id: number) =>
          Number.isFinite(id) && id > 0
      );

    if (pagePostIds.length) {
      const pageOldestId =
        Math.min(...pagePostIds);

      oldestPostIdRef.current =
        append && oldestPostIdRef.current
          ? Math.min(
              oldestPostIdRef.current,
              pageOldestId
            )
          : pageOldestId;
    } else if (!append) {
      oldestPostIdRef.current = null;
    }

    const basePostRows = [
      ...(basePosts || []),
    ];

    const requestedPostId = Number(
      searchParams.get("post")
    );

    if (
      Number.isFinite(requestedPostId) &&
      requestedPostId > 0 &&
      !basePostRows.some(
        (post: any) =>
          Number(post.id) ===
          requestedPostId
      )
    ) {
      const {
        data: requestedPost,
      } = await supabase
        .from("posts")
        .select(
          "id,user_id,content,image_url,created_at,image_path,media_bucket,edited_at"
        )
        .eq("id", requestedPostId)
        .maybeSingle();

      if (requestedPost) {
        basePostRows.push(
          requestedPost
        );
      }
    }

    const basePostIds = basePostRows.map(
      (post: any) => post.id
    );

    const authorIds = [
      ...new Set(
        basePostRows
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

    const postsData = basePostRows.map(
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
          .select(
            "id,post_id,user_id,content,created_at"
          )
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
          .select(
            "id,post_id,user_id,media_type,media_url,media_path,media_bucket,mime_type,sort_order,width,height,created_at"
          )
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

    if (append) {
      const nextLoadedIds =
        new Set(loadedPostIdsRef.current);

      for (const post of formatted) {
        nextLoadedIds.add(
          Number(post.id)
        );
      }

      loadedPostIdsRef.current =
        nextLoadedIds;

      setPosts((current) => {
        const byId = new Map(
          current.map((post: any) => [
            Number(post.id),
            post,
          ])
        );

        for (const post of formatted) {
          byId.set(
            Number(post.id),
            post
          );
        }

        return Array.from(
          byId.values()
        );
      });
    } else {
      setPosts(formatted);

      loadedPostIdsRef.current =
        new Set(
          formatted.map(
            (post: any) =>
              Number(post.id)
          )
        );
    }

    setHasMore(
      pagePostCount >= safeLimit
    );

    if (showLoader) {
      setLoading(false);
    }

    return true;
  }

  async function createPost(
    onStage?: (
      stage: PostPublishStage
    ) => void
  ): Promise<boolean> {
    if (!content.trim() && !mediaFiles.length) {
      return false;
    }

    onStage?.(
      "preparing"
    );

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
      onStage?.(
        mediaFiles.length
          ? "uploading"
          : "publishing"
      );

      const uploadResult = await uploadPostMediaFiles({
        files: mediaFiles,
        userId: user.id,
        postId: insertedPost.id,
        isPrivate: Boolean(privacyProfile?.is_private),
      });

      onStage?.(
        "publishing"
      );

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

    const actionKey = `like:${post.id}`;

    if (
      pendingPostActionsRef.current.has(actionKey)
    ) {
      return;
    }

    pendingPostActionsRef.current.add(actionKey);

    const wasLiked = Boolean(post.liked);
    const previousLikesCount = Number(
      post.likesCount || 0
    );

    setPosts((current) =>
      current.map((item) =>
        item.id === post.id
          ? {
              ...item,
              liked: !wasLiked,
              likesCount: Math.max(
                0,
                previousLikesCount +
                  (wasLiked ? -1 : 1)
              ),
            }
          : item
      )
    );

    try {
      const { error } = wasLiked
        ? await supabase
            .from("likes")
            .delete()
            .eq("post_id", post.id)
            .eq("user_id", currentUser.id)
        : await supabase
            .from("likes")
            .insert({
              post_id: post.id,
              user_id: currentUser.id,
            });

      if (error) {
        console.error(
          "[Alumni Feed] like mutation:",
          error
        );

        setPosts((current) =>
          current.map((item) =>
            item.id === post.id
              ? {
                  ...item,
                  liked: wasLiked,
                  likesCount:
                    previousLikesCount,
                }
              : item
          )
        );

        showToast(
          error.message ||
            "No se pudo actualizar Me gusta"
        );
        return;
      }

      if (post.user_id !== currentUser.id) {
        if (wasLiked) {
          void supabase
            .from("notifications")
            .delete()
            .eq("user_id", post.user_id)
            .eq("actor_id", currentUser.id)
            .eq("type", "like")
            .eq("post_id", post.id)
            .then(({ error }) => {
              if (error) {
                console.warn(
                  "[Alumni Feed] like notification delete:",
                  error
                );
              }
            });
        } else {
          void supabase
            .from("notifications")
            .insert({
              user_id: post.user_id,
              actor_id: currentUser.id,
              type: "like",
              post_id: post.id,
              target_type: "post",
              target_id: String(post.id),
            })
            .then(({ error }) => {
              if (error) {
                console.warn(
                  "[Alumni Feed] like notification insert:",
                  error
                );
              }
            });
        }
      }
    } finally {
      pendingPostActionsRef.current.delete(
        actionKey
      );
    }
  }

  async function openComments(postId: number) {
    setCommentsPostId(postId);
    setFocusedCommentId(null);

    const post = posts.find(
      (item) => item.id === postId
    );

    if (post?.commentsLoaded) {
      return;
    }

    setCommentsLoading(true);

    const { data, error } = await supabase.rpc(
      "alumni_post_comments_v1",
      {
        p_post_id: postId,
        p_limit: 500,
      }
    );

    if (!error && Array.isArray(data)) {
      setPosts((current) =>
        current.map((item) =>
          item.id === postId
            ? {
                ...item,
                comments: data,
                commentsCount: data.length,
                commentsLoaded: true,
              }
            : item
        )
      );
    } else if (error) {
      console.warn(
        "[Alumni Feed] lazy comments:",
        error
      );
      showToast(
        "No se pudieron cargar todos los comentarios."
      );
    }

    setCommentsLoading(false);
  }

  async function addComment(postId: number) {
    if (!currentUser) {
      window.location.href = "/login";
      return;
    }

    const value =
      commentInputs[postId]?.trim();

    if (!value) {
      return;
    }

    const actionKey = `comment:${postId}`;

    if (
      pendingPostActionsRef.current.has(actionKey)
    ) {
      return;
    }

    pendingPostActionsRef.current.add(actionKey);

    const optimisticId =
      optimisticCommentIdRef.current--;

    const optimisticCreatedAt =
      new Date().toISOString();

    const optimisticComment = {
      id: optimisticId,
      created_at: optimisticCreatedAt,
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
    };

    setCommentInputs((current) => ({
      ...current,
      [postId]: "",
    }));

    setPosts((current) =>
      current.map((item) =>
        item.id === postId
          ? {
              ...item,
              commentsCount:
                Number(
                  item.commentsCount ||
                    item.comments?.length ||
                    0
                ) + 1,
              comments: [
                ...(item.comments || []),
                optimisticComment,
              ],
            }
          : item
      )
    );

    try {
      const {
        data: inserted,
        error,
      } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: currentUser.id,
          content: value,
        })
        .select("id,created_at")
        .single();

      if (error || !inserted) {
        if (error) {
          console.error(
            "[Alumni Feed] comment mutation:",
            error
          );
        }

        setPosts((current) =>
          current.map((item) =>
            item.id === postId
              ? {
                  ...item,
                  commentsCount: Math.max(
                    0,
                    Number(
                      item.commentsCount ||
                        item.comments?.length ||
                        0
                    ) - 1
                  ),
                  comments: (
                    item.comments || []
                  ).filter(
                    (comment: any) =>
                      comment.id !==
                      optimisticId
                  ),
                }
              : item
          )
        );

        setCommentInputs((current) => ({
          ...current,
          [postId]:
            current[postId]?.trim()
              ? current[postId]
              : value,
        }));

        showToast(
          error?.message ||
            "No se pudo comentar"
        );
        return;
      }

      setPosts((current) =>
        current.map((item) =>
          item.id === postId
            ? {
                ...item,
                comments: (
                  item.comments || []
                ).map(
                  (comment: any) =>
                    comment.id ===
                    optimisticId
                      ? {
                          ...comment,
                          id: inserted.id,
                          created_at:
                            inserted.created_at,
                        }
                      : comment
                ),
              }
            : item
        )
      );

      const post = posts.find(
        (item) => item.id === postId
      );

      if (
        post &&
        post.user_id !== currentUser.id
      ) {
        void supabase
          .from("notifications")
          .insert({
            user_id: post.user_id,
            actor_id: currentUser.id,
            type: "comment",
            post_id: postId,
            target_type: "post_comment",
            target_id: String(
              inserted.id
            ),
          })
          .then(({ error }) => {
            if (error) {
              console.warn(
                "[Alumni Feed] comment notification:",
                error
              );
            }
          });
      }
    } finally {
      pendingPostActionsRef.current.delete(
        actionKey
      );
    }
  }

  async function toggleRepost(post: any) {
    if (!currentUser) {
      window.location.href = "/login";
      return;
    }

    if (post.user_id === currentUser.id) {
      showToast(
        "No puedes repostear tu propia publicación"
      );
      return;
    }

    const actionKey = `repost:${post.id}`;

    if (
      pendingPostActionsRef.current.has(actionKey)
    ) {
      return;
    }

    pendingPostActionsRef.current.add(actionKey);

    const wasReposted =
      Boolean(post.reposted);
    const previousRepostsCount =
      Number(post.repostsCount || 0);
    const previousLatestRepostAt =
      post.latestRepostAt;
    const previousLatestRepostProfile =
      post.latestRepostProfile;
    const previousRepostUserIds =
      Array.isArray(post.repostUserIds)
        ? [...post.repostUserIds]
        : [];

    setPosts((current) =>
      current.map((item) =>
        item.id === post.id
          ? {
              ...item,
              reposted: !wasReposted,
              repostsCount: Math.max(
                0,
                previousRepostsCount +
                  (wasReposted ? -1 : 1)
              ),
              latestRepostAt:
                !wasReposted
                  ? new Date().toISOString()
                  : item.latestRepostAt,
              latestRepostProfile:
                !wasReposted
                  ? currentProfile
                  : item.latestRepostProfile,
              repostUserIds: wasReposted
                ? previousRepostUserIds.filter(
                    (id: string) =>
                      id !== currentUser.id
                  )
                : [
                    currentUser.id,
                    ...previousRepostUserIds.filter(
                      (id: string) =>
                        id !== currentUser.id
                    ),
                  ],
            }
          : item
      )
    );

    try {
      const query =
        supabase.from("post_reposts");

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
        console.error(
          "[Alumni Feed] repost mutation:",
          error
        );

        setPosts((current) =>
          current.map((item) =>
            item.id === post.id
              ? {
                  ...item,
                  reposted: wasReposted,
                  repostsCount:
                    previousRepostsCount,
                  latestRepostAt:
                    previousLatestRepostAt,
                  latestRepostProfile:
                    previousLatestRepostProfile,
                  repostUserIds:
                    previousRepostUserIds,
                }
              : item
          )
        );

        showToast(error.message);
        return;
      }

      showToast(
        wasReposted
          ? "Repost eliminado"
          : "Compartido en Alumni"
      );
    } finally {
      pendingPostActionsRef.current.delete(
        actionKey
      );
    }
  }

  async function toggleSave(post: any) {
    if (!currentUser) {
      window.location.href = "/login";
      return;
    }

    const actionKey = `save:${post.id}`;

    if (
      pendingPostActionsRef.current.has(actionKey)
    ) {
      return;
    }

    pendingPostActionsRef.current.add(actionKey);

    const wasSaved =
      Boolean(post.saved);

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

    try {
      const table =
        supabase.from("post_saves");

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
        console.error(
          "[Alumni Feed] save mutation:",
          error
        );

        setPosts((current) =>
          current.map((item) =>
            item.id === post.id
              ? {
                  ...item,
                  saved: wasSaved,
                }
              : item
          )
        );

        showToast(error.message);
        return;
      }

      showToast(
        wasSaved
          ? "Quitado de Guardadas"
          : "Publicación guardada"
      );
    } finally {
      pendingPostActionsRef.current.delete(
        actionKey
      );
    }
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

    const result =
      await shareAlumniContent({
        title: `Publicación de @${post.profiles?.username || "Alumni"}`,
        text:
          post.content ||
          "Mira esta publicación en Alumni.",
        url,
        dialogTitle:
          "Compartir publicación",
      });

    if (result === "copied") {
      showToast("Enlace copiado");
    } else if (
      result === "unavailable"
    ) {
      showToast(
        "No se pudo abrir el menú para compartir."
      );
    }
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

  useEffect(() => {
    if (
      loading ||
      loadingMore ||
      !hasMore
    ) {
      return;
    }

    const target =
      loadMoreRef.current;

    if (!target) {
      return;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          if (
            entries[0]?.isIntersecting
          ) {
            void loadMorePosts();
          }
        },
        {
          rootMargin:
            "480px 0px",
        }
      );

    observer.observe(target);

    return () =>
      observer.disconnect();
  }, [
    loading,
    loadingMore,
    hasMore,
  ]);

  return (
    <AppShell>
      <div className="alumni-feed-page alumni-feed-pro mx-auto w-full max-w-[780px]">
        <StoriesRail
          focusStoryId={searchParams.get("story")}
        />

        <AdSenseSlot
          placement="stories"
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

        {newPostsAvailable && (
          <div className="flex justify-center px-4 py-2">
            <button
              type="button"
              onClick={() =>
                void refreshNewestPosts()
              }
              className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-xs font-semibold text-[var(--app-text)] shadow-sm transition hover:bg-[var(--app-surface-2)]"
            >
              Nuevas publicaciones
            </button>
          </div>
        )}

        {loading ? (
          <FeedLoadingSkeleton />
        ) : visiblePosts.length === 0 && !hasMore ? (
          <AlumniEmptyState
            eyebrow={
              feedMode === "following"
                ? "Tu red"
                : "Inicio"
            }
            title={
              feedMode === "following"
                ? "Tu red está tranquila por ahora."
                : "Todavía no hay publicaciones."
            }
            description={
              feedMode === "following"
                ? "Cuando tus conexiones publiquen o compartan algo, aparecerá aquí."
                : "Explora personas y comunidades para empezar a darle vida a tu Feed."
            }
            actionHref="/explore"
            actionLabel="Explorar Alumni"
          />
        ) : (
          <div className="alumni-pro-feed-list">
            {visiblePosts.map((post, postIndex) => (
              <Fragment key={post.id}>
              <div
                key={post.id}
                className={
                  focusedPostId === post.id
                    ? "alumni-feed-post-viewport alumni-pro-post-focus"
                    : "alumni-feed-post-viewport"
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
                    void openComments(post.id);
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

              {shouldShowFeedAd(postIndex) && (
                <AdSenseSlot
                  placement="feed"
                />
              )}
              </Fragment>
            ))}

            {hasMore && (
              <div
                ref={loadMoreRef}
                className="flex min-h-24 items-center justify-center px-4 py-7"
              >
                <button
                  type="button"
                  onClick={() =>
                    void loadMorePosts()
                  }
                  disabled={loadingMore}
                  className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2.5 text-xs font-semibold text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-2)] disabled:cursor-wait disabled:opacity-60"
                >
                  {loadingMore
                    ? "Cargando publicaciones..."
                    : "Ver más publicaciones"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {commentsPostId !== null && (
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
          loading={commentsLoading}
        />
      )}

      {engagement && (
        <FeedEngagementModal
          postId={engagement.postId}
          mode={engagement.mode}
          onClose={() => setEngagement(null)}
        />
      )}

      {selectedMedia && (
        <AlumniMediaViewer
          src={selectedMedia.media_url || ""}
          type={
            selectedMedia.media_type === "video"
              ? "video"
              : "image"
          }
          alt="Publicación ampliada"
          onClose={() => setSelectedMedia(null)}
        />
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

/* ALUMNI_2_7_0_LOADING_STATES:FEED */

/* ALUMNI_2_8_0_MEDIA_VIEWER:FEED */

/* ALUMNI_3_3_0A_WEB_ADS:FEED */

/* ALUMNI_3_5_0_NATIVE_EXPERIENCE */

/* ALUMNI_3_6_0_CREATION_SOCIAL_POLISH */

/* ALUMNI_3_7_0_PERFORMANCE_RELIABILITY_CORE */

/* ALUMNI_PERFORMANCE_HARDENING_FEED_V1_CURSOR_PAGINATION */

/* ALUMNI_PERFORMANCE_HARDENING_FEED_V2_RPC_LAZY_COMMENTS */

/* ALUMNI_PERFORMANCE_HARDENING_FEED_V3_REALTIME_LOW_FREQUENCY */

/* ALUMNI_PERFORMANCE_HARDENING_FEED_RENDER_V5 */

/* ALUMNI_PERFORMANCE_HARDENING_FEED_CODE_SPLIT_V6 */

/* ALUMNI_PERFORMANCE_HARDENING_FEED_OPTIMISTIC_ROLLBACK_V7 */
