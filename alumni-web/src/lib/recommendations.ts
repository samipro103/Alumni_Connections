"use client";

import { supabase } from "@/lib/supabase";

export type RecommendedProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  full_name?: string | null;
  university?: string | null;
  education_institution_name?: string | null;
  education_program_name?: string | null;
  career?: string | null;
  city?: string | null;
  country?: string | null;
  residence_country_code?: string | null;
  bio?: string | null;
  score: number;
  mutualCount: number;
  reason: string;
};

function normalized(
  value: unknown
) {
  return String(value || "")
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toLowerCase();
}

function same(
  left: unknown,
  right: unknown
) {
  const a = normalized(left);
  const b = normalized(right);

  return Boolean(
    a && b && a === b
  );
}

function institution(
  person: any
) {
  return (
    person
      ?.education_institution_name ||
    person?.university ||
    ""
  );
}

export async function getRecommendedProfiles(
  userId: string,
  limit = 8
) {
  /* ALUMNI_1_1_0_C_HOTFIX_TYPESCRIPT */
  const { data: meData } =
    await supabase
      .from("profiles")
      .select(
        "id, university, education_institution_name, education_program_name, career, city, country, residence_country_code"
      )
      .eq("id", userId)
      .maybeSingle();

  const me = meData as any;

  const { data: mineRows } =
    await supabase
      .from("follows")
      .select("following_id")
      .eq(
        "follower_id",
        userId
      );

  const mine =
    new Set(
      (mineRows || []).map(
        (row: any) =>
          row.following_id
      )
    );

  const {
    data: candidatesData,
  } = await supabase
    .from("profiles")
    .select(
      "id, username, avatar_url, full_name, university, education_institution_name, education_program_name, career, city, country, residence_country_code, bio"
    )
    .neq("id", userId)
    .limit(140);

  const candidateRows =
    (candidatesData || []) as any[];

  const candidates =
    candidateRows.filter(
      (person: any) =>
        !mine.has(person.id)
    );

  if (!candidates.length) {
    return [];
  }

  const ids =
    candidates.map(
      (person: any) =>
        person.id
    );

  const {
    data: otherFollows,
  } = await supabase
    .from("follows")
    .select(
      "follower_id, following_id"
    )
    .in(
      "follower_id",
      ids
    );

  const followMap =
    new Map<
      string,
      Set<string>
    >();

  (
    otherFollows || []
  ).forEach((row: any) => {
    const set =
      followMap.get(
        row.follower_id
      ) ||
      new Set<string>();

    set.add(
      row.following_id
    );

    followMap.set(
      row.follower_id,
      set
    );
  });

  const since =
    new Date();

  since.setDate(
    since.getDate() - 30
  );

  const {
    data: recentPosts,
  } = await supabase
    .from("posts")
    .select("user_id")
    .in("user_id", ids)
    .gte(
      "created_at",
      since.toISOString()
    );

  const active =
    new Set(
      (
        recentPosts || []
      ).map(
        (post: any) =>
          post.user_id
      )
    );

  return candidates
    .map((person: any) => {
      let score = 0;
      let mutualCount = 0;

      const theirs =
        followMap.get(
          person.id
        ) ||
        new Set<string>();

      mine.forEach((id) => {
        if (
          theirs.has(id)
        ) {
          mutualCount += 1;
        }
      });

      const sameInstitution =
        same(
          institution(me),
          institution(person)
        );

      const sameProgram =
        same(
          me?.education_program_name,
          person
            .education_program_name
        );

      const sameCareer =
        same(
          me?.career,
          person.career
        );

      const sameCity =
        same(
          me?.city,
          person.city
        );

      const sameCountry =
        same(
          me
            ?.residence_country_code ||
            me?.country,
          person
            .residence_country_code ||
            person.country
        );

      if (sameProgram) {
        score += 48;
      }

      if (sameCareer) {
        score += 39;
      }

      if (sameInstitution) {
        score += 36;
      }

      score +=
        Math.min(
          mutualCount * 9,
          27
        );

      if (sameCity) {
        score += 12;
      } else if (
        sameCountry
      ) {
        score += 5;
      }

      if (
        person.avatar_url
      ) {
        score += 3;
      }

      if (person.bio) {
        score += 2;
      }

      if (
        active.has(person.id)
      ) {
        score += 7;
      }

      let reason =
        "Perfil de la comunidad";

      if (
        sameProgram &&
        person.education_program_name
      ) {
        reason =
          person
            .education_program_name;
      } else if (
        sameCareer &&
        mutualCount
      ) {
        reason =
          `${person.career} · ${mutualCount} ${
            mutualCount === 1
              ? "conexión en común"
              : "conexiones en común"
          }`;
      } else if (
        mutualCount
      ) {
        reason =
          `${mutualCount} ${
            mutualCount === 1
              ? "conexión en común"
              : "conexiones en común"
          }`;
      } else if (
        sameCareer &&
        person.career
      ) {
        reason =
          `También estudia ${person.career}`;
      } else if (
        sameInstitution
      ) {
        reason =
          institution(person);
      } else if (
        sameCity &&
        person.city
      ) {
        reason =
          `También está en ${person.city}`;
      } else {
        reason =
          person.career ||
          institution(person) ||
          reason;
      }

      return {
        ...person,
        score,
        mutualCount,
        reason,
      };
    })
    .sort(
      (a: any, b: any) =>
        b.score - a.score
    )
    .slice(0, limit);
}
