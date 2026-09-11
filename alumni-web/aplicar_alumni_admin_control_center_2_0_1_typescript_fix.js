const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const FILE =
  "src/app/admin/users/page.tsx";
const MARKER =
  "ALUMNI_ADMIN_CONTROL_CENTER_2_0_1_TYPESCRIPT_FIX";

function abs(rel) {
  return path.join(ROOT, rel);
}

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

if (!fs.existsSync(abs("package.json"))) {
  fail("Ejecutá este parche dentro de alumni-web.");
}

if (!fs.existsSync(abs(FILE))) {
  fail(`No encontré ${FILE}`);
}

let source = fs
  .readFileSync(abs(FILE), "utf8")
  .replace(/\r\n/g, "\n");

if (source.includes(MARKER)) {
  console.log("✅ Fix 2.0.1 ya estaba aplicado.");
  process.exit(0);
}

const before = `                    {[
                      [
                        "Publicar",
                        restrictPosts,
                        setRestrictPosts,
                      ],
                      [
                        "Comentar",
                        restrictComments,
                        setRestrictComments,
                      ],
                      [
                        "Mensajes",
                        restrictMessages,
                        setRestrictMessages,
                      ],
                      [
                        "Social",
                        restrictSocial,
                        setRestrictSocial,
                      ],
                    ].map(
                      ([
                        label,
                        enabled,
                        setter,
                      ]) => (
                        <button
                          key={
                            String(
                              label
                            )
                          }
                          type="button"
                          onClick={() =>
                            (
                              setter as React.Dispatch<
                                React.SetStateAction<boolean>
                              >
                            )(
                              !Boolean(
                                enabled
                              )
                            )
                          }
                          className={\`rounded-xl border px-3 py-2.5 text-xs font-black \${
                            enabled
                              ? "border-[var(--app-accent)] bg-[var(--app-accent-soft)] text-[var(--app-accent)]"
                              : "border-[var(--app-border)] text-[var(--app-muted)]"
                          }\`}
                        >
                          {
                            label
                          }
                        </button>
                      )
                    )}`;

const after = `                    {[
                      {
                        label: "Publicar",
                        enabled: restrictPosts,
                        setter: setRestrictPosts,
                      },
                      {
                        label: "Comentar",
                        enabled: restrictComments,
                        setter: setRestrictComments,
                      },
                      {
                        label: "Mensajes",
                        enabled: restrictMessages,
                        setter: setRestrictMessages,
                      },
                      {
                        label: "Social",
                        enabled: restrictSocial,
                        setter: setRestrictSocial,
                      },
                    ].map(
                      ({
                        label,
                        enabled,
                        setter,
                      }) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() =>
                            setter(
                              !enabled
                            )
                          }
                          className={\`rounded-xl border px-3 py-2.5 text-xs font-black \${
                            enabled
                              ? "border-[var(--app-accent)] bg-[var(--app-accent-soft)] text-[var(--app-accent)]"
                              : "border-[var(--app-border)] text-[var(--app-muted)]"
                          }\`}
                        >
                          {label}
                        </button>
                      )
                    )}`;

if (!source.includes(before)) {
  fail(
    "No encontré el bloque esperado. No hice cambios."
  );
}

const backup =
  abs(FILE) +
  ".before-admin-control-center-2.0.1.bak";

if (!fs.existsSync(backup)) {
  fs.writeFileSync(
    backup,
    source,
    "utf8"
  );
}

source = source.replace(
  before,
  after
);

source += `\n/* ${MARKER} */\n`;

try {
  const ts = require("typescript");

  const parsed = ts.createSourceFile(
    FILE,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  const diagnostics =
    parsed.parseDiagnostics || [];

  if (diagnostics.length) {
    const first =
      diagnostics[0];

    const message =
      ts.flattenDiagnosticMessageText(
        first.messageText,
        "\n"
      );

    fail(
      `Sintaxis TSX inválida: ${message}`
    );
  }

  console.log(
    "✅ Parser TypeScript: archivo válido"
  );
} catch (error) {
  if (
    !(
      error &&
      typeof error === "object" &&
      error.code === "MODULE_NOT_FOUND"
    )
  ) {
    throw error;
  }
}

fs.writeFileSync(
  abs(FILE),
  source,
  "utf8"
);

console.log("");
console.log(
  "✅ Centro de Control 2.0.1 aplicado."
);
console.log(
  "✅ Corregido error TypeScript en restricciones."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
