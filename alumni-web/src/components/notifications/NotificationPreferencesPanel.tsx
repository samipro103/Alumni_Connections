"use client";

import {
  ArrowLeft,
  AtSign,
  Bell,
  BellRing,
  CalendarDays,
  CheckCheck,
  Heart,
  Mail,
  MessageCircle,
  MessagesSquare,
  Repeat2,
  UserPlus,
} from "lucide-react";

export type NotificationPreferenceKey =
  | "push_enabled"
  | "messages"
  | "story_replies"
  | "likes"
  | "comments"
  | "follows"
  | "events";

export type NotificationPreferences = Record<
  NotificationPreferenceKey,
  boolean
>;

const CATEGORY_ITEMS: Array<{
  key: Exclude<
    NotificationPreferenceKey,
    "push_enabled"
  >;
  title: string;
  description: string;
  icon:
    React.ComponentType<{
      size?: number;
    }>;
}> = [
  {
    key: "messages",
    title: "Mensajes y grupos",
    description:
      "Mensajes privados, actividad importante de grupos y menciones grupales.",
    icon: MessagesSquare,
  },
  {
    key: "story_replies",
    title: "Historias",
    description:
      "Respuestas y actividad relacionada con tus historias.",
    icon: MessageCircle,
  },
  {
    key: "likes",
    title: "Likes y compartidos",
    description:
      "Likes, reacciones y publicaciones compartidas.",
    icon: Heart,
  },
  {
    key: "comments",
    title: "Comentarios y menciones",
    description:
      "Comentarios, respuestas y menciones en contenido.",
    icon: AtSign,
  },
  {
    key: "follows",
    title: "Seguidores e invitaciones",
    description:
      "Nuevos seguidores, solicitudes e invitaciones a comunidades.",
    icon: UserPlus,
  },
  {
    key: "events",
    title: "Eventos",
    description:
      "Invitaciones, recordatorios y actividad de eventos.",
    icon: CalendarDays,
  },
];

function PreferenceSwitch({
  active,
}: {
  active: boolean;
}) {
  return (
    <i
      data-on={
        active
          ? "true"
          : "false"
      }
    >
      <b />
    </i>
  );
}

