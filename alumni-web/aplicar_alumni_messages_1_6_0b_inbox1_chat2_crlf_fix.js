const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER = "ALUMNI_MESSAGES_1_6_0B_INBOX1_CHAT2_CRLF_FIX";
const CSS_NAME = "messages-design-1-6.css";

const inboxFile = path.join(ROOT, "src", "app", "messages", "page.tsx");
const chatFile = path.join(ROOT, "src", "app", "messages", "[username]", "page.tsx");
const groupFile = path.join(ROOT, "src", "app", "messages", "group", "[id]", "page.tsx");
const cssFile = path.join(ROOT, "src", "app", "messages", CSS_NAME);

for (const file of [inboxFile, chatFile, groupFile]) {
  if (!fs.existsSync(file)) {
    console.error("❌ No encontré:", file);
    console.error("Ejecutá este parche desde la carpeta alumni-web.");
    process.exit(1);
  }
}

let inbox = fs.readFileSync(inboxFile, "utf8").replace(/\r\n/g, "\n");
let chat = fs.readFileSync(chatFile, "utf8").replace(/\r\n/g, "\n");
let group = fs.readFileSync(groupFile, "utf8").replace(/\r\n/g, "\n");

console.log("✅ Saltos de línea normalizados (Windows CRLF compatible)");

function mustReplace(source, from, to, label) {
  if (!source.includes(from)) {
    console.error(`❌ No encontré el bloque esperado: ${label}`);
    process.exit(1);
  }
  console.log(`✅ ${label}`);
  return source.replace(from, to);
}

function ensureImport(source, importLine, afterLine, label) {
  if (source.includes(importLine)) {
    console.log(`ℹ️ ${label} ya estaba importado`);
    return source;
  }

  if (!source.includes(afterLine)) {
    console.error(`❌ No encontré el punto de importación: ${label}`);
    process.exit(1);
  }

  console.log(`✅ ${label}`);
  return source.replace(afterLine, `${afterLine}\n${importLine}`);
}

/* ================================================================
   INBOX — OPCIÓN 1
   ================================================================ */
if (!inbox.includes(MARKER)) {
  inbox = ensureImport(
    inbox,
    `import "./${CSS_NAME}";`,
    `import CreateMessageGroupModal from "@/components/messages/CreateMessageGroupModal";`,
    "CSS Inbox limpio"
  );

  inbox = mustReplace(
    inbox,
    `<div className="alumni-messages-page mx-auto w-full max-w-[820px]">`,
    `<div className="alumni-messages-page alumni-inbox-clean mx-auto w-full max-w-[820px]" data-messages-design="inbox-clean">`,
    "Wrapper Inbox limpio"
  );

  inbox = mustReplace(
    inbox,
    `<div className="flex items-end gap-4 pb-5 pt-1 sm:pb-7 sm:pt-2">`,
    `<div className="alumni-inbox-header flex items-center gap-4">`,
    "Cabecera Inbox"
  );

  if (
    /<p className="[^"]*">\s*Conversaciones de tu comunidad Alumni\.\s*<\/p>/.test(inbox)
  ) {
    inbox = inbox.replace(
      /<p className="[^"]*">\s*Conversaciones de tu comunidad Alumni\.\s*<\/p>/,
      `<p className="alumni-inbox-subtitle">
              Conversaciones de tu comunidad Alumni.
            </p>`
    );
    console.log("✅ Subtítulo Inbox");
  } else {
    console.error("❌ No encontré el subtítulo actual del Inbox.");
    process.exit(1);
  }

  inbox = mustReplace(
    inbox,
    `<div className="flex items-center gap-2">`,
    `<div className="alumni-inbox-actions flex items-center gap-2">`,
    "Acciones Inbox"
  );

  inbox = mustReplace(
    inbox,
    `<div className="alumni-messages-search flex h-12 items-center gap-2 border-b border-[var(--app-border)]">`,
    `<div className="alumni-messages-search alumni-inbox-search flex items-center gap-2">`,
    "Buscador Inbox"
  );

  inbox = mustReplace(
    inbox,
    `<div className="flex items-center gap-5 border-b border-[var(--app-border)] py-3">`,
    `<div className="alumni-inbox-filters flex items-center gap-2">`,
    "Filtros Inbox"
  );

  inbox = inbox.replace(
    `className="relative py-1 text-[13px] font-black transition`,
    `className="alumni-inbox-filter-chip text-[12px] font-black transition`
  );
  inbox = inbox.replace(
    `className="relative py-1 text-[13px] font-black transition`,
    `className="alumni-inbox-filter-chip text-[12px] font-black transition`
  );

  // Underline legacy no longer needed; CSS hides it if one remains.
  inbox = inbox.replaceAll(
    `<span className="absolute -bottom-3 left-0 right-0 h-[2px] rounded-full bg-[var(--app-accent)]" />`,
    `<span className="alumni-inbox-filter-legacy-line" />`
  );

  inbox = inbox.replace(
    `<section className="border-b border-[var(--app-border)] py-3">`,
    `<section className="alumni-inbox-groups">`
  );

  inbox = inbox.replace(
    `<div className="divide-y divide-[var(--app-border)]">
            {filteredConversations.map(`,
    `<div className="alumni-inbox-list">
            {filteredConversations.map(`
  );

  inbox += `\n/* ${MARKER} */\n`;
}

