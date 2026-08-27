"use client";

import {
  ArrowLeft,
  CalendarDays,
  Check,
  Lock,
  MoreHorizontal,
  Send,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import "../community-2.css";
import "./community-detail.css";

export default function CommunityDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = decodeURIComponent(String(params.slug || ""));
  const { user } = useAuth();

  const [community, setCommunity] = useState<any>(null);
  const [membership, setMembership] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [posting, setPosting] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    void load();
  }, [slug, user?.id]);

  async function load() {
    setLoading(true);

    const { data: communityData } = await supabase
      .from("communities")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (!communityData) {
      setCommunity(null);
      setLoading(false);
      return;
    }

    const [membersResult, postsResult, eventsResult] =
      await Promise.all([
        supabase
          .from("community_members")
          .select("community_id,user_id,role,status,joined_at")
          .eq("community_id", communityData.id)
          .order("joined_at", { ascending: true }),
        supabase
          .from("community_posts")
          .select("*")
          .eq("community_id", communityData.id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("events")
          .select("*")
          .eq("community_id", communityData.id)
          .gte("event_date", new Date().toISOString())
          .order("event_date", { ascending: true })
          .limit(6),
      ]);

    const memberRows = membersResult.data || [];
    const userIds = [
      ...new Set(memberRows.map((row: any) => row.user_id)),
    ];

    const postUserIds = [
      ...new Set((postsResult.data || []).map((row: any) => row.user_id)),
    ];

    const allProfileIds = [
      ...new Set([...userIds, ...postUserIds]),
    ];

    const profilesResult = allProfileIds.length
      ? await supabase
          .from("profiles")
          .select("id,username,full_name,avatar_url")
          .in("id", allProfileIds)
      : { data: [] as any[] };

    const profileMap = new Map(
      (profilesResult.data || []).map((profile: any) => [
        profile.id,
        profile,
      ])
    );

    setCommunity(communityData);
    setMembers(
      memberRows.map((row: any) => ({
        ...row,
        profile: profileMap.get(row.user_id) || null,
      }))
    );
    setPosts(
      (postsResult.data || []).map((row: any) => ({
        ...row,
        profile: profileMap.get(row.user_id) || null,
      }))
    );
    setEvents(eventsResult.data || []);
    setMembership(
      user
        ? memberRows.find((row: any) => row.user_id === user.id) || null
        : null
    );
    setLoading(false);
  }

  const activeMembers = useMemo(
    () => members.filter((row) => row.status === "active"),
    [members]
  );

  const canPost = membership?.status === "active";
  const canManage =
    membership?.status === "active" &&
    ["owner", "moderator"].includes(membership.role);

  async function joinOrLeave() {
    if (!user || !community || joining) return;

    setJoining(true);

    try {
      if (membership?.status === "active") {
        const { error } = await supabase.rpc(
          "alumni_leave_community",
          { p_community: community.id }
        );
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc(
          "alumni_join_community",
          { p_community: community.id }
        );
        if (error) throw error;
      }

      await load();
    } catch (error: any) {
      alert(error?.message || "No se pudo completar.");
    } finally {
      setJoining(false);
    }
  }

  async function publish() {
    if (!user || !community || !canPost || posting) return;
    const value = content.trim();
    if (!value) return;

    setPosting(true);

    const { error } = await supabase
      .from("community_posts")
      .insert({
        community_id: community.id,
        user_id: user.id,
        content: value,
      });

    setPosting(false);

    if (error) {
      alert(error.message);
      return;
    }

    setContent("");
    await load();
  }

  async function moderate(row: any, action: "approve" | "reject" | "remove") {
    if (!canManage) return;

    const { error } = await supabase.rpc(
      "alumni_moderate_community_member",
      {
        p_community: community.id,
        p_user: row.user_id,
        p_action: action,
      }
    );

    if (error) {
      alert(error.message);
      return;
    }

    await load();
  }

  if (loading) {
    return (
      <AppShell>
        <p className="community2-state">Cargando comunidad...</p>
      </AppShell>
    );
  }

  if (!community) {
    return (
      <AppShell>
        <main className="community-detail-empty">
          <h1>Comunidad no disponible.</h1>
          <Link href="/community">Volver a comunidades</Link>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="community-detail mx-auto w-full max-w-[920px]">
        <Link href="/community" className="community-detail-back">
          <ArrowLeft size={15} />
          Comunidades
        </Link>

        <header className="community-detail-header">
          <div className="community-detail-title">
            <span>
              {community.visibility === "private" ? (
                <>
                  <Lock size={11} />
                  Comunidad privada
                </>
              ) : (
                "Comunidad pública"
              )}
            </span>

            <h1>{community.name}</h1>

            {community.description && (
              <p>{community.description}</p>
            )}

            <div className="community-detail-meta">
              {community.institution && <span>{community.institution}</span>}
              {community.career && <span>{community.career}</span>}
              {community.city && <span>{community.city}</span>}
              <button type="button" onClick={() => setMembersOpen(true)}>
                <Users size={13} />
                {activeMembers.length} miembros
              </button>
            </div>
          </div>

          {user && (
            <button
              type="button"
              onClick={() => void joinOrLeave()}
              disabled={
                joining ||
                membership?.role === "owner" ||
                membership?.status === "pending"
              }
              className="community-detail-join"
            >
              {membership?.role === "owner"
                ? "Tu comunidad"
                : membership?.status === "pending"
                ? "Solicitud enviada"
                : membership?.status === "active"
                ? "Salir"
                : community.visibility === "private"
                ? "Solicitar acceso"
                : "Unirme"}
            </button>
          )}
        </header>

        {canPost && (
          <section className="community-composer">
            <textarea
              value={content}
              maxLength={5000}
              onChange={(event) => setContent(event.target.value)}
              placeholder={`Comparte algo con ${community.name}...`}
            />
            <div>
              <span>{content.length}/5000</span>
              <button
                type="button"
                disabled={posting || !content.trim()}
                onClick={() => void publish()}
              >
                <Send size={14} />
                Publicar
              </button>
            </div>
          </section>
        )}

        {events.length > 0 && (
          <section className="community-events-strip">
            <header>
              <div>
                <span>Próximamente</span>
                <h2>Eventos de esta comunidad</h2>
              </div>
              <Link href="/events">
                Ver todos
              </Link>
            </header>

            <div>
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="community-event-row"
                >
                  <CalendarDays size={16} />
                  <span>
                    <strong>{event.title}</strong>
                    <small>
                      {new Date(event.event_date).toLocaleDateString("es-SV", {
                        day: "numeric",
                        month: "short",
                      })}
                      {event.location ? ` · ${event.location}` : ""}
                    </small>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="community-feed">
          <header>
            <span>Conversaciones</span>
            <h2>Lo que se está compartiendo</h2>
          </header>

          {posts.length === 0 ? (
            <p className="community2-state">
              Aún no hay publicaciones en esta comunidad.
            </p>
          ) : (
            posts.map((post: any) => (
              <article key={post.id} className="community-post">
                <header>
                  <Link href={`/u/${post.profile?.username || ""}`}>
                    <span className="community-post-avatar">
                      {post.profile?.avatar_url ? (
                        <img src={post.profile.avatar_url} alt="" />
                      ) : (
                        post.profile?.username?.charAt(0)?.toUpperCase() || "A"
                      )}
                    </span>
                    <span>
                      <strong>
                        {post.profile?.full_name ||
                          `@${post.profile?.username || "alumni"}`}
                      </strong>
                      <small>
                        @{post.profile?.username || "alumni"} ·{" "}
                        {new Date(post.created_at).toLocaleDateString("es-SV", {
                          day: "numeric",
                          month: "short",
                        })}
                      </small>
                    </span>
                  </Link>
                </header>

                {post.content && <p>{post.content}</p>}
              </article>
            ))
          )}
        </section>

        {membersOpen && (
          <div
            className="community2-modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setMembersOpen(false);
            }}
          >
            <section className="community2-modal community-members-modal">
              <header>
                <div>
                  <span>Comunidad</span>
                  <h2>Miembros</h2>
                </div>
                <button type="button" onClick={() => setMembersOpen(false)}>
                  <X size={18} />
                </button>
              </header>

              <div className="community-members-list">
                {members
                  .filter(
                    (row) =>
                      row.status === "active" ||
                      (canManage && row.status === "pending")
                  )
                  .map((row) => (
                    <div key={row.user_id} className="community-member-row">
                      <span className="community-post-avatar">
                        {row.profile?.avatar_url ? (
                          <img src={row.profile.avatar_url} alt="" />
                        ) : (
                          row.profile?.username?.charAt(0)?.toUpperCase() || "A"
                        )}
                      </span>

                      <span>
                        <strong>
                          {row.profile?.full_name ||
                            `@${row.profile?.username || "alumni"}`}
                        </strong>
                        <small>
                          @{row.profile?.username || "alumni"}
                          {row.role === "owner"
                            ? " · Creador"
                            : row.role === "moderator"
                            ? " · Moderador"
                            : row.status === "pending"
                            ? " · Solicitud pendiente"
                            : ""}
                        </small>
                      </span>

                      {canManage && row.status === "pending" && (
                        <div>
                          <button
                            type="button"
                            onClick={() => void moderate(row, "approve")}
                            title="Aceptar"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void moderate(row, "reject")}
                            title="Rechazar"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}

                      {canManage &&
                        row.status === "active" &&
                        row.role === "member" &&
                        row.user_id !== user?.id && (
                          <button
                            type="button"
                            className="community-member-remove"
                            onClick={() => void moderate(row, "remove")}
                          >
                            Quitar
                          </button>
                        )}
                    </div>
                  ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </AppShell>
  );
}

/* ALUMNI_2_1_COMMUNITY_DETAIL */
