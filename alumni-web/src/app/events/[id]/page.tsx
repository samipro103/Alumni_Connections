"use client";

import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  Share2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import "../events-2.css";
import "./event-detail.css";

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const eventId = Number(params.id);
  const { user } = useAuth();

  const [event, setEvent] = useState<any>(null);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [myStatus, setMyStatus] = useState<string | null>(null);
  const [community, setCommunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

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

    const [rsvpResult, communityResult] = await Promise.all([
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
    setRsvps(
      rows.map((row: any) => ({
        ...row,
        profile: profileMap.get(row.user_id) || null,
      }))
    );
    setMyStatus(
      user
        ? rows.find((row: any) => row.user_id === user.id)?.status || null
        : null
    );
    setLoading(false);
  }

  const going = useMemo(
    () => rsvps.filter((row) => row.status === "going"),
    [rsvps]
  );

  const interested = useMemo(
    () => rsvps.filter((row) => row.status === "interested"),
    [rsvps]
  );

  async function setRsvp(status: string) {
    if (!user || busy) return;

    setBusy(status);

    const { error } = await supabase.rpc(
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
        await navigator.clipboard.writeText(`${text} ${url}`);
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

  return (
    <AppShell>
      <main className="event-detail mx-auto w-full max-w-[920px]">
        <Link href="/events" className="event-detail-back">
          <ArrowLeft size={15} />
          Eventos
        </Link>

        <header className="event-detail-header">
          <span>
            {event.event_type || "Evento"}
            {event.visibility === "community" ? " · comunidad" : ""}
          </span>

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

        <section className="event-rsvp">
          <div>
            <span>Tu respuesta</span>
            <h2>¿Te apuntas?</h2>
          </div>

          <div className="event-rsvp-actions">
            <button
              type="button"
              data-active={myStatus === "going" ? "true" : "false"}
              disabled={Boolean(busy)}
              onClick={() => void setRsvp("going")}
            >
              Voy
            </button>

            <button
              type="button"
              data-active={myStatus === "interested" ? "true" : "false"}
              disabled={Boolean(busy)}
              onClick={() => void setRsvp("interested")}
            >
              Me interesa
            </button>

            <button
              type="button"
              data-active={myStatus === "not_going" ? "true" : "false"}
              disabled={Boolean(busy)}
              onClick={() => void setRsvp("not_going")}
            >
              No puedo
            </button>
          </div>
        </section>

        <section className="event-attendance">
          <header>
            <div>
              <span>Personas</span>
              <h2>
                {going.length} van · {interested.length} interesados
              </h2>
            </div>

            <button type="button" onClick={() => void shareEvent()}>
              <Share2 size={15} />
              Compartir
            </button>
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
                      <img src={row.profile.avatar_url} alt="" />
                    ) : (
                      row.profile?.username?.charAt(0)?.toUpperCase() || "A"
                    )}
                  </span>

                  <strong>
                    {row.profile?.full_name ||
                      `@${row.profile?.username || "alumni"}`}
                  </strong>
                </Link>
              ))}
            </div>
          )}

          {event.max_attendees && (
            <p className="event-capacity">
              {going.length} de {event.max_attendees} lugares confirmados.
            </p>
          )}
        </section>
      </main>
    </AppShell>
  );
}

/* ALUMNI_2_1_EVENT_DETAIL */
