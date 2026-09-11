"use client";

import {
  Clock3,
  LockKeyhole,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react";
import {
  useState,
} from "react";

type Props = {
  isPrivate: boolean;
  privacySaving: boolean;
  updatePrivacy:
    (next: boolean) => void;
  followRequests: any[];
  requestsLoading: boolean;
  acceptFollowRequest:
    (id: string) => Promise<void>;
  rejectFollowRequest:
    (id: string) => Promise<void>;
};

export default function ProfileSettingsHub({
  isPrivate,
  privacySaving,
  updatePrivacy,
  followRequests,
  requestsLoading,
  acceptFollowRequest,
  rejectFollowRequest,
}: Props) {
  const [
    busyRequest,
    setBusyRequest,
  ] =
    useState<string | null>(
      null
    );

  async function accept(
    id: string
  ) {
    if (busyRequest) {
      return;
    }

    setBusyRequest(id);

    try {
      await acceptFollowRequest(
        id
      );
    } finally {
      setBusyRequest(null);
    }
  }

  async function reject(
    id: string
  ) {
    if (busyRequest) {
      return;
    }

    setBusyRequest(id);

    try {
      await rejectFollowRequest(
        id
      );
    } finally {
      setBusyRequest(null);
    }
  }

  return (
    <div className="alumni-profile-settings-hub">
      <div className="alumni-setting-row">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
          <LockKeyhole
            size={18}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-[var(--app-text)]">
            Cuenta privada
          </p>

          <p className="mt-1 text-[11px] leading-5 text-[var(--app-muted-2)]">
            Las nuevas personas necesitan tu aprobación para seguirte.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={
            isPrivate
          }
          disabled={
            privacySaving
          }
          onClick={() =>
            updatePrivacy(
              !isPrivate
            )
          }
          className={`alumni-privacy-switch ${isPrivate ? "is-on" : ""}`}
          aria-label={
            isPrivate
              ? "Desactivar cuenta privada"
              : "Activar cuenta privada"
          }
        >
          <span />
        </button>
      </div>

      {isPrivate && (
        <div className="border-t border-[var(--app-border)]">
          <div className="flex items-center gap-3 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--app-soft)] text-[var(--app-muted)]">
              <Clock3
                size={18}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-[var(--app-text)]">
                Solicitudes de seguimiento
              </p>

              <p className="mt-1 text-[10px] leading-4 text-[var(--app-muted-2)]">
                Acepta o rechaza quién puede seguirte.
              </p>
            </div>

            {followRequests.length >
              0 && (
              <span className="rounded-full bg-[var(--app-accent)] px-2 py-1 text-[10px] font-black text-[var(--app-on-accent)]">
                {
                  followRequests.length
                }
              </span>
            )}
          </div>

          {requestsLoading ? (
            <div className="pb-4 pl-[52px] text-xs text-[var(--app-muted-2)]">
              Cargando...
            </div>
          ) : followRequests.length ===
            0 ? (
            <div className="pb-4 pl-[52px] text-xs text-[var(--app-muted-2)]">
              No hay solicitudes pendientes.
            </div>
          ) : (
            <div className="divide-y divide-[var(--app-border)] pb-2">
              {followRequests.map(
                (request) => {
                  const person =
                    request.requester;

                  const busy =
                    busyRequest ===
                    request.id;

                  return (
                    <div
                      key={
                        request.id
                      }
                      className="flex items-center gap-3 py-3 pl-[8px]"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--app-soft-strong)] text-xs font-black text-[var(--app-text)]">
                        {person?.avatar_url ? (
                          <img
                            src={
                              person.avatar_url
                            }
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          person?.username
                            ?.charAt(
                              0
                            )
                            ?.toUpperCase() ||
                          "U"
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-black text-[var(--app-text)]">
                          @
                          {person?.username ||
                            "usuario"}
                        </p>

                        {person?.full_name && (
                          <p className="mt-0.5 truncate text-[10px] text-[var(--app-muted-2)]">
                            {
                              person.full_name
                            }
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={
                          busyRequest !==
                          null
                        }
                        onClick={() =>
                          void accept(
                            request.id
                          )
                        }
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--app-accent)] text-[var(--app-on-accent)] disabled:opacity-50"
                        aria-label="Aceptar solicitud"
                        title="Aceptar"
                      >
                        {busy ? (
                          <Clock3
                            size={
                              14
                            }
                          />
                        ) : (
                          <UserRoundCheck
                            size={
                              15
                            }
                          />
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={
                          busyRequest !==
                          null
                        }
                        onClick={() =>
                          void reject(
                            request.id
                          )
                        }
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--app-soft)] text-[var(--app-muted)] disabled:opacity-50"
                        aria-label="Rechazar solicitud"
                        title="Rechazar"
                      >
                        <UserRoundX
                          size={15}
                        />
                      </button>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ALUMNI_SETTINGS_2_2_NO_REDUNDANCY */
