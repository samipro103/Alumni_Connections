import { createClient } from "npm:@supabase/supabase-js@2";
import { JWT } from "npm:google-auth-library@10";
// @ts-ignore CommonJS package loaded through Deno npm compatibility.
import webpush from "npm:web-push@3.6.7";

type Payload = {
  table?: string;
  action?: string;
  delay_ms?: number;
  record?: Record<string, any> | null;
};

type Pref =
  | "messages"
  | "story_replies"
  | "likes"
  | "comments"
  | "follows"
  | "events";

type Copy = {
  recipientId: string;
  preference: Pref;
  title: string;
  body: string;
  url: string;
  type: string;
  targetId: string;
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(body: unknown, status = 200) {
  return Response.json(body, { status, headers: cors });
}

function serviceKey() {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;

  try {
    const keys = JSON.parse(
      Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"
    );
    return keys.default || null;
  } catch {
    return null;
  }
}

function adminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = serviceKey();

  if (!url || !key) {
    throw new Error("Supabase admin credentials are unavailable.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function username(
  admin: ReturnType<typeof createClient>,
  id: string | null
) {
  if (!id) return null;

  const { data } = await admin
    .from("profiles")
    .select("username")
    .eq("id", id)
    .maybeSingle();

  return data?.username ? String(data.username) : null;
}

function notificationUrl(
  row: Record<string, any>,
  actorUsername: string | null
) {
  const type = String(row.type || "");
  const targetType = String(row.target_type || "");
  const targetId = String(
    row.target_id || row.post_id || row.id || ""
  );

  if (type === "follow" && actorUsername) {
    return `/u/${encodeURIComponent(actorUsername)}`;
  }

  if (type === "story_reply" && actorUsername) {
    return `/messages/${encodeURIComponent(actorUsername)}`;
  }

  if (targetType === "story") {
    return `/feed?story=${encodeURIComponent(targetId)}`;
  }

  if (targetType === "post" || row.post_id) {
    return `/feed?post=${encodeURIComponent(
      String(row.post_id || targetId)
    )}`;
  }

  return "/notifications";
}

function notificationCopy(
  row: Record<string, any>,
  actorUsername: string | null
): Copy {
  const type = String(row.type || "");
  const targetType = String(row.target_type || "");
  const actor = actorUsername ? `@${actorUsername}` : "Alguien";

  let body = "Tienes una nueva notificación.";
  let preference: Pref = "likes";

  if (type === "follow") {
    body = `${actor} comenzó a seguirte.`;
    preference = "follows";
  } else if (type === "comment") {
    body = `${actor} comentó tu publicación.`;
    preference = "comments";
  } else if (type === "story_reply") {
    body = `${actor} respondió a tu historia.`;
    preference = "story_replies";
  } else if (type === "like" && targetType === "story") {
    body = `${actor} le dio me gusta a tu historia.`;
  } else if (
    type === "like" &&
    (targetType === "comment" || targetType === "post_comment")
  ) {
    body = `${actor} le dio me gusta a tu comentario.`;
  } else if (type === "like") {
    body = `${actor} le dio me gusta a tu publicación.`;
  } else if (type === "event") {
    body = "Tienes una actualización de evento.";
    preference = "events";
  }

  return {
    recipientId: String(row.user_id),
    preference,
    title: "AlumniConnections",
    body,
    url: notificationUrl(row, actorUsername),
    type: type || "notification",
    targetId: String(
      row.target_id || row.post_id || row.id || ""
    ),
  };
}

function messageCopy(
  row: Record<string, any>,
  senderUsername: string | null
): Copy | null {
  const senderId = String(row.sender_id || "");
  const recipientId = String(row.receiver_id || "");

  if (!senderId || !recipientId || senderId === recipientId) {
    return null;
  }

  // story_reply también crea una fila en notifications.
  if (String(row.message_type || "") === "story_reply") {
    return null;
  }

  const actor = senderUsername ? `@${senderUsername}` : "Alguien";
  const content = String(row.content || "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    recipientId,
    preference: "messages",
    title: actor,
    body:
      content.length > 90
        ? `${content.slice(0, 87)}...`
        : content || "Te envió un mensaje.",
    url: senderUsername
      ? `/messages/${encodeURIComponent(senderUsername)}`
      : "/messages",
    type: "message",
    targetId: String(row.id || ""),
  };
}

async function makeCopy(
  admin: ReturnType<typeof createClient>,
  payload: Payload
) {
  const row = payload.record;
  if (!row) return null;

  if (payload.table === "notifications") {
    const actor = await username(
      admin,
      row.actor_id ? String(row.actor_id) : null
    );
    return notificationCopy(row, actor);
  }

  if (payload.table === "messages") {
    const sender = await username(
      admin,
      row.sender_id ? String(row.sender_id) : null
    );
    return messageCopy(row, sender);
  }

  return null;
}

async function allowed(
  admin: ReturnType<typeof createClient>,
  copy: Copy
) {
  const { data } = await admin
    .from("notification_preferences")
    .select("*")
    .eq("user_id", copy.recipientId)
    .maybeSingle();

  if (data?.push_enabled === false) return false;
  if (data && data[copy.preference] === false) return false;
  return true;
}

async function firebaseToken() {
  const raw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured.");
  }

  const account = JSON.parse(raw);
  const client = new JWT({
    email: account.client_email,
    key: account.private_key,
    scopes: [
      "https://www.googleapis.com/auth/firebase.messaging",
    ],
  });

  const result = await client.getAccessToken();
  const token =
    typeof result === "string" ? result : result?.token;

  if (!token) {
    throw new Error("Could not obtain Firebase access token.");
  }

  return {
    token,
    projectId: String(account.project_id),
  };
}

async function sendAndroid(
  admin: ReturnType<typeof createClient>,
  copy: Copy
) {
  const { data: devices, error } = await admin
    .from("user_devices")
    .select("id, push_token")
    .eq("user_id", copy.recipientId)
    .eq("active", true)
    .eq("platform", "android")
    .eq("push_provider", "fcm")
    .not("push_token", "is", null);

  if (error) return { sent: 0, disabled: 0, errors: [error.message] };
  if (!devices?.length) return { sent: 0, disabled: 0, errors: [] };

  let firebase;
  try {
    firebase = await firebaseToken();
  } catch (error) {
    return {
      sent: 0,
      disabled: 0,
      errors: [
        error instanceof Error ? error.message : String(error),
      ],
    };
  }

  let sent = 0;
  let disabled = 0;
  const errors: string[] = [];

  for (const device of devices) {
    const pushToken = String(device.push_token || "");
    if (!pushToken) continue;

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(
        firebase.projectId
      )}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${firebase.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token: pushToken,
            notification: {
              title: copy.title,
              body: copy.body,
            },
            data: {
              url: copy.url,
              type: copy.type,
              target_id: copy.targetId,
            },
            android: {
              priority: "high",
              notification: {
                channel_id: "alumni_activity",
                sound: "default",
                icon: "ic_stat_alumni",
                default_vibrate_timings: true,
              },
            },
          },
        }),
      }
    );

    if (response.ok) {
      sent += 1;
      continue;
    }

    const detail = await response.text();
    errors.push(`${response.status}: ${detail.slice(0, 240)}`);

    if (
      response.status === 404 ||
      detail.includes("UNREGISTERED")
    ) {
      await admin
        .from("user_devices")
        .update({
          active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", device.id);
      disabled += 1;
    }
  }

  return { sent, disabled, errors };
}

