import crypto from "node:crypto";
import fs from "node:fs";
import https from "node:https";

const SAFE_HOST = "phhrtimyvzjwurhzmbxn.supabase.co";
const BASE_URL = "https://phhrtimyvzjwurhzmbxn.supabase.co";
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

const VUS = numericArg("vus", 500, 1, 2500);
const DURATION_SECONDS = numericArg("duration", 30, 10, 300);
const RAMP_SECONDS = numericArg("ramp", 15, 0, 120);
const THINK_MIN_MS = numericArg("thinkMin", 350, 0, 5000);
const THINK_MAX_MS = Math.max(
  THINK_MIN_MS,
  numericArg("thinkMax", 1200, 0, 10000)
);
const REQUEST_TIMEOUT_MS = numericArg("timeout", 30000, 1000, 120000);
const MAX_SOCKETS = numericArg("sockets", 200, 1, 1000);

const parsed = new URL(BASE_URL);
if (parsed.hostname !== SAFE_HOST) {
  throw new Error(`SAFETY STOP: runner permitido solo en ${SAFE_HOST}`);
}
if (
  parsed.hostname.includes("qmsvoytjdivfhqgmvcge") ||
  parsed.hostname === "alumnisv.com" ||
  parsed.hostname.endsWith(".alumnisv.com")
) {
  throw new Error("SAFETY STOP: producción bloqueada.");
}

const HTTPS_AGENT = new https.Agent({
  keepAlive: true,
  maxSockets: MAX_SOCKETS,
  maxFreeSockets: Math.min(MAX_SOCKETS, 100),
  scheduling: "lifo",
});

const metrics = new Map();
const allLatency = [];
const errorSamples = [];
let totalRequests = 0;
let failedRequests = 0;
let startedUsers = 0;
let completedLoops = 0;
let peakPendingRequests = 0;
let active = true;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomBetween(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
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

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)
  );
  return sorted[index];
}

function pendingAgentRequests() {
  return Object.values(HTTPS_AGENT.requests)
    .reduce((sum, items) => sum + items.length, 0);
}

function record(name, elapsed, ok, status, message = null) {
  totalRequests += 1;
  allLatency.push(elapsed);

  if (!ok) {
    failedRequests += 1;
    if (errorSamples.length < 25) {
      errorSamples.push({
        scenario: name,
        status: String(status),
        latencyMs: Number(elapsed.toFixed(2)),
        message: message?.slice(0, 300) || null,
      });
    }
  }

  const current = metrics.get(name) || {
    count: 0,
    failed: 0,
    latencies: [],
    statuses: {},
  };

  current.count += 1;
  current.latencies.push(elapsed);
  if (!ok) current.failed += 1;
  current.statuses[String(status)] =
    (current.statuses[String(status)] || 0) + 1;

  metrics.set(name, current);
}

async function requestJson(method, path, body, scenario, prefer = null) {
  const started = performance.now();

  return new Promise((resolve) => {
    const payload = body === undefined ? null : JSON.stringify(body);
    const headers = {
      apikey: API_KEY,
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      Connection: "keep-alive",
    };

    if (payload !== null) {
      headers["Content-Length"] = Buffer.byteLength(payload);
    }

    if (prefer) {
      headers.Prefer = prefer;
    }

    const req = https.request(
      new URL(path, BASE_URL),
      {
        method,
        agent: HTTPS_AGENT,
        headers,
      },
      (res) => {
        let text = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          if (text.length < 1000) text += chunk;
        });
        res.on("end", () => {
          clearTimeout(timer);
          const elapsed = performance.now() - started;
          const ok = res.statusCode >= 200 && res.statusCode < 300;
          record(
            scenario,
            elapsed,
            ok,
            res.statusCode,
            ok ? null : text
          );
          resolve({ ok, status: res.statusCode, text });
        });
      }
    );

    peakPendingRequests = Math.max(
      peakPendingRequests,
      pendingAgentRequests()
    );

    req.once("error", (error) => {
      clearTimeout(timer);
      const elapsed = performance.now() - started;
      record(
        scenario,
        elapsed,
        false,
        error?.name || error?.code || "network",
        String(error?.message || error)
      );
      resolve({ ok: false, status: "network", text: "" });
    });

    const timer = setTimeout(() => {
      const error = new Error(`Request timeout ${REQUEST_TIMEOUT_MS}ms`);
      error.name = "TimeoutError";
      req.destroy(error);
    }, REQUEST_TIMEOUT_MS);

    if (payload !== null) req.write(payload);
    req.end();
  });
}

