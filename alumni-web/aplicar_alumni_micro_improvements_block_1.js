const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER = "ALUMNI_MICRO_IMPROVEMENTS_BLOCK_1";

const files = {
  owner: "src/app/profile/page.tsx",
  public: "src/app/u/[username]/page.tsx",
  overview: "src/components/profile/ProfessionalProfileOverview.tsx",
  chat: "src/app/messages/[username]/page.tsx",
  profileCss: "src/app/profile/profile-micro-polish-1-0.css",
  messageCss: "src/app/messages/chat-composer-pro-1-0.css",
};

function abs(rel) { return path.join(ROOT, rel); }
function fail(message) { console.error("❌ " + message); process.exit(1); }
function read(rel) {
  if (!fs.existsSync(abs(rel))) fail(`No encontré ${rel}. Ejecutá el parche desde alumni-web.`);
  return fs.readFileSync(abs(rel), "utf8").replace(/\r\n/g, "\n");
}
function backup(rel, content) {
  const bak = abs(rel) + ".before-micro-improvements-block-1.bak";
  if (!fs.existsSync(bak)) fs.writeFileSync(bak, content, "utf8");
}
function replaceRequired(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) fail(`No encontré ${label}. No escribí cambios.`);
  return source.replace(before, after);
}

if (!fs.existsSync(abs("package.json"))) fail("Ejecutá este parche dentro de alumni-web.");

let owner = read(files.owner);
let publicProfile = read(files.public);
let chat = read(files.chat);
const overviewCurrent = read(files.overview);

backup(files.owner, owner);
backup(files.public, publicProfile);
backup(files.chat, chat);
backup(files.overview, overviewCurrent);

// Perfil propio: quitar controles superpuestos del banner.
owner = owner.replace("  Share2,\n", "");
owner = owner.replace("  ArrowLeft,\n", "");
const ownerButtons = `              <button
                type="button"
                onClick={() => router.back()}
                className="alumni-profile-launch-cover-action is-back"
                aria-label="Volver"
              >
                <ArrowLeft size={19} />
              </button>

              <button
                type="button"
                onClick={shareProfile}
                className="alumni-profile-launch-cover-action is-share"
                aria-label="Compartir perfil"
              >
                <Share2 size={18} />
              </button>
`;
if (owner.includes(ownerButtons)) owner = owner.replace(ownerButtons, "");

if (!owner.includes('import "./profile-micro-polish-1-0.css";')) {
  owner = replaceRequired(
    owner,
    'import "./profile-option-3-selected-2-0.css";',
    'import "./profile-option-3-selected-2-0.css";\nimport "./profile-micro-polish-1-0.css";',
    "import CSS de perfil propio"
  );
}

// Perfil público: quitar flecha/compartir superpuestos del banner.
publicProfile = publicProfile.replace("  ArrowLeft,\n", "");
const publicButtons = `            <button
              type="button"
              onClick={() => router.back()}
              className="alumni-profile-v3-top-button is-left"
              aria-label="Volver"
            >
              <ArrowLeft size={19} />
            </button>

            <button
              type="button"
              onClick={shareProfile}
              className="alumni-profile-v3-top-button is-right"
              aria-label="Compartir perfil"
            >
              <Share2 size={18} />
            </button>
`;
if (publicProfile.includes(publicButtons)) publicProfile = publicProfile.replace(publicButtons, "");

if (!publicProfile.includes('import "../../profile/profile-micro-polish-1-0.css";')) {
  publicProfile = replaceRequired(
    publicProfile,
    'import "../../profile/profile-option-3-selected-2-0.css";',
    'import "../../profile/profile-option-3-selected-2-0.css";\nimport "../../profile/profile-micro-polish-1-0.css";',
    "import CSS de perfil público"
  );
}

