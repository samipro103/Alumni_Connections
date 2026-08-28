const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function fromBase64Url(value) {
  let normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  while (normalized.length % 4) normalized += "=";
  return Buffer.from(normalized, "base64");
}

function toBase64Url(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
  namedCurve: "prime256v1",
});

const publicJwk = publicKey.export({ format: "jwk" });
const privateJwk = privateKey.export({ format: "jwk" });

if (!publicJwk.x || !publicJwk.y || !privateJwk.d) {
  throw new Error("No se pudieron generar las claves VAPID.");
}

const rawPublic = Buffer.concat([
  Buffer.from([0x04]),
  fromBase64Url(publicJwk.x),
  fromBase64Url(publicJwk.y),
]);

const rawPrivate = fromBase64Url(privateJwk.d);

const publicVapid = toBase64Url(rawPublic);
const privateVapid = toBase64Url(rawPrivate);

fs.writeFileSync(
  path.join(__dirname, "VAPID_TEMP.cmd"),
  [
    `set "WEB_PUSH_VAPID_PUBLIC_KEY=${publicVapid}"`,
    `set "WEB_PUSH_VAPID_PRIVATE_KEY=${privateVapid}"`,
    "",
  ].join("\r\n"),
  "utf8"
);

console.log("Claves VAPID generadas.");
console.log("La clave privada se usara solo para configurar Supabase.");
