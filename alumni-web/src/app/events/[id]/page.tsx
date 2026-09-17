"use client";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageCircle,
  Share2,
  Sparkles,
  UserRound,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import SocialInvitePicker from "@/components/social/SocialInvitePicker";
import EventPrivateChatSheet from "@/components/events/EventPrivateChatSheet";
import "../events-core-4-1.css";
import "../../interior-ui-1-0.css";
import "../events-motion-3-0.css";
import "../event-detail-chat-6-2.css";

function organizerDisplayName(profile: any) {
  return (
    profile?.full_name ||
    (profile?.username
      ? `@${profile.username}`
      : "Organizador")
  );
}

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const eventId = Number(params.id);
  const { user } = useAuth();

  const [event, setEvent] = useState<any>(null);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [myStatus, setMyStatus] = useState<string | null>(null);
  const [community, setCommunity] = useState<any>(null);
  const [organizer, setOrganizer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(eventId)) return;
    void load();
  }, [eventId, user?.id]);

  async function load() {
    setLoading(true);

    const { data: eventData } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .maybeSingle();

    if (!eventData) {
      setEvent(null);
      setLoading(false);
      return;
    }

    const [rsvpResult, communityResult, organizerResult] =
      await Promise.all([
        supabase
          .from("event_rsvps")
          .select("user_id,status,updated_at")
          .eq("event_id", eventId),
        eventData.community_id
          ? supabase
              .from("communities")
              .select("id,name,slug")
              .eq("id", eventData.community_id)
              .maybeSingle()
          : Promise.resolve({ data: null } as any),
        eventData.created_by
          ? supabase
              .from("profiles")
              .select("id,username,full_name,avatar_url")
              .eq("id", eventData.created_by)
              .maybeSingle()
          : Promise.resolve({ data: null } as any),
      ]);

    const rows = rsvpResult.data || [];
    const profileIds = [
      ...new Set(
        rows
          .filter((row: any) => row.status === "going")
          .map((row: any) => row.user_id)
      ),
    ];

    const profilesResult = profileIds.length
      ? await supabase
          .from("profiles")
          .select("id,username,full_name,avatar_url")
          .in("id", profileIds)
      : { data: [] as any[] };

    const profileMap = new Map(
      (profilesResult.data || []).map((profile: any) => [
        profile.id,
        profile,
      ])
    );

    setEvent(eventData);
    setCommunity(communityResult.data || null);
    setOrganizer(organizerResult.data || null);
    setRsvps(
      rows.map((row: any) => ({
        ...row,
        profile: profileMap.get(row.user_id) || null,
      }))
    );
    setMyStatus(
      user
        ? rows.find((row: any) => row.user_id === user.id)
            ?.status || null
        : null
    );
    setLoading(false);
  }

  const going = useMemo(
    () => rsvps.filter((row) => row.status === "going"),
    [rsvps]
  );

  const interested = useMemo(
    () =>
      rsvps.filter((row) => row.status === "interested"),
    [rsvps]
  );

  async function setRsvp(status: string) {
    if (!user || busy) return;

    setBusy(status);

    const { data: nextStatus, error } = await supabase.rpc(
      "alumni_toggle_event_rsvp",
      {
        p_event: eventId,
        p_status: status,
      }
    );

    setBusy(null);

    if (error) {
      alert(error.message);
      return;
    }

    await load();

    if (
      status === "interested" &&
      nextStatus === "interested" &&
      event?.created_by &&
      event.created_by !== user.id
    ) {
      setChatOpen(true);
    }
  }

  async function shareEvent() {
    if (!event) return;

    const url = window.location.href;
    const text = `${event.title}${
      event.location ? ` · ${event.location}` : ""
    }`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: event.title,
          text,
          url,
        });
      } else {
        await navigator.clipboard.writeText(
          `${text} ${url}`
        );
        alert("Evento copiado.");
      }
    } catch {}
  }

  if (loading) {
    return (
      <AppShell>
        <p className="events2-state">Cargando evento...</p>
      </AppShell>
    );
  }

  if (!event) {
    return (
      <AppShell>
        <main className="event-detail-empty">
          <h1>Evento no disponible.</h1>
          <Link href="/events">Volver a eventos</Link>
        </main>
      </AppShell>
    );
  }

  const date = new Date(event.event_date);
  const isOrganizer =
    Boolean(user?.id) && event.created_by === user?.id;
  const hideOrganizer =
    Boolean(event.organizer_anonymous) && !isOrganizer;

  const organizerName = hideOrganizer
    ? "Organizador anónimo"
    : isOrganizer
    ? organizerDisplayName(organizer) || "Tú"
    : organizerDisplayName(organizer);

  const organizerAvatarVisible =
    !hideOrganizer && organizer?.avatar_url;

  const organizerCanLink =
    !hideOrganizer &&
    !isOrganizer &&
    Boolean(organizer?.username);

  const eventEndMs = new Date(
    event.end_date || event.event_date
  ).getTime();
  const chatAvailable =
    Number.isFinite(eventEndMs) &&
    Date.now() < eventEndMs + 24 * 60 * 60 * 1000;

  const organizerCardInner = (
    <>
      <span className="event-organizer-avatar">
        {organizerAvatarVisible ? (
          <img src={organizer.avatar_url} alt="" />
        ) : hideOrganizer ? (
          <UserRound size={17} />
        ) : (
          String(
            organizer?.full_name ||
              organizer?.username ||
              "O"
          )
            .charAt(0)
            .toUpperCase()
        )}
      </span>

      <span className="event-organizer-copy">
        <small>Organizado por</small>
        <strong>{organizerName}</strong>
      </span>

      {isOrganizer && event.organizer_anonymous && (
        <em>Visible como anónimo</em>
      )}
    </>
  );

  return (
    <AppShell>
      <main
        className="event-detail mx-auto w-full max-w-[920px] event-detail-6-2"
        data-alumni-motion-ignore="true"
      >
        <Link href="/events" className="event-detail-back">
          <ArrowLeft size={15} />
          Eventos
        </Link>

        <header className="event-detail-header">
          {organizerCanLink ? (
            <Link
              href={`/u/${organizer.username}`}
              className="event-organizer-card"
            >
              {organizerCardInner}
            </Link>
          ) : (
            <div className="event-organizer-card">
              {organizerCardInner}
            </div>
          )}

          <h1>{event.title}</h1>

          <div className="event-detail-meta">
            <span>
              <CalendarDays size={14} />
              {date.toLocaleDateString("es-SV", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>

            <span>
              <Clock3 size={14} />
              {date.toLocaleTimeString("es-SV", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>

            {event.location && (
              <span>
                <MapPin size={14} />
                {event.location}
              </span>
            )}
          </div>

          {event.description && <p>{event.description}</p>}

          {community && (
            <Link
              href={`/community/${community.slug}`}
              className="event-detail-community"
            >
              Organizado dentro de {community.name}
            </Link>
          )}
        </header>

        <section className="event-rsvp event-rsvp-v2">
          <div className="event-rsvp-heading">
            <span>Tu respuesta</span>
            <h2>¿Vas a ir?</h2>
            <p>
              Elige una opción. Puedes cambiarla cuando quieras.
            </p>
          </div>

          <div
            className="event-rsvp-choice"
            role="group"
            aria-label="Respuesta al evento"
          >
            <button
              type="button"
              data-active={
                myStatus === "going" ? "true" : "false"
              }
              disabled={Boolean(busy)}
              onClick={() => void setRsvp("going")}
            >
              <CheckCircle2 size={17} />
              <span>
                <strong>Voy</strong>
                <small>Cuenta conmigo</small>
              </span>
            </button>

            <button
              type="button"
              data-active={
                myStatus === "interested"
                  ? "true"
                  : "false"
              }
              disabled={Boolean(busy)}
              onClick={() => void setRsvp("interested")}
            >
              <Sparkles size={17} />
              <span>
                <strong>Me interesa</strong>
                <small>Tal vez vaya</small>
              </span>
            </button>

            <button
              type="button"
              data-active={
                myStatus === "not_going"
                  ? "true"
                  : "false"
              }
              disabled={Boolean(busy)}
              onClick={() => void setRsvp("not_going")}
            >
              <XCircle size={17} />
              <span>
                <strong>No puedo</strong>
                <small>Esta vez no</small>
              </span>
            </button>
          </div>

          {user &&
            !isOrganizer &&
            ["interested", "going"].includes(myStatus || "") &&
            chatAvailable && (
              <button
                type="button"
                className="event-rsvp-chat-open"
                onClick={() => setChatOpen(true)}
              >
                <MessageCircle size={17} />
                <span>
                  <strong>Preguntar al organizador</strong>
                  <small>
                    Chat privado y temporal
                  </small>
                </span>
              </button>
            )}
        </section>

        <section className="event-attendance">
          <header>
            <div>
              <span>Personas</span>
              <h2>
                {going.length} van · {interested.length} interesados
              </h2>
            </div>

            <div className="event-attendance-actions">
              {isOrganizer && chatAvailable && (
                <button
                  type="button"
                  onClick={() => setChatOpen(true)}
                >
                  <MessageCircle size={15} />
                  Preguntas privadas
                </button>
              )}

              {user && (
                <SocialInvitePicker
                  scope="event"
                  targetId={event.id}
                  communityId={event.community_id}
                  label="Invitar personas"
                />
              )}

              <button
                type="button"
                onClick={() => void shareEvent()}
              >
                <Share2 size={15} />
                Compartir
              </button>
            </div>
          </header>

          {going.length > 0 && (
            <div className="event-going-list">
              {going.map((row: any) => (
                <Link
                  key={row.user_id}
                  href={`/u/${row.profile?.username || ""}`}
                >
                  <span>
                    {row.profile?.avatar_url ? (
                      <img
                        src={row.profile.avatar_url}
                        alt=""
                      />
                    ) : (
                      row.profile?.username
                        ?.charAt(0)
                        ?.toUpperCase() || "A"
                    )}
                  </span>

                  <strong>
                    {row.profile?.full_name ||
                      `@${
                        row.profile?.username || "alumni"
                      }`}
                  </strong>
                </Link>
              ))}
            </div>
          )}

          {event.max_attendees && (
            <p className="event-capacity">
              {going.length} de {event.max_attendees} lugares
              confirmados.
            </p>
          )}
        </section>

        {user && event.created_by && chatAvailable && (
          <EventPrivateChatSheet
            open={chatOpen}
            event={event}
            userId={user.id}
            organizerProfile={organizer}
            onClose={() => setChatOpen(false)}
          />
        )}
      </main>
    </AppShell>
  );
}

/* ALUMNI_EVENTS_ORGANIZER_CHAT_6_2:DETAIL */

