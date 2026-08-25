"use client";

import { Briefcase, Building2, MapPin, Sparkles } from "lucide-react";
import { flagEmoji } from "@/lib/profileCatalog";

function Logo({
  src,
  fallback,
}: {
  src?: string | null;
  fallback: string;
}) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-[var(--app-border)] bg-white text-[10px] font-black text-zinc-700">
      {src ? (
        <img src={src} alt="" className="h-full w-full object-contain p-1" />
      ) : (
        fallback.slice(0, 2).toUpperCase()
      )}
    </span>
  );
}

export default function ProfileIdentityMeta({ profile }: { profile: any }) {
  const institution =
    profile.education_institution_name || profile.university || "";
  const program = profile.education_program_name || "";
  const primaryFlag = flagEmoji(profile.nationality_primary_code);
  const secondaryFlag = flagEmoji(profile.nationality_secondary_code);
  const residenceFlag = flagEmoji(profile.residence_country_code);

  if (
    !institution &&
    !program &&
    !profile.career &&
    !profile.city &&
    !profile.country &&
    !primaryFlag
  ) {
    return null;
  }

  return (
    <div className="mt-5 flex flex-wrap gap-2.5">
      {institution && (
        <div className="alumni-profile-chip">
          <Logo
            src={profile.education_institution_logo_url}
            fallback={institution}
          />
          <div className="min-w-0">
            <p className="max-w-[240px] truncate text-[11px] font-black text-[var(--app-text-soft)]">
              {institution}
            </p>
            {profile.career && (
              <p className="mt-0.5 max-w-[240px] truncate text-[9px] text-[var(--app-muted-2)]">
                {profile.career}
              </p>
            )}
          </div>
        </div>
      )}

      {!institution && profile.career && (
        <div className="alumni-profile-chip">
          <Briefcase size={14} className="text-[var(--app-accent)]" />
          <span className="text-[11px] font-bold text-[var(--app-text-soft)]">
            {profile.career}
          </span>
        </div>
      )}

      {program && (
        <div className="alumni-profile-chip">
          <Logo src={profile.education_program_logo_url} fallback={program} />
          <div className="min-w-0">
            <p className="max-w-[220px] truncate text-[11px] font-black text-[var(--app-text-soft)]">
              {program}
            </p>
            <p className="mt-0.5 text-[9px] text-[var(--app-muted-2)]">
              Programa
            </p>
          </div>
        </div>
      )}

      {(profile.city || profile.country) && (
        <div className="alumni-profile-chip">
          <MapPin size={14} className="text-[var(--app-accent)]" />
          <span className="text-[11px] font-bold text-[var(--app-text-soft)]">
            {residenceFlag ? `${residenceFlag} ` : ""}
            {[profile.city, profile.country].filter(Boolean).join(", ")}
          </span>
        </div>
      )}

      {primaryFlag && (
        <div className="alumni-profile-chip" title="Nacionalidad">
          <span className="text-[18px] leading-none">
            {primaryFlag}
            {secondaryFlag ? ` / ${secondaryFlag}` : ""}
          </span>
        </div>
      )}
    </div>
  );
}
