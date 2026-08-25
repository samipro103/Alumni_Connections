"use client";

import { MapPin } from "lucide-react";
import { flagEmoji } from "@/lib/profileCatalog";
import MonochromeBrandMark from "@/components/profile/MonochromeBrandMark";

export default function ProfileIdentityMeta({ profile }: { profile: any }) {
  const institution =
    profile.education_institution_name || profile.university || "";
  const program = profile.education_program_name || "";
  const primaryFlag = flagEmoji(profile.nationality_primary_code);
  const secondaryFlag = flagEmoji(profile.nationality_secondary_code);
  const residenceFlag = flagEmoji(profile.residence_country_code);

  const hasLocation = Boolean(profile.city || profile.country);
  const hasNationality = Boolean(primaryFlag);

  if (
    !institution &&
    !program &&
    !profile.career &&
    !hasLocation &&
    !hasNationality
  ) {
    return null;
  }

  return (
    <section className="mt-6 border-y border-[var(--app-border)] py-4">
      <div className="grid gap-x-10 md:grid-cols-2">
        {institution && (
          <IdentityLine>
            <MonochromeBrandMark
              name={institution}
              kind="university"
              size={40}
              className="text-[var(--app-text-soft)]"
            />

            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--app-muted-3)]">
                Universidad
              </p>
              <p className="mt-1 text-[13px] font-black leading-5 text-[var(--app-text)]">
                {institution}
              </p>
              {profile.career && (
                <p className="mt-0.5 text-[12px] leading-5 text-[var(--app-muted)]">
                  {profile.career}
                </p>
              )}
            </div>
          </IdentityLine>
        )}

        {!institution && profile.career && (
          <IdentityLine>
            <MonochromeBrandMark
              name={profile.career}
              kind="university"
              size={38}
              className="text-[var(--app-text-soft)]"
            />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--app-muted-3)]">
                Carrera
              </p>
              <p className="mt-1 text-[13px] font-black text-[var(--app-text)]">
                {profile.career}
              </p>
            </div>
          </IdentityLine>
        )}

        {program && (
          <IdentityLine>
            <MonochromeBrandMark
              name={program}
              kind="program"
              size={38}
              className="text-[var(--app-text-soft)]"
            />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--app-muted-3)]">
                Programa / comunidad
              </p>
              <p className="mt-1 text-[13px] font-black leading-5 text-[var(--app-text)]">
                {program}
              </p>
            </div>
          </IdentityLine>
        )}

        {hasLocation && (
          <IdentityLine>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center text-[var(--app-text-soft)]">
              <MapPin size={19} strokeWidth={1.7} />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--app-muted-3)]">
                Ubicación
              </p>
              <p className="mt-1 text-[13px] font-bold text-[var(--app-text-soft)]">
                {residenceFlag ? `${residenceFlag} ` : ""}
                {[profile.city, profile.country].filter(Boolean).join(", ")}
              </p>
            </div>
          </IdentityLine>
        )}

        {hasNationality && (
          <IdentityLine>
            <span className="flex h-9 min-w-9 shrink-0 items-center justify-center text-[20px] leading-none">
              {primaryFlag}
              {secondaryFlag ? ` ${secondaryFlag}` : ""}
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--app-muted-3)]">
                Nacionalidad
              </p>
              <p className="mt-1 text-[13px] font-bold text-[var(--app-text-soft)]">
                {[profile.nationality_primary_name, profile.nationality_secondary_name]
                  .filter(Boolean)
                  .join(" · ") || "Registrada"}
              </p>
            </div>
          </IdentityLine>
        )}
      </div>
    </section>
  );
}

function IdentityLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3 border-b border-[var(--app-border)] py-3.5 last:border-b-0 md:[&:nth-last-child(-n+2)]:border-b-0">
      {children}
    </div>
  );
}
