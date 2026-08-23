import { createClient } from "npm:@supabase/supabase-js@2";
import { JWT } from "npm:google-auth-library@10";

type WebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: Record<string, any> | null;
  old_record?: Record<string, any> | null;
};

type PushCopy = {
  recipientId: string;
  actorId: string | null;
  preference:
    | "messages"
    | "story_replies"
    | "likes"
    | "comments"
    | "follows"
    | "events";
  title: string;
  body: string;
  url: string;
  type: string;
  targetId: string;
};

function getSupabaseSecretKey() {
  const legacy = Deno.env.get(
    "SUPABASE_SERVICE_ROLE_KEY"
  );

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

function buildNotificationUrl(
  record: Record<string, any>,
  actorUsername: string | null
) {
  const type = String(record.type || "");
  const targetType = String(
    record.target_type || ""
  );
  const targetId = String(
    record.target_id ||
      record.post_id ||
      record.id ||
      ""
  );

  if (type === "follow" && actorUsername) {
    return `/u/${encodeURIComponent(actorUsername)}`;
  }

  if (
    type === "story_reply" &&
    actorUsername
  ) {
    return `/messages/${encodeURIComponent(
      actorUsername
    )}`;
  }

  if (targetType === "story") {
    return `/feed?story=${encodeURIComponent(
      targetId
    )}`;
  }

  if (
    targetType === "post" ||
    record.post_id
  ) {
    const postId =
      record.post_id || targetId;

    return `/feed?post=${encodeURIComponent(
      String(postId)
    )}`;
  }

  return "/notifications";
}

function buildNotificationCopy(
  record: Record<string, any>,
  actorUsername: string | null
): PushCopy {
  const type = String(record.type || "");
  const targetType = String(
    record.target_type || ""
  );

  const actor = actorUsername
    ? `@${actorUsername}`
    : "Alguien";

  let body = "Tienes una nueva notificación.";
  let preference: PushCopy["preference"] =
    "likes";

  if (type === "follow") {
    body = `${actor} comenzó a seguirte.`;
    preference = "follows";
  } else if (type === "comment") {
    body = `${actor} comentó tu publicación.`;
    preference = "comments";
  } else if (type === "story_reply") {
    body = `${actor} respondió a tu historia.`;
    preference = "story_replies";
  } else if (
    type === "like" &&
    targetType === "story"
  ) {
    body = `${actor} le dio me gusta a tu historia.`;
    preference = "likes";
  } else if (
    type === "like" &&
    (targetType === "comment" ||
      targetType === "post_comment")
  ) {
    body = `${actor} le dio me gusta a tu comentario.`;
    preference = "likes";
  } else if (type === "like") {
    body = `${actor} le dio me gusta a tu publicación.`;
    preference = "likes";
  } else if (type === "event") {
    body = "Tienes una actualización de evento.";
    preference = "events";
  }

  return {
    recipientId: String(record.user_id),
    actorId: record.actor_id
      ? String(record.actor_id)
      : null,
    preference,
    title: "AlumniConnections",
    body,
    url: buildNotificationUrl(
      record,
      actorUsername
    ),
    type: type || "notification",
    targetId: String(
      record.target_id ||
        record.post_id ||
        record.id ||
        ""
    ),
  };
}

function buildMessageCopy(
  record: Record<string, any>,
  senderUsername: string | null
): PushCopy | null {
  const senderId = String(
    record.sender_id || ""
  );

  const recipientId = String(
    record.receiver_id || ""
  );

  if (
    !senderId ||
    !recipientId ||
    senderId === recipientId
  ) {
    return null;
  }

  // story_reply ya genera una fila en notifications;
  // así evitamos una push duplicada.
  if (
    String(record.message_type || "") ===
    "story_reply"
  ) {
    return null;
  }

  const actor = senderUsername
    ? `@${senderUsername}`
    : "Alguien";

  const content = String(
    record.content || ""
  )
    .replace(/\s+/g, " ")
    .trim();

  const preview =
    content.length > 90
      ? `${content.slice(0, 87)}...`
      : content;

  return {
    recipientId,
    actorId: senderId,
    preference: "messages",
    title: actor,
    body: preview || "Te envió un mensaje.",
    url: senderUsername
      ? `/messages/${encodeURIComponent(
          senderUsername
        )}`
      : "/messages",
    type: "message",
    targetId: String(record.id || ""),
  };
}

async function getActorUsername(
  admin: ReturnType<typeof createClient>,
  actorId: string | null
) {
  if (!actorId) return null;

  const { data } = await admin
    .from("profiles")
    .select("username")
    .eq("id", actorId)
    .maybeSingle();

  return data?.username
    ? String(data.username)
    : null;
}

async function getFirebaseAccessToken() {
  const raw = Deno.env.get(
    "FIREBASE_SERVICE_ACCOUNT_JSON"
  );

  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is not configured."
    );
  }

  const serviceAccount = JSON.parse(raw);

  const client = new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: [
      "https://www.googleapis.com/auth/firebase.messaging",
    ],
  });

  const result = await client.getAccessToken();

  const token =
    typeof result === "string"
      ? result
      : result?.token;

  if (!token) {
    throw new Error(
      "Could not obtain Firebase access token."
    );
  }

  return {
    accessToken: token,
    projectId: String(
      serviceAccount.project_id
    ),
  };
}

