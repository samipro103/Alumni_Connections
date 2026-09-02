import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

function loadEnvFile(fileName: string) {
  const filePath = resolve(process.cwd(), fileName);

  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) continue;

    const equals = line.indexOf("=");
    if (equals <= 0) continue;

    const key = line.slice(0, equals).trim();
    let value = line.slice(equals + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const supabaseUrl =
  process.env.QA_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const anonKey =
  process.env.QA_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY " +
      "o QA_SUPABASE_URL/QA_SUPABASE_ANON_KEY."
  );
}

const anon = createClient(supabaseUrl, anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

const protectedTables = [
  "admin_permissions",
  "app_error_events",
  "feedback_reports",
  "follow_requests",
  "messages",
  "message_groups",
  "message_group_members",
  "group_messages",
  "user_blocks",
] as const;

async function expectNoAnonymousRows(table: string) {
  const { data, error } = await anon
    .from(table)
    .select("*")
    .limit(1);

  if (error) {
    const code = String(error.code || "");
    const message = String(error.message || "").toLowerCase();

    expect(
      code === "42501" ||
        message.includes("permission denied") ||
        message.includes("not allowed")
    ).toBe(true);

    return;
  }

  expect(data ?? []).toHaveLength(0);
}

describe("Supabase anonymous security regression", () => {
  it("permite consultar la superficie pública de perfiles", async () => {
    const { error } = await anon
      .from("profiles")
      .select("id")
      .limit(1);

    expect(error).toBeNull();
  });

  it("permite consultar la superficie pública de publicaciones", async () => {
    const { error } = await anon
      .from("posts")
      .select("id")
      .limit(1);

    expect(error).toBeNull();
  });

  it.each(protectedTables)(
    "no expone filas privadas de %s a anon",
    async (table) => {
      await expectNoAnonymousRows(table);
    }
  );

  it("rechaza el RPC administrativo get_my_admin_access para anon", async () => {
    const { error } = await anon.rpc("get_my_admin_access");

    expect(error).not.toBeNull();

    const code = String(error?.code || "");
    const message = String(error?.message || "").toLowerCase();

    expect(
      code === "42501" ||
        message.includes("permission denied") ||
        message.includes("not allowed")
    ).toBe(true);
  });
});
