"use client";

import {
  Flag,
  GraduationCap,
  MapPin,
  Sparkles,
} from "lucide-react";
import { flagEmoji } from "@/lib/profileCatalog";
import OriginalMonochromeLogo from "@/components/profile/OriginalMonochromeLogo";

export default function ProfileIdentityMeta({ profile }: { profile: any }) {
  const institution =
    profile.education_institution_name || profile.university || "";
  const institutionLogo = profile.education_institution_logo_url || null;
  const program = profile.education_program_name || "";
  const programLogo = profile.education_program_logo_url || null;

  const primaryFlag = flagEmoji(profile.nationality_primary_code);
  const secondaryFlag = flagEmoji(profile.nationality_secondary_code);
  const residenceFlag = flagEmoji(profile.residence_country_code);

  const location = [profile.city, profile.country].filter(Boolean).join(", ");
  const nationalities = [
    profile.nationality_primary_name,
    profile.nationality_secondary_name,
  ]
    .filter(Boolean)
    .join(" · ");

  if (
    !institution &&
    !program &&
    !profile.career &&
    !location &&
    !primaryFlag
  ) {
    return null;
  }

  return (
    <section className="alumni-premium-meta mt-7">
      <div className="mb-3 flex items-center gap-3">
        <span className="h-px flex-1 bg-[var(--app-border)]" />
        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[var(--app-muted-3)]">
          Perfil
        </p>
        <span className="h-px flex-1 bg-[var(--app-border)]" />
      </div>

      <div className="grid gap-x-12 lg:grid-cols-2">
        {(institution || profile.career) && (
          <MetaRow>
            {institution ? (
              <OriginalMonochromeLogo
                src={institutionLogo}
                name={institution}
                size={46}
                className="text-[var(--app-text-soft)]"
              />
            ) : (
              <MetaIcon>
                <GraduationCap size={19} strokeWidth={1.7} />
              </MetaIcon>
            )}

            <div className="min-w-0">
              <MetaLabel>Formación académica</MetaLabel>

              {institution && (
                <p className="mt-1 text-[14px] font-black leading-5 text-[var(--app-text)]">
                  {institution}
                </p>
              )}

              {profile.career && (
                <div className="mt-1.5 flex items-start gap-1.5 text-[12px] leading-5 text-[var(--app-muted)]">
                  <GraduationCap
                    size={13}
                    className="mt-0.5 shrink-0 text-[var(--app-accent)]"
                  />
                  <span>{profile.career}</span>
                </div>
              )}
            </div>
          </MetaRow>
        )}

        {program && (
          <MetaRow>
            <OriginalMonochromeLogo
              src={programLogo}
              name={program}
              size={44}
              className="text-[var(--app-text-soft)]"
            />

            <div className="min-w-0">
              <MetaLabel>Programa / comunidad</MetaLabel>
              <p className="mt-1 text-[14px] font-black leading-5 text-[var(--app-text)]">
                {program}
              </p>
            </div>
          </MetaRow>
        )}

        {location && (
          <MetaRow>
            <MetaIcon>
              <MapPin size={19} strokeWidth={1.7} />
            </MetaIcon>

            <div className="min-w-0">
              <MetaLabel>Ubicación</MetaLabel>
              <p className="mt-1 text-[13px] font-bold text-[var(--app-text-soft)]">
                {residenceFlag ? `${residenceFlag} ` : ""}
                {location}
              </p>
            </div>
          </MetaRow>
        )}

        {primaryFlag && (
          <MetaRow>
            <MetaIcon>
              <Flag size={18} strokeWidth={1.7} />
            </MetaIcon>

            <div className="min-w-0">
              <MetaLabel>Nacionalidad</MetaLabel>
              <p className="mt-1 text-[13px] font-bold text-[var(--app-text-soft)]">
                <span className="mr-1.5 text-base">
                  {primaryFlag}
                  {secondaryFlag ? ` ${secondaryFlag}` : ""}
                </span>
                {nationalities || "Registrada"}
              </p>
            </div>
          </MetaRow>
        )}
      </div>
    </section>
  );
}

function MetaRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="group flex min-w-0 items-center gap-4 border-b border-[var(--app-border)] py-4.5 transition-colors last:border-b-0 lg:min-h-[82px] lg:[&:nth-last-child(-n+2)]:border-b-0">
      {children}
    </div>
  );
}

function MetaLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] font-black uppercase tracking-[0.17em] text-[var(--app-muted-3)]">
      {children}
    </p>
  );
}

function MetaIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center text-[var(--app-text-soft)]">
      {children}
    </span>
  );
}
