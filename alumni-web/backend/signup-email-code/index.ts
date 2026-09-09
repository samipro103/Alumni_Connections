import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(body: unknown, status = 200) {
  return Response.json(body, { status, headers: cors });
}

function serviceKey() {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;

  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    return keys.default || null;
  } catch {
    return null;
  }
}

function adminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = serviceKey();

  if (!url || !key) {
    throw new Error("Supabase admin credentials unavailable.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function codeHash(challengeId: string, code: string) {
  const secret = serviceKey();
  if (!secret) throw new Error("Hash secret unavailable.");

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${challengeId}:${code}`)
  );

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function code6() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return String(values[0] % 1000000).padStart(6, "0");
}

function maskEmail(email: string) {
  const [local, domain] = String(email || "").split("@");
  if (!local || !domain) return "tu correo";

  const shown = local.length <= 2 ? local[0] || "" : local.slice(0, 2);
  return `${shown}${"•".repeat(
    Math.max(3, Math.min(6, local.length - shown.length))
  )}@${domain}`;
}

function signupEmailHtml(code: string) {
  const left = code.slice(0, 3);
  const right = code.slice(3);

  return `<!doctype html>
<html>
<body style="margin:0;background:#090b0f;font-family:Inter,Arial,sans-serif;color:#f7f8fb">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#090b0f;padding:34px 14px">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#0f1218;border:1px solid #202530;border-radius:28px;overflow:hidden">
<tr><td style="padding:34px 34px 8px"><div style="font-size:23px;font-weight:900;letter-spacing:-.8px;color:#ffffff">Alumni.</div></td></tr>
<tr><td style="padding:22px 34px 0">
<div style="font-size:11px;font-weight:800;letter-spacing:1.7px;text-transform:uppercase;color:#8d98ff">Confirma tu correo</div>
<h1 style="margin:10px 0 0;font-size:30px;line-height:1.12;letter-spacing:-1px;color:#ffffff">Termina de crear tu cuenta.</h1>
<p style="margin:12px 0 0;font-size:14px;line-height:1.7;color:#8d94a3">Escribe este código de 6 dígitos en Alumni para confirmar que este correo te pertenece.</p>
</td></tr>
<tr><td style="padding:30px 34px 26px">
<div style="background:#0a0d12;border:1px solid #292f3a;border-radius:22px;padding:30px 18px;text-align:center">
<div style="font-size:48px;line-height:1;font-weight:900;letter-spacing:11px;color:#ffffff">${left}&nbsp;${right}</div>
<div style="margin-top:15px;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#6f7786">Expira en 10 minutos</div>
</div>
</td></tr>
<tr><td style="padding:0 34px 34px">
<p style="margin:0;font-size:12px;line-height:1.7;color:#697181">Si no intentaste crear una cuenta en Alumni, puedes ignorar este correo. Nunca compartas este código con otra persona.</p>
<div style="height:1px;background:#202530;margin:26px 0 20px"></div>
<p style="margin:0;font-size:11px;color:#4f5662">Alumni. · Verificación de correo</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

async function sendEmail(email: string, code: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("ALUMNI_EMAIL_FROM");

  if (!apiKey || !from) {
    throw new Error("EMAIL_PROVIDER_NOT_CONFIGURED");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Confirma tu correo en Alumni",
      html: signupEmailHtml(code),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `EMAIL_SEND_FAILED:${response.status}:${detail.slice(0, 180)}`
    );
  }
}

async function findUserByEmail(admin: any, email: string) {
  const wanted = email.trim().toLowerCase();

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) throw error;

    const users = data?.users || [];
    const found = users.find(
      (user: any) => String(user.email || "").toLowerCase() === wanted
    );

    if (found) return found;
    if (users.length < 1000) break;
  }

  return null;
}

async function usernameAvailable(
  admin: any,
  username: string,
  ignoreUserId?: string
) {
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (error) throw error;
  if (!data) return true;
  return Boolean(ignoreUserId && data.id === ignoreUserId);
}

