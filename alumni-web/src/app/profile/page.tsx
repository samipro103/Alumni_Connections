"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  GraduationCap,
  Heart,
  Link2,
  MapPin,
  MessageCircle,
  Pencil,
  Settings,
  Share2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/layout/AppShell";
import ProfileMusicCard from "@/components/profile/ProfileMusicCard";
import ProfilePassportPreview from "@/components/profile/ProfilePassportPreview";
import ProfileMiniStats from "@/components/profile/ProfileMiniStats";
import HDProfileImage from "@/components/profile/HDProfileImage";
import ProfileSocialLinks from "@/components/profile/ProfileSocialLinks";
import ProfileIdentityMeta from "@/components/profile/ProfileIdentityMeta";
import ProfileHeaderFacts from "@/components/profile/ProfileHeaderFacts";
import ProfessionalProfileOverview from "@/components/profile/ProfessionalProfileOverview";
import { hydratePostMedia } from "@/lib/privateMedia";
import ProfilePostOwnerMenu from "@/components/profile/ProfilePostOwnerMenu";
import "@/components/profile/ProfilePostOwnerMenu.css";


type ProfileTab = "posts" | "about";

/* ALUMNI_1_2_2_NAV_STABILITY:PROFILE */
type ProfilePageCache = {
  profile: any;
  followers: number;
  following: number;
  posts: any[];
  profileMusic: any;
};