// Mensajes: reemplazar iconografía y sumar capa visual pro.
chat = chat.replace("  ImagePlus,\n", "  Plus,\n");
chat = chat.replace("  Send,\n", "  ArrowUp,\n");
chat = chat.replace(
  `<ImagePlus\n                size={19}\n              />`,
  `<Plus\n                size={19}\n                strokeWidth={2.1}\n              />`
);
chat = chat.replace(
  `<Send\n                  size={17}\n                />`,
  `<ArrowUp\n                  size={18}\n                  strokeWidth={2.3}\n                />`
);

if (!chat.includes('import "../chat-composer-pro-1-0.css";')) {
  chat = replaceRequired(
    chat,
    'import "../messages-design-1-6.css";',
    'import "../messages-design-1-6.css";\nimport "../chat-composer-pro-1-0.css";',
    "import CSS del composer"
  );
}

if (!owner.includes(MARKER)) owner += `\n/* ${MARKER}:OWNER_PROFILE */\n`;
if (!publicProfile.includes(MARKER)) publicProfile += `\n/* ${MARKER}:PUBLIC_PROFILE */\n`;
if (!chat.includes(MARKER)) chat += `\n/* ${MARKER}:DIRECT_CHAT */\n`;

const overview = "\"use client\";\n\nimport { motion, useReducedMotion } from \"framer-motion\";\nimport { MapPin } from \"lucide-react\";\n\ntype Props = {\n  profile: any;\n  posts: any[];\n  followers: number;\n  following: number;\n  own?: boolean;\n};\n\nfunction first(...values: unknown[]) {\n  return values.find(\n    (value) => typeof value === \"string\" && value.trim()\n  ) as string | undefined;\n}\n\nexport default function ProfessionalProfileOverview({ profile }: Props) {\n  const reduceMotion = useReducedMotion();\n  const city = first(profile?.residence_city, profile?.city);\n  const country = first(\n    profile?.residence_country_name,\n    profile?.country,\n    profile?.nationality_name,\n    profile?.nationality\n  );\n  const location = [city, country].filter(Boolean).join(\", \");\n\n  if (!location) return null;\n\n  return (\n    <motion.section\n      className=\"alumni-profile-location\"\n      initial={reduceMotion ? false : { opacity: 0, y: 7 }}\n      animate={{ opacity: 1, y: 0 }}\n      transition={{ duration: 0.38, ease: [0.2, 0.8, 0.2, 1] }}\n    >\n      <span className=\"alumni-profile-location-icon\" aria-hidden=\"true\">\n        <MapPin size={16} strokeWidth={1.9} />\n      </span>\n      <div className=\"alumni-profile-location-copy\">\n        <span>Ubicación</span>\n        <strong>{location}</strong>\n      </div>\n    </motion.section>\n  );\n}\n\n/* ALUMNI_MICRO_IMPROVEMENTS_BLOCK_1 */\n";
const profileCss = "/* ALUMNI_MICRO_IMPROVEMENTS_BLOCK_1 */\n.alumni-profile-launch-cover-action,\n.alumni-profile-v3-top-button{display:none!important}\n.alumni-profile-launch-cover,.alumni-profile-v3-cover{isolation:isolate}\n.alumni-profile-launch-cover-overlay{background:linear-gradient(180deg,rgba(3,6,10,0) 0%,rgba(3,6,10,.04) 55%,rgba(3,6,10,.26) 100%)!important}\n.alumni-profile-v3-cover-shade{background:linear-gradient(180deg,rgba(3,6,10,0) 0%,rgba(3,6,10,.03) 56%,rgba(3,6,10,.25) 100%)!important}\n.alumni-profile-launch-cover-image,.alumni-profile-v3-cover-image,.alumni-profile-launch-cover-fallback,.alumni-profile-v3-cover-fallback{animation:alumniProfileBannerReveal .52s cubic-bezier(.2,.8,.2,1) both}\n.alumni-profile-v3-activity{gap:18px!important;padding-top:20px!important}\n.alumni-profile-v3-activity-card{position:relative;overflow:visible;padding:3px 2px 15px 15px!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;animation:alumniProfileSoftReveal .42s cubic-bezier(.2,.8,.2,1) both}\n.alumni-profile-v3-activity-card::before{content:\"\";position:absolute;top:2px;bottom:15px;left:0;width:2px;border-radius:99px;background:color-mix(in srgb,var(--app-accent) 68%,transparent)}\n.alumni-profile-v3-activity-card span{color:var(--app-muted-2)!important;font-size:9px!important;font-weight:900!important;letter-spacing:.14em!important}\n.alumni-profile-v3-activity-card p{margin-top:9px!important;max-width:46ch;color:var(--app-text-soft)!important;font-size:13.5px!important;font-weight:520;line-height:1.55!important}\n.alumni-profile-location{display:flex;min-width:0;align-items:center;gap:11px;padding:3px 2px 17px;border-bottom:1px solid var(--app-border)}\n.alumni-profile-location-icon{display:inline-flex;width:35px;height:35px;flex:0 0 35px;align-items:center;justify-content:center;border-radius:12px;background:color-mix(in srgb,var(--app-accent) 9%,transparent);color:var(--app-accent)}\n.alumni-profile-location-copy{min-width:0}\n.alumni-profile-location-copy span{display:block;color:var(--app-muted-3);font-size:8.5px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}\n.alumni-profile-location-copy strong{display:block;margin-top:4px;overflow:hidden;color:var(--app-text-soft);font-size:13px;font-weight:760;line-height:1.3;text-overflow:ellipsis;white-space:nowrap}\n@keyframes alumniProfileBannerReveal{from{opacity:.45;transform:scale(1.018)}to{opacity:1;transform:scale(1)}}\n@keyframes alumniProfileSoftReveal{from{opacity:0;transform:translate3d(0,7px,0)}to{opacity:1;transform:translate3d(0,0,0)}}\n@media(prefers-reduced-motion:reduce){.alumni-profile-launch-cover-image,.alumni-profile-v3-cover-image,.alumni-profile-launch-cover-fallback,.alumni-profile-v3-cover-fallback,.alumni-profile-v3-activity-card{animation:none!important}}\n@media(max-width:374px){.alumni-profile-location-copy strong{font-size:12.5px}.alumni-profile-v3-activity-card p{font-size:13px!important}}\n";
const messageCss = "/* ALUMNI_MICRO_IMPROVEMENTS_BLOCK_1 */\n.alumni-chat-focused .alumni-chat-focus-composer-shell{padding:7px 9px max(8px,env(safe-area-inset-bottom))!important;border-top:0!important;background:color-mix(in srgb,var(--app-bg) 84%,transparent)!important;box-shadow:0 -12px 34px color-mix(in srgb,var(--app-shadow) 12%,transparent);backdrop-filter:blur(18px) saturate(1.08);-webkit-backdrop-filter:blur(18px) saturate(1.08);animation:alumniChatComposerReveal .36s cubic-bezier(.2,.8,.2,1) both}\n.alumni-chat-focused .alumni-chat-focus-composer,.alumni-chat-focused .alumni-chat-composer{min-height:50px!important;align-items:center!important;gap:5px!important;padding:5px!important;border:1px solid color-mix(in srgb,var(--app-text) 7%,var(--app-border))!important;border-radius:22px!important;background:color-mix(in srgb,var(--app-surface) 88%,transparent)!important;box-shadow:inset 0 1px 0 color-mix(in srgb,white 4%,transparent)!important;transition:border-color 160ms ease,background-color 160ms ease,box-shadow 180ms ease}\n.alumni-chat-focused .alumni-chat-focus-composer:focus-within,.alumni-chat-focused .alumni-chat-composer:focus-within{border-color:color-mix(in srgb,var(--app-accent) 36%,var(--app-border))!important;box-shadow:0 0 0 3px color-mix(in srgb,var(--app-accent) 6%,transparent)!important}\n.alumni-chat-focused .alumni-chat-composer textarea{min-height:38px!important;max-height:116px!important;padding:9px 5px 8px!important;color:var(--app-text)!important;font-size:16px!important;line-height:1.25!important}\n.alumni-chat-focused .alumni-chat-composer textarea::placeholder{color:var(--app-muted-2)!important}\n.alumni-chat-focused .alumni-chat-attach{width:38px!important;height:38px!important;flex:0 0 38px;border:1px solid color-mix(in srgb,var(--app-text) 5%,var(--app-border));border-radius:999px!important;background:var(--app-soft)!important;color:var(--app-text-soft)!important;transition:transform 150ms cubic-bezier(.2,.8,.2,1),background-color 160ms ease,color 160ms ease}\n.alumni-chat-focused .alumni-chat-attach:active{transform:scale(.93);background:var(--app-soft-strong)!important}\n.alumni-chat-focused .alumni-chat-send,.alumni-chat-focused .alumni-chat-composer button[type=\"submit\"]{width:40px!important;height:40px!important;min-width:40px!important;flex:0 0 40px;border:1px solid color-mix(in srgb,var(--app-accent) 24%,transparent)!important;border-radius:999px!important;background:var(--app-accent-fill)!important;color:var(--app-on-accent)!important;box-shadow:0 7px 20px color-mix(in srgb,var(--app-accent) 18%,transparent)!important;transition:transform 150ms cubic-bezier(.2,.8,.2,1),box-shadow 170ms ease,opacity 150ms ease}\n.alumni-chat-focused .alumni-chat-send:not(:disabled):active{transform:scale(.91)}\n.alumni-chat-focused .alumni-chat-send:disabled{box-shadow:none!important}\nhtml[data-theme=\"light\"] .alumni-chat-focused .alumni-chat-focus-composer,html[data-theme=\"light\"] .alumni-chat-focused .alumni-chat-composer{background:rgba(247,248,251,.94)!important}\nhtml[data-theme=\"dark\"] .alumni-chat-focused .alumni-chat-focus-composer,html[data-theme=\"dark\"] .alumni-chat-focused .alumni-chat-composer{background:rgba(21,25,32,.94)!important}\n@keyframes alumniChatComposerReveal{from{opacity:0;transform:translate3d(0,7px,0)}to{opacity:1;transform:translate3d(0,0,0)}}\n@media(prefers-reduced-motion:reduce){.alumni-chat-focused .alumni-chat-focus-composer-shell{animation:none!important}.alumni-chat-focused .alumni-chat-focus-composer,.alumni-chat-focused .alumni-chat-composer,.alumni-chat-focused .alumni-chat-attach,.alumni-chat-focused .alumni-chat-send{transition:none!important}}\n";

