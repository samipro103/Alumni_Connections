const fs = require("fs");
const path = require("path");

const ROOT =
  process.cwd();

const SRC =
  path.join(ROOT, "src");

const CSS_IMPORT_RE =
  /import\s+["']([^"']+\.css)["'];?/g;

function walk(dir, output = []) {
  if (!fs.existsSync(dir)) {
    return output;
  }

  for (
    const entry of
      fs.readdirSync(
        dir,
        { withFileTypes: true }
      )
  ) {
    const full =
      path.join(
        dir,
        entry.name
      );

    if (
      entry.isDirectory()
    ) {
      walk(full, output);
    } else {
      output.push(full);
    }
  }

  return output;
}

function relative(file) {
  return path
    .relative(ROOT, file)
    .replace(/\\/g, "/");
}

const files =
  walk(SRC);

const cssFiles =
  files.filter(
    (file) =>
      file.endsWith(".css")
  );

const sourceFiles =
  files.filter(
    (file) =>
      /\.(tsx?|jsx?)$/.test(file)
  );

const backups =
  files.filter(
    (file) =>
      /\.bak$/i.test(file) ||
      /\.before-[^/\\]+$/i.test(file)
  );

const imports =
  new Map();

for (
  const file of sourceFiles
) {
  const text =
    fs.readFileSync(
      file,
      "utf8"
    );

  const found = [];

  let match;

  while (
    (
      match =
        CSS_IMPORT_RE.exec(text)
    )
  ) {
    found.push(match[1]);
  }

  if (found.length) {
    imports.set(
      relative(file),
      found
    );
  }
}

const multiStyleRoutes = [];

for (
  const [
    file,
    list,
  ] of imports
) {
  if (
    list.length >= 3 &&
    file.startsWith(
      "src/app/"
    )
  ) {
    multiStyleRoutes.push({
      file,
      imports: list,
    });
  }
}

const totalCssBytes =
  cssFiles.reduce(
    (sum, file) =>
      sum +
      fs.statSync(file).size,
    0
  );

const versionGroups =
  new Map();

for (
  const file of cssFiles
) {
  const name =
    path.basename(file);

  const base =
    name.replace(
      /[-_](?:v)?\d+(?:[-_.]\d+)+(?=\.css$)/i,
      ""
    );

  const key =
    path.join(
      path.dirname(file),
      base
    );

  const group =
    versionGroups.get(key) ||
    [];

  group.push(
    relative(file)
  );

  versionGroups.set(
    key,
    group
  );
}

const versioned =
  Array.from(
    versionGroups.values()
  ).filter(
    (group) =>
      group.length > 1
  );

console.log("");
console.log(
  "ALUMNI — STYLE AUDIT"
);
console.log(
  "===================="
);
console.log(
  `CSS files: ${cssFiles.length}`
);
console.log(
  `CSS total: ${(totalCssBytes / 1024).toFixed(1)} KB`
);
console.log(
  `Backup files inside src: ${backups.length}`
);
console.log(
  `Routes/components with 3+ CSS imports: ${multiStyleRoutes.length}`
);
console.log(
  `Possible version groups: ${versioned.length}`
);

if (
  multiStyleRoutes.length
) {
  console.log("");
  console.log(
    "Pantallas con muchas capas:"
  );

  for (
    const item of
      multiStyleRoutes
  ) {
    console.log(
      `- ${item.file}`
    );
    for (
      const css of item.imports
    ) {
      console.log(
        `    ${css}`
      );
    }
  }
}

if (versioned.length) {
  console.log("");
  console.log(
    "Posibles generaciones de CSS:"
  );

  for (
    const group of
      versioned
  ) {
    console.log(
      "- " +
      group.join(", ")
    );
  }
}

console.log("");
console.log(
  "Este comando SOLO audita. No borra CSS activo."
);
