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

  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, value));
}

const VUS = numericArg("vus", 100, 1, 3500);
const DURATION_SECONDS = numericArg("duration", 20, 5, 300);
const RAMP_SECONDS = numericArg("ramp", 5, 0, 120);
const THINK_MIN_MS = numericArg("thinkMin", 250, 0, 5000);
const THINK_MAX_MS = Math.max(
  THINK_MIN_MS,
  numericArg("thinkMax", 700, 0, 10000)
);
const REQUEST_TIMEOUT_MS = numericArg("timeout", 30000, 1000, 120000);
const MAX_SOCKETS = numericArg("sockets", 100, 1, 1000);

const parsed = new URL(BASE_URL);

if (parsed.hostname !== SAFE_HOST) {
  throw new Error(
    `SAFETY STOP: este runner SOLO puede usar ${SAFE_HOST}. Host recibido: ${parsed.hostname}`
  );
}

if (
  parsed.hostname.includes("qmsvoytjdivfhqgmvcge") ||
  parsed.hostname === "alumnisv.com" ||
  parsed.hostname.endsWith(".alumnisv.com")
) {
  throw new Error("SAFETY STOP: producción está bloqueada.");
}

const HTTPS_AGENT = new https.Agent({
  keepAlive: true,
  maxSockets: MAX_SOCKETS,
  maxFreeSockets: Math.min(MAX_SOCKETS, 50),
  scheduling: "lifo",
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function syntheticUuid(prefix, value) {
  const hex = crypto
    .createHash("md5")
    .update(`${prefix}${value}`)
    .digest("hex");

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

function percentile(sorted, p) {
  if (!sorted.length) {
    return 0;
  }

  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)
  );

  return sorted[index];
}

function randomBetween(min, max) {
  if (max <= min) {
    return min;
  }

  return Math.floor(min + Math.random() * (max - min + 1));
}

const latencies = [];
const queueWaits = [];
const networkWaits = [];
const byScenario = new Map();
const errorSamples = [];

let totalRequests = 0;
let failedRequests = 0;
let completedIterations = 0;
let startedUsers = 0;
let reusedSockets = 0;
let freshSockets = 0;
let peakPendingRequests = 0;
let active = true;

function pendingAgentRequests() {
  return Object.values(HTTPS_AGENT.requests)
    .reduce((sum, items) => sum + items.length, 0);
}

function sampleAgentQueue() {
  peakPendingRequests = Math.max(
    peakPendingRequests,
    pendingAgentRequests()
  );
}

function recordScenario(
  name,
  totalMs,
  queueMs,
  networkMs,
  ok,
  status,
  errorMessage = null
) {
  totalRequests += 1;
  latencies.push(totalMs);
  queueWaits.push(queueMs);
  networkWaits.push(networkMs);

  if (!ok) {
    failedRequests += 1;

    if (errorSamples.length < 20) {
      errorSamples.push({
        scenario: name,
        status: String(status),
        totalMs: Number(totalMs.toFixed(2)),
        socketQueueMs: Number(queueMs.toFixed(2)),
        afterSocketMs: Number(networkMs.toFixed(2)),
        message: errorMessage?.slice(0, 300) || null,
      });
    }
  }

  const current =
    byScenario.get(name) || {
      count: 0,
      failed: 0,
      latencies: [],
      queueWaits: [],
      networkWaits: [],
      statuses: {},
    };

  current.count += 1;
  current.latencies.push(totalMs);
  current.queueWaits.push(queueMs);
  current.networkWaits.push(networkMs);

  if (!ok) {
    current.failed += 1;
  }

  current.statuses[String(status)] =
    (current.statuses[String(status)] || 0) + 1;

  byScenario.set(name, current);
}

async function rpc(name, payload, scenario) {
  const started = performance.now();
  let socketAssignedAt = null;
  let settled = false;

  return new Promise((resolve) => {
    const body = JSON.stringify(payload);
    const url = new URL(`/rest/v1/rpc/${name}`, BASE_URL);

    const req = https.request(
      url,
      {
        method: "POST",
        agent: HTTPS_AGENT,
        headers: {
          apikey: API_KEY,
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          Connection: "keep-alive",
        },
      },
      (res) => {
        let responseText = "";

        res.setEncoding("utf8");

        res.on("data", (chunk) => {
          if (responseText.length < 400) {
            responseText += chunk;
          }
        });

        res.on("end", () => {
          if (settled) {
            return;
          }

          settled = true;
          clearTimeout(timeoutTimer);

          const ended = performance.now();
          const assignedAt = socketAssignedAt ?? ended;
          const totalMs = ended - started;
          const queueMs = Math.max(0, assignedAt - started);
          const networkMs = Math.max(0, ended - assignedAt);
          const ok = res.statusCode >= 200 && res.statusCode < 300;

          recordScenario(
            scenario,
            totalMs,
            queueMs,
            networkMs,
            ok,
            res.statusCode,
            ok ? null : responseText
          );

          resolve(ok);
        });
      }
    );

    sampleAgentQueue();

    req.once("socket", () => {
      socketAssignedAt = performance.now();

      if (req.reusedSocket) {
        reusedSockets += 1;
      } else {
        freshSockets += 1;
      }
    });

    req.once("error", (error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutTimer);

      const ended = performance.now();
      const assignedAt = socketAssignedAt ?? ended;
      const totalMs = ended - started;
      const queueMs = Math.max(0, assignedAt - started);
      const networkMs = Math.max(0, ended - assignedAt);

      recordScenario(
        scenario,
        totalMs,
        queueMs,
        networkMs,
        false,
        error?.name || error?.code || "network",
        String(error?.message || error)
      );

      resolve(false);
    });

    const timeoutTimer = setTimeout(() => {
      if (settled) {
        return;
      }

      const error = new Error(
        `Total request timeout after ${REQUEST_TIMEOUT_MS}ms`
      );
      error.name = "TimeoutError";
      req.destroy(error);
    }, REQUEST_TIMEOUT_MS);

    req.end(body);
  });
}