try {
  const ts = require("typescript");
  const checks = [
    [files.owner, owner],
    [files.public, publicProfile],
    [files.overview, overview],
    [files.chat, chat],
  ];
  for (const [name, source] of checks) {
    const parsed = ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const diagnostics = parsed.parseDiagnostics || [];
    if (diagnostics.length) {
      const first = diagnostics[0];
      fail(`${name}: ${ts.flattenDiagnosticMessageText(first.messageText, "\\n")}`);
    }
  }
  console.log("✅ Parser TypeScript: archivos válidos");
} catch (error) {
  if (!(error && typeof error === "object" && error.code === "MODULE_NOT_FOUND")) throw error;
}

fs.writeFileSync(abs(files.owner), owner, "utf8");
fs.writeFileSync(abs(files.public), publicProfile, "utf8");
fs.writeFileSync(abs(files.overview), overview, "utf8");
fs.writeFileSync(abs(files.chat), chat, "utf8");
fs.writeFileSync(abs(files.profileCss), profileCss, "utf8");
fs.writeFileSync(abs(files.messageCss), messageCss, "utf8");

console.log("");
console.log("✅ BLOQUE 1 aplicado.");
console.log("✅ Portadas de perfil sin botones encima.");
console.log("✅ Formación eliminada del perfil público.");
console.log("✅ Ubicación/país simplificados.");
console.log("✅ Acerca de más limpio.");
console.log("✅ Barra de mensajes refinada.");
console.log("✅ Send reemplazado por ArrowUp.");
console.log("✅ Adjuntar reemplazado por +.");
console.log("✅ Motion incluido.");
console.log("");
console.log("Ahora ejecutá: npm run build");
