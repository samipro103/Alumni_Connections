"use client";

import {
  LockKeyhole,
  UserPlus,
  UserRoundCheck,
} from "lucide-react";
import { AlumniAvatar } from "@/components/ui/AlumniImage";

export default function ExplorePersonRow({
  person,
  following,
  busy,
  reason,
  onFollow,
  onOpen,
}: {
  person: any;
  following: boolean;
  busy: boolean;
  reason?: string;
  onFollow: () => void;
  onOpen?: () => void;
}) {
  return (
    <div className="alumni-explore-person">
      <a
        href={`/u/${person.username}`}
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--app-soft-strong)] text-sm font-black text-[var(--app-text)]">
          <AlumniAvatar
            src={person.avatar_url}
            name={person.username}
            alt=""
            className="h-full w-full"
            imageClassName="h-full w-full object-cover"
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-2">
            <strong className="truncate text-[14px] font-black text-[var(--app-text)]">
              {person.full_name || `@${person.username}`}
            </strong>
            {person.is_private && (
              <LockKeyhole
                size={12}
                className="shrink-0 text-[var(--app-muted-3)]"
              />
            )}
          </span>

          <span className="mt-0.5 block truncate text-[12px] text-[var(--app-muted-2)]">
            @{person.username}
            {person.career ? ` · ${person.career}` : ""}
          </span>

          {(reason ||
            person.education_institution_name ||
            person.university ||
            person.city) && (
            <span className="mt-1 block truncate text-[12px] font-semibold text-[var(--app-muted)]">
              {reason ||
                person.education_institution_name ||
                person.university ||
                person.city}
            </span>
          )}
        </span>
      </a>

      <button
        type="button"
        disabled={busy || following}
        onClick={onFollow}
        className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[11px] font-black transition ${
          following
            ? "bg-[var(--app-soft)] text-[var(--app-muted-2)]"
            : "bg-[var(--app-accent-fill)] text-[var(--app-on-accent)]"
        } disabled:opacity-60`}
      >
        {following ? (
          <>
            <UserRoundCheck size={14} />
            Siguiendo
          </>
        ) : (
          <>
            <UserPlus size={14} />
            {person.is_private ? "Solicitar" : "Seguir"}
          </>
        )}
      </button>
    </div>
  );
}

/* ALUMNI_1_6_0_EXPLORE_PERSON_ROW */

/* ALUMNI_2_9_0_IMAGE_LAYER:EXPLORE_PERSON */
