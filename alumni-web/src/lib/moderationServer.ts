import { createClient } from "@supabase/supabase-js";

function clean(raw: string | undefined, name: string) {
  let value = (raw || "").trim();
  const prefix = `${name}=`;
  if (value.startsWith(prefix)) value = value.slice(prefix.length).trim();
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    value = value.slice(1, -1).trim();
  }
  return value;
}

function config() {
  const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
  const anon = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const adminKey =
    clean(process.env.SUPABASE_SECRET_KEY, "SUPABASE_SECRET_KEY") ||
    clean(process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !anon) throw new Error("Supabase no está configurado.");
  if (!adminKey) throw new Error("SUPABASE_SECRET_KEY no está disponible en servidor.");
  return { url, anon, adminKey };
}

export function moderationAdminClient() {
  const { url, adminKey } = config();
  return createClient(url, adminKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function verifyModerationUser(authorization: string | null) {
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1] || "";
  if (!token) return null;

  const { url, anon } = config();
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
  return user?.id ? { id: String(user.id) } : null;
}

type Key =
  | "threat"
  | "violence"
  | "harassment"
  | "self_harm"
  | "sexual"
  | "hate"
  | "spam"
  | "scam"
  | "illicit"
  | "suspicious_link";

type Rule = { pattern: RegExp; weight: number; label: string };

type ImageSignal = {
  source?: string;
  status?: "completed" | "error" | "not_run";
  risk_score?: number;
  flagged?: boolean;
  classes?: Record<string, number>;
  error?: string | null;
};

const RULES: Record<Exclude<Key, "suspicious_link">, Rule[]> = {
  threat: [
    { pattern: /\bte\s+voy\s+a\s+(matar|golpear|quebrar|apu[nñ]alar|disparar|lastimar|hacer\s+da[nñ]o)\b/gi, weight: 0.96, label: "amenaza directa" },
    { pattern: /\b(matarte|golpearte|quebrarte|apu[nñ]alarte|dispararte|lastimarte)\b/gi, weight: 0.94, label: "amenaza directa" },
    { pattern: /\bte\s+(mato|golpeo|quiebro|apu[nñ]alo|disparo)\b/gi, weight: 0.93, label: "amenaza directa" },
    { pattern: /\b(vas\s+a\s+pagar|te\s+espero\s+afuera|ya\s+vas\s+a\s+ver)\b/gi, weight: 0.62, label: "intimidación" },
  ],
  violence: [
    { pattern: /\b(agarrar(lo|la)?\s+a\s+golpes|dar(le)?\s+una\s+golpiza|romper(le)?\s+la\s+cara)\b/gi, weight: 0.90, label: "violencia física" },
    { pattern: /\b(lo|la)\s+voy\s+a\s+(matar|golpear|apu[nñ]alar|disparar)\b/gi, weight: 0.93, label: "violencia dirigida" },
    { pattern: /\b(matar|apu[nñ]alar|disparar|golpear)\s+(a|al)\s+\w+/gi, weight: 0.78, label: "violencia" },
  ],
  harassment: [
    { pattern: /\b(sos|eres)\s+(un|una)?\s*(in[uú]til|basura|idiota|imb[eé]cil|est[uú]pido|est[uú]pida)\b/gi, weight: 0.68, label: "insulto dirigido" },
    { pattern: /\b(nadie\s+te\s+(quiere|soporta)|das\s+asco|deber[ií]as\s+desaparecer)\b/gi, weight: 0.76, label: "acoso dirigido" },
  ],
  self_harm: [
    { pattern: /\b(me\s+quiero|quiero)\s+(matar|morir|suicidar)\b/gi, weight: 0.98, label: "autolesión" },
    { pattern: /\b(me\s+voy\s+a\s+suicidar|voy\s+a\s+quitarme\s+la\s+vida)\b/gi, weight: 0.99, label: "autolesión" },
    { pattern: /\b(quiero|pienso\s+en)\s+hacerme\s+da[nñ]o\b/gi, weight: 0.92, label: "autolesión" },
  ],
  sexual: [
    { pattern: /\b(pornograf[ií]a|porno|porn|hentai)\b/gi, weight: 0.74, label: "sexual explícito" },
    { pattern: /\b(sexo\s+expl[ií]cito|contenido\s+sexual\s+expl[ií]cito)\b/gi, weight: 0.83, label: "sexual explícito" },
    { pattern: /\b(nudes?|desnudos?|desnudas?|pack\s+de\s+fotos?)\b/gi, weight: 0.67, label: "desnudez / sexual" },
  ],
  hate: [
    { pattern: /\b(odio|detesto)\s+a\s+(los|las|todos|todas)\s+(gays?|lesbianas?|musulmanes?|jud[ií]os?|cristianos?|negros?|blancos?|migrantes?|extranjeros?)\b/gi, weight: 0.84, label: "odio a grupo" },
    { pattern: /\b(no\s+deber[ií]an\s+existir|hay\s+que\s+expulsar)\s+(los|las)\s+(gays?|lesbianas?|musulmanes?|jud[ií]os?|migrantes?|extranjeros?)\b/gi, weight: 0.88, label: "odio a grupo" },
  ],
  spam: [
    { pattern: /\b(escr[ií]beme|escribime|cont[aá]ctame)\s+(al|por)\s+whats(app)?\b/gi, weight: 0.42, label: "promoción por WhatsApp" },
    { pattern: /\b(100%\s+garantizado|dinero\s+r[aá]pido|gana\s+dinero\s+f[aá]cil)\b/gi, weight: 0.64, label: "spam promocional" },
    { pattern: /(.)\1{8,}/g, weight: 0.32, label: "repetición excesiva" },
  ],
  scam: [
    { pattern: /\b(duplica|triplica)\s+tu\s+dinero\b/gi, weight: 0.82, label: "promesa financiera sospechosa" },
    { pattern: /\b(inversi[oó]n|ganancia|retorno)\s+(garantizada|garantizado)\b/gi, weight: 0.84, label: "estafa potencial" },
    { pattern: /\b(deposita|transfiere|env[ií]a)\s+\$?\d+\s+y\s+(recibe|obt[eé]n|gana)\b/gi, weight: 0.88, label: "estafa potencial" },
  ],
  illicit: [
    { pattern: /\b(vendo|venta\s+de|compro)\s+(armas?|municiones?|drogas?|coca[ií]na|metanfetamina)\b/gi, weight: 0.88, label: "actividad ilícita" },
    { pattern: /\b(documentos?\s+falsos?|tarjetas?\s+clonadas?|cuentas?\s+robadas?)\b/gi, weight: 0.86, label: "actividad ilícita" },
  ],
};

const SHORTENERS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "cutt.ly",
  "is.gd",
  "rb.gy",
  "rebrand.ly",
  "shorturl.at",
]);

