const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PAYLOAD = path.join(__dirname, "payload");
const MARKER = "ALUMNI_2_1_2_INVITES_CONTROLS";

function die(message) {
  console.error("\n[ERROR] " + message + "\n");
  process.exit(1);
}

function norm(text) {
  return text.replace(/\r\n/g, "\n");
}

function replaceOnce(source, from, to, label) {
  if (!source.includes(from)) {
    die("No encuentro ancla: " + label);
  }

  console.log("[OK] " + label);
  return source.replace(from, to);
}

function writeLikeOriginal(target, original, next) {
  const crlf = original.includes("\r\n");
  const normalized = norm(next);

  fs.writeFileSync(
    target,
    crlf ? normalized.replace(/\n/g, "\r\n") : normalized,
    "utf8"
  );
}

if (path.basename(ROOT).toLowerCase() !== "alumni-web") {
  die('Ejecuta dentro de "alumni-web".');
}

const replaceFiles = [
  "src/app/events/[id]/page.tsx",
  "src/app/events/[id]/event-detail.css",
  "src/app/community/[slug]/page.tsx",
  "src/app/community/[slug]/community-detail.css",
];

const newFiles = [
  "src/components/social/SocialInvitePicker.tsx",
  "src/components/social/SocialInvitePicker.module.css",
  "src/components/social/InvitationNotificationActions.tsx",
  "src/components/social/InvitationNotificationActions.module.css",
  "src/components/events/EventReminderBootstrap.tsx",
];

const patchFiles = [
  "src/components/layout/AppShell.tsx",
  "src/app/notifications/page.tsx",
];

for (const rel of [...replaceFiles, ...patchFiles]) {
  if (!fs.existsSync(path.join(ROOT, rel))) {
    die("No encuentro " + rel);
  }
}

const currentEvent = fs.readFileSync(
  path.join(ROOT, "src/app/events/[id]/page.tsx"),
  "utf8"
);

if (currentEvent.includes(MARKER)) {
  console.log("[SKIP] ALUMNI 2.1.2 ya estaba aplicado.");
  process.exit(0);
}

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-");

const backupRoot = path.join(
  ROOT,
  ".alumni_backups",
  "2.1.2-invites-controls",
  stamp
);

for (const rel of [...replaceFiles, ...newFiles, ...patchFiles]) {
  const source = path.join(ROOT, rel);

  if (!fs.existsSync(source)) continue;

  const backup = path.join(backupRoot, rel);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(source, backup);
}

