const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PROFILE = path.join(ROOT, "src", "app", "profile", "page.tsx");
const OLD_CSS = path.join(ROOT, "src", "app", "profile", "profile-option-3-own.css");
const MARKER = "ALUMNI_PROFILE_1_1_1B_BUILD_HOTFIX";

if (!fs.existsSync(PROFILE)) {
  console.error("❌ No encontré:", PROFILE);
  console.error("Ejecutá este parche dentro de alumni-web.");
  process.exit(1);
}

let source = fs.readFileSync(PROFILE, "utf8").replace(/\r\n/g, "\n");

console.log("✅ /profile detectado");
console.log("✅ CRLF/LF normalizado");

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

if (source.includes(MARKER)) {
  console.log("ℹ️ Profile 1.1.1B ya está aplicado.");
  process.exit(0);
}

/*
 * El 1.1.1 insertó por error el perfil profesional DENTRO de:
 *
 * if (!profile) {
 *   return (
 *     <AppShell>
 *       <div className="alumni-profile-pro" ...
 *
 * Debe existir primero el empty state y DESPUÉS el render real.
 */
const brokenPrefix = `  if (!profile) {
    return (
    <AppShell>
      <div className="alumni-profile-pro" data-profile-design="option-3-pro-exact">`;

const fixedPrefix = `  if (!profile) {
    return (
      <AppShell>
        <AlumniEmptyState
          eyebrow="Perfil"
          title="No pudimos mostrar tu perfil."
          description="Vuelve a intentarlo o revisa la configuración de tu cuenta."
          actionHref="/settings?section=profile"
          actionLabel="Abrir configuración"
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="alumni-profile-pro" data-profile-design="option-3-pro-exact">`;

if (source.includes(brokenPrefix)) {
  source = source.replace(brokenPrefix, fixedPrefix);
  console.log("✅ Render profesional sacado del if (!profile)");
  console.log("✅ Estado vacío de perfil restaurado");
} else if (
  source.includes('data-profile-design="option-3-pro-exact"') &&
  source.includes('title="No pudimos mostrar tu perfil."')
) {
  console.log("ℹ️ La estructura if (!profile) ya parece corregida");
} else {
  fail(
    "No encontré la estructura rota esperada de Profile 1.1.1. " +
    "No haré cambios a ciegas."
  );
}

/* Evitar que el CSS anterior se monte sobre la versión profesional actual. */
const oldImport = 'import "./profile-option-3-own.css";\n';

if (source.includes(oldImport)) {
  source = source.replace(oldImport, "");
  console.log("✅ Import del CSS viejo Profile 1.1.0 retirado");
} else {
  console.log("ℹ️ El CSS viejo ya no estaba importado");
}

/*
 * La versión nueva debe conservar su CSS profesional.
 */
if (!source.includes('import "./profile-professional-exact-1-1-1.css";')) {
  fail("Falta el CSS profesional 1.1.1; no guardaré un perfil incompleto.");
}

/*
 * Validaciones estructurales antes de guardar.
 */
const requiredTokens = [
  'data-profile-design="option-3-pro-exact"',
  'alumni-profile-pro-cover',
  'alumni-profile-pro-avatar',
  'alumni-profile-pro-actions',
  'alumni-profile-pro-stats',
  'alumni-profile-pro-tabs',
  'setTab("posts")',
  'setTab("saved")',
  'setTab("activity")',
  'ProfileSavedTab userId={profile.id}',
  'ProfessionalProfileOverview',
  'ProfilePassportPreview',
];

for (const token of requiredTokens) {
  if (!source.includes(token)) {
    fail("Validación visual/estructural: falta " + token);
  }
}

if (!source.includes(`  if (!profile) {
    return (
      <AppShell>
        <AlumniEmptyState`)) {
  fail("El estado vacío de perfil no quedó correctamente restaurado.");
}

if (!source.includes(`  }

  return (
    <AppShell>
      <div className="alumni-profile-pro"`)) {
  fail("El render principal todavía no quedó fuera de if (!profile).");
}

/*
 * Validación TSX real usando TypeScript del proyecto.
 * Si existe un error de parsing, NO escribe el archivo.
 */
try {
  const ts = require("typescript");

  const parsed = ts.createSourceFile(
    "page.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  const diagnostics = parsed.parseDiagnostics || [];

  if (diagnostics.length > 0) {
    const first = diagnostics[0];
    const message = ts.flattenDiagnosticMessageText(
      first.messageText,
      "\n"
    );

    let where = "";

    if (typeof first.start === "number") {
      const pos = parsed.getLineAndCharacterOfPosition(first.start);
      where = ` línea ${pos.line + 1}, columna ${pos.character + 1}`;
    }

    fail("TypeScript todavía detecta error de sintaxis" + where + ": " + message);
  }

  console.log("✅ Parser TypeScript: TSX válido");
} catch (error) {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "MODULE_NOT_FOUND"
  ) {
    console.warn("⚠️ No pude cargar TypeScript para validación extra.");
  } else {
    throw error;
  }
}

/* Backup local antes de escribir. */
const backup = PROFILE + ".before-profile-1.1.1b.bak";
if (!fs.existsSync(backup)) {
  fs.copyFileSync(PROFILE, backup);
  console.log("✅ Backup creado: page.tsx.before-profile-1.1.1b.bak");
}

/* Marca final. */
source += `\n/* ${MARKER} */\n`;

fs.writeFileSync(PROFILE, source, "utf8");

if (fs.existsSync(OLD_CSS)) {
  fs.unlinkSync(OLD_CSS);
  console.log("✅ CSS viejo profile-option-3-own.css eliminado");
}

console.log("");
console.log("✅ ALUMNI Profile 1.1.1B aplicado COMPLETO.");
console.log("✅ Error Expected '}' corregido estructuralmente.");
console.log("✅ if (!profile) restaurado.");
console.log("✅ Render profesional fuera del estado null.");
console.log("✅ CSS anterior retirado para evitar estilos montados.");
console.log("✅ Diseño profesional 1.1.1 conservado.");
console.log("");
console.log("Ahora ejecutá: npm run build");