function vapid() {
  const publicKey = Deno.env.get("WEB_PUSH_VAPID_PUBLIC_KEY");
  const privateKey = Deno.env.get("WEB_PUSH_VAPID_PRIVATE_KEY");

  if (!publicKey || !privateKey) {
    throw new Error(
      "WEB_PUSH_VAPID_PUBLIC_KEY / WEB_PUSH_VAPID_PRIVATE_KEY are not configured."
    );
  }

  return { publicKey, privateKey };
}

async function sendWeb(
  admin: ReturnType<typeof createClient>,
  copy: Copy
) {
  const { data: subscriptions, error } = await admin
    .from("web_push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", copy.recipientId)
    .eq("active", true);

  if (error) return { sent: 0, disabled: 0, errors: [error.message] };
  if (!subscriptions?.length) {
    return { sent: 0, disabled: 0, errors: [] };
  }

  let keys;
  try {
    keys = vapid();
    webpush.setVapidDetails(
      "https://alumni-connections.vercel.app",
      keys.publicKey,
      keys.privateKey
    );
  } catch (error) {
    return {
      sent: 0,
      disabled: 0,
      errors: [
        error instanceof Error ? error.message : String(error),
      ],
    };
  }

  let sent = 0;
  let disabled = 0;
  const errors: string[] = [];

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: String(sub.endpoint),
          keys: {
            p256dh: String(sub.p256dh),
            auth: String(sub.auth),
          },
        },
        JSON.stringify({
          title: copy.title,
          body: copy.body,
          url: copy.url,
          type: copy.type,
          target_id: copy.targetId,
        }),
        {
          TTL: 300,
          urgency: "high",
        }
      );
      sent += 1;
    } catch (error: any) {
      const status = Number(
        error?.statusCode || error?.status || 0
      );
      const detail =
        error?.body || error?.message || String(error);

      errors.push(
        `${status || "ERR"}: ${String(detail).slice(0, 240)}`
      );

      if (status === 404 || status === 410) {
        await admin
          .from("web_push_subscriptions")
          .update({
            active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sub.id);
        disabled += 1;
      }
    }
  }

  return { sent, disabled, errors };
}

