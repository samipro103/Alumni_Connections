const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_PROFILE_ACTIVITY_EVENTS_1_0";

const PROFILE =
  "src/app/profile/page.tsx";

const COMPONENT =
  "src/components/profile/ProfileActivityEvents.tsx";

const CSS =
  "src/components/profile/ProfileActivityEvents.css";

function abs(rel) {
  return path.join(ROOT, rel);
}

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

function read(rel) {
  const file = abs(rel);

  if (!fs.existsSync(file)) {
    fail(
      `No encontré ${rel}. Ejecutá este parche dentro de alumni-web.`
    );
  }

  return fs
    .readFileSync(file, "utf8")
    .replace(/\r\n/g, "\n");
}

function ensureDir(rel) {
  fs.mkdirSync(
    path.dirname(abs(rel)),
    { recursive: true }
  );
}

function backup(rel) {
  const file = abs(rel);

  const bak =
    file +
    ".before-profile-activity-events-1.0.bak";

  if (!fs.existsSync(bak)) {
    fs.copyFileSync(
      file,
      bak
    );
  }
}

let profile = read(PROFILE);

if (
  profile.includes(MARKER) &&
  fs.existsSync(abs(COMPONENT)) &&
  fs.existsSync(abs(CSS))
) {
  console.log(
    "✅ Profile Activity Events 1.0 ya estaba aplicado."
  );
  process.exit(0);
}

/* =========================================================
   1. Import component
   ========================================================= */

const importAnchor =
  'import ProfileSavedTab from "@/components/profile/ProfileSavedTab";';

if (
  !profile.includes(
    'import ProfileActivityEvents from "@/components/profile/ProfileActivityEvents";'
  )
) {
  if (!profile.includes(importAnchor)) {
    fail(
      "No encontré el import de ProfileSavedTab."
    );
  }

  profile =
    profile.replace(
      importAnchor,
      `${importAnchor}
import ProfileActivityEvents from "@/components/profile/ProfileActivityEvents";`
    );
}

/* =========================================================
   2. Replace Activity tab content
   ========================================================= */

const activityStart =
  `<section className="alumni-profile-launch-activity">`;

const activityIndex =
  profile.lastIndexOf(
    activityStart
  );

if (activityIndex === -1) {
  fail(
    "No encontré la sección Actividad del perfil."
  );
}

/*
 * Activity is the final branch in:
 *   tab === posts ? ... : tab === saved ? ... : ( activity )
 *
 * Find the end immediately before the ternary close.
 */
const activityTail =
  `            </section>
          )}
        </section>`;

const tailIndex =
  profile.indexOf(
    activityTail,
    activityIndex
  );

if (tailIndex === -1) {
  fail(
    "No pude identificar el final de la sección Actividad."
  );
}

const oldActivity =
  profile.slice(
    activityIndex,
    tailIndex +
      `            </section>`.length
  );

const newActivity =
  `<section className="alumni-profile-launch-activity">
              <ProfileActivityEvents
                userId={profile.id}
              />
            </section>`;

profile =
  profile.slice(
    0,
    activityIndex
  ) +
  newActivity +
  profile.slice(
    tailIndex +
      `            </section>`.length
  );

if (
  !profile.includes(
    `/* ${MARKER} */`
  )
) {
  profile +=
    `\n/* ${MARKER} */\n`;
}

/* =========================================================
   3. Real event activity component
   ========================================================= */

const component = `"use client";

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
                href={\`/events/\${event.id}\`}
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

/* ${MARKER} */
`;

