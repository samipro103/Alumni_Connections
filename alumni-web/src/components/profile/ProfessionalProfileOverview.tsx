"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  GraduationCap,
  Link2,
  MapPin,
  PencilLine,
  Radio,
} from "lucide-react";
import {
  formatDistanceToNow,
} from "date-fns";
import {
  es,
} from "date-fns/locale";
import {
  externalLinkRel,
  safeExternalUrl,
  type SocialKind,
} from "@/lib/safeExternalUrl";

type Props = {
  profile: any;
  posts: any[];
  followers: number;
  following: number;
  own?: boolean;
};

function first(
  ...values: unknown[]
) {
  return values.find(
    (value) =>
      typeof value ===
        "string" &&
      value.trim()
  ) as
    | string
    | undefined;
}

function activityTotal(
  posts: any[]
) {
  return posts.reduce(
    (
      total,
      post
    ) =>
      total +
      Number(
        post.likes?.length ||
          post.likesCount ||
          0
      ) +
      Number(
        post.comments?.length ||
          0
      ),
    0
  );
}

export default function ProfessionalProfileOverview({
  profile,
  posts,
  followers,
  following,
  own = false,
}: Props) {
  const institution =
    first(
      profile
        ?.education_institution_name,
      profile?.university
    );

  const program =
    first(
      profile
        ?.education_program_name
    );

  const career =
    first(
      profile?.career
    );

  const role =
    first(
      profile?.job_title,
      profile?.current_role,
      profile?.occupation,
      profile?.profession,
      career
    );

  const company =
    first(
      profile?.company,
      profile?.current_company,
      profile?.organization
    );

  const city =
    first(
      profile?.residence_city,
      profile?.city
    );

  const country =
    first(
      profile
        ?.residence_country_name,
      profile?.country
    );

  const nationality =
    first(
      profile?.nationality_name,
      profile?.nationality
    );

  const location =
    [city, country]
      .filter(Boolean)
      .join(", ");

  const links = [
    {
      label: "Sitio web",
      key:
        "website" as SocialKind,
      value:
        profile?.website,
    },
    {
      label: "LinkedIn",
      key:
        "linkedin" as SocialKind,
      value:
        profile?.linkedin,
    },
    {
      label: "GitHub",
      key:
        "github" as SocialKind,
      value:
        profile?.github,
    },
    {
      label: "Instagram",
      key:
        "instagram" as SocialKind,
      value:
        profile?.instagram,
    },
  ]
    .map((item) => ({
      ...item,
      href:
        safeExternalUrl(
          item.value,
          item.key
        ),
    }))
    .filter(
      (item) =>
        Boolean(
          item.href
        )
    );

  const lastPost =
    posts?.[0];

  const interactions =
    activityTotal(
      posts || []
    );

  const identityFields = [
    profile?.full_name,
    profile?.bio,
    profile?.avatar_url,
    career,
    institution,
    program,
    location,
    links.length
      ? "links"
      : "",
  ];

  const completion =
    Math.round(
      (identityFields.filter(
        Boolean
      ).length /
        identityFields.length) *
        100
    );

  return (
    <section className="pt-3">
      <div className="border-b border-[var(--app-border)] pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--app-muted-3)]">
              Perfil profesional
            </p>

            <h2 className="mt-2 text-[22px] font-black tracking-[-0.035em] text-[var(--app-text)]">
              {role ||
                "Comunidad Alumni"}
            </h2>

            {(company ||
              institution) && (
              <p className="mt-1 text-sm leading-6 text-[var(--app-muted)]">
                {[
                  company,
                  institution,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>

          {own && (
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--app-muted-3)]">
                Perfil {completion}%
              </span>

              <Link
                href="/settings?section=profile&edit=1"
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[var(--app-accent)] transition hover:text-[var(--app-text)]"
              >
                <PencilLine
                  size={13}
                />
                Mejorar
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="grid border-b border-[var(--app-border)] md:grid-cols-[1.15fr_.85fr]">
        <div className="py-6 md:border-r md:border-[var(--app-border)] md:pr-8">
          <div className="flex items-center gap-2 text-[var(--app-accent)]">
            <GraduationCap
              size={16}
            />
            <p className="text-[10px] font-black uppercase tracking-[0.16em]">
              Formación
            </p>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <p className="text-base font-black tracking-[-0.02em] text-[var(--app-text)]">
                {career ||
                  "Trayectoria por completar"}
              </p>

              {institution && (
                <p className="mt-1 text-sm leading-6 text-[var(--app-muted)]">
                  {institution}
                </p>
              )}
            </div>

            {program && (
              <div className="border-l border-[var(--app-accent)] pl-3">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[var(--app-muted-3)]">
                  Programa
                </p>

                <p className="mt-1 text-sm font-bold text-[var(--app-text-soft)]">
                  {program}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="py-6 md:pl-8">
          <div className="flex items-center gap-2 text-[var(--app-accent)]">
            <MapPin size={16} />
            <p className="text-[10px] font-black uppercase tracking-[0.16em]">
              Contexto
            </p>
          </div>

          <div className="mt-4 space-y-3">
            <ProfileLine
              label="Ubicación"
              value={
                location ||
                "No especificada"
              }
            />

            <ProfileLine
              label="Nacionalidad"
              value={
                nationality ||
                "No especificada"
              }
            />
          </div>
        </div>
      </div>

      <div className="grid border-b border-[var(--app-border)] sm:grid-cols-3">
        <Metric
          label="Publicaciones"
          value={
            posts.length
          }
        />

        <Metric
          label="Red"
          value={
            followers +
            following
          }
          divider
        />

        <Metric
          label="Interacciones"
          value={interactions}
          divider
        />
      </div>

      <div className="grid border-b border-[var(--app-border)] md:grid-cols-[1fr_1fr]">
        <div className="py-6 md:border-r md:border-[var(--app-border)] md:pr-8">
          <div className="flex items-center gap-2">
            <Radio
              size={15}
              className="text-[var(--app-accent)]"
            />

            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--app-muted-3)]">
              Actividad
            </p>
          </div>

          <p className="mt-4 text-sm font-bold text-[var(--app-text-soft)]">
            {lastPost
              ? `Última publicación ${formatDistanceToNow(
                  new Date(
                    lastPost.created_at
                  ),
                  {
                    addSuffix:
                      true,
                    locale: es,
                  }
                )}`
              : "Sin publicaciones todavía"}
          </p>

          <p className="mt-1 text-xs leading-5 text-[var(--app-muted)]">
            {followers} seguidores · {following} siguiendo
          </p>
        </div>

        <div className="py-6 md:pl-8">
          <div className="flex items-center gap-2">
            <Link2
              size={15}
              className="text-[var(--app-accent)]"
            />

            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--app-muted-3)]">
              Presencia
            </p>
          </div>

          {links.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {links.map(
                (item) => (
                  <a
                    key={
                      item.label
                    }
                    href={
                      item.href
                    }
                    target="_blank"
                    rel={
                      externalLinkRel()
                    }
                    referrerPolicy="no-referrer"
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--app-border)] px-2.5 py-2 text-[10px] font-black text-[var(--app-muted)] transition hover:border-[var(--app-accent)]/40 hover:text-[var(--app-text)]"
                  >
                    {
                      item.label
                    }
                    <ArrowUpRight
                      size={12}
                    />
                  </a>
                )
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--app-muted)]">
              {own
                ? "Agrega enlaces profesionales para completar tu presencia."
                : "Sin enlaces públicos por ahora."}
            </p>
          )}
        </div>
      </div>

      {(company ||
        role) && (
        <div className="flex items-start gap-3 py-6">
          <BriefcaseBusiness
            size={16}
            className="mt-0.5 shrink-0 text-[var(--app-accent)]"
          />

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--app-muted-3)]">
              Enfoque actual
            </p>

            <p className="mt-2 text-sm font-bold leading-6 text-[var(--app-text-soft)]">
              {[
                role,
                company,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function ProfileLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[var(--app-muted-3)]">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-[var(--app-text-soft)]">
        {value}
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
  divider = false,
}: {
  label: string;
  value: number;
  divider?: boolean;
}) {
  return (
    <div
      className={`py-5 ${
        divider
          ? "sm:border-l sm:border-[var(--app-border)] sm:pl-6"
          : ""
      }`}
    >
      <p className="text-xl font-black tracking-[-0.035em] text-[var(--app-text)]">
        {value}
      </p>

      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-[var(--app-muted-3)]">
        {label}
      </p>
    </div>
  );
}