function syntheticWriteId(index, actionSeq) {
  const nowPart = BigInt(Date.now() % 100000000000);
  return (
    900000000000000n +
    nowPart * 10000n +
    BigInt((index % 2500) * 4 + (actionSeq % 4))
  ).toString();
}

async function rpc(name, payload, scenario) {
  return requestJson(
    "POST",
    `/rest/v1/rpc/${name}`,
    payload,
    scenario
  );
}

async function readFeed(userId) {
  return rpc(
    "alumni_loadtest_feed_page",
    { p_user_id: userId, p_before_id: null, p_limit: 30 },
    "read_feed"
  );
}

async function readDirect(userId, peerId) {
  return rpc(
    "alumni_loadtest_direct_messages",
    {
      p_user_id: userId,
      p_peer_id: peerId,
      p_before_id: null,
      p_limit: 50,
    },
    "read_direct"
  );
}

async function readGroup(groupId) {
  return rpc(
    "alumni_loadtest_group_messages",
    {
      p_group_id: groupId,
      p_before_id: null,
      p_limit: 50,
    },
    "read_group"
  );
}

async function insertLike(userId, postId) {
  return requestJson(
    "POST",
    "/rest/v1/lt_likes?on_conflict=post_id,user_id",
    { post_id: postId, user_id: userId },
    "write_like",
    "resolution=ignore-duplicates,return=minimal"
  );
}

async function insertComment(userId, postId, index, actionSeq) {
  const id = syntheticWriteId(index, actionSeq);
  return requestJson(
    "POST",
    "/rest/v1/lt_comments",
    {
      id,
      post_id: postId,
      user_id: userId,
      content: `LT: comment vu=${index} seq=${actionSeq}`,
    },
    "write_comment",
    "return=minimal"
  );
}

async function insertDirectMessage(userId, peerId, index, actionSeq) {
  const id = syntheticWriteId(index, actionSeq);
  return requestJson(
    "POST",
    "/rest/v1/lt_messages",
    {
      id,
      sender_id: userId,
      receiver_id: peerId,
      content: `LT: direct message vu=${index} seq=${actionSeq}`,
    },
    "write_direct_message",
    "return=minimal"
  );
}

async function insertGroupMessage(userId, groupId, index, actionSeq) {
  const id = syntheticWriteId(index, actionSeq);
  return requestJson(
    "POST",
    "/rest/v1/lt_group_messages",
    {
      id,
      group_id: groupId,
      sender_id: userId,
      content: `LT: group message vu=${index} seq=${actionSeq}`,
    },
    "write_group_message",
    "return=minimal"
  );
}

async function insertPost(userId, index, actionSeq) {
  const id = syntheticWriteId(index, actionSeq);
  return requestJson(
    "POST",
    "/rest/v1/lt_posts",
    {
      id,
      user_id: userId,
      content: `LT: new post vu=${index} seq=${actionSeq}`,
    },
    "write_post",
    "return=minimal"
  );
}

async function virtualUser(index, stopAt) {
  const rampDelay =
    VUS <= 1 || RAMP_SECONDS <= 0
      ? 0
      : Math.floor((index / (VUS - 1)) * RAMP_SECONDS * 1000);

  await sleep(rampDelay + randomBetween(0, 100));
  if (!active || Date.now() >= stopAt) return;

  startedUsers += 1;

  const userNo = (index % 4000) + 1;
  const peerNo = ((userNo - 1 + 37) % 4000) + 1;
  const groupNo = (index % 200) + 1;

  const userId = syntheticUuid("alumni-lt-user-", userNo);
  const peerId = syntheticUuid("alumni-lt-user-", peerNo);
  const groupId = syntheticUuid("alumni-lt-group-", groupNo);

  let seq = 0;

  while (active && Date.now() < stopAt) {
    seq += 1;

    const roll = Math.random();

    if (roll < 0.32) {
      await readFeed(userId);
    } else if (roll < 0.48) {
      await readDirect(userId, peerId);
    } else if (roll < 0.60) {
      await readGroup(groupId);
    } else if (roll < 0.74) {
      const postId = 900000000000000 + ((index + seq) % 1000) + 1;
      await insertLike(userId, postId);
    } else if (roll < 0.83) {
      const postId = 900000000000000 + ((index * 7 + seq) % 1000) + 1;
      await insertComment(userId, postId, index, seq);
    } else if (roll < 0.91) {
      await insertDirectMessage(userId, peerId, index, seq);
    } else if (roll < 0.96) {
      await insertGroupMessage(userId, groupId, index, seq);
    } else {
      await insertPost(userId, index, seq);
    }

    completedLoops += 1;

    if (active && Date.now() < stopAt) {
      await sleep(randomBetween(THINK_MIN_MS, THINK_MAX_MS));
    }
  }
}