/* ================================================================
   DIRECT CHAT — OPCIÓN 2
   ================================================================ */
if (!chat.includes(MARKER)) {
  chat = ensureImport(
    chat,
    `import "../${CSS_NAME}";`,
    `import {
  ComposerReplyPreview,
  MessageReplyQuote,
  SwipeToReply,
} from "@/components/messages/MessageReplyExperience";`,
    "CSS Chat enfocado"
  );

  chat = mustReplace(
    chat,
    `className="alumni-chat-stage fixed inset-x-0 top-[var(--chat-top)] z-[80] mx-auto flex h-[var(--chat-vh)] w-full max-w-[780px] flex-col overflow-hidden overscroll-none bg-[var(--app-bg)] lg:static lg:h-[calc(100vh-132px)] lg:min-h-[540px] lg:rounded-[24px] lg:border lg:border-[var(--app-border)] lg:bg-[var(--app-surface)] lg:shadow-[0_24px_70px_var(--app-shadow)]"`,
    `className="alumni-chat-stage alumni-chat-focused fixed inset-x-0 top-[var(--chat-top)] z-[80] mx-auto flex h-[var(--chat-vh)] w-full flex-col overflow-hidden overscroll-none" data-messages-design="chat-focused"`,
    "Stage Chat enfocado"
  );

  chat = mustReplace(
    chat,
    `<header className="relative z-50 shrink-0 border-b border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_95%,transparent)] pt-[env(safe-area-inset-top)] backdrop-blur-2xl">`,
    `<header className="alumni-chat-focus-header relative z-50 shrink-0 pt-[env(safe-area-inset-top)]">`,
    "Cabecera Chat enfocado"
  );

  chat = mustReplace(
    chat,
    `className="alumni-chat-scroll alumni-chat-wallpaper scrollbar-thin min-h-0 flex-1 overscroll-contain overflow-y-auto px-2.5 py-3 sm:px-5 sm:py-4"`,
    `className="alumni-chat-scroll alumni-chat-wallpaper alumni-chat-focus-scroll scrollbar-thin min-h-0 flex-1 overscroll-contain overflow-y-auto"`,
    "Área de mensajes enfocada"
  );

  chat = mustReplace(
    chat,
    `className="alumni-chat-composer-shell shrink-0 border-t border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_96%,transparent)] px-2 pb-[max(7px,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-2xl sm:px-3 sm:pb-3 sm:pt-2"`,
    `className="alumni-chat-composer-shell alumni-chat-focus-composer-shell shrink-0"`,
    "Composer Chat enfocado"
  );

  chat = mustReplace(
    chat,
    `className="alumni-chat-composer flex items-end gap-1 rounded-[21px] border p-1"`,
    `className="alumni-chat-composer alumni-chat-focus-composer flex items-end gap-1"`,
    "Caja de escritura enfocada"
  );

  chat = chat.replace(
    `className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-[var(--app-accent)] transition active:bg-[var(--app-accent-soft)] disabled:opacity-40"`,
    `className="alumni-chat-attach flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full transition disabled:opacity-40"`
  );

  chat = chat.replace(
    `className="alumni-accent-button flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"`,
    `className="alumni-chat-send flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"`
  );

  chat += `\n/* ${MARKER} */\n`;
}

