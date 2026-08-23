"use client";
import { supabase } from "@/lib/supabase";

export type RecommendedProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  full_name?: string | null;
  university?: string | null;
  career?: string | null;
  city?: string | null;
  country?: string | null;
  bio?: string | null;
  score: number;
  mutualCount: number;
  reason: string;
};

export async function getRecommendedProfiles(userId: string, limit = 8) {
  const { data: me } = await supabase
    .from("profiles")
    .select("id, university, career, city, country")
    .eq("id", userId)
    .maybeSingle();

  const { data: mineRows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  const mine = new Set((mineRows || []).map((r: any) => r.following_id));

  const { data: candidatesData } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, full_name, university, career, city, country, bio")
    .neq("id", userId)
    .limit(80);

  const candidates = (candidatesData || []).filter((p: any) => !mine.has(p.id));
  if (!candidates.length) return [];

  const ids = candidates.map((p: any) => p.id);

  const { data: otherFollows } = await supabase
    .from("follows")
    .select("follower_id, following_id")
    .in("follower_id", ids);

  const followMap = new Map<string, Set<string>>();
  (otherFollows || []).forEach((row: any) => {
    const set = followMap.get(row.follower_id) || new Set<string>();
    set.add(row.following_id);
    followMap.set(row.follower_id, set);
  });

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: recentPosts } = await supabase
    .from("posts")
    .select("user_id")
    .in("user_id", ids)
    .gte("created_at", since.toISOString());

  const active = new Set((recentPosts || []).map((p: any) => p.user_id));

  return candidates.map((p: any) => {
    let score = 0;
    let mutualCount = 0;

    const theirs = followMap.get(p.id) || new Set<string>();
    mine.forEach((id) => {
      if (theirs.has(id)) mutualCount += 1;
    });

    const sameUniversity = me?.university && p.university === me.university;
    const sameCareer = me?.career && p.career === me.career;
    const sameCity = me?.city && p.city === me.city;
    const sameCountry = me?.country && p.country === me.country;

    if (sameUniversity) score += 40;
    if (sameCareer) score += 35;
    score += Math.min(mutualCount * 8, 24);
    if (sameCity) score += 10;
    else if (sameCountry) score += 5;
    if (p.avatar_url) score += 3;
    if (p.bio) score += 2;
    if (active.has(p.id)) score += 5;

    let reason = "Perfil de la comunidad";
    if (sameCareer && mutualCount) {
      reason = `${p.career} · ${mutualCount} ${mutualCount === 1 ? "conexión en común" : "conexiones en común"}`;
    } else if (mutualCount) {
      reason = `${mutualCount} ${mutualCount === 1 ? "conexión en común" : "conexiones en común"}`;
    } else if (sameCareer) {
      reason = `También estudia ${p.career}`;
    } else if (sameUniversity) {
      reason = p.university;
    } else if (sameCity) {
      reason = `También está en ${p.city}`;
    } else {
      reason = p.career || p.university || reason;
    }

    return { ...p, score, mutualCount, reason };
  })
  .sort((a: any, b: any) => b.score - a.score)
  .slice(0, limit);
}
