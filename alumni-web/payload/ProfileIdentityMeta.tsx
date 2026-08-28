"use client";

import { GraduationCap, Sparkles } from "lucide-react";
import OriginalMonochromeLogo from "@/components/profile/OriginalMonochromeLogo";

export default function ProfileIdentityMeta({ profile }: { profile: any }) {
  const institution =
    profile.education_institution_name || profile.university || "";
  const institutionLogo = profile.education_institution_logo_url || null;
  const program = profile.education_program_name || "";
  const programLogo = profile.education_program_logo_url || null;

  if (!institution && !profile.career && !program) return null;

  return (
    <section className="alumni-academic-showcase mt-8">
      <div className="mb-5 flex items-center gap-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--app-muted-3)]">
            Trayectoria
          </p>
          <p className="mt-1 text-sm font-black tracking-[-0.02em] text-[var(--app-text-soft)]">
            Formación y comunidad
          </p>
        </div>
        <span className="h-px flex-1 bg-[var(--app-border)]" />
      </div>

      <div className="grid gap-7 lg:grid-cols-2 lg:gap-0">
        {(institution || profile.career) && (
          <AcademicColumn>
            <div className="flex min-w-0 items-center gap-4">
              {institution ? (
                <OriginalMonochromeLogo
                  src={institutionLogo}
                  name={institution}
                  size={58}
                  className="text-[var(--app-text-soft)]"
                />
              ) : (
                <span className="flex h-[58px] w-[58px] shrink-0 items-center justify-center text-[var(--app-text-soft)]">
                  <GraduationCap size={25} strokeWidth={1.5} />
                </span>
              )}

              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--app-muted-3)]">
                  Universidad
                </p>

                {institution && (
                  <p className="mt-1 text-[15px] font-black leading-5 text-[var(--app-text)]">
                    {institution}
                  </p>
                )}

                {profile.career && (
                  <div className="mt-2 flex items-start gap-2 text-[12px] leading-5 text-[var(--app-muted)]">
                    <GraduationCap
                      size={14}
                      strokeWidth={1.7}
                      className="mt-0.5 shrink-0 text-[var(--app-accent)]"
                    />
                    <span>{profile.career}</span>
                  </div>
                )}
              </div>
            </div>
          </AcademicColumn>
        )}

        {program && (
          <AcademicColumn secondary>
            <div className="flex min-w-0 items-center gap-4">
              <OriginalMonochromeLogo
                src={programLogo}
                name={program}
                size={58}
                className="text-[var(--app-text-soft)]"
              />

              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--app-muted-3)]">
                  Programa / comunidad
                </p>

                <p className="mt-1 text-[15px] font-black leading-5 text-[var(--app-text)]">
                  {program}
                </p>

                <div className="mt-2 flex items-center gap-2 text-[11px] font-bold text-[var(--app-muted-2)]">
                  <Sparkles
                    size={13}
                    strokeWidth={1.7}
                    className="text-[var(--app-accent)]"
                  />
                  <span>Comunidad académica</span>
                </div>
              </div>
            </div>
          </AcademicColumn>
        )}
      </div>
    </section>
  );
}

function AcademicColumn({
  children,
  secondary = false,
}: {
  children: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <div
      className={
        secondary
          ? "min-w-0 lg:border-l lg:border-[var(--app-border)] lg:pl-8"
          : "min-w-0 lg:pr-8"
      }
    >
      {children}
    </div>
  );
}
