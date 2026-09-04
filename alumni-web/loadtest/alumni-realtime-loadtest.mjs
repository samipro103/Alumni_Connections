import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import fs from "node:fs";

const BASE_URL = "https://phhrtimyvzjwurhzmbxn.supabase.co";
const SAFE_REF = "phhrtimyvzjwurhzmbxn";
const API_KEY = "sb_publishable__xnGx-ICZWjYBGk0eyPJOw_bF86r-Wd";

const argv = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((item) => item.startsWith("--"))
    .map((item) => {
      const [key, value = "true"] = item.slice(2).split("=");
      return [key, value];
    })
);

function numericArg(name, fallback, min, max) {
  const value = Number(argv[name] ?? fallback);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

const CONNECTIONS = numericArg("connections", 150, 1, 190);
const RAMP_SECONDS = numericArg("ramp", 15, 0, 120);
const DURATION_SECONDS = numericArg("duration", 30, 10, 180);
const EVENTS_PER_SECOND = numericArg("eps", 20, 1, 80);
const SETTLE_SECONDS = numericArg("settle", 5, 1, 20);

const parsed = new URL(BASE_URL);
if (!parsed.hostname.startsWith(`${SAFE_REF}.`)) {
  throw new Error("SAFETY STOP: solo staging.");
}
if (
  parsed.hostname.includes("qmsvoytjdivfhqgmvcge") ||
  parsed.hostname === "alumnisv.com" ||
  parsed.hostname.endsWith(".alumnisv.com")
) {
  throw new Error("SAFETY STOP: producción bloqueada.");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function syntheticUuid(prefix, value) {
  const hex = crypto.createHash("md5").update(`${prefix}${value}`).digest("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)
  );
  return sorted[index];
}

function makeClient() {
  return createClient(BASE_URL, API_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    realtime: {
      heartbeatIntervalMs: 15000,
      reconnectAfterMs: (tries) => Math.min(1000 * tries, 5000),
    },
    global: {
      headers: {
        "X-ALUMNI-Loadtest": "3.7.8F",
      },
    },
  });
}

const clients = [];
const channels = [];
const connected = new Set();
const subscriptionErrors = [];
const sendErrors = [];
const sentAtById = new Map();
const receiveLatencies = [];
const receivedIds = new Set();

let eventsAttempted = 0;
let eventsInserted = 0;
let eventsReceived = 0;
let reconnectSignals = 0;

function makeMessageId(sequence) {
  return (
    980000000000000n +
    BigInt(Date.now() % 100000000000) * 1000n +
    BigInt(sequence % 1000)
  ).toString();
}

console.log("");
console.log("ALUMNI 3.7.8F - REALTIME WEBSOCKET LOAD TEST");
console.log("---------------------------------------------");
console.log(`Target: ${BASE_URL}`);
console.log(`Connections: ${CONNECTIONS}`);
console.log(`Ramp: ${RAMP_SECONDS}s`);
console.log(`Duration: ${DURATION_SECONDS}s`);
console.log(`Event rate: ${EVENTS_PER_SECOND}/s`);
console.log(`Settle after writes: ${SETTLE_SECONDS}s`);
console.log("Realtime tables: lt_messages only");
console.log("Production access: BLOCKED");
console.log("");

const connectStarted = performance.now();

for (let i = 0; i < CONNECTIONS; i += 1) {
  const client = makeClient();
  const userNo = (i % 4000) + 1;
  const receiverId = syntheticUuid("alumni-lt-user-", userNo);

  const channel = client
    .channel(`lt-direct-${i}-${Date.now()}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "lt_messages",
        filter: `receiver_id=eq.${receiverId}`,
      },
      (payload) => {
        const id = String(payload?.new?.id ?? "");
        if (!id || receivedIds.has(id)) return;

        receivedIds.add(id);
        eventsReceived += 1;

        const sentAt = sentAtById.get(id);
        if (sentAt !== undefined) {
          receiveLatencies.push(performance.now() - sentAt);
          sentAtById.delete(id);
        }
      }
    );

  channel.subscribe((status, error) => {
    if (status === "SUBSCRIBED") {
      connected.add(i);
    } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
      subscriptionErrors.push({
        index: i,
        status,
        message: error?.message || null,
      });
    } else if (status === "CLOSED" && connected.has(i)) {
      reconnectSignals += 1;
    }
  });

  clients.push(client);
  channels.push(channel);

  if (RAMP_SECONDS > 0 && i < CONNECTIONS - 1) {
    await sleep((RAMP_SECONDS * 1000) / CONNECTIONS);
  }
}

const connectDeadline = Date.now() + 15000;
while (connected.size < CONNECTIONS && Date.now() < connectDeadline) {
  await sleep(100);
}

const connectElapsedMs = performance.now() - connectStarted;

if (connected.size < CONNECTIONS) {
  console.log(
    `WARNING: solo ${connected.size}/${CONNECTIONS} conexiones quedaron SUBSCRIBED antes del timeout.`
  );
}

const writer = makeClient();

let sequence = 0;
let writing = true;
const intervalMs = Math.max(12.5, 1000 / EVENTS_PER_SECOND);

const writerLoop = (async () => {
  const started = Date.now();
  const stopAt = started + DURATION_SECONDS * 1000;

  while (writing && Date.now() < stopAt) {
    sequence += 1;
    eventsAttempted += 1;

    const targetIndex = sequence % CONNECTIONS;
    const receiverNo = (targetIndex % 4000) + 1;
    const senderNo = ((receiverNo + 137 - 1) % 4000) + 1;

    const receiverId = syntheticUuid("alumni-lt-user-", receiverNo);
    const senderId = syntheticUuid("alumni-lt-user-", senderNo);
    const id = makeMessageId(sequence);

    sentAtById.set(id, performance.now());

    const { error } = await writer
      .from("lt_messages")
      .insert({
        id,
        sender_id: senderId,
        receiver_id: receiverId,
        content: `LT: realtime seq=${sequence}`,
      });

    if (error) {
      sentAtById.delete(id);
      if (sendErrors.length < 25) {
        sendErrors.push({
          sequence,
          message: error.message,
          code: error.code || null,
        });
      }
    } else {
      eventsInserted += 1;
    }

    const elapsed = Date.now() - started;
    const expectedElapsed = sequence * intervalMs;
    const delay = expectedElapsed - elapsed;
    if (delay > 0) {
      await sleep(delay);
    }
  }
})();

await writerLoop;
writing = false;
await sleep(SETTLE_SECONDS * 1000);

const finalConnected = connected.size;
const missingEvents = Math.max(0, eventsInserted - eventsReceived);
const deliveryPct = eventsInserted
  ? (eventsReceived / eventsInserted) * 100
  : 0;

const summary = {
  target: BASE_URL,
  requestedConnections: CONNECTIONS,
  subscribedConnections: finalConnected,
  connectElapsedMs: Number(connectElapsedMs.toFixed(2)),
  rampSeconds: RAMP_SECONDS,
  durationSeconds: DURATION_SECONDS,
  eventsPerSecondTarget: EVENTS_PER_SECOND,
  eventsAttempted,
  eventsInserted,
  eventsReceived,
  missingEvents,
  deliveryPct: Number(deliveryPct.toFixed(3)),
  reconnectSignals,
  latencyMs: {
    p50: Number(percentile(receiveLatencies, 50).toFixed(2)),
    p95: Number(percentile(receiveLatencies, 95).toFixed(2)),
    p99: Number(percentile(receiveLatencies, 99).toFixed(2)),
    max: Number(
      (receiveLatencies.length
        ? Math.max(...receiveLatencies)
        : 0
      ).toFixed(2)
    ),
  },
  subscriptionErrors: subscriptionErrors.slice(0, 25),
  sendErrors: sendErrors.slice(0, 25),
};

fs.mkdirSync("loadtest/results", { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const output =
  `loadtest/results/realtime-${CONNECTIONS}conn-${EVENTS_PER_SECOND}eps-${stamp}.json`;

fs.writeFileSync(
  output,
  JSON.stringify(summary, null, 2),
  "utf8"
);

console.log(JSON.stringify(summary, null, 2));
console.log("");
console.log(`Resultado guardado en: ${output}`);
console.log("");

for (let i = 0; i < channels.length; i += 1) {
  try {
    await clients[i].removeChannel(channels[i]);
  } catch {}
}

try {
  await writer.removeAllChannels();
} catch {}

for (const client of clients) {
  try {
    await client.removeAllChannels();
  } catch {}
}

if (
  finalConnected === CONNECTIONS &&
  sendErrors.length === 0 &&
  deliveryPct >= 99
) {
  console.log("RESULTADO: Realtime estable en esta carga.");
} else {
  console.log("RESULTADO: revisar antes de aumentar conexiones.");
}

console.log("");