async function currentUser(
  request: Request,
  admin: ReturnType<typeof createClient>
) {
  const token = (
    request.headers.get("Authorization") || ""
  ).replace(/^Bearer\s+/i, "");

  if (!token) return null;

  const {
    data: { user },
    error,
  } = await admin.auth.getUser(token);

  return error ? null : user;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  if (request.method !== "POST") {
    return respond({ ok: false, error: "POST required." }, 405);
  }

  try {
    const payload = (await request.json()) as Payload;

    if (payload.action === "vapid_public_key") {
      return respond({
        ok: true,
        publicKey: vapid().publicKey,
      });
    }

    const admin = adminClient();

    if (payload.action === "test_web_push") {
      const user = await currentUser(request, admin);

      if (!user) {
        return respond(
          { ok: false, error: "Authentication required." },
          401
        );
      }

      const delay = Math.max(
        0,
        Math.min(Number(payload.delay_ms || 0), 8000)
      );

      if (delay) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      const web = await sendWeb(admin, {
        recipientId: user.id,
        preference: "messages",
        title: "AlumniConnections",
        body:
          "Las notificaciones ya están funcionando en tu iPhone 🎉",
        url: "/notifications",
        type: "push_test",
        targetId: `test-${Date.now()}`,
      });

      return respond({
        ok: web.errors.length === 0 && web.sent > 0,
        web,
      });
    }

    const copy = await makeCopy(admin, payload);

    if (!copy) {
      return respond({
        ok: true,
        skipped: true,
        reason: "Nothing to push.",
      });
    }

    if (!(await allowed(admin, copy))) {
      return respond({
        ok: true,
        skipped: true,
        reason: "Push preference disabled.",
      });
    }

    const [android, web] = await Promise.all([
      sendAndroid(admin, copy),
      sendWeb(admin, copy),
    ]);

    const errors = [
      ...android.errors.map((item) => `android: ${item}`),
      ...web.errors.map((item) => `web: ${item}`),
    ];

    return respond(
      {
        ok: errors.length === 0,
        android,
        web,
        errors,
      },
      errors.length ? 207 : 200
    );
  } catch (error) {
    console.error("Push error:", error);

    return respond(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected push error.",
      },
      500
    );
  }
});
