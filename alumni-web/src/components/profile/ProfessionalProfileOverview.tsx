"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MapPin } from "lucide-react";

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
  const reduceMotion = useReducedMotion();
  const city = first(profile?.residence_city, profile?.city);
  const country = first(
    profile?.residence_country_name,
    profile?.country,
    profile?.nationality_name,
    profile?.nationality
  );
  const location = [city, country].filter(Boolean).join(", ");

  if (!location) return null;

  return (
    <motion.section
      className="alumni-profile-location"
      initial={reduceMotion ? false : { opacity: 0, y: 7 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <span className="alumni-profile-location-icon" aria-hidden="true">
        <MapPin size={16} strokeWidth={1.9} />
      </span>
      <div className="alumni-profile-location-copy">
        <span>Ubicación</span>
        <strong>{location}</strong>
      </div>
    </motion.section>
  );
}

/* ALUMNI_MICRO_IMPROVEMENTS_BLOCK_1 */