/* ================================================================
   GROUP CHAT — MISMO LENGUAJE DE CHAT ENFOCADO
   ================================================================ */
if (!group.includes(MARKER)) {
  group = ensureImport(
    group,
    `import "../../${CSS_NAME}";`,
    `import {
  ComposerReplyPreview,
  MessageReplyQuote,
  SwipeToReply,
} from "@/components/messages/MessageReplyExperience";`,
    "CSS Chat enfocado en grupos"
  );

  const groupStageOld =
    `className="fixed inset-x-0 top-0 z-[80] mx-auto flex h-[100dvh] w-full max-w-[780px] flex-col overflow-hidden bg-[var(--app-bg)] lg:static lg:h-[calc(100vh-120px)] lg:min-h-[560px] lg:rounded-[24px] lg:border lg:border-[var(--app-border)] lg:bg-[var(--app-surface)]"`;

  if (group.includes(groupStageOld)) {
    group = group.replace(
      groupStageOld,
      `className="alumni-chat-stage alumni-chat-focused alumni-group-chat-focused fixed inset-x-0 top-0 z-[80] mx-auto flex h-[100dvh] w-full flex-col overflow-hidden" data-messages-design="chat-focused"`
    );
    console.log("✅ Stage grupo enfocado");
  } else {
    console.error("❌ No encontré el stage actual del chat grupal.");
    process.exit(1);
  }

  group = group.replace(
    `<header className="relative z-20 shrink-0 border-b border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_96%,transparent)] pt-[env(safe-area-inset-top)] backdrop-blur-2xl">`,
    `<header className="alumni-chat-focus-header relative z-20 shrink-0 pt-[env(safe-area-inset-top)]">`
  );

  group = group.replace(
    `className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 py-3 sm:px-5 sm:py-4"`,
    `className="alumni-chat-scroll alumni-chat-wallpaper alumni-chat-focus-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain"`
  );

  group = group.replace(
    `className="shrink-0 border-t border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_96%,transparent)] px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl sm:px-3 sm:pb-3"`,
    `className="alumni-chat-composer-shell alumni-chat-focus-composer-shell shrink-0"`
  );

  // If the group has the same base composer class, theme it automatically through CSS.
  group += `\n/* ${MARKER} */\n`;
}

/* ================================================================
   CSS — MOBILE FIRST
   ================================================================ */