async function main(payload: WebhookPayload) {
  const record = payload.record || null;

  if (!record) {
    return {
      ok: true,
      skipped: true,
      reason: "No record.",
    };
  }

  const supabaseUrl =
    Deno.env.get("SUPABASE_URL");

  const secretKey =
    getSupabaseSecretKey();

  if (!supabaseUrl || !secretKey) {
    throw new Error(
      "Supabase admin credentials are unavailable."
    );
  }

  const admin = createClient(
    supabaseUrl,
    secretKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  let copy: PushCopy | null = null;

  if (payload.table === "notifications") {
    const actorUsername =
      await getActorUsername(
        admin,
        record.actor_id
          ? String(record.actor_id)
          : null
      );

    copy = buildNotificationCopy(
      record,
      actorUsername
    );
  } else if (payload.table === "messages") {
    const senderId = record.sender_id
      ? String(record.sender_id)
      : null;

    const senderUsername =
      await getActorUsername(
        admin,
        senderId
      );

    copy = buildMessageCopy(
      record,
      senderUsername
    );
  } else {
    return {
      ok: true,
      skipped: true,
      reason: `Unsupported table: ${payload.table}`,
    };
  }

  if (!copy) {
    return {
      ok: true,
      skipped: true,
      reason: "Nothing to push.",
    };
  }

  const { data: preferences } =
    await admin
      .from("notification_preferences")
      .select("*")
      .eq("user_id", copy.recipientId)
      .maybeSingle();

  if (
    preferences &&
    preferences.push_enabled === false
  ) {
    return {
      ok: true,
      skipped: true,
      reason: "Push disabled.",
    };
  }

  if (
    preferences &&
    preferences[copy.preference] === false
  ) {
    return {
      ok: true,
      skipped: true,
      reason: `Preference disabled: ${copy.preference}`,
    };
  }

  const { data: devices, error: deviceError } =
    await admin
      .from("user_devices")
      .select("id, push_token")
      .eq("user_id", copy.recipientId)
      .eq("active", true)
      .eq("platform", "android")
      .eq("push_provider", "fcm")
      .not("push_token", "is", null);

  if (deviceError) {
    throw deviceError;
  }

  if (!devices?.length) {
    return {
      ok: true,
      skipped: true,
      reason: "No active Android devices.",
    };
  }

  const { accessToken, projectId } =
    await getFirebaseAccessToken();

  let sent = 0;
  let disabled = 0;
  const errors: string[] = [];

  for (const device of devices) {
    const pushToken = String(
      device.push_token || ""
    );

    if (!pushToken) continue;

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(
        projectId
      )}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
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
    errors.push(
      `${response.status}: ${detail.slice(
        0,
        240
      )}`
    );

    if (
      response.status === 404 ||
      detail.includes("UNREGISTERED")
    ) {
      await admin
        .from("user_devices")
        .update({
          active: false,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", device.id);

      disabled += 1;
    }
  }

  return {
    ok: errors.length === 0,
    sent,
    disabled,
    errors,
  };
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return Response.json(
      {
        ok: false,
        error: "POST required.",
      },
      { status: 405 }
    );
  }

  try {
    const payload =
      (await request.json()) as WebhookPayload;

    const result = await main(payload);

    return Response.json(result, {
      status: result.ok ? 200 : 207,
    });
  } catch (error) {
    console.error("Native push error:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected push error.",
      },
      { status: 500 }
    );
  }
});