function matchRules(text: string, rules: Rule[]) {
  let score = 0;
  const matches: string[] = [];

  for (const rule of rules) {
    rule.pattern.lastIndex = 0;
    let hit = false;
    let match: RegExpExecArray | null;

    while ((match = rule.pattern.exec(text)) !== null) {
      hit = true;
      if (match.index === rule.pattern.lastIndex) rule.pattern.lastIndex += 1;
      break;
    }

    if (hit) {
      score = Math.max(score, rule.weight);
      if (!matches.includes(rule.label)) matches.push(rule.label);
    }
  }

  if (matches.length > 1) score = Math.min(1, score + 0.05);
  return { score: Number(score.toFixed(4)), matches };
}

function linkRisk(text: string) {
  const urls = text.match(/https?:\/\/[^\s<>"']+/gi) || [];
  if (!urls.length) return { score: 0, matches: [] as string[] };

  let score = urls.length >= 3 ? 0.48 : 0.18;
  const matches: string[] = [];

  for (const raw of urls.slice(0, 8)) {
    try {
      const host = new URL(raw).hostname.toLowerCase();
      if (SHORTENERS.has(host)) {
        score = Math.max(score, 0.58);
        if (!matches.includes("URL acortada")) matches.push("URL acortada");
      }
      if (host.startsWith("xn--")) {
        score = Math.max(score, 0.72);
        if (!matches.includes("dominio punycode")) matches.push("dominio punycode");
      }
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
        score = Math.max(score, 0.70);
        if (!matches.includes("enlace por IP")) matches.push("enlace por IP");
      }
    } catch {
      score = Math.max(score, 0.40);
    }
  }

  return { score: Number(score.toFixed(4)), matches };
}

export function moderateTextLocally(raw: string | null | undefined) {
  const text = (raw || "")
    .normalize("NFKC")
    .replace(/\u200B|\u200C|\u200D|\uFEFF/g, "")
    .trim();

  const results: Record<Key, { score: number; matches: string[] }> = {
    threat: matchRules(text, RULES.threat),
    violence: matchRules(text, RULES.violence),
    harassment: matchRules(text, RULES.harassment),
    self_harm: matchRules(text, RULES.self_harm),
    sexual: matchRules(text, RULES.sexual),
    hate: matchRules(text, RULES.hate),
    spam: matchRules(text, RULES.spam),
    scam: matchRules(text, RULES.scam),
    illicit: matchRules(text, RULES.illicit),
    suspicious_link: linkRisk(text),
  };

  const phones = text.match(/(?:\+?\d[\s().-]?){8,15}/g) || [];
  if (phones.length >= 2 && results.spam.score < 0.55) {
    results.spam = { score: 0.55, matches: [...results.spam.matches, "contacto telefónico repetido"] };
  }

  const categoryScores = Object.fromEntries(
    Object.entries(results).map(([key, value]) => [key, value.score])
  ) as Record<Key, number>;

  const categories = Object.fromEntries(
    Object.entries(categoryScores).map(([key, value]) => [key, value >= 0.55])
  );

  const top = Object.entries(categoryScores)
    .map(([category, score]) => ({ category, score }))
    .sort((a, b) => b.score - a.score)[0] || { category: "safe", score: 0 };

  const severe =
    categoryScores.threat >= 0.80 ||
    categoryScores.self_harm >= 0.80 ||
    categoryScores.hate >= 0.82 ||
    categoryScores.illicit >= 0.84;

  const flagged = severe || top.score >= 0.72;
  const review = flagged || top.score >= 0.55;

  return {
    engine: "alumni-shield-text",
    version: "1.0.0",
    flagged,
    review,
    topCategory: top.score > 0 ? top.category : "safe",
    topScore: Number(top.score.toFixed(4)),
    categories,
    categoryScores,
    matches: Object.fromEntries(
      Object.entries(results).map(([key, value]) => [key, value.matches])
    ),
  };
}

export function combineModerationSignals(
  textResult: ReturnType<typeof moderateTextLocally>,
  imageSignal?: ImageSignal | null
) {
  const imageStatus = imageSignal?.status || "not_run";
  const imageRisk = imageStatus === "completed"
    ? Math.max(0, Math.min(1, Number(imageSignal?.risk_score || 0)))
    : 0;
  const imageFlagged = imageStatus === "completed" && Boolean(imageSignal?.flagged);

  const topScore = Math.max(textResult.topScore, imageRisk);
  const topCategory = imageRisk > textResult.topScore
    ? "sexual_image"
    : textResult.topCategory;

  const flagged = textResult.flagged || imageFlagged;
  const review = flagged || textResult.review || (imageStatus === "completed" && imageRisk >= 0.48);

  return {
    flagged,
    suggestedAction: review ? "review" : "allow",
    topCategory,
    topScore: Number(topScore.toFixed(4)),
    imageStatus,
    imageRisk: Number(imageRisk.toFixed(4)),
    imageFlagged,
  };
}

export type AlumniImageSignal = ImageSignal;