async function virtualUser(index, stopAt) {
  const rampDelay =
    VUS <= 1 || RAMP_SECONDS <= 0
      ? 0
      : Math.floor(
          (index / (VUS - 1)) *
            RAMP_SECONDS *
            1000
        );

  const rampJitter =
    RAMP_SECONDS > 0
      ? randomBetween(0, 75)
      : 0;

  await sleep(rampDelay + rampJitter);

  if (!active || Date.now() >= stopAt) {
    return;
  }

  startedUsers += 1;

  const userNo = (index % 4000) + 1;
  const peerNo = ((userNo - 1 + 37) % 4000) + 1;
  const groupNo = (index % 200) + 1;

  const userId = syntheticUuid("alumni-lt-user-", userNo);
  const peerId = syntheticUuid("alumni-lt-user-", peerNo);
  const groupId = syntheticUuid("alumni-lt-group-", groupNo);

  while (active && Date.now() < stopAt) {
    await rpc(
      "alumni_loadtest_feed_page",
      {
        p_user_id: userId,
        p_before_id: null,
        p_limit: 30,
      },
      "feed"
    );

    if (!active || Date.now() >= stopAt) {
      break;
    }

    await rpc(
      "alumni_loadtest_direct_messages",
      {
        p_user_id: userId,
        p_peer_id: peerId,
        p_before_id: null,
        p_limit: 50,
      },
      "direct_chat"
    );

    if (!active || Date.now() >= stopAt) {
      break;
    }

    await rpc(
      "alumni_loadtest_group_messages",
      {
        p_group_id: groupId,
        p_before_id: null,
        p_limit: 50,
      },
      "group_chat"
    );

    completedIterations += 1;

    if (active && Date.now() < stopAt) {
      await sleep(
        randomBetween(THINK_MIN_MS, THINK_MAX_MS)
      );
    }
  }
}

console.log("");
console.log("ALUMNI 3.7.8D - POOLED HTTPS LOAD TEST");
console.log("--------------------------------------");
console.log(`Target: ${BASE_URL}`);
console.log(`Safety host: ${SAFE_HOST}`);
console.log(`Virtual users: ${VUS}`);
console.log(`Ramp: ${RAMP_SECONDS}s`);
console.log(`Steady duration: ${DURATION_SECONDS}s`);
console.log(`Think time: ${THINK_MIN_MS}-${THINK_MAX_MS}ms`);
console.log(`Request timeout: ${REQUEST_TIMEOUT_MS}ms`);
console.log(`HTTPS max sockets: ${MAX_SOCKETS}`);
console.log("Keep-alive: ON");
console.log("Workload: Feed + direct chat + group chat");
console.log("Production access: BLOCKED");
console.log("");

const startedAt = Date.now();

const stopAt =
  startedAt +
  (RAMP_SECONDS + DURATION_SECONDS) * 1000;

