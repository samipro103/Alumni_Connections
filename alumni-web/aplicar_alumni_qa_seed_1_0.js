const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const HERE = __dirname;

const TARGET_DIR =
  path.join(
    ROOT,
    "scripts",
    "qa-demo"
  );

const FILES = [
  "seed_alumni_demo.js",
  "cleanup_alumni_demo.js",
];

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

const packageJson =
  path.join(
    ROOT,
    "package.json"
  );

if (
  !fs.existsSync(
    packageJson
  )
) {
  fail(
    "No encontré package.json. Ejecutá este archivo dentro de alumni-web."
  );
}

fs.mkdirSync(
  TARGET_DIR,
  {
    recursive: true,
  }
);

for (
  const name of FILES
) {
  const source =
    path.join(
      HERE,
      name
    );

  if (
    !fs.existsSync(
      source
    )
  ) {
    fail(
      `No encontré ${name} dentro del ZIP extraído.`
    );
  }

  const target =
    path.join(
      TARGET_DIR,
      name
    );

  fs.copyFileSync(
    source,
    target
  );

  console.log(
    "✅",
    path.relative(
      ROOT,
      target
    )
  );
}

console.log("");
console.log(
  "✅ ALUMNI QA Seed 1.0 instalado localmente."
);
console.log("");
console.log(
  "Este instalador NO ha creado usuarios ni publicaciones todavía."
);
console.log("");
console.log(
  "Para llenar la app:"
);
console.log(
  "node .\\scripts\\qa-demo\\seed_alumni_demo.js --confirm=ALUMNI-QA"
);
console.log("");
console.log(
  "Para borrar TODO el QA creado por ese run:"
);
console.log(
  "node .\\scripts\\qa-demo\\cleanup_alumni_demo.js --confirm=DELETE-ALUMNI-QA"
);
console.log("");
