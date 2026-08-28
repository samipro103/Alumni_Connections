const fs = require("fs");
const path = require("path");

const PROJECT =
  "C:\\Users\\SAMI PC\\Documents\\Alumni_Connections\\alumni-web";

function fail(message) {
  console.error("\nERROR:", message);
  process.exit(1);
}

if (!fs.existsSync(path.join(PROJECT, "src", "app", "feed", "page.tsx"))) {
  fail("No encontre alumni-web.");
}

const payload = JSON.parse(
  fs.readFileSync(path.join(__dirname, "payload.json"), "utf8")
);

for (const [relative, encoded] of Object.entries(payload)) {
  const destination = path.join(PROJECT, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, Buffer.from(encoded, "base64"));
  console.log("OK:", relative);
}

const authPath = path.join(
  PROJECT,
  "src",
  "components",
  "auth",
  "AuthProvider.tsx"
);

let auth = fs.readFileSync(authPath, "utf8");

if (!auth.includes("@/components/pwa/WebPushBootstrap")) {
  const anchor =
    'import NativePushNotifications from "@/components/mobile/NativePushNotifications";';

  if (!auth.includes(anchor)) {
    fail("No encontre el import NativePushNotifications en AuthProvider.tsx.");
  }

  auth = auth.replace(
    anchor,
    `${anchor}\nimport WebPushBootstrap from "@/components/pwa/WebPushBootstrap";`
  );
}

if (!auth.includes("<WebPushBootstrap")) {
  const nativeBlock =
`<NativePushNotifications
        userId={user?.id ?? null}
      />`;

  if (!auth.includes(nativeBlock)) {
    fail("No encontre el bloque NativePushNotifications en AuthProvider.tsx.");
  }

  auth = auth.replace(
    nativeBlock,
`${nativeBlock}
      <WebPushBootstrap
        userId={user?.id ?? null}
      />`
  );
}

fs.writeFileSync(authPath, auth, "utf8");
console.log("OK: src/components/auth/AuthProvider.tsx");

console.log("");
console.log("==============================================");
console.log(" OK: ALUMNI PWA PUSH IPHONE 1.0 APLICADO");
console.log("==============================================");
console.log("");
console.log("Ahora ejecuta el SQL y luego CONFIGURAR_VAPID_Y_DEPLOY_PUSH.bat");
