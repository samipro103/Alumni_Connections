const fs = require("fs");
const path = require("path");
const cp = require("child_process");

function exists(file) {
  return fs.existsSync(file);
}

function stop(message) {
  console.error("");
  console.error("ERROR:", message);
  process.exit(1);
}

function run(command, args, cwd) {
  return cp.spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
}

function findProject(start) {
  const candidates = [
    start,
    process.cwd(),
    __dirname,
    path.dirname(__dirname),
  ];

  for (const candidate of candidates) {
    let current = path.resolve(candidate);

    for (let depth = 0; depth < 6; depth += 1) {
      if (
        exists(path.join(current, "package.json")) &&
        exists(path.join(current, "src", "app", "explore", "page.tsx"))
      ) {
        return current;
      }

      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }

  return null;
}

const project = findProject(process.argv[2]);

if (!project) {
  stop("No encuentro alumni-web.");
}

const files = [
  "src/app/community/page.tsx",
  "src/app/events/page.tsx",
  "src/app/explore/page.tsx",
  "src/app/explore/explore-pro.css",
  "src/app/passport/page.tsx",
  "src/app/passport/passport.css",
  "src/app/settings/page.tsx",
  "src/components/explore/ExploreSocialPulse.module.css",
  "src/components/explore/ExploreSocialPulse.tsx",
  "src/components/layout/LeftSidebar.tsx",
  "src/components/layout/MobileNav.tsx",
  "src/components/layout/RightSidebar.tsx",
  "src/components/music/SpotifyPremiumMusicGate.tsx",
  "src/components/settings/AccountTrustPanel.tsx",
  "src/components/settings/ProfileMusicSettings.tsx",
  "src/components/settings/ProfileSettingsHub.tsx",
  "src/components/settings/SavedPostsPanel.tsx",
];

const marker =
  "ALUMNI_3_1_1_PRODUCT_COPY_CLEANUP";

let markerCount = 0;
let cleanedFiles = 0;
let cleanedLines = 0;

for (const relative of files) {
  const file = path.join(project, relative);

  if (!exists(file)) {
    stop(`Falta ${relative}`);
  }

  const before = fs.readFileSync(file, "utf8");

  if (before.includes(marker)) {
    markerCount += 1;
  }

  const lines = before.split("\n");
  let fileChanged = false;

  const nextLines = lines.map((line) => {
    const cleaned = line.replace(/[ \t]+$/g, "");
    if (cleaned !== line) {
      fileChanged = true;
      cleanedLines += 1;
    }
    return cleaned;
  });

  if (fileChanged) {
    fs.writeFileSync(
      file,
      nextLines.join("\n"),
      "utf8"
    );
    cleanedFiles += 1;
  }
}

if (markerCount < 10) {
  stop(
    "No parece que 3.1.1 haya quedado aplicado. " +
    "No continue para evitar tocar una version incorrecta."
  );
}

const diffCheck = run(
  "git",
  [
    "diff",
    "--check",
    "--",
    ...files,
  ],
  project
);

if (diffCheck.status !== 0) {
  console.error(diffCheck.stdout || "");
  console.error(diffCheck.stderr || "");
  stop("git diff --check todavia detecta un problema.");
}

console.log("");
console.log("ALUMNI 3.1.1A OK");
console.log(`Archivos limpiados: ${cleanedFiles}`);
console.log(`Lineas corregidas: ${cleanedLines}`);
console.log("git diff --check: OK");
console.log("");
console.log("Los avisos LF -> CRLF de Windows son normales.");
console.log("");
console.log("Ahora ejecuta:");
console.log("  npm run build");