console.log("");
console.log("ALUMNI 3.7.8E - MIXED REAL-LIFE WORKLOAD");
console.log("----------------------------------------");
console.log(`Target: ${BASE_URL}`);
console.log(`Virtual users: ${VUS}`);
console.log(`Ramp: ${RAMP_SECONDS}s`);
console.log(`Steady duration: ${DURATION_SECONDS}s`);
console.log(`HTTPS max sockets: ${MAX_SOCKETS}`);
console.log(`Think time: ${THINK_MIN_MS}-${THINK_MAX_MS}ms`);
console.log("Mix: Feed + chats + likes + comments + messages + posts");
console.log("Media/Storage: NOT INCLUDED YET");
console.log("Realtime: NOT INCLUDED YET");
console.log("Production access: BLOCKED");
console.log("");

const startedAt = Date.now();
const stopAt =
  startedAt + (RAMP_SECONDS + DURATION_SECONDS) * 1000;

const workers = Array.from(
  { length: VUS },
  (_, index) => virtualUser(index, stopAt)
);

await sleep((RAMP_SECONDS + DURATION_SECONDS) * 1000);
active = false;
await Promise.allSettled(workers);
HTTPS_AGENT.destroy();

const elapsedSeconds = (Date.now() - startedAt) / 1000;
const sorted = [...allLatency].sort((a, b) => a - b);

const summary = {
  target: BASE_URL,
  virtualUsers: VUS,
  startedUsers,
  rampSeconds: RAMP_SECONDS,
  steadyDurationSeconds: DURATION_SECONDS,
  actualDurationSeconds: Number(elapsedSeconds.toFixed(2)),
  totalRequests,
  completedLoops,
  failedRequests,
  errorRatePct: totalRequests
    ? Number(((failedRequests / totalRequests) * 100).toFixed(3))
    : 0,
  requestsPerSecond: Number((totalRequests / elapsedSeconds).toFixed(2)),
  latencyMs: {
    p50: Number(percentile(sorted, 50).toFixed(2)),
    p95: Number(percentile(sorted, 95).toFixed(2)),
    p99: Number(percentile(sorted, 99).toFixed(2)),
    max: Number((sorted.at(-1) || 0).toFixed(2)),
  },
  https: {
    maxSockets: MAX_SOCKETS,
    peakPendingRequests,
  },
  scenarios: {},
  errorSamples,
};

for (const [name, value] of metrics) {
  const s = [...value.latencies].sort((a, b) => a - b);
  summary.scenarios[name] = {
    count: value.count,
    failed: value.failed,
    errorRatePct: value.count
      ? Number(((value.failed / value.count) * 100).toFixed(3))
      : 0,
    p50Ms: Number(percentile(s, 50).toFixed(2)),
    p95Ms: Number(percentile(s, 95).toFixed(2)),
    p99Ms: Number(percentile(s, 99).toFixed(2)),
    statuses: value.statuses,
  };
}

fs.mkdirSync("loadtest/results", { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const output =
  `loadtest/results/mixed-${VUS}vu-${stamp}.json`;

fs.writeFileSync(
  output,
  JSON.stringify(summary, null, 2),
  "utf8"
);

console.log(JSON.stringify(summary, null, 2));
console.log("");
console.log(`Resultado guardado en: ${output}`);
console.log("");
console.log(
  failedRequests === 0
    ? "RESULTADO: sin errores HTTP/network."
    : "RESULTADO: hubo errores; NO aumentes la carga todavía."
);
console.log("");
