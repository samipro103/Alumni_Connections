import crypto from "node:crypto";
import fs from "node:fs";

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
const DURATION_SECONDS = numericArg(
  "duration",
  20,
  5,
  300
);
const RAMP_SECONDS = numericArg(
  "ramp",
  5,
  0,
  120
);
const THINK_MIN_MS = numericArg(
  "thinkMin",
  250,
  0,
  5000
);
const THINK_MAX_MS = Math.max(
  THINK_MIN_MS,
  numericArg(
    "thinkMax",
    700,
    0,
    10000
  )
);
const REQUEST_TIMEOUT_MS = numericArg(
  "timeout",
  15000,
  1000,
  60000
);

const parsed = new URL(BASE_URL);

if (parsed.hostname !== SAFE_HOST) {
  throw new Error(
    `SAFETY STOP: este runner SOLO puede usar ${SAFE_HOST}. Host recibido: ${parsed.hostname}`
  );
}

if (
  parsed.hostname.includes(
    "qmsvoytjdivfhqgmvcge"
  ) ||
  parsed.hostname === "alumnisv.com" ||
  parsed.hostname.endsWith(".alumnisv.com")
) {
  throw new Error(
    "SAFETY STOP: producción está bloqueada."
  );
}

function sleep(ms) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
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
    Math.max(
      0,
      Math.ceil(
        (p / 100) * sorted.length
      ) - 1
    )
  );

  return sorted[index];
}

function randomBetween(min, max) {
  if (max <= min) {
    return min;
  }

  return Math.floor(
    min +
      Math.random() *
        (max - min + 1)
  );
}

const latencies = [];
const byScenario = new Map();
const errorSamples = [];

let totalRequests = 0;
let failedRequests = 0;
let completedIterations = 0;
let startedUsers = 0;
let active = true;

function recordScenario(
  name,
  ms,
  ok,
  status,
  errorMessage = null
) {
  totalRequests += 1;
  latencies.push(ms);

  if (!ok) {
    failedRequests += 1;

    if (errorSamples.length < 20) {
      errorSamples.push({
        scenario: name,
        status: String(status),
        latencyMs: Number(
          ms.toFixed(2)
        ),
        message:
          errorMessage?.slice(0, 300) ||
          null,
      });
    }
  }

  const current =
    byScenario.get(name) || {
      count: 0,
      failed: 0,
      latencies: [],
      statuses: {},
    };

  current.count += 1;
  current.latencies.push(ms);

  if (!ok) {
    current.failed += 1;
  }

  current.statuses[String(status)] =
    (current.statuses[
      String(status)
    ] || 0) + 1;

  byScenario.set(
    name,
    current
  );
}

