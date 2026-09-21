"use client";

import {
  CheckCircle2,
  Clock3,
  Flag,
  ShieldAlert,
  UserRoundX,
  VolumeX,
} from "lucide-react";

export type SafetyPerson = {
  id: string;
  username?: string | null;
  avatar_url?: string | null;
};

export type SafetyReport = {
  id: string;
  target_user_id?: string | null;
  target_type?: string | null;
  reason: string;
  status: string;
  resolution_note?: string | null;
  created_at?: string | null;
  target?: SafetyPerson | null;
};

const REASON_LABELS: Record<
  string,
  string
> = {
  spam: "Spam",
  harassment: "Acoso",
  impersonation: "Suplantación",
  inappropriate: "Contenido inapropiado",
  fraud: "Fraude o estafa",
  privacy: "Privacidad",
  other: "Otro",
};

const STATUS_LABELS: Record<
  string,
  string
> = {
  pending: "Pendiente",
  reviewing: "En revisión",
  resolved: "Resuelto",
  dismissed: "Descartado",
};

function statusClasses(
  status: string
) {
  if (status === "resolved") {
    return "bg-emerald-500/10 text-emerald-400";
  }

  if (status === "dismissed") {
    return "bg-[var(--app-soft)] text-[var(--app-muted-2)]";
  }

  if (status === "reviewing") {
    return "bg-sky-500/10 text-sky-400";
  }

  return "bg-amber-500/10 text-amber-400";
}

function reportDate(
  value?: string | null
) {
  if (!value) return "";

  return new Date(
    value
  ).toLocaleDateString(
    "es-SV",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

export default function SafetyCenterPanel({
  blocked,
  muted,
  reports,
  onUnblock,
  onUnmute,
}: {
  blocked: SafetyPerson[];
  muted: SafetyPerson[];
  reports: SafetyReport[];
  onUnblock: (
    id: string
  ) => void | Promise<void>;
  onUnmute: (
    id: string
  ) => void | Promise<void>;
}) {
  const openReports =
    reports.filter(
      (report) =>
        report.status ===
          "pending" ||
        report.status ===
          "reviewing"
    ).length;

  return (
    <section className="alumni-account-trust-section">
      <div className="flex items-start gap-3">
        <ShieldAlert
          size={18}
          className="mt-0.5 text-[var(--app-accent)]"
        />

        <div>
          <p className="text-sm font-black text-[var(--app-text)]">
            Centro de seguridad
          </p>
          <p className="mt-1 text-[11px] font-semibold leading-5 text-[var(--app-muted-2)]">
            Administra bloqueos, silencios y revisa el estado de los reportes que has enviado.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-[13px] bg-[var(--app-soft)] px-3 py-2.5">
          <strong className="block text-sm font-black text-[var(--app-text)]">
            {blocked.length}
          </strong>
          <span className="mt-0.5 block text-[9px] font-black uppercase tracking-[0.06em] text-[var(--app-muted-3)]">
            Bloqueados
          </span>
        </div>

        <div className="rounded-[13px] bg-[var(--app-soft)] px-3 py-2.5">
          <strong className="block text-sm font-black text-[var(--app-text)]">
            {muted.length}
          </strong>
          <span className="mt-0.5 block text-[9px] font-black uppercase tracking-[0.06em] text-[var(--app-muted-3)]">
            Silenciados
          </span>
        </div>

        <div className="rounded-[13px] bg-[var(--app-soft)] px-3 py-2.5">
          <strong className="block text-sm font-black text-[var(--app-text)]">
            {openReports}
          </strong>
          <span className="mt-0.5 block text-[9px] font-black uppercase tracking-[0.06em] text-[var(--app-muted-3)]">
            En revisión
          </span>
        </div>
      </div>

      {(blocked.length > 0 ||
        muted.length > 0) && (
        <div className="mt-5 border-t border-[var(--app-border)] pt-4">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--app-muted-3)]">
            Personas
          </p>

          <div className="divide-y divide-[var(--app-border)]">
            {blocked.map(
              (person) => (
                <div
                  key={`blocked-${person.id}`}
                  className="flex min-h-[48px] items-center gap-3 py-2"
                >
                  <UserRoundX
                    size={16}
                    className="shrink-0 text-red-400"
                  />

                  <span className="min-w-0 flex-1 truncate text-xs font-bold text-[var(--app-muted)]">
                    @{person.username || "usuario"}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      void onUnblock(
                        person.id
                      )
                    }
                    className="text-[10px] font-black text-[var(--app-accent)]"
                  >
                    Desbloquear
                  </button>
                </div>
              )
            )}

            {muted.map(
              (person) => (
                <div
                  key={`muted-${person.id}`}
                  className="flex min-h-[48px] items-center gap-3 py-2"
                >
                  <VolumeX
                    size={16}
                    className="shrink-0 text-[var(--app-muted-2)]"
                  />

                  <span className="min-w-0 flex-1 truncate text-xs font-bold text-[var(--app-muted)]">
                    @{person.username || "usuario"}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      void onUnmute(
                        person.id
                      )
                    }
                    className="text-[10px] font-black text-[var(--app-accent)]"
                  >
                    Activar
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      )}

      <div className="mt-5 border-t border-[var(--app-border)] pt-4">
        <div className="flex items-center gap-2">
          <Flag
            size={14}
            className="text-[var(--app-muted-2)]"
          />
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--app-muted-3)]">
            Tus reportes recientes
          </p>
        </div>

        {reports.length ? (
          <div className="mt-2 divide-y divide-[var(--app-border)]">
            {reports.map(
              (report) => (
                <article
                  key={report.id}
                  className="py-3"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--app-soft)] text-[var(--app-muted-2)]">
                      {report.status ===
                      "resolved" ? (
                        <CheckCircle2
                          size={13}
                        />
                      ) : (
                        <Clock3
                          size={13}
                        />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-[11px] font-black text-[var(--app-text-soft)]">
                          {REASON_LABELS[
                            report.reason
                          ] ||
                            report.reason}
                        </strong>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-black ${statusClasses(
                            report.status
                          )}`}
                        >
                          {STATUS_LABELS[
                            report.status
                          ] ||
                            report.status}
                        </span>
                      </div>

                      <p className="mt-1 text-[10px] font-semibold text-[var(--app-muted-2)]">
                        {report.target?.username
                          ? `@${report.target.username}`
                          : report.target_type ===
                            "user"
                          ? "Usuario reportado"
                          : "Contenido reportado"}
                        {report.created_at
                          ? ` · ${reportDate(
                              report.created_at
                            )}`
                          : ""}
                      </p>

                      {report.resolution_note && (
                        <p className="mt-2 rounded-[10px] bg-[var(--app-soft)] px-3 py-2 text-[10px] font-semibold leading-4 text-[var(--app-muted)]">
                          {report.resolution_note}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
        ) : (
          <p className="mt-3 text-[11px] font-semibold leading-5 text-[var(--app-muted-2)]">
            No has enviado reportes recientemente.
          </p>
        )}
      </div>
    </section>
  );
}

/* ALUMNI_10_4_SAFETY_CENTER */