const css = `/* ================================================================
   ${MARKER}
   FINAL SELECTION:
   - Outside: Option 1 / Inbox limpio
   - Inside: Option 2 / Chat enfocado
   - No calling UI
   - Mobile-first 360–430 px
   ================================================================ */

/* ------------------------------
   INBOX LIMPIO
   ------------------------------ */
.alumni-inbox-clean {
  width: 100%;
  max-width: 560px !important;
  margin: 0 auto;
  padding: 4px 0 32px;
  color: var(--app-text);
}

.alumni-inbox-clean .alumni-inbox-header {
  min-height: 58px;
  padding: 2px 0 10px;
}

.alumni-inbox-clean .alumni-inbox-header h1 {
  margin: 0;
  font-size: 28px !important;
  line-height: 1;
  font-weight: 950;
  letter-spacing: -.045em;
}

.alumni-inbox-clean .alumni-inbox-subtitle {
  display: none;
}

.alumni-inbox-clean .alumni-inbox-actions {
  flex: 0 0 auto;
}

.alumni-inbox-clean .alumni-inbox-actions > * {
  width: 40px !important;
  height: 40px !important;
  border-radius: 12px !important;
}

.alumni-inbox-clean .alumni-message-new {
  box-shadow: none !important;
}

.alumni-inbox-clean .alumni-inbox-search {
  min-height: 44px;
  height: 44px !important;
  padding: 0 13px;
  border: 0 !important;
  border-radius: 13px;
  background: var(--app-soft-strong);
}

.alumni-inbox-clean .alumni-inbox-search input {
  font-size: 14px !important;
}

.alumni-inbox-clean .alumni-inbox-filters {
  min-height: 44px;
  padding: 8px 0 7px;
  border: 0 !important;
  overflow-x: auto;
  scrollbar-width: none;
}

.alumni-inbox-clean .alumni-inbox-filters::-webkit-scrollbar {
  display: none;
}

.alumni-inbox-clean .alumni-inbox-filter-chip {
  position: static !important;
  min-height: 30px;
  padding: 0 13px !important;
  border: 1px solid transparent;
  border-radius: 999px;
  background: var(--app-soft);
  color: var(--app-muted) !important;
  white-space: nowrap;
}

.alumni-inbox-clean .alumni-inbox-filter-chip:has(.alumni-inbox-filter-legacy-line) {
  border-color: var(--app-text);
  background: var(--app-text);
  color: var(--app-bg) !important;
}

.alumni-inbox-clean .alumni-inbox-filter-legacy-line {
  display: none !important;
}

.alumni-inbox-clean .alumni-inbox-groups {
  margin-top: 3px;
  padding: 8px 0 5px;
  border: 0 !important;
}

.alumni-inbox-clean .alumni-inbox-groups > div:first-child {
  margin-bottom: 0 !important;
}

.alumni-inbox-clean .alumni-inbox-groups > div:first-child > p {
  padding: 7px 0 3px;
  color: var(--app-muted-2) !important;
  font-size: 9px !important;
  letter-spacing: .11em !important;
}

.alumni-inbox-clean .alumni-inbox-groups a,
.alumni-inbox-clean .alumni-conversation-row {
  min-height: 68px;
  padding: 9px 0 !important;
}

.alumni-inbox-clean .alumni-conversation-row {
  gap: 11px !important;
}

.alumni-inbox-clean .alumni-conversation-row > div:first-child > div {
  width: 48px !important;
  height: 48px !important;
}

.alumni-inbox-clean .alumni-conversation-row p {
  line-height: 1.18;
}

.alumni-inbox-clean .alumni-conversation-row > svg {
  display: none !important;
}

.alumni-inbox-clean .alumni-conversation-unread {
  background: transparent !important;
}

.alumni-inbox-clean .alumni-conversation-unread::before {
  display: none !important;
}

html[data-theme="light"] .alumni-inbox-clean .alumni-inbox-search,
html[data-theme="light"] .alumni-inbox-clean .alumni-inbox-filter-chip {
  background: #f0f3f7;
}

html[data-theme="dark"] .alumni-inbox-clean .alumni-inbox-search,
html[data-theme="dark"] .alumni-inbox-clean .alumni-inbox-filter-chip {
  background: var(--app-surface-2);
}

/* ------------------------------
   CHAT ENFOCADO
   ------------------------------ */
.alumni-chat-focused {
  width: 100vw !important;
  max-width: none !important;
  height: var(--chat-vh, 100dvh) !important;
  min-height: 0 !important;
  margin: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: var(--app-bg) !important;
  box-shadow: none !important;
}

.alumni-group-chat-focused {
  height: 100dvh !important;
}

.alumni-chat-focused .alumni-chat-focus-header {
  border-bottom: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-surface) 96%, transparent);
  backdrop-filter: blur(20px) saturate(120%);
  -webkit-backdrop-filter: blur(20px) saturate(120%);
}

.alumni-chat-focused .alumni-chat-focus-header > div:first-child {
  min-height: 56px !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
}

.alumni-chat-focused .alumni-chat-focus-header h1 {
  font-size: 14px !important;
  line-height: 1.15;
}

.alumni-chat-focused .alumni-chat-focus-header p {
  font-size: 10px !important;
  line-height: 1.15;
}

.alumni-chat-focused .alumni-chat-focus-scroll {
  padding: 10px 9px 12px !important;
  background-image: none !important;
  background-color: var(--app-bg) !important;
}

/* Burbujas compactas, iguales a la propuesta seleccionada. */
.alumni-chat-focused .alumni-message-bubble,
.alumni-chat-focused .alumni-message-other,
.alumni-chat-focused .alumni-message-mine {
  max-width: 78% !important;
  border-radius: 16px !important;
  box-shadow: none !important;
}

.alumni-chat-focused .alumni-message-other {
  border: 0 !important;
  background: var(--app-soft-strong) !important;
  color: var(--app-text) !important;
}

.alumni-chat-focused .alumni-message-mine {
  border: 0 !important;
  background: var(--app-accent-fill) !important;
  color: var(--app-on-accent) !important;
}

.alumni-chat-focused .alumni-message-mine p,
.alumni-chat-focused .alumni-message-mine span {
  color: inherit;
}

/* Media sigue teniendo la misma lógica, solo encaja visualmente. */
.alumni-chat-focused .alumni-message-media-mine {
  background: var(--app-accent-soft) !important;
}

.alumni-chat-focused .alumni-chat-focus-composer-shell {
  padding: 6px 8px max(7px, env(safe-area-inset-bottom));
  border-top: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-surface) 97%, transparent);
  backdrop-filter: blur(20px) saturate(120%);
  -webkit-backdrop-filter: blur(20px) saturate(120%);
}

.alumni-chat-focused .alumni-chat-focus-composer,
.alumni-chat-focused .alumni-chat-composer {
  min-height: 46px;
  padding: 3px !important;
  border: 1px solid var(--app-border) !important;
  border-radius: 18px !important;
  background: var(--app-soft) !important;
  box-shadow: none !important;
}

.alumni-chat-focused .alumni-chat-composer textarea {
  min-height: 38px !important;
  max-height: 116px !important;
  padding-top: 9px !important;
  padding-bottom: 8px !important;
  font-size: 16px !important;
}

.alumni-chat-focused .alumni-chat-attach,
.alumni-chat-focused .alumni-chat-composer button[type="button"] {
  color: var(--app-muted);
}

.alumni-chat-focused .alumni-chat-send,
.alumni-chat-focused .alumni-chat-composer button[type="submit"] {
  width: 38px !important;
  height: 38px !important;
  min-width: 38px !important;
  border-radius: 999px !important;
  background: var(--app-accent-fill) !important;
  color: var(--app-on-accent) !important;
  box-shadow: none !important;
}

/* Reply/edit preview: same card language, not a second interface. */
.alumni-chat-focused .alumni-composer-reply-preview {
  margin-bottom: 6px !important;
  border-color: var(--app-border) !important;
  background: var(--app-soft) !important;
}

/* Search panel inside chat */
.alumni-chat-focused .alumni-chat-focus-header input {
  color: var(--app-text) !important;
}

/* Menus and professional tools respect both themes. */
.alumni-chat-focused [class*="bg-[var(--app-surface)]"] {
  border-color: var(--app-border);
}

/* Light */
html[data-theme="light"] .alumni-chat-focused {
  background: #f7f8fa !important;
}

html[data-theme="light"] .alumni-chat-focused .alumni-chat-focus-header,
html[data-theme="light"] .alumni-chat-focused .alumni-chat-focus-composer-shell {
  background: rgba(255,255,255,.96) !important;
}

html[data-theme="light"] .alumni-chat-focused .alumni-message-other {
  background: #eef1f5 !important;
  color: #161b23 !important;
}

html[data-theme="light"] .alumni-chat-focused .alumni-chat-focus-composer {
  background: #f1f3f7 !important;
}

/* Dark */
html[data-theme="dark"] .alumni-chat-focused {
  background: #090b0f !important;
}

html[data-theme="dark"] .alumni-chat-focused .alumni-chat-focus-header,
html[data-theme="dark"] .alumni-chat-focused .alumni-chat-focus-composer-shell {
  background: rgba(16,19,24,.96) !important;
}

html[data-theme="dark"] .alumni-chat-focused .alumni-message-other {
  background: #171c24 !important;
  color: #f4f4f5 !important;
}

html[data-theme="dark"] .alumni-chat-focused .alumni-chat-focus-composer {
  background: #171c24 !important;
}

/* No phone/video-call UI is introduced by this design layer. */

/* ------------------------------
   VERY SMALL PHONES
   ------------------------------ */
@media (max-width: 374px) {
  .alumni-inbox-clean .alumni-inbox-header h1 {
    font-size: 26px !important;
  }

  .alumni-inbox-clean .alumni-inbox-actions > * {
    width: 38px !important;
    height: 38px !important;
  }

  .alumni-chat-focused .alumni-message-bubble,
  .alumni-chat-focused .alumni-message-other,
  .alumni-chat-focused .alumni-message-mine {
    max-width: 82% !important;
  }
}

/* ------------------------------
   DESKTOP SECONDARY ADAPTATION
   Same mobile UI, just centered.
   ------------------------------ */
@media (min-width: 700px) {
  .alumni-inbox-clean {
    max-width: 620px !important;
    padding-top: 18px;
  }

  .alumni-chat-focused {
    position: static !important;
    width: min(680px, calc(100vw - 40px)) !important;
    height: min(820px, calc(100dvh - 120px)) !important;
    margin: 0 auto !important;
    border: 1px solid var(--app-border) !important;
    border-radius: 22px !important;
    overflow: hidden !important;
    box-shadow: 0 22px 60px var(--app-shadow) !important;
  }
}
`;

