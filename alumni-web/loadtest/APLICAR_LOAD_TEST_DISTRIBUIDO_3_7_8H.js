const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const TARGET = path.join("loadtest", "alumni-loadtest.mjs");

function die(message) {
  console.error(`\nERROR: ${message}\n`);
  process.exit(1);
}

function git(...args) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    die(
      error?.stderr?.toString()?.trim() ||
      error?.message ||
      "Git error."
    );
  }
}

if (git("branch", "--show-current") !== "performance-hardening") {
  die("Debes estar en performance-hardening.");
}

if (!fs.existsSync(TARGET)) {
  die("No encontré loadtest/alumni-loadtest.mjs.");
}

if (git("diff", "--", TARGET)) {
  die("El runner tiene cambios locales sin commit. No lo voy a pisar.");
}

let source = fs.readFileSync(TARGET, "utf8");

if (
  !source.includes("ALUMNI 3.7.8E - MIXED REAL-LIFE WORKLOAD") ||
  !source.includes("const VUS = numericArg")
) {
  die("El runner actual no parece ser 3.7.8E.");
}

if (source.includes("USER_OFFSET")) {
  die("El runner ya parece tener soporte distribuido.");
}

const backupDir = path.join(
  ".alumni_backups",
  "performance-hardening"
);

fs.mkdirSync(backupDir, { recursive: true });

const stamp = new Date()
  .toISOString()
  .replace(/[-:TZ.]/g, "")
  .slice(0, 14);

fs.copyFileSync(
  TARGET,
  path.join(
    backupDir,
    `alumni-loadtest_before_3_7_8H_${stamp}.mjs`
  )
);

function replaceOnce(oldText, newText, label) {
  if (!source.includes(oldText)) {
    die(`No encontré el bloque esperado: ${label}`);
  }

  source = source.replace(oldText, newText);
}

replaceOnce(
  `const VUS = numericArg("vus", 500, 1, 2500);
const DURATION_SECONDS = numericArg("duration", 30, 10, 300);`,
  `const VUS = numericArg("vus", 500, 1, 2500);
const USER_OFFSET = numericArg("offset", 0, 0, 3999);
const GENERATOR_ID = String(argv.generator || "pc").replace(
  /[^a-zA-Z0-9_-]+/g,
  "_"
).slice(0, 40);
const DURATION_SECONDS = numericArg("duration", 30, 10, 300);`,
  "argumentos distribuidos"
);

replaceOnce(
  `function syntheticWriteId(index, actionSeq) {
  const nowPart = BigInt(Date.now() % 100000000000);
  return (
    900000000000000n +
    nowPart * 10000n +
    BigInt((index % 2500) * 4 + (actionSeq % 4))
  ).toString();
}`,
  `function syntheticWriteId(index, actionSeq) {
  const globalIndex = USER_OFFSET + index;
  const nowPart = BigInt(Date.now() % 100000000000);
  return (
    900000000000000n +
    nowPart * 10000n +
    BigInt((globalIndex % 4000) * 4 + (actionSeq % 4))
  ).toString();
}`,
  "IDs distribuidos"
);

replaceOnce(
  `  const userNo = (index % 4000) + 1;
  const peerNo = ((userNo - 1 + 37) % 4000) + 1;
  const groupNo = (index % 200) + 1;`,
  `  const globalIndex = USER_OFFSET + index;
  const userNo = (globalIndex % 4000) + 1;
  const peerNo = ((userNo - 1 + 37) % 4000) + 1;
  const groupNo = (globalIndex % 200) + 1;`,
  "usuarios distribuidos"
);

replaceOnce(
  `      const postId = 900000000000000 + ((index + seq) % 1000) + 1;`,
  `      const postId = 900000000000000 + ((globalIndex + seq) % 1000) + 1;`,
  "likes distribuidos"
);

replaceOnce(
  `      const postId = 900000000000000 + ((index * 7 + seq) % 1000) + 1;`,
  `      const postId = 900000000000000 + ((globalIndex * 7 + seq) % 1000) + 1;`,
  "comentarios distribuidos"
);

replaceOnce(
  `console.log("ALUMNI 3.7.8E - MIXED REAL-LIFE WORKLOAD");
console.log("----------------------------------------");`,
  `console.log("ALUMNI 3.7.8H - DISTRIBUTED MIXED LOAD TEST");
console.log("------------------------------------------");`,
  "cabecera"
);

replaceOnce(
  `console.log(\`Virtual users: \${VUS}\`);
console.log(\`Ramp: \${RAMP_SECONDS}s\`);`,
  `console.log(\`Generator: \${GENERATOR_ID}\`);
console.log(\`Virtual users: \${VUS}\`);
console.log(\`User offset: \${USER_OFFSET}\`);
console.log(
  \`Synthetic user range: \${USER_OFFSET + 1}-\${USER_OFFSET + VUS}\`
);
console.log(\`Ramp: \${RAMP_SECONDS}s\`);`,
  "salida de shard"
);

replaceOnce(
  `  virtualUsers: VUS,
  startedUsers,`,
  `  generatorId: GENERATOR_ID,
  virtualUsers: VUS,
  userOffset: USER_OFFSET,
  syntheticUserRange: {
    from: USER_OFFSET + 1,
    to: USER_OFFSET + VUS,
  },
  startedUsers,`,
  "summary distribuido"
);

replaceOnce(
  `const output =
  \`loadtest/results/mixed-\${VUS}vu-\${stamp}.json\`;`,
  `const output =
  \`loadtest/results/distributed-\${GENERATOR_ID}-\${VUS}vu-offset\${USER_OFFSET}-\${stamp}.json\`;`,
  "nombre de resultado"
);

fs.writeFileSync(TARGET, source, "utf8");

try {
  execFileSync(process.execPath, ["--check", TARGET], {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  });
} catch (error) {
  die(
    error?.stderr?.toString()?.trim() ||
    error?.message ||
    "node --check falló"
  );
}

console.log("\nOK - soporte distribuido 3.7.8H aplicado.");
console.log("");
console.log("PC 1:");
console.log(
  "node loadtest/alumni-loadtest.mjs --generator=pc1 --offset=0 --vus=2000 --ramp=60 --duration=30 --sockets=400 --timeout=30000"
);
console.log("");
console.log("PC 2:");
console.log(
  "node loadtest/alumni-loadtest.mjs --generator=pc2 --offset=2000 --vus=2000 --ramp=60 --duration=30 --sockets=400 --timeout=30000"
);
console.log("\nNO uses git add .\n");