const queueSampler = setInterval(
  sampleAgentQueue,
  50
);

const workers = Array.from(
  { length: VUS },
  (_, index) => virtualUser(index, stopAt)
);

await sleep(
  (RAMP_SECONDS + DURATION_SECONDS) * 1000
);

active = false;

await Promise.allSettled(workers);

clearInterval(queueSampler);
sampleAgentQueue();
HTTPS_AGENT.destroy();

const elapsedSeconds =
  (Date.now() - startedAt) / 1000;

const sorted = [...latencies].sort((a, b) => a - b);
const queueSorted = [...queueWaits].sort((a, b) => a - b);
const networkSorted = [...networkWaits].sort((a, b) => a - b);

const summary = {
  target: BASE_URL,
  virtualUsers: VUS,
  startedUsers,
  rampSeconds: RAMP_SECONDS,
  steadyDurationSeconds: DURATION_SECONDS,
  actualDurationSeconds: Number(elapsedSeconds.toFixed(2)),
  thinkTimeMs: {
    min: THINK_MIN_MS,
    max: THINK_MAX_MS,
  },
  requestTimeoutMs: REQUEST_TIMEOUT_MS,
  https: {
    maxSockets: MAX_SOCKETS,
    keepAlive: true,
    freshSocketAssignments: freshSockets,
    reusedSocketAssignments: reusedSockets,
    peakPendingRequests,
  },
  totalRequests,
  completedIterations,
  failedRequests,
  errorRatePct: totalRequests
    ? Number(((failedRequests / totalRequests) * 100).toFixed(3))
    : 0,
  requestsPerSecond: Number(
    (totalRequests / elapsedSeconds).toFixed(2)
  ),
  latencyMs: {
    p50: Number(percentile(sorted, 50).toFixed(2)),
    p95: Number(percentile(sorted, 95).toFixed(2)),
    p99: Number(percentile(sorted, 99).toFixed(2)),
    max: Number((sorted.at(-1) || 0).toFixed(2)),
  },
  socketQueueMs: {
    p50: Number(percentile(queueSorted, 50).toFixed(2)),
    p95: Number(percentile(queueSorted, 95).toFixed(2)),
    p99: Number(percentile(queueSorted, 99).toFixed(2)),
    max: Number((queueSorted.at(-1) || 0).toFixed(2)),
  },
  afterSocketMs: {
    p50: Number(percentile(networkSorted, 50).toFixed(2)),
    p95: Number(percentile(networkSorted, 95).toFixed(2)),
    p99: Number(percentile(networkSorted, 99).toFixed(2)),
    max: Number((networkSorted.at(-1) || 0).toFixed(2)),
  },
  scenarios: {},
  errorSamples,
};

for (const [name, value] of byScenario) {
  const scenarioSorted = [...value.latencies].sort((a, b) => a - b);
  const scenarioQueueSorted = [...value.queueWaits].sort((a, b) => a - b);
  const scenarioNetworkSorted = [...value.networkWaits].sort((a, b) => a - b);

  summary.scenarios[name] = {
    count: value.count,
    failed: value.failed,
    errorRatePct: value.count
      ? Number(((value.failed / value.count) * 100).toFixed(3))
      : 0,
    p50Ms: Number(percentile(scenarioSorted, 50).toFixed(2)),
    p95Ms: Number(percentile(scenarioSorted, 95).toFixed(2)),
    p99Ms: Number(percentile(scenarioSorted, 99).toFixed(2)),
    socketQueueP95Ms: Number(
      percentile(scenarioQueueSorted, 95).toFixed(2)
    ),
    afterSocketP95Ms: Number(
      percentile(scenarioNetworkSorted, 95).toFixed(2)
    ),
    statuses: value.statuses,
  };
}

fs.mkdirSync(
  "loadtest/results",
  { recursive: true }
);

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-");

const output =
  `loadtest/results/loadtest-${VUS}vu-pool${MAX_SOCKETS}-ramp${RAMP_SECONDS}s-${stamp}.json`;

fs.writeFileSync(
  output,
  JSON.stringify(summary, null, 2),
  "utf8"
);

console.log(JSON.stringify(summary, null, 2));
console.log("");
console.log(`Resultado guardado en: ${output}`);
console.log("");

if (failedRequests === 0) {
  console.log("RESULTADO: sin errores HTTP/network.");
} else {
  console.log(
    "RESULTADO: hubo errores; NO aumentes la carga todavía."
  );
}

console.log("");
