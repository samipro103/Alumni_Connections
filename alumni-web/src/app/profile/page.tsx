"use client";

import { useEffect, useMemo, useState } from "react";
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
import HDProfileImage from "@/components/profile/HDProfileImage";

type ProfileTab = "posts" | "about";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [tab, setTab] = useState<ProfileTab>("posts");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) getProfile();
  }, [user?.id]);

  async function getProfile() {
    if (!user) return;

    setLoadingProfile(true);

    const [
      { data: profileData },
      { data: followersData },
      { data: followingData },
      { data: postsData },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", user.id),
      supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id),
      supabase
        .from("posts")
        .select("*, likes(user_id), comments(id)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    setProfile(profileData);
    setFollowers(followersData?.length || 0);
    setFollowing(followingData?.length || 0);
    setPosts(postsData || []);
    setLoadingProfile(false);
  }

  async function shareProfile() {
    if (!profile?.username) return;

    const url = `${window.location.origin}/u/${profile.username}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `@${profile.username} en AlumniConnections`,
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
      <div className="mx-auto w-full max-w-[900px]">
        <section className="rounded-[28px] border border-white/[0.07] bg-[#101318]/95">
          <div className="overflow-hidden rounded-t-[27px]">
            <div className="relative h-48 bg-[#151a23] sm:h-60">
              {profile.banner_url ? (
                <HDProfileImage
                  src={profile.banner_url}
                  alt="Banner"
                  variant="banner"
                  className="h-full w-full object-cover"
/>
              ) : (
                <div className="h-full w-full bg-[radial-gradient(circle_at_20%_10%,rgba(109,124,255,.28),transparent_38%),radial-gradient(circle_at_85%_20%,rgba(124,58,237,.18),transparent_34%),#11151c]" />
              )}
            </div>
          </div>

          <div className="px-5 pb-6 pt-5 sm:px-7 sm:pt-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[0.09] bg-[#1a1f29] text-2xl font-black shadow-[0_10px_28px_rgba(0,0,0,.16)] sm:h-28 sm:w-28">
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

              <div className="flex shrink-0 gap-2">
                <Link
                  href="/settings"
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

            {profile.bio && (
              <p className="mt-5 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-zinc-400">
                {profile.bio}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-600">
              {profile.career && (
                <span className="flex items-center gap-1.5">
                  <Briefcase size={14} />
                  {profile.career}
                </span>
              )}

              {profile.university && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap size={14} />
                  {profile.university}
                </span>
              )}

              {(profile.city || profile.country) && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} />
                  {[profile.city, profile.country]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              )}
            </div>

            <div className="mt-6 flex gap-8 border-t border-white/[0.06] pt-5">
              <Stat value={posts.length} label="Publicaciones" />
              <Stat value={followers} label="Seguidores" />
              <Stat value={following} label="Siguiendo" />
            </div>
          </div>
        </section>

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
                Todavía no has publicado nada.
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post: any) => (
                  <article
                    key={post.id}
                    className="overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#101318]/95"
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

                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt="Publicación"
                        className="max-h-[650px] w-full object-cover"
                      />
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
          <section className="grid gap-4 pt-4 md:grid-cols-2">
            <InfoBlock
              title="Trayectoria académica"
              icon={<GraduationCap size={17} />}
            >
              <Detail label="Universidad" value={profile.university} />
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
                  Todavía no has agregado enlaces públicos.
                </p>
              )}
            </InfoBlock>
          </section>
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
      className={`rounded-[22px] border border-white/[0.07] bg-[#101318]/95 p-5 ${className}`}
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