async function begin(username: string, email: string, password: string) {
  const cleanUsername = username.trim().replace(/\s+/g, "");
  const cleanEmail = email.trim().toLowerCase();

  if (!/^[a-zA-Z0-9._-]{3,30}$/.test(cleanUsername)) {
    return respond(
      {
        ok: false,
        error:
          "El usuario debe tener entre 3 y 30 caracteres y usar solo letras, números, punto, guion o guion bajo.",
      },
      400
    );
  }

  if (!cleanEmail || !cleanEmail.includes("@")) {
    return respond({ ok: false, error: "Ingresa un correo válido." }, 400);
  }

  if (
    password.length < 10 ||
    !/[A-Za-z]/.test(password) ||
    !/\d/.test(password)
  ) {
    return respond(
      {
        ok: false,
        error:
          "La contraseña debe tener al menos 10 caracteres y combinar letras y números.",
      },
      400
    );
  }

  const admin = adminClient();
  let user = await findUserByEmail(admin, cleanEmail);
  let createdNow = false;

  if (user?.email_confirmed_at) {
    return respond(
      {
        ok: false,
        code: "ACCOUNT_EXISTS",
        error: "Ya existe una cuenta con este correo.",
      },
      409
    );
  }

  const available = await usernameAvailable(admin, cleanUsername, user?.id);
  if (!available) {
    return respond(
      {
        ok: false,
        code: "USERNAME_TAKEN",
        error: "Ese nombre de usuario ya está en uso.",
      },
      409
    );
  }

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: false,
      user_metadata: {
        username: cleanUsername,
      },
    });

    if (error || !data.user) {
      console.error("signup-email-code createUser:", error);
      return respond(
        { ok: false, error: "No pudimos preparar tu cuenta." },
        500
      );
    }

    user = data.user;
    createdNow = true;
  } else {
    const { error: updateUserError } = await admin.auth.admin.updateUserById(
      user.id,
      {
        password,
        user_metadata: {
          ...(user.user_metadata || {}),
          username: cleanUsername,
        },
      }
    );

    if (updateUserError) {
      console.error("signup-email-code updateUser:", updateUserError);
      return respond(
        { ok: false, error: "No pudimos actualizar el registro pendiente." },
        500
      );
    }

    const { error: profileError } = await admin
      .from("profiles")
      .update({ username: cleanUsername })
      .eq("id", user.id);

    if (profileError) {
      console.error("signup-email-code profile update:", profileError);
      return respond(
        { ok: false, error: "No pudimos actualizar el nombre de usuario." },
        500
      );
    }
  }

  const { data: latestChallenge } = await admin
    .from("email_2fa_challenges")
    .select("id,last_sent_at")
    .eq("user_id", user.id)
    .eq("client_fingerprint", "signup")
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestChallenge?.last_sent_at) {
    const elapsed = Date.now() - new Date(latestChallenge.last_sent_at).getTime();
    if (elapsed < 60_000) {
      return respond(
        {
          ok: false,
          error: "Espera un minuto antes de solicitar otro código.",
        },
        429
      );
    }
  }

  await admin
    .from("email_2fa_challenges")
    .delete()
    .eq("user_id", user.id)
    .eq("client_fingerprint", "signup")
    .is("consumed_at", null);

  const challengeId = crypto.randomUUID();
  const code = code6();

  const { error: insertError } = await admin
    .from("email_2fa_challenges")
    .insert({
      id: challengeId,
      user_id: user.id,
      session_id: challengeId,
      code_hash: await codeHash(challengeId, code),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      masked_email: maskEmail(cleanEmail),
      client_fingerprint: "signup",
    });

  if (insertError) {
    console.error("signup-email-code challenge insert:", insertError);

    if (createdNow) {
      await admin.auth.admin.deleteUser(user.id).catch(() => undefined);
    }

    return respond(
      { ok: false, error: "No pudimos preparar el código de verificación." },
      500
    );
  }

  try {
    await sendEmail(cleanEmail, code);
  } catch (sendError) {
    await admin
      .from("email_2fa_challenges")
      .delete()
      .eq("id", challengeId);

    if (createdNow) {
      await admin.auth.admin.deleteUser(user.id).catch(() => undefined);
    }

    const message =
      sendError instanceof Error ? sendError.message : String(sendError);

    if (message === "EMAIL_PROVIDER_NOT_CONFIGURED") {
      return respond(
        {
          ok: false,
          code: "EMAIL_PROVIDER_NOT_CONFIGURED",
          error: "El correo de verificación todavía no está configurado.",
        },
        503
      );
    }

    console.error("signup-email-code send:", sendError);
    return respond(
      { ok: false, error: "No pudimos enviar el código. Intenta nuevamente." },
      502
    );
  }

  return respond({
    ok: true,
    challenge_id: challengeId,
    masked_email: maskEmail(cleanEmail),
    expires_in: 600,
  });
}

