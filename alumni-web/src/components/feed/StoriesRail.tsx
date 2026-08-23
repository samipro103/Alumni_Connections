"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera } from "lucide-react";
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

  const [me, setMe] = useState<ProfileLite | null>(null);
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const [composerOpen, setComposerOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);
  const [viewerStartStoryIndex, setViewerStartStoryIndex] = useState(0);
  const [lastHandledFocusStory, setLastHandledFocusStory] =
    useState<string | null>(null);

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
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      setMe(profile || null);

      const { data: follows, error: followsError } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (followsError) throw followsError;

      const followingIds = (follows || []).map(
        (row: any) => row.following_id as string
      );

      const candidateIds = Array.from(
        new Set([user.id, ...followingIds])
      );

      const { data: storiesData, error: storiesError } = await supabase
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
          music_embed_url
        `)
        .in("user_id", candidateIds)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: true });

      if (storiesError) {
        console.error("Stories load error:", storiesError);
        setGroups([]);
        return;
      }

      const stories = (storiesData || []) as StoryItem[];

      if (!stories.length) {
        setGroups([]);
        return;
      }

      const storyUserIds = Array.from(
        new Set(stories.map((story) => story.user_id))
      );

      const { data: profilesData, error: profilesError } =
        await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", storyUserIds);

      if (profilesError) throw profilesError;

      const storyIds = stories.map((story) => story.id);
      let viewedStoryIds = new Set<string>();

      if (storyIds.length > 0) {
        const { data: viewsData, error: viewsError } = await supabase
          .from("story_views")
          .select("story_id")
          .eq("viewer_id", user.id)
          .in("story_id", storyIds);

        if (!viewsError) {
          viewedStoryIds = new Set(
            (viewsData || []).map((view: any) => view.story_id)
          );
        }
      }

      const profileMap = new Map(
        ((profilesData || []) as ProfileLite[]).map((profile) => [
          profile.id,
          profile,
        ])
      );

      const groupedMap = new Map<string, StoryGroup>();

      stories.forEach((story) => {
        const profile = profileMap.get(story.user_id);
        if (!profile) return;

        const storyWithView = {
          ...story,
          viewed: viewedStoryIds.has(story.id),
        };

        const current = groupedMap.get(story.user_id);

        if (current) {
          current.stories.push(storyWithView);
        } else {
          groupedMap.set(story.user_id, {
            user_id: story.user_id,
            username: profile.username,
            avatar_url: profile.avatar_url,
            stories: [storyWithView],
          });
        }
      });

      const ownGroup = groupedMap.get(user.id);

      const others = followingIds
        .map((id) => groupedMap.get(id))
        .filter(Boolean) as StoryGroup[];

      setGroups(ownGroup ? [ownGroup, ...others] : others);
    } catch (error) {
      console.error("Stories load error:", error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }

  const ownGroupIndex = useMemo(
    () => groups.findIndex((group) => group.user_id === user?.id),
    [groups, user?.id]
  );

  useEffect(() => {
    if (
      !focusStoryId ||
      loading ||
      lastHandledFocusStory === focusStoryId
    ) {
      return;
    }

    const groupIndex = groups.findIndex((group) =>
      group.stories.some((story) => story.id === focusStoryId)
    );

    if (groupIndex < 0) return;

    const storyIndex = groups[groupIndex].stories.findIndex(
      (story) => story.id === focusStoryId
    );

    setViewerStartIndex(groupIndex);
    setViewerStartStoryIndex(Math.max(storyIndex, 0));
    setViewerOpen(true);
    setLastHandledFocusStory(focusStoryId);
  }, [
    focusStoryId,
    groups,
    loading,
    lastHandledFocusStory,
  ]);

  function openGroup(groupIndex: number, storyIndex = 0) {
    setViewerStartIndex(groupIndex);
    setViewerStartStoryIndex(storyIndex);
    setViewerOpen(true);
  }

  function handleOwnStoryClick() {
    if (ownGroupIndex >= 0) {
      openGroup(ownGroupIndex);
    } else {
      setComposerOpen(true);
    }
  }

  if (!user) return null;

  return (
    <>
      <section className="mb-5 border-b border-white/[0.07] pb-5">
        <div className="scrollbar-thin flex items-start gap-4 overflow-x-auto overflow-y-visible px-1 pb-2 pt-1">
          <div className="w-[82px] shrink-0 text-center">
            <div className="relative mx-auto flex h-[72px] w-[72px] items-center justify-center overflow-visible">
              <button
                type="button"
                onClick={handleOwnStoryClick}
                className={`relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#171b23] text-sm font-bold shadow-[0_10px_28px_rgba(0,0,0,.18)] transition-transform duration-200 hover:scale-[1.02] ${
                  ownGroupIndex >= 0
                    ? "ring-2 ring-[#7f8cff] ring-offset-2 ring-offset-[var(--app-bg)]"
                    : "border border-white/10"
                }`}
                aria-label={
                  ownGroupIndex >= 0
                    ? "Ver tu historia"
                    : "Crear historia"
                }
              >
                {me?.avatar_url ? (
                  <img
                    src={me.avatar_url}
                    alt="Tu historia"
                    className="h-full w-full object-cover"
                    loading="eager"
                  />
                ) : (
                  me?.username?.charAt(0)?.toUpperCase() || "T"
                )}
              </button>

              <button
                type="button"
                onClick={() => setComposerOpen(true)}
                className="absolute bottom-[2px] right-[1px] z-10 flex h-6 w-6 items-center justify-center rounded-full border-[2px] border-[var(--app-bg)] bg-[var(--app-accent-2)] text-[var(--app-on-accent)] shadow-[0_6px_18px_rgba(0,0,0,.28)] transition-transform duration-200 hover:scale-105"
                aria-label="Agregar historia"
              >
                <Camera size={11} strokeWidth={2.4} />
              </button>
            </div>

            <p className="mt-2 truncate text-[11px] font-semibold text-zinc-300">
              Tu historia
            </p>
          </div>

          {!loading &&
            groups.map((group, index) => {
              if (group.user_id === user.id) return null;

              const allViewed = group.stories.every(
                (story) => story.viewed
              );

              return (
                <button
                  key={group.user_id}
                  type="button"
                  onClick={() => openGroup(index)}
                  className="w-[82px] shrink-0 text-center"
                >
                  <div className="mx-auto flex h-[72px] w-[72px] items-center justify-center overflow-visible">
                    <div
                      className={`rounded-full p-[2px] ${
                        allViewed
                          ? "bg-white/[0.10]"
                          : "bg-[var(--app-accent-fill)]"
                      }`}
                    >
                      <div className="flex h-[58px] w-[58px] items-center justify-center overflow-hidden rounded-full border-[2px] border-[var(--app-bg)] bg-[#171b23] text-sm font-bold">
                        {group.avatar_url ? (
                          <img
                            src={group.avatar_url}
                            alt={group.username}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          group.username?.charAt(0)?.toUpperCase() ||
                          "U"
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="mt-2 truncate text-[11px] text-zinc-500">
                    @{group.username}
                  </p>
                </button>
              );
            })}
        </div>
      </section>

      <StoryComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPublished={async () => {
          setComposerOpen(false);
          await loadStories();
        }}
      />

      <StoryViewer
        open={viewerOpen}
        groups={groups}
        startGroupIndex={viewerStartIndex}
        startStoryIndex={viewerStartStoryIndex}
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
