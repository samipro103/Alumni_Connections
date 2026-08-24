import { createClient } from "@supabase/supabase-js";

function cleanCredential(rawValue: string | undefined, variableName: string) {
  let value = (rawValue || "").trim();
  const prefix = `${variableName}=`;

  if (value.startsWith(prefix)) {
    value = value.slice(prefix.length).trim();
  }

  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    value = value.slice(1, -1).trim();
  }

  return value;
}

function getSupabaseConfig() {
  const url = cleanCredential(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_URL"
  );

  const anon = cleanCredential(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );

  const adminKey =
    cleanCredential(
      process.env.SUPABASE_SECRET_KEY,
      "SUPABASE_SECRET_KEY"
    ) ||
    cleanCredential(
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      "SUPABASE_SERVICE_ROLE_KEY"
    );

  if (!url || !anon) {
    throw new Error("Supabase no está configurado.");
  }

  if (!adminKey) {
    throw new Error(
      "SUPABASE_SECRET_KEY no está disponible en servidor."
    );
  }

  return { url, anon, adminKey };
}

export function moderationAdminClient() {
  const { url, adminKey } = getSupabaseConfig();

  return createClient(url, adminKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function verifyModerationUser(
  authorization: string | null
) {
  const token =
    authorization?.match(/^Bearer\s+(.+)$/i)?.[1] || "";

  if (!token) return null;

  const { url, anon } = getSupabaseConfig();

  const response = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: anon,
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) return null;

  const user = await response.json();

  return user?.id
    ? { id: String(user.id) }
    : null;
}

function getOpenAiKey() {
  const key = cleanCredential(
    process.env.OPENAI_API_KEY,
    "OPENAI_API_KEY"
  );

  if (!key) {
    throw new Error("OPENAI_API_KEY no está configurada.");
  }

  return key;
}

type ModeratePostInput = {
  text?: string | null;
  imageUrl?: string | null;
};

export async function moderatePostWithOpenAI({
  text,
  imageUrl,
}: ModeratePostInput) {
  const input: any[] = [];
  const cleanText = (text || "").trim();
  const cleanImageUrl = (imageUrl || "").trim();

  if (cleanText) {
    input.push({
      type: "text",
      text: cleanText,
    });
  }

  if (cleanImageUrl) {
    input.push({
      type: "image_url",
      image_url: {
        url: cleanImageUrl,
      },
    });
  }

  if (input.length === 0) {
    throw new Error(
      "La publicación no tiene contenido para analizar."
    );
  }

  const response = await fetch(
    "https://api.openai.com/v1/moderations",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getOpenAiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "omni-moderation-latest",
        input,
      }),
      cache: "no-store",
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        "OpenAI no pudo analizar la publicación."
    );
  }

  const result = data?.results?.[0];

  if (!result) {
    throw new Error(
      "OpenAI no devolvió un resultado de moderación."
    );
  }

  const scores = result.category_scores || {};

  const sorted = Object.entries(scores)
    .map(([category, value]) => ({
      category,
      score: Number(value || 0),
    }))
    .sort((a, b) => b.score - a.score);

  const top = sorted[0] || {
    category: null,
    score: 0,
  };

  return {
    flagged: Boolean(result.flagged),
    suggestedAction: result.flagged ? "review" : "allow",
    topCategory: top.category,
    topScore: top.score,
    categories: result.categories || {},
    categoryScores: scores,
    categoryAppliedInputTypes:
      result.category_applied_input_types || {},
    rawResponse: {
      id: data?.id || null,
      model: data?.model || "omni-moderation-latest",
      result,
    },
  };
}
