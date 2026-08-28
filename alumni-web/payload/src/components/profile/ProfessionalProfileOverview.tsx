"use client";

import { GraduationCap, MapPin } from "lucide-react";

type Props = {
  profile: any;
  posts: any[];
  followers: number;
  following: number;
  own?: boolean;
};

function first(...values: unknown[]) {
  return values.find(
    (value) => typeof value === "string" && value.trim()
  ) as string | undefined;
}

export default function ProfessionalProfileOverview({ profile }: Props) {
  const institution = first(
    profile?.education_institution_name,
    profile?.university
  );
  const program = first(profile?.education_program_name);
  const career = first(profile?.career);
  const city = first(profile?.residence_city, profile?.city);
  const country = first(profile?.residence_country_name, profile?.country);
  const nationality = first(profile?.nationality_name, profile?.nationality);

  return (
    <section className="pt-3">
      <div className="border-b border-[var(--app-border)] pb-4">
        <div className="flex items-center gap-2 text-[var(--app-accent)]">
          <GraduationCap size={16} />
          <h2 className="text-[11px] font-black uppercase tracking-[0.16em]">
            Formación
          </h2>
        </div>
      </div>

      <div className="grid gap-0 md:grid-cols-2">
        <div className="py-5 md:border-r md:border-[var(--app-border)] md:pr-8">
          <Line label="Carrera" value={career || "No especificada"} />
          <Line label="Institución" value={institution || "No especificada"} />
          {program && <Line label="Programa" value={program} />}
        </div>

        <div className="py-5 md:pl-8">
          <Line
            label="Ubicación"
            value={[city, country].filter(Boolean).join(", ") || "No especificada"}
            icon
          />
          <Line label="Nacionalidad" value={nationality || "No especificada"} />
        </div>
      </div>
    </section>
  );
}

function Line({
  label,
  value,
  icon = false,
}: {
  label: string;
  value: string;
  icon?: boolean;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.14em] text-[var(--app-muted-3)]">
        {icon && <MapPin size={11} />}
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-[var(--app-text-soft)]">
        {value}
      </p>
    </div>
  );
}
