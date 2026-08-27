"use client";

import {
  Bookmark,
  Check,
  ChevronRight,
  Clock3,
  LockKeyhole,
  PencilLine,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react";
import { useState } from "react";

type Props = {
  isPrivate: boolean;
  privacySaving: boolean;
  updatePrivacy: (next: boolean) => void;
  followRequests: any[];
  requestsLoading: boolean;
  acceptFollowRequest: (id: string) => Promise<void>;
  rejectFollowRequest: (id: string) => Promise<void>;
  onEditProfile: () => void;
  onOpenSaved: () => void;
};

export default function ProfileSettingsHub({
  isPrivate,
  privacySaving,
  updatePrivacy,
  followRequests,
  requestsLoading,
  acceptFollowRequest,
  rejectFollowRequest,
  onEditProfile,
  onOpenSaved,
}: Props) {
  const [busyRequest, setBusyRequest] = useState<string | null>(null);

  async function accept(id: string) {
    if (busyRequest) return;
    setBusyRequest(id);
    try {
      await acceptFollowRequest(id);
    } finally {
      setBusyRequest(null);
    }
  }

  async function reject(id: string) {
    if (busyRequest) return;
    setBusyRequest(id);
    try {
      await rejectFollowRequest(id);
    } finally {
      setBusyRequest(null);
    }
  }

  return (
    <div className="alumni-profile-settings-hub">
      <div className="alumni-setting-row">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
          <LockKeyhole size={18} />
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
          aria-checked={isPrivate}
          disabled={privacySaving}
          onClick={() => updatePrivacy(!isPrivate)}
          className={`alumni-privacy-switch ${isPrivate ? "is-on" : ""}`}
          aria-label={isPrivate ? "Desactivar cuenta privada" : "Activar cuenta privada"}
        >
          <span />
        </button>
      </div>

      {isPrivate && (
        <div className="border-t border-[var(--app-border)]">
          <div className="flex items-center gap-3 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--app-soft)] text-[var(--app-muted)]">
              <Clock3 size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-[var(--app-text)]">
                Solicitudes de seguimiento
              </p>
            </div>

            {followRequests.length > 0 && (
              <span className="rounded-full bg-[var(--app-accent)] px-2 py-1 text-[10px] font-black text-[var(--app-on-accent)]">
                {followRequests.length}
              </span>
            )}
          </div>

          {requestsLoading ? (
            <div className="pb-4 pl-[52px] text-xs text-[var(--app-muted-2)]">
              Cargando...
            </div>
          ) : followRequests.length === 0 ? (
            <div className="pb-4 pl-[52px] text-xs text-[var(--app-muted-2)]">
              No hay solicitudes pendientes.
            </div>
          ) : (
            <div className="divide-y divide-[var(--app-border)] pb-2">
              {followRequests.map((request) => {
                const person = request.requester;
                const busy = busyRequest === request.id;

                return (
                  <div
                    key={request.id}
                    className="flex items-center gap-3 py-3 pl-[8px]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--app-soft-strong)] text-xs font-black text-[var(--app-text)]">
                      {person?.avatar_url ? (
                        <img
                          src={person.avatar_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        person?.username?.charAt(0)?.toUpperCase() || "U"
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black text-[var(--app-text)]">
                        @{person?.username || "usuario"}
                      </p>
                      {person?.full_name && (
                        <p className="mt-0.5 truncate text-[10px] text-[var(--app-muted-2)]">
                          {person.full_name}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={busyRequest !== null}
                      onClick={() => void accept(request.id)}
                      className="flex h-9 items-center gap-1.5 rounded-xl bg-[var(--app-accent)] px-3 text-[10px] font-black text-[var(--app-on-accent)] disabled:opacity-50"
                    >
                      {busy ? <Clock3 size={14} /> : <UserRoundCheck size={14} />}
                      <span className="hidden sm:inline">
                        {busy ? "Aceptando" : "Aceptar"}
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={busyRequest !== null}
                      onClick={() => void reject(request.id)}
                      className="flex h-9 items-center gap-1.5 rounded-xl bg-[var(--app-soft)] px-3 text-[10px] font-black text-[var(--app-muted)] disabled:opacity-50"
                    >
                      <UserRoundX size={14} />
                      <span className="hidden sm:inline">Eliminar</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onOpenSaved}
        className="alumni-setting-row w-full border-t border-[var(--app-border)] text-left"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--app-soft)] text-[var(--app-muted)]">
          <Bookmark size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-[var(--app-text)]">
            Guardados
          </p>
          <p className="mt-1 text-[12px] leading-5 text-[var(--app-muted-2)]">
            Publicaciones que guardaste para ver después.
          </p>
        </div>

        <ChevronRight size={18} className="text-[var(--app-muted-3)]" />
      </button>

      <button
        type="button"
        onClick={onEditProfile}
        className="alumni-setting-row w-full border-t border-[var(--app-border)] text-left"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--app-soft)] text-[var(--app-muted)]">
          <PencilLine size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-[var(--app-text)]">
            Editar perfil
          </p>
        </div>

        <ChevronRight size={18} className="text-[var(--app-muted-3)]" />
      </button>
    </div>
  );
}

/* ALUMNI_1_4_1_PROFILE_REPOSTS_SAVED_READABILITY:SETTINGS_HUB */