const profilePageCache =
  new Map<
    string,
    ProfilePageCache
  >();

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [posts, setPosts] = useState<any[]>([]);
  const [profileMusic, setProfileMusic] = useState<any>(null);
  const [
    loadingProfile,
    setLoadingProfile,
  ] = useState(true);

  const [tab, setTab] =
    useState<ProfileTab>(
      "posts"
    );

  const profileRequestRef =
    useRef(0);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const cached =
      profilePageCache.get(
        user.id
      );

    if (cached) {
      setProfile(
        cached.profile
      );
      setFollowers(
        cached.followers
      );
      setFollowing(
        cached.following
      );
      setPosts(
        cached.posts
      );
      setProfileMusic(
        cached.profileMusic
      );
      setLoadingProfile(
        false
      );
    }

    void getProfile(
      !cached
    );

    return () => {
      profileRequestRef.current +=
        1;
    };
  }, [user?.id]);

  async function getProfile(
    showLoader = true
  ) {
    if (!user) return;

    const requestId =
      ++profileRequestRef.current;

    if (showLoader) {
      setLoadingProfile(true);
    }

    const currentUserId = user.id;

    const [
      { data: profileData, error: profileError },
      { data: followersData, error: followersError },
      { data: followingData, error: followingError },
      { data: postsData, error: postsError },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUserId)
        .maybeSingle(),
      supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", currentUserId),
      supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", currentUserId),
      supabase
        .from("posts")
        .select("*, likes(user_id)")
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: false }),
    ]);

    if (profileError) {
      console.error("Error cargando perfil:", profileError);
    }
    if (followersError) {
      console.error("Error cargando seguidores:", followersError);
    }
    if (followingError) {
      console.error("Error cargando seguidos:", followingError);
    }
    if (postsError) {
      console.error("Error cargando publicaciones del perfil:", postsError);
    }

    const safePosts =
      await hydratePostMedia(
        (postsData || []) as any[]
      );

    if (
      requestId !==
      profileRequestRef.current
    ) {
      return;
    }

    const postIds =
      safePosts.map(
        (post: any) => post.id
      );

    let commentsData: any[] = [];

    if (postIds.length > 0) {
      const { data, error } = await supabase
        .from("comments")
        .select("id, post_id")
        .in("post_id", postIds);

      if (error) {
        console.error("Error cargando comentarios del perfil:", error);
      } else {
        commentsData = data || [];
      }
    }

    if (
      requestId !==
      profileRequestRef.current
    ) {
      return;
    }

    const { data: pinnedRows } = await supabase
      .from("profile_pinned_posts")
      .select("post_id,sort_order")
      .eq("user_id", currentUserId)
      .order("sort_order", { ascending: true });

    if (
      requestId !==
      profileRequestRef.current
    ) {
      return;
    }

    const pinOrder = new Map(
      (pinnedRows || []).map(
        (row: any) => [
          Number(row.post_id),
          Number(row.sort_order),
        ]
      )
    );

    const nextPosts =
      safePosts
        .map(
          (post: any) => ({
            ...post,
            pinned: pinOrder.has(Number(post.id)),
            pinOrder: pinOrder.get(Number(post.id)) ?? 999,
            comments:
              commentsData.filter(
                (
                  comment: any
                ) =>
                  comment.post_id ===
                  post.id
              ),
          })
        )
        .sort((a: any, b: any) => {
          if (a.pinned !== b.pinned) {
            return a.pinned ? -1 : 1;
          }

          if (a.pinned && b.pinned) {
            return a.pinOrder - b.pinOrder;
          }

          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          );
        });

    const { data: musicData, error: musicError } = await supabase
      .from("profile_music")
      .select("*")
      .eq("user_id", currentUserId)
      .maybeSingle();

    if (musicError) {
      console.error("Error cargando música del perfil:", musicError);
    }

    if (
      requestId !==
      profileRequestRef.current
    ) {
      return;
    }

    const nextState = {
      profile:
        profileData || null,
      followers:
        followersData?.length ||
        0,
      following:
        followingData?.length ||
        0,
      posts:
        nextPosts,
      profileMusic:
        musicData || null,
    };

    profilePageCache.set(
      currentUserId,
      nextState
    );

    setProfile(
      nextState.profile
    );
    setFollowers(
      nextState.followers
    );
    setFollowing(
      nextState.following
    );
    setPosts(
      nextState.posts
    );
    setProfileMusic(
      nextState.profileMusic
    );
    setLoadingProfile(false);
  }

  async function shareProfile() {
    if (!profile?.username) return;

    const url = `${window.location.origin}/u/${profile.username}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `@${profile.username} en Alumni.`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert("Enlace del perfil copiado.");
      }
    } catch {
      // Compartir cancelado.
    }
  }

  async function editProfilePost(
    postId: number,
    content: string
  ) {
    const { error } = await supabase.rpc(
      "alumni_edit_post",
      {
        p_post_id: postId,
        p_content: content,
      }
    );

    if (error) {
      alert(error.message);
      throw error;
    }

    await getProfile(false);
  }

  async function toggleProfilePin(
    postId: number
  ) {
    const { error } = await supabase.rpc(
      "alumni_toggle_profile_pin",
      {
        p_post_id: postId,
      }
    );

    if (error) {
      alert(error.message);
      return;
    }

    await getProfile(false);
  }

  async function deleteProfilePost(
    postId: number
  ) {
    if (!user) return;

    const confirmed = window.confirm(
      "¿Borrar esta publicación? Esta acción no se puede deshacer."
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .eq("user_id", user.id);

    if (error) {
      alert(error.message);
      return;
    }

    await getProfile(false);
  }

  const links = useMemo(
    () =>
      [
        ["Sitio web", profile?.website],
        ["GitHub", profile?.github],
        ["LinkedIn", profile?.linkedin],
        ["Instagram", profile?.instagram],
      ].filter(([, value]) => Boolean(value)),
    [profile]
  );

  if (loadingProfile) {
    return (
      <AppShell>
        <div className="py-16 text-center text-sm text-zinc-600">
          Cargando perfil...
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <div className="py-16 text-center text-sm text-zinc-600">
          No se encontró tu perfil.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="alumni-profile-page mx-auto w-full max-w-[980px]">
        <section className="alumni-profile-hero">
          <div className="alumni-profile-banner overflow-hidden rounded-[24px]">
            <div className="relative h-48 bg-[#151a23] sm:h-60">
              {profile.banner_url ? (
                <HDProfileImage
                  src={profile.banner_url}
                  alt="Banner"
                  variant="banner"
                  className="h-full w-full object-cover"
/>
              ) : (
                <div className="profile-banner-fallback h-full w-full" />
              )}
            </div>
          </div>

          <div className="alumni-profile-body px-5 pb-6 pt-5 sm:px-7 sm:pt-6">
            <div className="alumni-profile-identity flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex shrink-0 items-center gap-4">
                <div className="alumni-profile-avatar flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[0.09] bg-[#1a1f29] text-2xl font-black shadow-[0_10px_28px_rgba(0,0,0,.16)] sm:h-28 sm:w-28">
                  {profile.avatar_url ? (
                    <HDProfileImage
                      src={profile.avatar_url}
                      alt="Avatar"
                      variant="avatar"
                      className="h-full w-full object-cover"
  />
                  ) : (
                    profile.username?.charAt(0)?.toUpperCase() || "U"
                  )}
                </div>

                <ProfileMiniStats
                  posts={posts.length}
                  followers={followers}
                  following={following}
                />
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="truncate text-2xl font-black tracking-[-0.035em]">
                  @{profile.username}
                </h1>
                {profile.full_name && (
                  <p className="mt-1 text-sm text-zinc-500">
                    {profile.full_name}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 gap-2">
                <Link
                  href="/settings?section=profile&edit=1"
                  className="flex h-10 items-center gap-2 rounded-xl bg-[#6d7cff] px-4 text-xs font-black text-white transition hover:bg-[#7b87ff]"
                >
                  <Pencil size={15} />
                  Editar perfil
                </Link>

                <button
                  onClick={shareProfile}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-zinc-500 transition hover:text-white"
                  aria-label="Compartir perfil"
                >
                  <Share2 size={16} />
                </button>
              </div>
            </div>

            <ProfileHeaderFacts profile={profile} />

            {profile.bio && (
              <p className="mt-5 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-zinc-400">
                {profile.bio}
              </p>
            )}

            <ProfileIdentityMeta profile={profile} />

        <ProfileSocialLinks profile={profile} className="mt-5" />

            <ProfileMusicCard track={profileMusic} className="mt-5" />

            <ProfilePassportPreview
              userId={profile.id}
              username={profile.username}
              own
            />


          </div>
        </section>

        <div className="alumni-section-tabs mt-6 flex items-center border-b border-white/[0.07]">
          <Tab
            active={tab === "posts"}
            onClick={() => setTab("posts")}
            label="Publicaciones"
          />
          <Tab
            active={tab === "about"}
            onClick={() => setTab("about")}
            label="Acerca de"
          />
        </div>

        {tab === "posts" ? (
          <section className="pt-4">
            {posts.length === 0 ? (
              <div className="alumni-empty-state rounded-[24px] border border-dashed border-white/[0.09] px-6 py-14 text-center text-sm text-zinc-600">
                Todavía no has publicado nada.
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post: any) => (
                  <article
                    key={post.id}
                    className="alumni-post-card overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#101318]/95"
                  >
                    <div className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#1a1f29] text-xs font-bold">
                          {profile.avatar_url ? (
                            <img
                              src={profile.avatar_url}
                              alt="Avatar"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            profile.username?.charAt(0)?.toUpperCase() ||
                            "U"
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-black">
                            @{profile.username}
                          </p>
                          <p className="mt-0.5 text-[11px] text-zinc-700">
                            {formatDistanceToNow(
                              new Date(post.created_at),
                              {
                                addSuffix: true,
                                locale: es,
                              }
                            )}
                          </p>
                        </div>
                      </div>

                      {post.content && (
                        <p className="mt-4 whitespace-pre-wrap text-[15px] leading-6 text-zinc-300">
                          {post.content}
                        </p>
                      )}
                    </div>

                    {post.image_url ? (
                      <div className="alumni-profile-post-media-wrap">
                        <img
                          src={post.image_url}
                          alt="Publicación"
                          className="max-h-[650px] w-full object-contain"
                        />

                        <ProfilePostOwnerMenu
                          post={post}
                          pinned={Boolean(post.pinned)}
                          onEdit={(content) =>
                            editProfilePost(post.id, content)
                          }
                          onTogglePin={() =>
                            toggleProfilePin(post.id)
                          }
                          onDelete={() =>
                            deleteProfilePost(post.id)
                          }
                        />
                      </div>
                    ) : (
                      <div className="alumni-profile-post-text-wrap">
                        <ProfilePostOwnerMenu
                          post={post}
                          pinned={Boolean(post.pinned)}
                          onEdit={(content) =>
                            editProfilePost(post.id, content)
                          }
                          onTogglePin={() =>
                            toggleProfilePin(post.id)
                          }
                          onDelete={() =>
                            deleteProfilePost(post.id)
                          }
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-5 px-5 py-3 text-xs font-bold text-zinc-600">
                      <span className="flex items-center gap-1.5">
                        <Heart size={15} />
                        {post.likes?.length || 0}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <MessageCircle size={15} />
                        {post.comments?.length || 0}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : (
          <ProfessionalProfileOverview
            profile={profile}
            posts={posts}
            followers={followers}
            following={following}
            own
          />
        )}

        <div className="mt-7 flex justify-end">
          <Link
            href="/settings"
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 hover:text-zinc-300"
          >
            <Settings size={14} />
            Configuración
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div>
      <p className="text-lg font-black text-zinc-100">{value}</p>
      <p className="text-xs text-zinc-600">{label}</p>
    </div>
  );
}

function Tab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 pb-3 text-sm font-bold transition ${
        active
          ? "text-zinc-100"
          : "text-zinc-600 hover:text-zinc-300"
      }`}
    >
      {label}
      {active && (
        <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-[#6d7cff]" />
      )}
    </button>
  );
}

function InfoBlock({
  title,
  icon,
  className = "",
  children,
}: {
  title: string;
  icon: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`alumni-open-info border-b border-[var(--app-border)] py-5 ${className}`}
    >
      <div className="flex items-center gap-2 text-[#8d98ff]">
        {icon}
        <p className="text-sm font-black text-zinc-200">{title}</p>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-700">
        {label}
      </p>
      <p className="mt-1 text-sm text-zinc-400">
        {value || "No especificado"}
      </p>
    </div>
  );
}

/* ALUMNI_1_2_0_TRUST_BLOCK:OWN_PROFILE_MEDIA */

/* ALUMNI_1_8_0_IDENTITY_CONNECTIONS:OWN_PROFILE */

/* ALUMNI_1_8_1_PROFILE_RESTORE_PIN_EDIT_LIMITS:OWN_PROFILE */

/* ALUMNI_2_3_0_SOCIAL_PASSPORT:OWNER_PROFILE */

/* ALUMNI_2_3_1_PROFILE_PASSPORT_POLISH:OWNER */
