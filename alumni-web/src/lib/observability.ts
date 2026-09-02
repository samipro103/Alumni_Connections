import { supabase } from "@/lib/supabase";

export type AlumniErrorKind =
  | "react_boundary" | "global_boundary" | "unhandled_error"
  | "unhandled_rejection" | "server_error" | "api_error"
  | "supabase_error" | "manual";

type ReportInput = {
  kind: AlumniErrorKind;
  error?: unknown;
  message?: string;
  severity?: "warning" | "error" | "fatal";
  source?: string;
  digest?: string | null;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "3.7.6";
const recent = new Map<string, number>();

function anonId() {
  if (typeof window === "undefined") return null;
  try {
    const key = "alumni_observability_id";
    let value = localStorage.getItem(key);
    if (!value) {
      value = crypto.randomUUID();
      localStorage.setItem(key, value);
    }
    return value.slice(0, 64);
  } catch { return null; }
}

function device() {
  const ua = navigator.userAgent || "";
  const platform = /iPhone|iPad|iPod/i.test(ua) ? "iOS"
    : /Android/i.test(ua) ? "Android"
    : /Windows/i.test(ua) ? "Windows"
    : /Macintosh|Mac OS X/i.test(ua) ? "macOS"
    : /Linux/i.test(ua) ? "Linux" : "Other";
  const browser = /Edg\//i.test(ua) ? "Edge"
    : /CriOS|Chrome\//i.test(ua) ? "Chrome"
    : /FxiOS|Firefox\//i.test(ua) ? "Firefox"
    : /Safari\//i.test(ua) ? "Safari" : "Other";
  const device_type = /iPad|Tablet/i.test(ua) ? "tablet"
    : /Mobi|Android|iPhone|iPod/i.test(ua) ? "mobile" : "desktop";
  return { platform, browser, device_type };
}

function normalize(input: ReportInput) {
  let message = input.message || "";
  let stack: string | null = null;
  if (input.error instanceof Error) {
    message ||= input.error.message || input.error.name;
    stack = input.error.stack || null;
  } else if (!message && typeof input.error === "string") {
    message = input.error;
  } else if (!message && input.error != null) {
    try { message = JSON.stringify(input.error); }
    catch { message = String(input.error); }
  }
  return {
    message: (message || "Unknown application error").slice(0, 2000),
    stack: stack?.slice(0, 12000) || null,
  };
}

export async function reportAppError(input: ReportInput) {
  if (typeof window === "undefined" || !URL || !KEY) return;

  const value = normalize(input);
  const route = location.pathname || "/";
  const dedupe = `${input.kind}|${route}|${value.message}|${input.source || ""}`;
  const now = Date.now();
  if (now - (recent.get(dedupe) || 0) < 5000) return;
  recent.set(dedupe, now);

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: KEY,
    };
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

    await fetch(`${URL}/functions/v1/capture-app-error`, {
      method: "POST",
      headers,
      keepalive: true,
      cache: "no-store",
      body: JSON.stringify({
        kind: input.kind,
        severity: input.severity || "error",
        message: value.message,
        stack: value.stack,
        route,
        source: input.source || null,
        digest: input.digest || null,
        anonymous_id: anonId(),
        app_version: VERSION,
        environment: process.env.NODE_ENV || "production",
        ...device(),
        metadata: {
          online: navigator.onLine,
          visibility: document.visibilityState,
          ...(input.metadata || {}),
        },
      }),
    });
  } catch {
    // El sistema de observabilidad nunca debe romper ALUMNI.
  }
}

/* ALUMNI_3_7_6_OBSERVABILITY */