async function verify(challengeId: string, code: string) {
  if (!challengeId || !/^\d{6}$/.test(code || "")) {
    return respond({ ok: false, error: "Ingresa el código de 6 dígitos." }, 400);
  }

  const admin = adminClient();
  const { data: challenge, error } = await admin
    .from("email_2fa_challenges")
    .select("*")
    .eq("id", challengeId)
    .eq("client_fingerprint", "signup")
    .maybeSingle();

  if (error || !challenge) {
    return respond({ ok: false, error: "El código ya no es válido." }, 400);
  }

  if (challenge.consumed_at) {
    return respond({ ok: false, error: "Este código ya fue utilizado." }, 400);
  }

  if (new Date(challenge.expires_at).getTime() <= Date.now()) {
    return respond(
      { ok: false, error: "El código expiró. Solicita uno nuevo." },
      400
    );
  }

  if (Number(challenge.attempts || 0) >= 5) {
    return respond(
      { ok: false, error: "Demasiados intentos. Solicita un código nuevo." },
      429
    );
  }

  const expected = await codeHash(challengeId, code);

  if (expected !== challenge.code_hash) {
    await admin
      .from("email_2fa_challenges")
      .update({ attempts: Number(challenge.attempts || 0) + 1 })
      .eq("id", challengeId);

    return respond({ ok: false, error: "Código incorrecto." }, 401);
  }

  const { error: confirmError } = await admin.auth.admin.updateUserById(
    challenge.user_id,
    { email_confirm: true }
  );

  if (confirmError) {
    console.error("signup-email-code confirm:", confirmError);
    return respond(
      { ok: false, error: "No pudimos confirmar tu correo." },
      500
    );
  }

  const now = new Date().toISOString();

  await admin
    .from("email_2fa_challenges")
    .update({ consumed_at: now })
    .eq("id", challengeId);

  await admin
    .from("account_security")
    .update({ mfa_required: false, updated_at: now })
    .eq("user_id", challenge.user_id);

  return respond({ ok: true });
}

async function resend(challengeId: string) {
  if (!challengeId) {
    return respond({ ok: false, error: "Solicitud inválida." }, 400);
  }

  const admin = adminClient();
  const { data: challenge } = await admin
    .from("email_2fa_challenges")
    .select("*")
    .eq("id", challengeId)
    .eq("client_fingerprint", "signup")
    .maybeSingle();

  if (!challenge || challenge.consumed_at) {
    return respond({ ok: false, error: "La solicitud ya no es válida." }, 400);
  }

  const elapsed = Date.now() - new Date(challenge.last_sent_at).getTime();
  if (elapsed < 60_000) {
    return respond(
      { ok: false, error: "Espera un minuto antes de reenviar." },
      429
    );
  }

  if (Number(challenge.resend_count || 0) >= 3) {
    return respond(
      {
        ok: false,
        error: "Alcanzaste el límite de reenvíos. Vuelve a iniciar el registro.",
      },
      429
    );
  }

  const { data: userResult, error: userError } =
    await admin.auth.admin.getUserById(challenge.user_id);

  const targetEmail = userResult?.user?.email;

  if (userError || !targetEmail) {
    return respond(
      { ok: false, error: "No encontramos el correo del registro." },
      400
    );
  }

  const code = code6();

  try {
    await sendEmail(targetEmail, code);
  } catch (sendError) {
    const message =
      sendError instanceof Error ? sendError.message : String(sendError);

    if (message === "EMAIL_PROVIDER_NOT_CONFIGURED") {
      return respond(
        {
          ok: false,
          code: "EMAIL_PROVIDER_NOT_CONFIGURED",
          error: "El correo de verificación todavía no está configurado.",
        },
        503
      );
    }

    return respond({ ok: false, error: "No pudimos reenviar el código." }, 502);
  }

  await admin
    .from("email_2fa_challenges")
    .update({
      code_hash: await codeHash(challengeId, code),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      attempts: 0,
      resend_count: Number(challenge.resend_count || 0) + 1,
      last_sent_at: new Date().toISOString(),
    })
    .eq("id", challengeId);

  return respond({
    ok: true,
    expires_in: 600,
    masked_email: maskEmail(targetEmail),
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  if (request.method !== "POST") {
    return respond({ ok: false, error: "POST required." }, 405);
  }

  try {
    const payload = await request.json();
    const action = String(payload?.action || "");

    if (action === "begin") {
      return await begin(
        String(payload.username || ""),
        String(payload.email || ""),
        String(payload.password || "")
      );
    }

    if (action === "verify") {
      return await verify(
        String(payload.challenge_id || ""),
        String(payload.code || "").replace(/\D/g, "").slice(0, 6)
      );
    }

    if (action === "resend") {
      return await resend(String(payload.challenge_id || ""));
    }

    return respond({ ok: false, error: "Acción no válida." }, 400);
  } catch (error) {
    console.error("signup-email-code error:", error);
    return respond(
      { ok: false, error: "No pudimos completar el registro." },
      500
    );
  }
});
