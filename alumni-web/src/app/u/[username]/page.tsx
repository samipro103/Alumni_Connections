"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Briefcase,
  Clock3,
  GraduationCap,
  Heart,
  Link2,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Send,
  Share2,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/layout/AppShell";
import ProfileMusicCard from "@/components/profile/ProfileMusicCard";
import ProfileSpotifyAction from "@/components/music/ProfileSpotifyAction";
import HDProfileImage from "@/components/profile/HDProfileImage";
import ProfileSocialLinks from "@/components/profile/ProfileSocialLinks";
import ProfileIdentityMeta from "@/components/profile/ProfileIdentityMeta";
import CommentLikeButton from "@/components/social/CommentLikeButton";

type ProfileTab = "posts" | "about";

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const router = useRouter();
  const { user } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [followers, setFollowers] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [posts, setPosts] = useState<any[]>([]);
  const [profileMusic, setProfileMusic] = useState<any>(null);
  const [following, setFollowing] = useState(false);
  const [followRequestPending, setFollowRequestPending] = useState(false);
  const [openComments, setOpenComments] = useState<Record<number, boolean>>(
    {}
  );
  const [commentInputs, setCommentInputs] = useState<
    Record<number, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ProfileTab>("posts");

  useEffect(() => {
    getProfile();
  }, [username, user?.id]);

  async function getProfile() {
    setLoading(true);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (!profileData) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setProfile(profileData);

    const { data: musicData, error: musicError } = await supabase
      .from("profile_music")
      .select("*")
      .eq("user_id", profileData.id)
      .maybeSingle();

    if (musicError) {
      console.error("Error cargando música pública:", musicError);
    }

    setProfileMusic(musicData || null);

    const [
      { data: followersData },
      { data: followingData },
      { data: postsData },
    ] = await Promise.all([
      supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", profileData.id),
      supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", profileData.id),
      supabase
        .from("posts")
        .select("*, likes(user_id)")
        .eq("user_id", profileData.id)
        .order("created_at", { ascending: false }),
    ]);

    setFollowers(followersData?.length || 0);
    setFollowingCount(followingData?.length || 0);

    const postIds = (postsData || []).map((post: any) => post.id);
    let comments: any[] = [];

    if (postIds.length > 0) {
      const { data: commentsData } = await supabase
        .from("comments")
        .select("*")
        .in("post_id", postIds)
        .order("created_at", { ascending: true });

      comments = commentsData || [];
    }

    const commentUserIds = [
      ...new Set(comments.map((comment: any) => comment.user_id)),
    ];

    let commentProfiles: any[] = [];

    if (commentUserIds.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", commentUserIds);

      commentProfiles = data || [];
    }

    setPosts(
      (postsData || []).map((post: any) => ({
        ...post,
        liked:
          post.likes?.some(
            (like: any) => like.user_id === user?.id
          ) || false,
        comments: comments
          .filter((comment: any) => comment.post_id === post.id)
          .map((comment: any) => ({
            ...comment,
            profile: commentProfiles.find(
              (item: any) => item.id === comment.user_id
            ),
          })),
      }))
    );

    if (user) {
      const { data: followData } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", user.id)
        .eq("following_id", profileData.id)
        .maybeSingle();

      setFollowing(Boolean(followData));

      if (!followData && profileData.is_private) {
        const { data: requestData } = await supabase
          .from("follow_requests")
          .select("id")
          .eq("requester_id", user.id)
          .eq("target_id", profileData.id)
          .maybeSingle();

        setFollowRequestPending(Boolean(requestData));
      } else {
        setFollowRequestPending(false);
      }
    } else {
      setFollowing(false);
      setFollowRequestPending(false);
    }

    setLoading(false);
  }

  async function toggleFollow() {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!profile || profile.id === user.id) return;

    if (following) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", profile.id);

      setFollowing(false);
      setFollowers((value) => Math.max(0, value - 1));
      return;
    }

    if (profile.is_private) {
      if (followRequestPending) {
        const { error } = await supabase
          .from("follow_requests")
          .delete()
          .eq("requester_id", user.id)
          .eq("target_id", profile.id);

        if (error) {
          alert(error.message);
          return;
        }

        setFollowRequestPending(false);
        return;
      }

      const { error } = await supabase.from("follow_requests").insert({
        requester_id: user.id,
        target_id: profile.id,
      });

      if (error) {
        alert(error.message);
        return;
      }

      setFollowRequestPending(true);
      return;
    }

    const { error } = await supabase.from("follows").insert({
      follower_id: user.id,
      following_id: profile.id,
    });

    if (error) {
      alert(error.message);
      return;
    }

    await supabase.from("notifications").insert({
      user_id: profile.id,
      actor_id: user.id,
      type: "follow",
      target_type: "profile",
      target_id: user.id,
    });

    setFollowing(true);
    setFollowers((value) => value + 1);
  }

  async function toggleLike(postId: number, liked: boolean) {
    if (!user) {
      router.push("/login");
      return;
    }

    const post = posts.find((item: any) => item.id === postId);

    if (liked) {
      await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      if (post && post.user_id !== user.id) {
        await supabase
          .from("notifications")
          .delete()
          .eq("user_id", post.user_id)
          .eq("actor_id", user.id)
          .eq("type", "like")
          .eq("post_id", postId);
      }
    } else {
      const { error } = await supabase.from("likes").insert({
        post_id: postId,
        user_id: user.id,
      });

      if (error) {
        alert(error.message);
        return;
      }

      if (post && post.user_id !== user.id) {
        await supabase.from("notifications").insert({
          user_id: post.user_id,
          actor_id: user.id,
          type: "like",
          post_id: postId,
          target_type: "post",
          target_id: String(postId),
        });
      }
    }

    await getProfile();
  }

  async function addComment(postId: number) {
    if (!user) {
      router.push("/login");
      return;
    }

    const content = commentInputs[postId]?.trim();
    if (!content) return;

    const { data: insertedComment, error } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        user_id: user.id,
        content,
      })
      .select("id")
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    if (profile.id !== user.id) {
      await supabase.from("notifications").insert({
        user_id: profile.id,
        actor_id: user.id,
        type: "comment",
        post_id: postId,
        target_type: "post_comment",
        target_id: String(insertedComment.id),
      });
    }

    setCommentInputs((current) => ({
      ...current,
      [postId]: "",
    }));

    setOpenComments((current) => ({
      ...current,
      [postId]: true,
    }));

    await getProfile();
  }

  async function shareProfile() {
    if (!profile) return;

    const url =
      `${window.location.origin}/u/${profile.username}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title:
            `@${profile.username} en Alumni`,
          url,
        });

        return;
      }

      await navigator.clipboard.writeText(
        url
      );

      alert(
        "Enlace del perfil copiado."
      );
    } catch (error: any) {
      if (
        error?.name !==
        "AbortError"
      ) {
        console.error(
          "Error compartiendo perfil:",
          error
        );
      }
    }
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

  if (loading) {
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
        <div className="py-16 text-center">
          <p className="font-bold text-zinc-300">
            Perfil no encontrado
          </p>
          <button
            onClick={() => router.push("/explore")}
            className="mt-3 text-sm font-bold text-[#8d98ff]"
          >
            Volver a explorar
          </button>
        </div>
      </AppShell>
    );
  }

  const ownProfile = user?.id === profile.id;
  const privateLocked =
    Boolean(profile.is_private) &&
    !ownProfile &&
    !following;

  return (
    <AppShell>
      <div className="alumni-profile-page mx-auto w-full max-w-[980px]">
        <section className="alumni-profile-hero relative">
<div className="alumni-profile-banner overflow-hidden rounded-[24px]">
            <div className="h-48 bg-[#151a23] sm:h-60">
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

              {ownProfile ? (
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => router.push("/settings?section=profile&edit=1")}
                    className="h-10 shrink-0 rounded-xl bg-[#6d7cff] px-4 text-xs font-black text-white"
                  >
                    Editar perfil
                  </button>

                  <button
                    type="button"
                    onClick={shareProfile}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-zinc-500 transition hover:bg-white/[0.07] hover:text-zinc-200"
                    aria-label="Compartir perfil"
                    title="Compartir perfil"
                  >
                    <Share2 size={17} />
                  </button>

                  <ProfileSpotifyAction
                    userId={user?.id || ""}
                    username={profile.username}
                  />
                </div>
              ) : (
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={toggleFollow}
                    className={`flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-black transition ${
                      following || followRequestPending
                        ? "bg-white/[0.07] text-zinc-300 hover:bg-white/[0.1]"
                        : "bg-[#6d7cff] text-white hover:bg-[#7b87ff]"
                    }}`}
                  >
                    {following ? (
                      <UserCheck size={15} />
                    ) : followRequestPending ? (
                      <Clock3 size={15} />
                    ) : (
                      <UserPlus size={15} />
                    )}
                    {following
                      ? "Siguiendo"
                      : followRequestPending
                      ? "Solicitado"
                      : "Seguir"}
                  </button>

                  <button
                    onClick={() =>
                      user
                        ? router.push(
                            `/messages/${profile.username}`
                          )
                        : router.push("/login")
                    }
                    className="flex h-10 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.035] px-4 text-xs font-black text-zinc-400 transition hover:text-white"
                  >
                    <MessageCircle size={15} />
                    Mensaje
                  </button>
                </div>
              )}
            </div>

            {profile.bio && (
              <p className="mt-5 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-zinc-400">
                {profile.bio}
              </p>
            )}

            <ProfileIdentityMeta profile={profile} />

            <ProfileSocialLinks profile={profile} className="mt-5" />

            <ProfileMusicCard track={profileMusic} className="mt-5" />

            <div className="mt-6 flex gap-8 border-t border-white/[0.06] pt-5">
              <Stat value={posts.length} label="Publicaciones" />
              <Stat value={followers} label="Seguidores" />
              <Stat value={followingCount} label="Siguiendo" />
            </div>
          </div>
        </section>

        {privateLocked ? (
          <section className="alumni-private-lock py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--app-soft)] text-[var(--app-muted)]">
              <LockKeyhole size={23} />
            </div>

            <h2 className="mt-4 text-base font-black text-[var(--app-text)]">
              Esta cuenta es privada
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--app-muted-2)]">
              Sigue a @{profile.username} para ver sus publicaciones e historias.
            </p>

            {followRequestPending && (
              <p className="mt-3 text-xs font-bold text-[var(--app-accent)]">
                Solicitud enviada
              </p>
            )}
          </section>
        ) : (
          <>
        <div className="mt-6 flex items-center border-b border-white/[0.07]">
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
              <div className="rounded-[24px] border border-dashed border-white/[0.09] px-6 py-14 text-center text-sm text-zinc-600">
                Este usuario todavía no ha publicado nada.
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post: any) => {
                  const commentsOpen = Boolean(openComments[post.id]);

                  return (
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
                              profile.username
                                ?.charAt(0)
                                ?.toUpperCase() || "U"
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

                      {post.image_url && (
                        <img
                          src={post.image_url}
                          alt="Publicación"
                          className="max-h-[650px] w-full object-cover"
                        />
                      )}

                      <div className="px-5 pb-4 pt-3">
                        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
                          <button
                            onClick={() =>
                              toggleLike(post.id, post.liked)
                            }
                            className={`flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-bold transition ${
                              post.liked
                                ? "bg-red-500/10 text-red-400"
                                : "text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-300"
                            }`}
                          >
                            <Heart
                              size={17}
                              fill={
                                post.liked
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                            {post.likes?.length || 0}
                          </button>

                          <button
                            onClick={() =>
                              setOpenComments((current) => ({
                                ...current,
                                [post.id]:
                                  !current[post.id],
                              }))
                            }
                            className="flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-bold text-zinc-600 transition hover:bg-white/[0.04] hover:text-zinc-300"
                          >
                            <MessageCircle size={17} />
                            {post.comments?.length || 0}
                          </button>
                        </div>

                        {commentsOpen && (
                          <div className="pt-4">
                            <div className="space-y-3">
                              {post.comments?.map(
                                (comment: any) => (
                                  <div
                                    key={comment.id}
                                    className="flex gap-3"
                                  >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1a1f29] text-[10px] font-bold">
                                      {comment.profile
                                        ?.avatar_url ? (
                                        <img
                                          src={
                                            comment.profile
                                              .avatar_url
                                          }
                                          alt="Avatar"
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        comment.profile?.username
                                          ?.charAt(0)
                                          ?.toUpperCase() || "U"
                                      )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <div className="rounded-2xl bg-white/[0.035] px-3.5 py-2.5">
                                        <p className="text-xs font-black text-zinc-300">
                                          @
                                          {comment.profile
                                            ?.username ||
                                            "usuario"}
                                        </p>
                                        <p className="mt-1 text-sm text-zinc-500">
                                          {comment.content}
                                        </p>
                                      </div>

                                      <CommentLikeButton
                                        commentId={comment.id}
                                        commentOwnerId={comment.user_id}
                                        currentUserId={user?.id}
                                      />
                                    </div>
                                  </div>
                                )
                              )}
                            </div>

                            <div className="mt-4 flex gap-2">
                              <input
                                value={
                                  commentInputs[post.id] || ""
                                }
                                onChange={(e) =>
                                  setCommentInputs(
                                    (current) => ({
                                      ...current,
                                      [post.id]:
                                        e.target.value,
                                    })
                                  )
                                }
                                placeholder="Escribe un comentario..."
                                className="h-10 flex-1 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 text-sm outline-none placeholder:text-zinc-700"
                              />

                              <button
                                onClick={() =>
                                  addComment(post.id)
                                }
                                disabled={
                                  !commentInputs[
                                    post.id
                                  ]?.trim()
                                }
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6d7cff] text-white disabled:bg-white/[0.06] disabled:text-zinc-700"
                              >
                                <Send size={15} />
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
          </section>
        ) : (
          <section className="grid gap-x-10 pt-2 md:grid-cols-2">
            <InfoBlock
              title="Trayectoria académica"
              icon={<GraduationCap size={17} />}
            >
              <Detail
                label="Universidad"
                value={profile.university}
              />
              <Detail label="Carrera" value={profile.career} />
            </InfoBlock>

            <InfoBlock
              title="Ubicación"
              icon={<MapPin size={17} />}
            >
              <Detail label="Ciudad" value={profile.city} />
              <Detail label="País" value={profile.country} />
            </InfoBlock>

            <InfoBlock
              title="Enlaces"
              icon={<Link2 size={17} />}
              className="md:col-span-2"
            >
              {links.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {links.map(([label, value]) => (
                    <a
                      key={label}
                      href={String(value)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-xs font-bold text-zinc-500 transition hover:text-zinc-200"
                    >
                      {label}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-700">
                  Este usuario todavía no ha agregado enlaces.
                </p>
              )}
            </InfoBlock>
          </section>
        )}
          </>
        )}
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
      className={`border-b border-[var(--app-border)] py-5 ${className}`}
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