export default function NotificationPreferencesPanel({
  preferences,
  savingPreference,
  savingAll,
  onToggle,
  onSetAllCategories,
  onClose,
}: {
  preferences: NotificationPreferences;
  savingPreference:
    | NotificationPreferenceKey
    | null;
  savingAll: boolean;
  onToggle: (
    key: NotificationPreferenceKey
  ) => void | Promise<void>;
  onSetAllCategories: (
    enabled: boolean
  ) => void | Promise<void>;
  onClose: () => void;
}) {
  const categoryKeys =
    CATEGORY_ITEMS.map(
      (item) => item.key
    );

  const activeCategories =
    categoryKeys.filter(
      (key) =>
        preferences[key]
    ).length;

  const allEnabled =
    activeCategories ===
    categoryKeys.length;

  const busy =
    Boolean(
      savingPreference
    ) ||
    savingAll;

  return (
    <section
      className="alumni-notification-settings"
      role="dialog"
      aria-modal="true"
      aria-label="Preferencias de notificaciones"
    >
      <header>
        <button
          type="button"
          onClick={onClose}
          aria-label="Volver"
        >
          <ArrowLeft
            size={19}
            strokeWidth={2}
          />
        </button>

        <div>
          <p>Notificaciones</p>
          <h2>Qué quieres recibir</h2>
        </div>
      </header>

      <div className="px-4 pb-1 pt-4 sm:px-5">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-[14px] border border-[var(--app-border)] bg-[var(--app-soft)] p-3">
            <div className="flex items-center gap-2 text-[var(--app-accent)]">
              <Bell size={15} />
              <strong className="text-[11px] font-black">
                Dentro de Alumni
              </strong>
            </div>

            <p className="mt-1.5 text-[9.5px] font-semibold leading-4 text-[var(--app-muted-2)]">
              {activeCategories} de{" "}
              {categoryKeys.length} tipos de actividad activos.
            </p>
          </div>

          <div className="rounded-[14px] border border-[var(--app-border)] bg-[var(--app-soft)] p-3">
            <div className="flex items-center gap-2 text-[var(--app-accent)]">
              <BellRing size={15} />
              <strong className="text-[11px] font-black">
                Push
              </strong>
            </div>

            <p className="mt-1.5 text-[9.5px] font-semibold leading-4 text-[var(--app-muted-2)]">
              {preferences.push_enabled
                ? "Activo en este dispositivo."
                : "Pausado."}
            </p>
          </div>

          <div className="rounded-[14px] border border-[var(--app-border)] bg-[var(--app-soft)] p-3 opacity-75">
            <div className="flex items-center gap-2 text-[var(--app-muted-2)]">
              <Mail size={15} />
              <strong className="text-[11px] font-black">
                Correo
              </strong>
            </div>

            <p className="mt-1.5 text-[9.5px] font-semibold leading-4 text-[var(--app-muted-3)]">
              Aún no configurado en Alumni.
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-1 pt-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[var(--app-muted-3)]">
              Canales
            </p>
            <p className="mt-1 text-[11px] font-semibold leading-5 text-[var(--app-muted-2)]">
              Push es adicional a la actividad que ves dentro de Alumni.
            </p>
          </div>
        </div>
      </div>

      <div className="alumni-notification-preferences-list">
        <button
          type="button"
          onClick={() =>
            void onToggle(
              "push_enabled"
            )
          }
          disabled={busy}
        >
          <span>
            <strong>
              Push en este dispositivo
            </strong>
            <small>
              Recibe avisos fuera de Alumni para las categorías que mantengas activas.
            </small>
          </span>

          <PreferenceSwitch
            active={
              preferences
                .push_enabled
            }
          />
        </button>
      </div>

      <div className="px-4 pb-1 pt-5 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[var(--app-muted-3)]">
              Actividad
            </p>
            <p className="mt-1 text-[11px] font-semibold leading-5 text-[var(--app-muted-2)]">
              Elige qué tipos de actividad quieres conservar en tu centro de Notificaciones.
            </p>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void onSetAllCategories(
                !allEnabled
              )
            }
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-[var(--app-border)] bg-[var(--app-soft)] px-3 text-[9.5px] font-black text-[var(--app-text-soft)] disabled:opacity-50"
          >
            <CheckCheck
              size={12}
            />
            {allEnabled
              ? "Pausar todas"
              : "Activar todas"}
          </button>
        </div>
      </div>

      <div className="alumni-notification-preferences-list">
        {CATEGORY_ITEMS.map(
          ({
            key,
            title,
            description,
            icon: Icon,
          }) => (
            <button
              key={key}
              type="button"
              onClick={() =>
                void onToggle(
                  key
                )
              }
              disabled={busy}
            >
              <span className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--app-soft)] text-[var(--app-accent)]">
                  <Icon size={14} />
                </span>

                <span className="min-w-0">
                  <strong>
                    {title}
                  </strong>
                  <small>
                    {description}
                  </small>
                </span>
              </span>

              <PreferenceSwitch
                active={
                  preferences[
                    key
                  ]
                }
              />
            </button>
          )
        )}
      </div>

      <div className="mx-4 mb-5 mt-4 rounded-[14px] border border-[var(--app-border)] bg-[var(--app-soft)] px-3.5 py-3 sm:mx-5">
        <div className="flex items-start gap-2.5">
          <Repeat2
            size={14}
            className="mt-0.5 shrink-0 text-[var(--app-muted-2)]"
          />

          <p className="text-[9.5px] font-semibold leading-4 text-[var(--app-muted-2)]">
            Si desactivas una categoría, dejará de generarse esa actividad en tu centro de Notificaciones y tampoco se enviará por Push.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ALUMNI_10_3_NOTIFICATION_PREFERENCES */