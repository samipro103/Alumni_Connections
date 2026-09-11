"use client";

import {
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import {
  supabase,
} from "@/lib/supabase";
import "./ProfileActivityEvents.css";

type ActivityEvent = {
  id: number;
  title: string;
  event_date: string;
  end_date?: string | null;
  location?: string | null;
  event_type?: string | null;
  visibility?: string | null;
};

const EVENT_LABELS: Record<
  string,
  string
> = {
  meetup: "Encuentro",
  party: "Fiesta",
  sports: "Deporte",
  academic: "Académico",
  cultural: "Cultural",
  graduation: "Graduación",
  other: "Evento",
};

export default function ProfileActivityEvents({
  userId,
}: {
  userId: string;
}) {
  const [
    events,
    setEvents,
  ] = useState<
    ActivityEvent[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    if (!userId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);

      const {
        data: rsvps,
        error: rsvpError,
      } = await supabase
        .from("event_rsvps")
        .select("event_id,status")
        .eq("user_id", userId)
        .eq("status", "going");

      if (!active) return;

      if (rsvpError) {
        console.error(
          "Profile activity RSVP:",
          rsvpError
        );
        setEvents([]);
        setLoading(false);
        return;
      }

      const eventIds = [
        ...new Set(
          (rsvps || [])
            .map(
              (row: any) =>
                Number(
                  row.event_id
                )
            )
            .filter(
              (id) =>
                Number.isFinite(id)
            )
        ),
      ];

      if (
        eventIds.length === 0
      ) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const {
        data: eventRows,
        error: eventError,
      } = await supabase
        .from("events")
        .select(
          "id,title,event_date,end_date,location,event_type,visibility"
        )
        .in("id", eventIds);

      if (!active) return;

      if (eventError) {
        console.error(
          "Profile activity events:",
          eventError
        );
        setEvents([]);
        setLoading(false);
        return;
      }

      const next =
        (eventRows || [])
          .slice()
          .sort(
            (a: any, b: any) =>
              new Date(
                b.event_date
              ).getTime() -
              new Date(
                a.event_date
              ).getTime()
          )
          .slice(0, 8);

      setEvents(next);
      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="alumni-profile-event-activity-loading">
        <span />
        <span />
        <span />
      </div>
    );
  }

  if (
    events.length === 0
  ) {
    return (
      <div className="alumni-profile-event-activity-empty">
        <span className="alumni-profile-event-activity-empty-icon">
          <CalendarDays
            size={22}
          />
        </span>

        <strong>
          Tu actividad aparecerá aquí
        </strong>

        <p>
          Cuando confirmes que vas a un evento,
          lo verás reflejado en tu perfil.
        </p>

        <Link
          href="/events"
          className="alumni-profile-event-activity-empty-link"
        >
          Explorar eventos
        </Link>
      </div>
    );
  }

  const now =
    Date.now();

  return (
    <div className="alumni-profile-event-activity">
      <header className="alumni-profile-event-activity-header">
        <div>
          <strong>
            Eventos
          </strong>

          <span>
            Tu participación reciente
          </span>
        </div>

        <Link
          href="/events"
        >
          Ver todos
        </Link>
      </header>

      <div className="alumni-profile-event-activity-list">
        {events.map(
          (event) => {
            const date =
              new Date(
                event.event_date
              );

            const isPast =
              date.getTime() <
              now;

            const label =
              EVENT_LABELS[
                event.event_type ||
                  ""
              ] ||
              "Evento";

            return (
              <Link
                key={
                  event.id
                }
                href={`/events/${event.id}`}
                className="alumni-profile-event-activity-row"
              >
                <time className="alumni-profile-event-activity-date">
                  <span>
                    {date
                      .toLocaleDateString(
                        "es-SV",
                        {
                          month:
                            "short",
                        }
                      )
                      .replace(
                        ".",
                        ""
                      )}
                  </span>

                  <strong>
                    {date.getDate()}
                  </strong>
                </time>

                <span className="alumni-profile-event-activity-main">
                  <span className="alumni-profile-event-activity-kicker">
                    {label}
                    {" · "}
                    {isPast
                      ? "Confirmaste asistencia"
                      : "Vas a asistir"}
                  </span>

                  <strong className="alumni-profile-event-activity-title">
                    {
                      event.title
                    }
                  </strong>

                  <span className="alumni-profile-event-activity-meta">
                    <Clock3
                      size={
                        13
                      }
                    />

                    {date.toLocaleTimeString(
                      "es-SV",
                      {
                        hour:
                          "2-digit",
                        minute:
                          "2-digit",
                      }
                    )}

                    {event.location && (
                      <>
                        <span
                          aria-hidden="true"
                        >
                          ·
                        </span>

                        <MapPin
                          size={
                            13
                          }
                        />

                        <span className="alumni-profile-event-activity-location">
                          {
                            event.location
                          }
                        </span>
                      </>
                    )}
                  </span>
                </span>

                <ChevronRight
                  size={18}
                  className="alumni-profile-event-activity-chevron"
                />
              </Link>
            );
          }
        )}
      </div>
    </div>
  );
}

/* ALUMNI_PROFILE_ACTIVITY_EVENTS_1_0 */