for (const rel of [...replaceFiles, ...newFiles]) {
  const source = path.join(PAYLOAD, rel);
  const target = path.join(ROOT, rel);

  if (!fs.existsSync(source)) {
    die("Payload faltante: " + rel);
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  console.log("[OK] " + rel);
}

/* AppShell: reminder check, no UI shell changes */
{
  const file = path.join(ROOT, "src/components/layout/AppShell.tsx");
  const original = fs.readFileSync(file, "utf8");
  let src = norm(original);

  if (!src.includes("ALUMNI_2_1_2_EVENT_REMINDER_BOOTSTRAP:MOUNT")) {
    src = replaceOnce(
      src,
`import AppUtilities from "./AppUtilities";`,
`import AppUtilities from "./AppUtilities";
import EventReminderBootstrap from "@/components/events/EventReminderBootstrap";`,
      "Montar recordatorios de eventos"
    );

    src = replaceOnce(
      src,
`  return (
    <>`,
`  return (
    <>
      <EventReminderBootstrap />`,
      "Activar recordatorio al abrir/focalizar Alumni"
    );

    src += `\n/* ALUMNI_2_1_2_EVENT_REMINDER_BOOTSTRAP:MOUNT */\n`;
  }

  writeLikeOriginal(file, original, src);
}

/* Notifications: readable community/event copy + direct actions */
{
  const file = path.join(ROOT, "src/app/notifications/page.tsx");
  const original = fs.readFileSync(file, "utf8");
  let src = norm(original);

  if (!src.includes("ALUMNI_2_1_2_NOTIFICATION_INVITES")) {
    src = replaceOnce(
      src,
`  Bell,
  CheckCheck,`,
`  Bell,
  CalendarDays,
  CheckCheck,`,
      "Icono de eventos en Notificaciones"
    );

    src = replaceOnce(
      src,
`import { hydratePostMediaItems } from "@/lib/feedMedia";`,
`import { hydratePostMediaItems } from "@/lib/feedMedia";
import InvitationNotificationActions from "@/components/social/InvitationNotificationActions";`,
      "Acciones de invitación en Notificaciones"
    );

    src = replaceOnce(
      src,
`  if (
    ["follow", "follow_request", "follow_request_accepted"].includes(t)
  ) {
    return "connections";
  }`,
`  if (
    [
      "follow",
      "follow_request",
      "follow_request_accepted",
      "community_invite",
      "community_join_request",
      "event_invite",
      "event_reminder",
    ].includes(t)
  ) {
    return "connections";
  }`,
      "Clasificar invitaciones claramente"
    );

    src = replaceOnce(
      src,
`    case "group_mention":
      return plural
        ? "te mencionaron en un grupo"
        : "te mencionó en un grupo";

    default:`,
`    case "group_mention":
      return plural
        ? "te mencionaron en un grupo"
        : "te mencionó en un grupo";

    case "community_invite":
      return "te invitó a una comunidad";

    case "community_join_request":
      return "quiere entrar a tu comunidad";

    case "event_invite":
      return "te invitó a un evento";

    case "event_reminder":
      return "te recuerda que tienes un evento dentro de las próximas 24 horas";

    default:`,
      "Texto simple para invitaciones y recordatorios"
    );

    src = replaceOnce(
      src,
`    case "mention":
    case "group_mention":
      return AtSign;

    default:`,
`    case "mention":
    case "group_mention":
      return AtSign;

    case "event_invite":
    case "event_reminder":
      return CalendarDays;

    case "community_invite":
    case "community_join_request":
      return UserPlus;

    default:`,
      "Iconos claros para comunidad/evento"
    );

    src = replaceOnce(
      src,
`function actorText(group: GroupedNotification) {
  const names = group.actors`,
`function actorText(group: GroupedNotification) {
  if (group.type === "event_reminder") {
    return "Alumni";
  }

  const names = group.actors`,
      "Recordatorio sin actor artificial"
    );

    src = replaceOnce(
      src,
`    if (group.type === "story_reply") {`,
`    if (group.targetType === "event") {
      router.push(\`/events/\${encodeURIComponent(group.targetId)}\`);
      return;
    }

    if (group.targetType === "community") {
      const { data: community } = await supabase
        .from("communities")
        .select("slug")
        .eq("id", group.targetId)
        .maybeSingle();

      if (community?.slug) {
        router.push(\`/community/\${community.slug}\`);
      } else {
        router.push("/community");
      }
      return;
    }

    if (group.type === "story_reply") {`,
      "Abrir destino exacto de evento/comunidad"
    );

    src = replaceOnce(
      src,
`                            {requestOpen && (
                              <div className="alumni-notification-request-actions">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void acceptRequest(group)
                                  }
                                  disabled={
                                    requestBusy === group.targetId
                                  }
                                >
                                  Aceptar
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void rejectRequest(group)
                                  }
                                  disabled={
                                    requestBusy === group.targetId
                                  }
                                >
                                  Rechazar
                                </button>
                              </div>
                            )}`,
`                            {requestOpen && (
                              <div className="alumni-notification-request-actions">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void acceptRequest(group)
                                  }
                                  disabled={
                                    requestBusy === group.targetId
                                  }
                                >
                                  Aceptar
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void rejectRequest(group)
                                  }
                                  disabled={
                                    requestBusy === group.targetId
                                  }
                                >
                                  Rechazar
                                </button>
                              </div>
                            )}

                            <InvitationNotificationActions
                              type={group.type}
                              targetId={group.targetId}
                              actorId={group.actors[0]?.id || null}
                              onDone={() =>
                                loadPage(0, true, false)
                              }
                            />`,
      "Aceptar/rechazar comunidad o evento desde Notificaciones"
    );

    src += `\n/* ALUMNI_2_1_2_NOTIFICATION_INVITES */\n`;
  }

  writeLikeOriginal(file, original, src);
}

console.log("");
console.log("============================================================");
console.log(" ALUMNI 2.1.2 - INVITACIONES + CONTROLES");
console.log("============================================================");
console.log("[OK] RSVP rediseñado y más fácil de entender");
console.log("[OK] Voy / Me interesa / No puedo con estado visible");
console.log("[OK] Invitar personas desde comunidad");
console.log("[OK] Invitar personas desde evento");
console.log("[OK] Solo muestra conexiones relevantes");
console.log("[OK] Estado Invitada evita repetir invitaciones");
console.log("[OK] Invitación comunidad/evento llega a Notificaciones");
console.log("[OK] Aceptar/Rechazar directamente desde Notificaciones");
console.log("[OK] Solicitud a comunidad privada también se resuelve ahí");
console.log("[OK] Recordatorio 24 h generado al abrir o volver a Alumni");
console.log("[OK] Recordatorio no se duplica");
console.log("[OK] Diseño abierto, sin cards nuevas");
console.log("[OK] Supabase YA migrado");
console.log("[OK] Backup: " + backupRoot);
console.log("");
console.log("Ejecuta ahora: npm run build");
console.log("============================================================");
