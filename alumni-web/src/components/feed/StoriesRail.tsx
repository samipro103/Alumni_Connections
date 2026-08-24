"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import StoryComposer from "@/components/stories/StoryComposer";
import StoryViewer, {
  StoryGroup,
  StoryItem,
} from "@/components/stories/StoryViewer";

type ProfileLite = {
  id: string;
  username: string;
  avatar_url: string | null;
};

export default function StoriesRail({
  focusStoryId,
}: {
  focusStoryId?: string | null;
}) {
  const { user } = useAuth();

  const [me, setMe] =
    useState<ProfileLite | null>(null);

  const [groups, setGroups] =
    useState<StoryGroup[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [
    composerOpen,
    setComposerOpen,
  ] = useState(false);

  const [
    viewerOpen,
    setViewerOpen,
  ] = useState(false);

  const [
    viewerStartIndex,
    setViewerStartIndex,
  ] = useState(0);

  const [
    viewerStartStoryIndex,
    setViewerStartStoryIndex,
  ] = useState(0);

  const [
    lastHandledFocusStory,
    setLastHandledFocusStory,
  ] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setMe(null);
      setGroups([]);
      setLoading(false);
      return;
    }

    void loadStories();
  }, [user?.id]);

  async function loadStories() {
    if (!user) return;

    setLoading(true);

    try {
      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "id, username, avatar_url"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      setMe(profile || null);

      const {
        data: follows,
        error: followsError,
      } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (followsError) {
        throw followsError;
      }

      const followingIds = (
        follows || []
      ).map(
        (row: any) =>
          row.following_id as string
      );

      const candidateIds =
        Array.from(
          new Set([
            user.id,
            ...followingIds,
          ])
        );

      const {
        data: storiesData,
        error: storiesError,
      } = await supabase
        .from("stories")
        .select(`
          id,
          user_id,
          media_url,
          media_type,
          created_at,
          expires_at,
          music_provider,
          music_track_id,
          music_title,
          music_artist,
          music_artwork_url,
          music_track_url,
          music_embed_url,
          music_preview_url,
          music_duration_ms,
          music_clip_start_seconds,
          music_clip_duration_seconds,
          music_storage_path
        `)
        .in("user_id", candidateIds)
        .gt(
          "expires_at",
          new Date().toISOString()
        )
        .order("created_at", {
          ascending: true,
        });

      if (storiesError) {
        console.error(
          "Stories load error:",
          storiesError
        );
        setGroups([]);
        return;
      }

      const stories = (
        storiesData || []
      ) as StoryItem[];

      if (!stories.length) {
        setGroups([]);
        return;
      }

      const storyUserIds =
        Array.from(
          new Set(
            stories.map(
              (story) =>
                story.user_id
            )
          )
        );

      const {
        data: profilesData,
        error: profilesError,
      } = await supabase
        .from("profiles")
        .select(
          "id, username, avatar_url"
        )
        .in(
          "id",
          storyUserIds
        );

      if (profilesError) {
        throw profilesError;
      }

      const storyIds =
        stories.map(
          (story) => story.id
        );

      let viewedStoryIds =
        new Set<string>();

      if (storyIds.length > 0) {
        const {
          data: viewsData,
          error: viewsError,
        } = await supabase
          .from("story_views")
          .select("story_id")
          .eq(
            "viewer_id",
            user.id
          )
          .in(
            "story_id",
            storyIds
          );

        if (!viewsError) {
          viewedStoryIds =
            new Set(
              (
                viewsData || []
              ).map(
                (view: any) =>
                  view.story_id
              )
            );
        }
      }

      const profileMap =
        new Map(
          (
            (profilesData ||
              []) as ProfileLite[]
          ).map((profile) => [
            profile.id,
            profile,
          ])
        );

      const groupedMap =
        new Map<
          string,
          StoryGroup
        >();

      stories.forEach(
        (story) => {
          const profile =
            profileMap.get(
              story.user_id
            );

          if (!profile) return;

          const storyWithView = {
            ...story,
            viewed:
              viewedStoryIds.has(
                story.id
              ),
          };

          const current =
            groupedMap.get(
              story.user_id
            );

          if (current) {
            current.stories.push(
              storyWithView
            );
          } else {
            groupedMap.set(
              story.user_id,
              {
                user_id:
                  story.user_id,
                username:
                  profile.username,
                avatar_url:
                  profile.avatar_url,
                stories: [
                  storyWithView,
                ],
              }
            );
          }
        }
      );

      const ownGroup =
        groupedMap.get(
          user.id
        );

      const others =
        followingIds
          .map((id) =>
            groupedMap.get(id)
          )
          .filter(
            Boolean
          ) as StoryGroup[];

      setGroups(
        ownGroup
          ? [ownGroup, ...others]
          : others
      );
    } catch (error) {
      console.error(
        "Stories load error:",
        error
      );
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }

  const ownGroupIndex =
    useMemo(
      () =>
        groups.findIndex(
          (group) =>
            group.user_id ===
            user?.id
        ),
      [groups, user?.id]
    );

  useEffect(() => {
    if (
      !focusStoryId ||
      loading ||
      lastHandledFocusStory ===
        focusStoryId
    ) {
      return;
    }

    const groupIndex =
      groups.findIndex(
        (group) =>
          group.stories.some(
            (story) =>
              story.id ===
              focusStoryId
          )
      );

    if (groupIndex < 0) {
      return;
    }

    const storyIndex =
      groups[
        groupIndex
      ].stories.findIndex(
        (story) =>
          story.id ===
          focusStoryId
      );

    setViewerStartIndex(
      groupIndex
    );

    setViewerStartStoryIndex(
      Math.max(storyIndex, 0)
    );

    setViewerOpen(true);

    setLastHandledFocusStory(
      focusStoryId
    );
  }, [
    focusStoryId,
    groups,
    loading,
    lastHandledFocusStory,
  ]);

  function openGroup(
    groupIndex: number,
    storyIndex = 0
  ) {
    setViewerStartIndex(groupIndex);
    setViewerStartStoryIndex(storyIndex);
    setViewerOpen(true);
  }

  function handleOwnStoryClick() {
    if (ownGroupIndex >= 0) {
      openGroup(
        ownGroupIndex
      );
    } else {
      setComposerOpen(true);
    }
  }

  if (!user) return null;

  const ownPreviewStory =
    ownGroupIndex >= 0
      ? groups[ownGroupIndex]?.stories[
          Math.max(
            (groups[ownGroupIndex]?.stories.length || 1) - 1,
            0
          )
        ]
      : null;

  return (
    <>
      <section className="alumni-stories-section mb-5">
        <div className="scrollbar-thin flex gap-3 overflow-x-auto px-1 pb-5 pt-1">
          <div className="relative h-[132px] w-[92px] shrink-0">
            <button
              type="button"
              onClick={handleOwnStoryClick}
              className="alumni-story-tile group relative h-full w-full overflow-hidden rounded-[20px] text-left"
              aria-label={
                ownGroupIndex >= 0
                  ? "Ver tu historia"
                  : "Crear historia"
              }
            >
              <div className="absolute inset-0 bg-[var(--app-surface-2)]">
                {ownPreviewStory?.media_type === "image" ? (
                  <img
                    src={ownPreviewStory.media_url}
                    alt=""
                    className="h-full w-full object-cover transition duration-300 group-active:scale-[1.02]"
                    loading="eager"
                  />
                ) : ownPreviewStory?.media_type === "video" ? (
                  <video
                    src={ownPreviewStory.media_url}
                    muted
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                ) : me?.avatar_url ? (
                  <img
                    src={me.avatar_url}
                    alt=""
                    className="h-full w-full scale-110 object-cover opacity-55 blur-[1px]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-black text-[var(--app-muted)]">
                    {me?.username?.charAt(0)?.toUpperCase() || "T"}
                  </div>
                )}
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/5" />

              <div className="absolute left-2.5 top-2.5 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-white/70 bg-black/20 text-[10px] font-black text-white shadow-lg">
                {me?.avatar_url ? (
                  <img
                    src={me.avatar_url}
                    alt="Tu historia"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  me?.username?.charAt(0)?.toUpperCase() || "T"
                )}
              </div>

              <div className="absolute inset-x-2.5 bottom-2.5">
                <p className="truncate text-[11px] font-black text-white">
                  Tu historia
                </p>
                <p className="mt-0.5 truncate pr-5 text-[9px] text-white/55">
                  {ownGroupIndex >= 0 ? "Ver ahora" : "Crear"}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setComposerOpen(true)}
              className="absolute -bottom-1.5 right-1 z-20 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-[var(--app-bg)] bg-[var(--app-accent-2)] text-white shadow-[0_8px_22px_rgba(0,0,0,.38)] transition active:scale-95"
              aria-label="Agregar nueva historia"
              title="Agregar historia"
            >
              <Plus size={16} strokeWidth={2.7} />
            </button>
          </div>

          {!loading &&
            groups.map((group, index) => {
              if (group.user_id === user.id) {
                return null;
              }

              const allViewed = group.stories.every(
                (story) => story.viewed
              );
              const previewStory =
                group.stories[group.stories.length - 1];

              return (
                <button
                  key={group.user_id}
                  type="button"
                  onClick={() => openGroup(index)}
                  className={`alumni-story-tile group relative h-[132px] w-[92px] shrink-0 overflow-hidden rounded-[20px] text-left ${
                    allViewed
                      ? "alumni-story-viewed"
                      : "alumni-story-unseen"
                  }`}
                >
                  <div className="absolute inset-0 bg-[var(--app-surface-2)]">
                    {previewStory?.media_type === "image" ? (
                      <img
                        src={previewStory.media_url}
                        alt=""
                        className="h-full w-full object-cover transition duration-300 group-active:scale-[1.02]"
                        loading="lazy"
                      />
                    ) : previewStory?.media_type === "video" ? (
                      <video
                        src={previewStory.media_url}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover"
                      />
                    ) : group.avatar_url ? (
                      <img
                        src={group.avatar_url}
                        alt=""
                        className="h-full w-full scale-110 object-cover opacity-55 blur-[1px]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-black text-[var(--app-muted)]">
                        {group.username?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/5" />

                  <div
                    className={`absolute left-2.5 top-2.5 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 bg-black/20 text-[10px] font-black text-white shadow-lg ${
                      allViewed
                        ? "border-white/35"
                        : "border-white/90"
                    }`}
                  >
                    {group.avatar_url ? (
                      <img
                        src={group.avatar_url}
                        alt={group.username}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      group.username?.charAt(0)?.toUpperCase() || "U"
                    )}
                  </div>

                  <div className="absolute inset-x-2.5 bottom-2.5">
                    <p className="truncate text-[11px] font-black text-white">
                      @{group.username}
                    </p>
                    <p className="mt-0.5 truncate text-[9px] text-white/55">
                      {group.stories.length > 1
                        ? `${group.stories.length} historias`
                        : "Nueva historia"}
                    </p>
                  </div>
                </button>
              );
            })}
        </div>
      </section>

      <StoryComposer
        open={composerOpen}
        onClose={() =>
          setComposerOpen(false)
        }
        onPublished={async () => {
          setComposerOpen(false);
          await loadStories();
        }}
      />

      <StoryViewer
        open={viewerOpen}
        groups={groups}
        startGroupIndex={
          viewerStartIndex
        }
        startStoryIndex={
          viewerStartStoryIndex
        }
        currentUserId={user.id}
        onClose={() => {
          setViewerOpen(false);
          void loadStories();
        }}
        onChanged={loadStories}
      />
    </>
  );
}