const validations = [
  [inbox.includes("alumni-inbox-clean"), "Inbox limpio"],
  [inbox.includes("alumni-inbox-search"), "Buscador Inbox"],
  [inbox.includes("alumni-inbox-filters"), "Filtros Inbox"],
  [chat.includes("alumni-chat-focused"), "Chat directo enfocado"],
  [chat.includes("alumni-chat-focus-composer-shell"), "Composer directo"],
  [group.includes("alumni-group-chat-focused"), "Chat grupal enfocado"],
];

for (const [ok, label] of validations) {
  if (!ok) {
    console.error(`❌ Validación final falló: ${label}`);
    process.exit(1);
  }
}

fs.writeFileSync(inboxFile, inbox, "utf8");
fs.writeFileSync(chatFile, chat, "utf8");
fs.writeFileSync(groupFile, group, "utf8");
fs.writeFileSync(cssFile, css, "utf8");

console.log("");
console.log("✅ ALUMNI Messages 1.6.0B aplicado COMPLETO.");
console.log("✅ Inbox = Opción 1 / Inbox limpio.");
console.log("✅ Chat directo = Opción 2 / Chat enfocado.");
console.log("✅ Chat grupal usa el mismo lenguaje visual.");
console.log("✅ Sin botones de llamada.");
console.log("✅ Mobile-first.");
console.log("✅ Claro/Oscuro.");
console.log("✅ Lógica de mensajería conservada.");
console.log("");
console.log("Ahora ejecutá: npm run build");
