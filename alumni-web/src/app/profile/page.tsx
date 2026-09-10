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
import { useAlumniUX } from "@/components/ui/AlumniUXProvider";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/layout/AppShell";
import AlumniMediaViewer from "@/components/ui/AlumniMediaViewer";
import { ProfileLoadingSkeleton, AlumniEmptyState } from "@/components/ui/AlumniLoading";
import ProfileMusicCard from "@/components/profile/ProfileMusicCard";
import ProfilePassportPreview from "@/components/profile/ProfilePassportPreview";
import ProfileMiniStats from "@/components/profile/ProfileMiniStats";
import HDProfileImage from "@/components/profile/HDProfileImage";
import { AlumniAvatar } from "@/components/ui/AlumniImage";
import ProfileSocialLinks from "@/components/profile/ProfileSocialLinks";
import ProfileIdentityMeta from "@/components/profile/ProfileIdentityMeta";
import ProfileHeaderFacts from "@/components/profile/ProfileHeaderFacts";
import ProfessionalProfileOverview from "@/components/profile/ProfessionalProfileOverview";
import ProfileSavedTab from "@/components/profile/ProfileSavedTab";
import { hydratePostMedia } from "@/lib/privateMedia";
import { shareAlumniContent } from "@/lib/nativeExperience";
import ProfilePostOwnerMenu from "@/components/profile/ProfilePostOwnerMenu";
import "@/components/profile/ProfilePostOwnerMenu.css";
import "./profile-visual-2-8.css";
import "./profile-option-3-own.css";


