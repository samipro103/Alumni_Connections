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

const payloadPath = path.join(__dirname, "payload.json");
if (!fs.existsSync(payloadPath)) {
  fail("Falta payload.json.");
}

const payload = JSON.parse(
  fs.readFileSync(payloadPath, "utf8")
);

for (const [relative, encoded] of Object.entries(payload)) {
  const destination = path.join(PROJECT, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, Buffer.from(encoded, "base64"));
  console.log("OK:", relative);
}

const googlePath = path.join(
  PROJECT,
  "android",
  "app",
  "google-services.json"
);

if (!fs.existsSync(googlePath)) {
  fail("Falta android\\app\\google-services.json");
}

let google;
try {
  google = JSON.parse(fs.readFileSync(googlePath, "utf8"));
} catch {
  fail("google-services.json no es un JSON valido.");
}

const packageNames = (google?.client || [])
  .map(
    (item) =>
      item?.client_info?.android_client_info?.package_name
  )
  .filter(Boolean);

console.log(
  "Firebase package(s):",
  packageNames.join(", ") || "(ninguno)"
);

if (!packageNames.includes("com.alumniconnections.app")) {
  fail(
    "Ese google-services.json NO corresponde a com.alumniconnections.app"
  );
}

console.log(
  "[OK] google-services.json corresponde a AlumniConnections"
);
