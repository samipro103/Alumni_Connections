const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const TARGET = path.join("src", "app", "feed", "page.tsx");

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
        "Error ejecutando Git."
    );
  }
}

function main() {
  if (!fs.existsSync(TARGET)) {
    die("Ejecuta este archivo desde la carpeta alumni-web.");
  }

  const branch = git("branch", "--show-current");

  if (branch !== "performance-hardening") {
    die(
      `Estás en la rama '${branch || "(desconocida)"}'. Debes estar en performance-hardening.`
    );
  }

  const original = fs.readFileSync(TARGET, "utf8");

  const oldBlock = `  async function refreshPosts(options: {
    showLoader?: boolean;
    limit?: number;
  } = {}) {`;

  const newBlock = `  async function refreshPosts(options: {
    showLoader?: boolean;
    limit?: number;
    append?: boolean;
    beforePostId?: number | null;
  } = {}) {`;

  const count = original.split(oldBlock).length - 1;

  if (count !== 1) {
    die(
      `Esperaba encontrar el bloque de refreshPosts exactamente 1 vez y encontré ${count}. No modifiqué nada.`
    );
  }

  const updated = original.replace(oldBlock, newBlock);

  fs.writeFileSync(TARGET, updated, "utf8");

  console.log("\nOK - Typecheck fix aplicado.");
  console.log("- refreshPosts ahora acepta append.");
  console.log("- refreshPosts ahora acepta beforePostId.");
  console.log("\nSIGUIENTE:");
  console.log("  npm run typecheck");
  console.log("  npm run build");
  console.log("  npm run test");
  console.log("\nSi los tres pasan, ya puedes hacer commit.\n");
}

main();