type ProfileTab = "posts" | "saved" | "activity";

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
  const { notify, confirm } = useAlumniUX();

  const [profile, setProfile] = useState<any>(null);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [posts, setPosts] = useState<any[]>([]);
  const [profileMusic, setProfileMusic] = useState<any>(null);
  const [
    loadingProfile,
    setLoadingProfile,
  ] = useState(true);

  const [
    selectedProfileMedia,
    setSelectedProfileMedia,
  ] = useState<string | null>(null);

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

    const url =
      `${window.location.origin}/u/${profile.username}`;

    const result =
      await shareAlumniContent({
        title:
          `@${profile.username} en Alumni.`,
        text:
          profile.full_name
            ? `Mira el perfil de ${profile.full_name} en Alumni.`
            : "Mira este perfil en Alumni.",
        url,
        dialogTitle:
          "Compartir perfil",
      });

    if (
      result === "copied"
    ) {
      notify(
        "Enlace del perfil copiado.",
        "success"
      );
    } else if (
      result === "unavailable"
    ) {
      notify(
        "No se pudo abrir el menú para compartir.",
        "error"
      );
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
      notify(error.message, "error");
      throw error;
    }

    await getProfile(false);
    notify(
      "Publicación actualizada.",
      "success"
    );
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
      notify(error.message, "error");
      return;
    }

    await getProfile(false);
    notify(
      "Perfil actualizado.",
      "success"
    );
  }

  async function deleteProfilePost(
    postId: number
  ) {
    if (!user) return;

    const confirmed = await confirm({
      title: "Eliminar publicación",
      description:
        "Esta publicación se eliminará de Alumni y no se puede deshacer.",
      confirmLabel: "Eliminar",
      cancelLabel: "Cancelar",
      tone: "danger",
    });

    if (!confirmed) return;

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .eq("user_id", user.id);

    if (error) {
      notify(error.message, "error");
      return;
    }

    await getProfile(false);
    notify(
      "Publicación eliminada.",
      "success"
    );
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
        <ProfileLoadingSkeleton />
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <AlumniEmptyState
          eyebrow="Perfil"
          title="No pudimos mostrar tu perfil."
          description="Vuelve a intentarlo o revisa la configuración de tu cuenta."
          actionHref="/settings?section=profile"
          actionLabel="Abrir configuración"
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div
        className="alumni-own-profile-v3"
        data-profile-design="option-3-activity-own"
      >
        {/* PORTADA */}
        <section className="alumni-own-profile-v3-hero">
          <div className="alumni-own-profile-v3-cover">
            {profile.banner_url ? (
              <HDProfileImage
                src={profile.banner_url}
                alt="Portada"
                variant="banner"
                className="alumni-own-profile-v3-cover-image"
              />
            ) : (
              <div className="alumni-own-profile-v3-cover-fallback" />
            )}

            <div className="alumni-own-profile-v3-cover-shade" />

            <button
              type="button"
              onClick={() => router.back()}
              className="alumni-own-profile-v3-top-button is-left"
              aria-label="Volver"
            >
              <span aria-hidden="true">←</span>
            </button>

            <Link
              href="/settings"
              className="alumni-own-profile-v3-top-button is-right"
              aria-label="Configuración"
              title="Configuración"
            >
              <Settings size={18} />
            </Link>
          </div>

          <div className="alumni-own-profile-v3-main">
            <div className="alumni-own-profile-v3-avatar-wrap">
              <div className="alumni-own-profile-v3-avatar">
                {profile.avatar_url ? (
                  <HDProfileImage
                    src={profile.avatar_url}
                    alt="Avatar"
                    variant="avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  profile.username
                    ?.charAt(0)
                    ?.toUpperCase() || "U"
                )}
              </div>
            </div>

            <div className="alumni-own-profile-v3-identity">
              <h1>
                {profile.full_name ||
                  `@${profile.username}`}
              </h1>

              <p className="alumni-own-profile-v3-handle">
                @{profile.username}
              </p>

              {(profile.career ||
                profile.education_program_name) && (
                <p className="alumni-own-profile-v3-role">
                  {profile.career ||
                    profile.education_program_name}
                  <span> · Alumni</span>
                </p>
              )}

              {(profile.university ||
                profile.education_institution_name) && (
                <p className="alumni-own-profile-v3-fact">
                  <GraduationCap size={14} />
                  <span>
                    {profile.university ||
                      profile.education_institution_name}
                  </span>
                </p>
              )}

              {(profile.city || profile.country) && (
                <p className="alumni-own-profile-v3-fact">
                  <MapPin size={14} />
                  <span>
                    {[profile.city, profile.country]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </p>
              )}
            </div>

            <div className="alumni-own-profile-v3-actions">
              <Link
                href="/settings?section=profile&edit=1"
                className="alumni-own-profile-v3-primary"
              >
                <Pencil size={15} />
                Editar perfil
              </Link>

              <button
                type="button"
                onClick={shareProfile}
                className="alumni-own-profile-v3-secondary"
              >
                <Share2 size={15} />
                Compartir
              </button>
            </div>

            <div className="alumni-own-profile-v3-stats">
              <button
                type="button"
                onClick={() => setTab("posts")}
              >
                <strong>{posts.length}</strong>
                <span>Publicaciones</span>
              </button>

              <div>
                <strong>{followers}</strong>
                <span>Seguidores</span>
              </div>

              <div>
                <strong>{following}</strong>
                <span>Siguiendo</span>
              </div>
            </div>
          </div>
        </section>

        {/* NAVEGACIÓN DEL PERFIL */}
        <nav
          className="alumni-own-profile-v3-tabs"
          aria-label="Secciones de mi perfil"
        >
          <button
            type="button"
            data-active={tab === "posts" ? "true" : "false"}
            onClick={() => setTab("posts")}
          >
            Posts
          </button>

          <button
            type="button"
            data-active={tab === "saved" ? "true" : "false"}
            onClick={() => setTab("saved")}
          >
            Guardados
          </button>

          <button
            type="button"
            data-active={tab === "activity" ? "true" : "false"}
            onClick={() => setTab("activity")}
          >
            Actividad
          </button>
        </nav>

        {/* POSTS COMO PROTAGONISTA */}
        {tab === "posts" ? (
          <section className="alumni-own-profile-v3-feed">
            {posts.length === 0 ? (
              <div className="alumni-own-profile-v3-empty">
                <strong>Aún no tienes publicaciones.</strong>
                <span>
                  Cuando publiques algo en Alumni,
                  aparecerá aquí.
                </span>
              </div>
            ) : (
              <div className="alumni-own-profile-v3-post-list">
                {posts.map((post: any) => (
                  <article
                    key={post.id}
                    className="alumni-own-profile-v3-post"
                  >
                    <header className="alumni-own-profile-v3-post-head">
                      <div className="alumni-own-profile-v3-post-avatar">
                        <AlumniAvatar
                          src={profile.avatar_url}
                          name={profile.username}
                          alt="Avatar"
                          className="h-full w-full"
                          imageClassName="h-full w-full object-cover"
                        />
                      </div>

                      <div className="alumni-own-profile-v3-post-author">
                        <strong>
                          {profile.full_name ||
                            `@${profile.username}`}
                        </strong>
                        <span>
                          @{profile.username} ·{" "}
                          {formatDistanceToNow(
                            new Date(post.created_at),
                            {
                              addSuffix: true,
                              locale: es,
                            }
                          )}
                        </span>
                      </div>

                      {post.pinned && (
                        <span className="alumni-own-profile-v3-pinned">
                          Fijada
                        </span>
                      )}
                    </header>

                    {post.content && (
                      <p className="alumni-own-profile-v3-post-copy">
                        {post.content}
                      </p>
                    )}

                    {post.image_url && (
                      <div className="alumni-own-profile-v3-media">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedProfileMedia(
                              post.image_url
                            )
                          }
                          aria-label="Abrir fotografía"
                        >
                          <img
                            src={post.image_url}
                            alt="Publicación"
                          />
                        </button>
                      </div>
                    )}

                    <div className="alumni-own-profile-v3-post-foot">
                      <div className="alumni-own-profile-v3-engagement">
                        <span>
                          <Heart size={17} />
                          {post.likes?.length || 0}
                        </span>

                        <span>
                          <MessageCircle size={17} />
                          {post.comments?.length || 0}
                        </span>
                      </div>

                      <ProfilePostOwnerMenu
                        post={post}
                        pinned={Boolean(post.pinned)}
                        onEdit={(content) =>
                          editProfilePost(
                            post.id,
                            content
                          )
                        }
                        onTogglePin={() =>
                          toggleProfilePin(post.id)
                        }
                        onDelete={() =>
                          deleteProfilePost(post.id)
                        }
                      />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : tab === "saved" ? (
          <section className="alumni-own-profile-v3-saved">
            <ProfileSavedTab userId={profile.id} />
          </section>
        ) : (
          <section className="alumni-own-profile-v3-activity">
            {profile.bio && (
              <div className="alumni-own-profile-v3-about-card">
                <span>Acerca de</span>
                <p>{profile.bio}</p>
              </div>
            )}

            <ProfessionalProfileOverview
              profile={profile}
              posts={posts}
              followers={followers}
              following={following}
              own
            />

            <div className="alumni-own-profile-v3-activity-block">
              <ProfileHeaderFacts profile={profile} />
            </div>

            <div className="alumni-own-profile-v3-activity-block">
              <ProfileIdentityMeta profile={profile} />
            </div>

            <div className="alumni-own-profile-v3-activity-block">
              <ProfileSocialLinks profile={profile} />
            </div>

            {profileMusic && (
              <div className="alumni-own-profile-v3-activity-block">
                <ProfileMusicCard track={profileMusic} />
              </div>
            )}

            <div className="alumni-own-profile-v3-activity-block">
              <ProfilePassportPreview
                userId={profile.id}
                username={profile.username}
                own
              />
            </div>
          </section>
        )}
      </div>

      {selectedProfileMedia && (
        <AlumniMediaViewer
          src={selectedProfileMedia}
          type="image"
          alt="Publicación ampliada"
          onClose={() =>
            setSelectedProfileMedia(null)
          }
        />
      )}
    </AppShell>
  );
}

/* ALUMNI_PROFILE_1_1_0_OWN_PROFILE_OPTION_3_EXACT */

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

/* ALUMNI_2_3_2_RECOVERY_PROFILE_PASSPORT_NAV:OWNER_PROFILE */

/* ALUMNI_2_6_0_GLOBAL_UX:PROFILE */

/* ALUMNI_2_7_0_LOADING_STATES:PROFILE */

/* ALUMNI_2_8_0_PROFILE_VISUAL:PROFILE */

/* ALUMNI_2_8_1_PROFILE_LAYOUT_HOTFIX:PROFILE */

/* ALUMNI_2_9_0_IMAGE_LAYER:PROFILE */

/* ALUMNI_3_6_0_CREATION_SOCIAL_POLISH */