const css = `/*
 * ${MARKER}
 * Real profile activity based on event_rsvps.
 */

.alumni-profile-event-activity {
  width: 100%;
  background:
    var(--app-bg);
}

.alumni-profile-event-activity-header {
  display: flex;
  min-height: 70px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding:
    14px 16px;
  border-bottom:
    1px solid
    var(--app-border);
}

.alumni-profile-event-activity-header
  > div {
  min-width: 0;
}

.alumni-profile-event-activity-header
  strong {
  display: block;
  color:
    var(--app-text);
  font-size: 15px;
  font-weight: 800;
  line-height: 1.25;
}

.alumni-profile-event-activity-header
  span {
  display: block;
  margin-top: 4px;
  color:
    var(--app-muted-2);
  font-size: 12.5px;
  line-height: 1.35;
}

.alumni-profile-event-activity-header
  > a {
  flex: 0 0 auto;
  color:
    var(--app-accent);
  font-size: 13px;
  font-weight: 750;
  text-decoration: none;
}

.alumni-profile-event-activity-list {
  display: block;
}

.alumni-profile-event-activity-row {
  display: grid;
  grid-template-columns:
    52px
    minmax(0,1fr)
    auto;
  align-items: center;
  gap: 12px;
  min-height: 86px;
  padding:
    12px 16px;
  border-bottom:
    1px solid
    var(--app-border);
  color:
    inherit;
  text-decoration:
    none;
}

.alumni-profile-event-activity-date {
  display: flex;
  width: 52px;
  height: 58px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border:
    1px solid
    var(--app-border);
  border-radius: 14px;
  background:
    var(--app-soft);
}

.alumni-profile-event-activity-date
  span {
  color:
    var(--app-muted);
  font-size: 11px;
  font-weight: 750;
  line-height: 1;
  text-transform:
    uppercase;
}

.alumni-profile-event-activity-date
  strong {
  margin-top: 5px;
  color:
    var(--app-text);
  font-size: 20px;
  font-weight: 850;
  line-height: 1;
}

.alumni-profile-event-activity-main {
  min-width: 0;
}

.alumni-profile-event-activity-kicker {
  display: block;
  overflow: hidden;
  color:
    var(--app-accent);
  font-size: 11.5px;
  font-weight: 700;
  line-height: 1.25;
  text-overflow:
    ellipsis;
  white-space:
    nowrap;
}

.alumni-profile-event-activity-title {
  display: block;
  overflow: hidden;
  margin-top: 4px;
  color:
    var(--app-text);
  font-size: 14.5px;
  font-weight: 800;
  line-height: 1.3;
  text-overflow:
    ellipsis;
  white-space:
    nowrap;
}

.alumni-profile-event-activity-meta {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 5px;
  margin-top: 6px;
  color:
    var(--app-muted-2);
  font-size: 12px;
  line-height: 1.25;
}

.alumni-profile-event-activity-location {
  min-width: 0;
  overflow: hidden;
  text-overflow:
    ellipsis;
  white-space:
    nowrap;
}

.alumni-profile-event-activity-chevron {
  color:
    var(--app-muted-3);
}

.alumni-profile-event-activity-empty {
  display: flex;
  min-height: 260px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding:
    34px 22px
    calc(
      110px +
      env(
        safe-area-inset-bottom
      )
    );
  text-align: center;
}

.alumni-profile-event-activity-empty-icon {
  display: inline-flex;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background:
    var(--app-soft);
  color:
    var(--app-muted);
}

.alumni-profile-event-activity-empty
  strong {
  margin-top: 16px;
  color:
    var(--app-text);
  font-size: 16px;
  font-weight: 820;
}

.alumni-profile-event-activity-empty
  p {
  max-width: 300px;
  margin-top: 7px;
  color:
    var(--app-muted-2);
  font-size: 13px;
  line-height: 1.5;
}

.alumni-profile-event-activity-empty-link {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  margin-top: 18px;
  padding: 0 16px;
  border-radius: 11px;
  background:
    var(--app-accent-fill);
  color:
    var(--app-on-accent);
  font-size: 13px;
  font-weight: 760;
  text-decoration: none;
}

.alumni-profile-event-activity-loading {
  display: grid;
  gap: 1px;
}

.alumni-profile-event-activity-loading
  span {
  display: block;
  height: 86px;
  border-bottom:
    1px solid
    var(--app-border);
  background:
    linear-gradient(
      90deg,
      var(--app-bg),
      var(--app-soft),
      var(--app-bg)
    );
  background-size:
    220% 100%;
  animation:
    alumni-profile-event-loading
    1.25s linear
    infinite;
}

@keyframes
  alumni-profile-event-loading {
  from {
    background-position:
      100% 0;
  }

  to {
    background-position:
      -100% 0;
  }
}

@media (max-width: 374px) {
  .alumni-profile-event-activity-row {
    grid-template-columns:
      48px
      minmax(0,1fr)
      auto;
    gap: 10px;
    padding-right: 13px;
    padding-left: 13px;
  }

  .alumni-profile-event-activity-date {
    width: 48px;
    height: 56px;
  }

  .alumni-profile-event-activity-title {
    font-size: 14px;
  }
}

/* ${MARKER} */
`;

/* =========================================================
   4. Validate TSX
   ========================================================= */

try {
  const ts =
    require("typescript");

  for (
    const [name, source]
    of [
      [PROFILE, profile],
      [COMPONENT, component],
    ]
  ) {
    const parsed =
      ts.createSourceFile(
        name,
        source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

    const diagnostics =
      parsed.parseDiagnostics ||
      [];

    if (
      diagnostics.length
    ) {
      const first =
        diagnostics[0];

      const message =
        ts.flattenDiagnosticMessageText(
          first.messageText,
          "\n"
        );

      const pos =
        typeof first.start ===
        "number"
          ? parsed
              .getLineAndCharacterOfPosition(
                first.start
              )
          : null;

      fail(
        `${name}: sintaxis inválida` +
          (
            pos
              ? ` línea ${pos.line + 1}, columna ${pos.character + 1}`
              : ""
          ) +
          `: ${message}`
      );
    }
  }

  console.log(
    "✅ Parser TypeScript: Profile y ActivityEvents válidos"
  );
} catch (error) {
  if (
    !(
      error &&
      typeof error ===
        "object" &&
      error.code ===
        "MODULE_NOT_FOUND"
    )
  ) {
    throw error;
  }
}

/* =========================================================
   5. Product validation
   ========================================================= */

if (
  profile.includes(
    "<strong>Sobre mí</strong>"
  ) ||
  profile.includes(
    "Trayectoria académica"
  ) ||
  profile.includes(
    "Experiencia profesional"
  )
) {
  fail(
    "Validación: todavía quedaron accesos de edición dentro de Actividad."
  );
}

if (
  !component.includes(
    '.eq("status", "going")'
  )
) {
  fail(
    "Validación: ActivityEvents no quedó basado en RSVP going."
  );
}

/* =========================================================
   6. Write
   ========================================================= */

backup(PROFILE);
ensureDir(COMPONENT);
ensureDir(CSS);

fs.writeFileSync(
  abs(PROFILE),
  profile,
  "utf8"
);

fs.writeFileSync(
  abs(COMPONENT),
  component,
  "utf8"
);

fs.writeFileSync(
  abs(CSS),
  css,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI Profile Activity Events 1.0 aplicado."
);
console.log(
  "✅ Actividad ya no contiene enlaces de Editar perfil."
);
console.log(
  "✅ Actividad usa event_rsvps reales con status going."
);
console.log(
  "✅ Eventos futuros: Vas a asistir."
);
console.log(
  "✅ Eventos pasados: Confirmaste asistencia."
);
console.log(
  "✅ Cada evento abre su detalle."
);
console.log(
  "✅ Estado vacío limpio incluido."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