async function rpc(
  name,
  payload,
  scenario
) {
  const started =
    performance.now();

  try {
    const response = await fetch(
      `${BASE_URL}/rest/v1/rpc/${name}`,
      {
        method: "POST",
        headers: {
          apikey: API_KEY,
          Authorization:
            `Bearer ${API_KEY}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(
          payload
        ),
        signal:
          AbortSignal.timeout(
            REQUEST_TIMEOUT_MS
          ),
      }
    );

    const text =
      await response.text();

    const elapsed =
      performance.now() -
      started;

    recordScenario(
      scenario,
      elapsed,
      response.ok,
      response.status,
      response.ok
        ? null
        : text
    );

    return response.ok;
  } catch (error) {
    const elapsed =
      performance.now() -
      started;

    const message =
      String(
        error?.cause?.message ||
          error?.message ||
          error
      );

    recordScenario(
      scenario,
      elapsed,
      false,
      error?.name ||
        "network",
      message
    );

    return false;
  }
}

async function virtualUser(
  index,
  stopAt
) {
  const rampDelay =
    VUS <= 1 ||
    RAMP_SECONDS <= 0
      ? 0
      : Math.floor(
          (index /
            (VUS - 1)) *
            RAMP_SECONDS *
            1000
        );

  const rampJitter =
    RAMP_SECONDS > 0
      ? randomBetween(0, 75)
      : 0;

  await sleep(
    rampDelay +
      rampJitter
  );

  if (
    !active ||
    Date.now() >= stopAt
  ) {
    return;
  }

  startedUsers += 1;

  const userNo =
    (index % 4000) + 1;

  const peerNo =
    ((userNo - 1 + 37) %
      4000) +
    1;

  const groupNo =
    (index % 200) + 1;

  const userId =
    syntheticUuid(
      "alumni-lt-user-",
      userNo
    );

  const peerId =
    syntheticUuid(
      "alumni-lt-user-",
      peerNo
    );

  const groupId =
    syntheticUuid(
      "alumni-lt-group-",
      groupNo
    );

  while (
    active &&
    Date.now() <
      stopAt
  ) {
    await rpc(
      "alumni_loadtest_feed_page",
      {
        p_user_id: userId,
        p_before_id: null,
        p_limit: 30,
      },
      "feed"
    );

    if (
      !active ||
      Date.now() >= stopAt
    ) {
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

    if (
      !active ||
      Date.now() >= stopAt
    ) {
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

    if (
      active &&
      Date.now() <
        stopAt
    ) {
      await sleep(
        randomBetween(
          THINK_MIN_MS,
          THINK_MAX_MS
        )
      );
    }
  }
}

console.log("");
console.log(
  "ALUMNI 3.7.8C - RAMPED ISOLATED LOAD TEST"
);
console.log(
  "------------------------------------------"
);
console.log(
  `Target: ${BASE_URL}`
);
console.log(
  `Safety host: ${SAFE_HOST}`
);
console.log(
  `Virtual users: ${VUS}`
);
console.log(
  `Ramp: ${RAMP_SECONDS}s`
);
console.log(
  `Steady duration: ${DURATION_SECONDS}s`
);
console.log(
  `Think time: ${THINK_MIN_MS}-${THINK_MAX_MS}ms`
);
console.log(
  `Request timeout: ${REQUEST_TIMEOUT_MS}ms`
);
console.log(
  "Workload: Feed + direct chat + group chat"
);
console.log(
  "Production access: BLOCKED"
);
console.log("");

const startedAt =
  Date.now();

const stopAt =
  startedAt +
  (RAMP_SECONDS +
    DURATION_SECONDS) *
    1000;

const workers =
  Array.from(
    { length: VUS },
    (_, index) =>
      virtualUser(
        index,
        stopAt
      )
  );

await sleep(
  (RAMP_SECONDS +
    DURATION_SECONDS) *
    1000
);

active = false;

await Promise.allSettled(
  workers
);

const elapsedSeconds =
  (Date.now() -
    startedAt) /
  1000;

const sorted =
  [...latencies].sort(
    (a, b) => a - b
  );

const summary = {
  target: BASE_URL,
  virtualUsers: VUS,
  startedUsers,
  rampSeconds:
    RAMP_SECONDS,
  steadyDurationSeconds:
    DURATION_SECONDS,
  actualDurationSeconds:
    Number(
      elapsedSeconds.toFixed(2)
    ),
  thinkTimeMs: {
    min: THINK_MIN_MS,
    max: THINK_MAX_MS,
  },
  requestTimeoutMs:
    REQUEST_TIMEOUT_MS,
  totalRequests,
  completedIterations,
  failedRequests,
  errorRatePct:
    totalRequests
      ? Number(
          (
            (failedRequests /
              totalRequests) *
            100
          ).toFixed(3)
        )
      : 0,
  requestsPerSecond:
    Number(
      (
        totalRequests /
        elapsedSeconds
      ).toFixed(2)
    ),
  latencyMs: {
    p50: Number(
      percentile(
        sorted,
        50
      ).toFixed(2)
    ),
    p95: Number(
      percentile(
        sorted,
        95
      ).toFixed(2)
    ),
    p99: Number(
      percentile(
        sorted,
        99
      ).toFixed(2)
    ),
    max: Number(
      (
        sorted.at(-1) ||
        0
      ).toFixed(2)
    ),
  },
  scenarios: {},
  errorSamples,
};

for (
  const [
    name,
    value,
  ] of byScenario
) {
  const scenarioSorted =
    [
      ...value.latencies,
    ].sort(
      (a, b) =>
        a - b
    );

  summary.scenarios[
    name
  ] = {
    count: value.count,
    failed:
      value.failed,
    errorRatePct:
      value.count
        ? Number(
            (
              (value.failed /
                value.count) *
              100
            ).toFixed(3)
          )
        : 0,
    p50Ms: Number(
      percentile(
        scenarioSorted,
        50
      ).toFixed(2)
    ),
    p95Ms: Number(
      percentile(
        scenarioSorted,
        95
      ).toFixed(2)
    ),
    p99Ms: Number(
      percentile(
        scenarioSorted,
        99
      ).toFixed(2)
    ),
    statuses:
      value.statuses,
  };
}

fs.mkdirSync(
  "loadtest/results",
  {
    recursive: true,
  }
);

const stamp =
  new Date()
    .toISOString()
    .replace(
      /[:.]/g,
      "-"
    );

const output =
  `loadtest/results/loadtest-${VUS}vu-ramp${RAMP_SECONDS}s-${stamp}.json`;

fs.writeFileSync(
  output,
  JSON.stringify(
    summary,
    null,
    2
  ),
  "utf8"
);

console.log(
  JSON.stringify(
    summary,
    null,
    2
  )
);
console.log("");
console.log(
  `Resultado guardado en: ${output}`
);
console.log("");

if (
  failedRequests === 0
) {
  console.log(
    "RESULTADO: sin errores HTTP/network."
  );
} else {
  console.log(
    "RESULTADO: hubo errores; NO aumentes la carga todavía."
  );
}

console.log("");
