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
import type {
  SharedPostStoryPayload,
} from "@/components/stories/StoryFreeOverlay";
import { hydrateStoryMedia } from "@/lib/privateMedia";

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
    sharedPostDraft,
    setSharedPostDraft,
  ] =
    useState<SharedPostStoryPayload | null>(
      null
    );

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
    function openPostAsStory(
      event: Event
    ) {
      const detail =
        (
          event as CustomEvent<SharedPostStoryPayload>
        ).detail;

      if (
        !detail ||
        !detail.id ||
        !detail.username
      ) {
        return;
      }

      setSharedPostDraft(
        detail
      );

      setComposerOpen(
        true
      );
    }

    window.addEventListener(
      "alumni:compose-story-from-post",
      openPostAsStory
    );

    return () =>
      window.removeEventListener(
        "alumni:compose-story-from-post",
        openPostAsStory
      );
  }, []);

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

      const {
        data: muteRows,
      } = await supabase
        .from("user_mutes")
        .select("muted_user_id")
        .eq("user_id", user.id);

      const mutedIds =
        new Set(
          (muteRows || []).map(
            (row: any) =>
              row.muted_user_id
          )
        );

      const followingIds = (
        follows || []
      )
        .map(
          (row: any) =>
            row.following_id as string
        )
        .filter(
          (id) =>
            !mutedIds.has(id)
        );

      const candidateIds =
        Array.from(
          new Set([
            user.id,
            ...followingIds,
          ])
        );

      /*
        ALUMNI_1_1_0_D1_SAFE_STORIES
        Una columna nueva nunca debe hacer desaparecer
        las historias existentes. Si existe drift de
        schema, cargamos inmediatamente el formato anterior.
      */
      const storyFieldsBase = `
          id,
          user_id,
          media_url,
          media_path,
          media_bucket,
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
          caption,
          story_kind,
          headline,
          achievement_type,
          organization,
          opportunity_type,
          work_mode,
          location_text,
          action_url,
          story_template,
          story_accent,
          story_animation,
          story_photo_style,
          story_decor,
          story_font_style
        `;

      /*
        ALUMNI_1_1_0_D1_1_TYPES
        No reasignamos respuestas PostgREST con selects distintos:
        TypeScript infiere formas diferentes cuando una consulta
        incluye story_overlay y la otra no.
      */
      const overlayResult =
        await supabase
          .from("stories")
          .select(
            `${storyFieldsBase}, story_overlay`
          )
          .in(
            "user_id",
            candidateIds
          )
          .gt(
            "expires_at",
            new Date().toISOString()
          )
          .order(
            "created_at",
            {
              ascending: true,
            }
          );

      let storiesData =
        (overlayResult.data ||
          []) as any[];

      let storiesError:
        any =
        overlayResult.error;

      if (
        storiesError &&
        String(
          storiesError.message ||
            ""
        )
          .toLowerCase()
          .includes(
            "story_overlay"
          )
      ) {
        console.warn(
          "Story overlay no disponible; cargando historias compatibles."
        );

        const fallbackResult =
          await supabase
            .from("stories")
            .select(
              storyFieldsBase
            )
            .in(
              "user_id",
              candidateIds
            )
            .gt(
              "expires_at",
              new Date().toISOString()
            )
            .order(
              "created_at",
              {
                ascending: true,
              }
            );

        storiesData =
          (fallbackResult.data ||
            []) as any[];

        storiesError =
          fallbackResult.error;
      }

      if (storiesError) {
        console.error(
          "Stories load error:",
          storiesError
        );
        return;
      }

      const signedStories =
        await hydrateStoryMedia(
          storiesData
        );

      const stories =
        signedStories as StoryItem[];

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

  return (
    <>
      <section
        className="alumni-stories-section"
        aria-label="Historias de Alumni"
      >
        <div className="alumni-stories-rail">
          {/* ALUMNI_STORIES_1_3_2_OPTION_C_REAL_FIX: el + es una acción independiente */}
          <div className="alumni-story-compact-item">
            <div className="relative">
              <button
                type="button"
                onClick={handleOwnStoryClick}
                className="alumni-story-compact-button"
                aria-label={
                  ownGroupIndex >= 0
                    ? "Ver tu historia"
                    : "Crear historia"
                }
              >
                <span
                  className={
                    ownGroupIndex >= 0
                      ? "alumni-story-compact-ring alumni-story-compact-ring-unseen"
                      : "alumni-story-compact-ring alumni-story-compact-ring-empty"
                  }
                >
                  <span className="alumni-story-compact-avatar">
                    {me?.avatar_url ? (
                      <img src={me.avatar_url} alt="" loading="eager" />
                    ) : (
                      <span>
                        {me?.username?.charAt(0)?.toUpperCase() || "A"}
                      </span>
                    )}
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setComposerOpen(true);
                }}
                className="alumni-story-compact-add"
                style={{
                  position: "absolute",
                  right: "-2px",
                  bottom: "-2px",
                  zIndex: 30,
                }}
                aria-label="Agregar otra historia"
                title="Agregar historia"
              >
                <Plus size={13} strokeWidth={2.8} />
              </button>
            </div>

            <span className="alumni-story-compact-label" title="Tu historia">
              Tu historia
            </span>
          </div>

          {!loading &&
            groups.map((group, index) => {
              if (group.user_id === user.id) return null;
              const allViewed = group.stories.every((story) => story.viewed);

              return (
                <div key={group.user_id} className="alumni-story-compact-item">
                  <button
                    type="button"
                    onClick={() => openGroup(index)}
                    className="alumni-story-compact-button"
                    aria-label={`Ver historia de ${group.username}`}
                  >
                    <span
                      className={
                        allViewed
                          ? "alumni-story-compact-ring alumni-story-compact-ring-viewed"
                          : "alumni-story-compact-ring alumni-story-compact-ring-unseen"
                      }
                    >
                      <span className="alumni-story-compact-avatar">
                        {group.avatar_url ? (
                          <img src={group.avatar_url} alt="" loading="lazy" />
                        ) : (
                          <span>
                            {group.username?.charAt(0)?.toUpperCase() || "U"}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                  <span
                    className="alumni-story-compact-label"
                    title={`@${group.username}`}
                  >
                    {group.username}
                  </span>
                </div>
              );
            })}

          {loading &&
            Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`story-loading-${index}`}
                className="alumni-story-compact-item"
                aria-hidden="true"
              >
                <span className="alumni-story-compact-skeleton" />
                <span className="alumni-story-compact-label-skeleton" />
              </div>
            ))}
        </div>
      </section>

      <StoryComposer
        open={composerOpen}
        initialSharedPost={
          sharedPostDraft
        }
        onClose={() => {
          setComposerOpen(false);
          setSharedPostDraft(
            null
          );
        }}
        onPublished={async () => {
          setComposerOpen(false);
          setSharedPostDraft(
            null
          );
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

/* ALUMNI_1_2_0_TRUST_BLOCK:STORIES_PRIVATE_MEDIA */

/* ALUMNI_FEED_1_1_COMPACT_STORIES */
