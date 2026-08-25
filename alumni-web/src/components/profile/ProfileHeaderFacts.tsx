"use client";

import { Flag, MapPin } from "lucide-react";
import { flagEmoji } from "@/lib/profileCatalog";

export default function ProfileHeaderFacts({ profile }: { profile: any }) {
  const residenceFlag = flagEmoji(profile.residence_country_code);
  const primaryFlag = flagEmoji(profile.nationality_primary_code);
  const secondaryFlag = flagEmoji(profile.nationality_secondary_code);

  const location = [profile.city, profile.country].filter(Boolean).join(", ");
  const nationalities = [
    profile.nationality_primary_name,
    profile.nationality_secondary_name,
  ]
    .filter(Boolean)
    .join(" · ");

  if (!location && !primaryFlag && !nationalities) return null;

  return (
    <div className="alumni-profile-header-facts mt-3 flex flex-wrap justify-end gap-x-6 gap-y-2">
      {location && (
        <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--app-muted)]">
          <MapPin
            size={14}
            strokeWidth={1.8}
            className="text-[var(--app-accent)]"
          />
          <span>
            {residenceFlag ? `${residenceFlag} ` : ""}
            {location}
          </span>
        </div>
      )}

      {(primaryFlag || nationalities) && (
        <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--app-muted)]">
          <Flag
            size={14}
            strokeWidth={1.8}
            className="text-[var(--app-accent)]"
          />
          <span>
            {primaryFlag ? `${primaryFlag}` : ""}
            {secondaryFlag ? ` ${secondaryFlag}` : ""}
            {(primaryFlag || secondaryFlag) && nationalities ? " · " : ""}
            {nationalities}
          </span>
        </div>
      )}
    </div>
  );
}
