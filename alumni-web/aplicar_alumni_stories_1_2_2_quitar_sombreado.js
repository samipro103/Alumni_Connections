const fs = require("fs");
const path = require("path");

const file = path.join(
  process.cwd(),
  "src",
  "components",
  "stories",
  "StoryViewer.tsx"
);

if (!fs.existsSync(file)) {
  console.error("❌ No encontré StoryViewer.tsx.");
  console.error("Ejecutá este archivo desde la carpeta alumni-web.");
  process.exit(1);
}

let content = fs.readFileSync(file, "utf8");

const topShadow =
  '        <div className="alumni-story-chrome alumni-story-chrome-top absolute inset-x-0 top-0 z-20 h-32 bg-gradient-to-b from-black/55 via-black/15 to-transparent" />\n';

const bottomShadow =
  '        <div className="alumni-story-chrome alumni-story-chrome-bottom absolute inset-x-0 bottom-0 z-20 h-52 bg-gradient-to-t from-black/58 via-black/14 to-transparent" />\n';

let changes = 0;

if (content.includes(topShadow)) {
  content = content.replace(topShadow, "");
  changes++;
}

if (content.includes(bottomShadow)) {
  content = content.replace(bottomShadow, "");
  changes++;
}

if (changes === 0) {
  console.log("ℹ️ Los sombreados del visor ya no están presentes. No hubo cambios.");
  process.exit(0);
}

fs.writeFileSync(file, content, "utf8");

console.log("✅ Stories 1.2.2 aplicado correctamente.");
console.log(`✅ Capas de sombreado eliminadas: ${changes}`);
console.log("✅ No se modificó navegación, likes, respuestas ni visualizaciones.");
