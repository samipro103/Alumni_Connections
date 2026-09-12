const fs = require("fs");
const path = require("path");

const ROOT =
  process.cwd();

const SRC =
  path.join(ROOT, "src");

const ARCHITECTURE_FILE =
  path.join(
    ROOT,
    "scripts",
    "qa-design",
    "style_architecture.json"
  );

const VERBOSE =
  process.argv.includes("--verbose");

const STRICT =
  process.argv.includes("--strict");

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

function sameArray(a, b) {
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every(
      (value, index) =>
        value === b[index]
    )
  );
}

function loadArchitecture() {
  if (
    !fs.existsSync(
      ARCHITECTURE_FILE
    )
  ) {
    return {
      approvedStacks: {},
    };
  }

  try {
    return JSON.parse(
      fs.readFileSync(
        ARCHITECTURE_FILE,
        "utf8"
      )
    );
  } catch (error) {
    console.error(
      "❌ style_architecture.json inválido:",
      error?.message || error
    );
    process.exit(1);
  }
}

const architecture =
  loadArchitecture();

const approvedStacks =
  architecture.approvedStacks ||
  {};

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

const approved = [];
const debt = [];
const drift = [];

for (
  const [
    file,
    expected,
  ] of Object.entries(
    approvedStacks
  )
) {
  const actual =
    imports.get(file) || [];

  if (
    sameArray(
      actual,
      expected
    )
  ) {
    approved.push({
      file,
      imports: actual,
    });
  } else {
    drift.push({
      file,
      expected,
      actual,
    });
  }
}

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
    ) &&
    !Object.prototype.hasOwnProperty.call(
      approvedStacks,
      file
    )
  ) {
    debt.push({
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
  "ALUMNI — STYLE AUDIT 4.3"
);
console.log(
  "========================"
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
  `Approved intentional stacks: ${approved.length}`
);
console.log(
  `Real multi-layer debt: ${debt.length}`
);
console.log(
  `Architecture drift: ${drift.length}`
);
console.log(
  `Possible version groups: ${versioned.length}`
);

if (
  debt.length === 0
) {
  console.log("");
  console.log(
    "✅ Deuda real de capas CSS: 0"
  );
} else {
  console.log("");
  console.log(
    "⚠️ Pantallas con deuda real:"
  );

  for (
    const item of debt
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

if (
  drift.length
) {
  console.log("");
  console.log(
    "⚠️ Arquitecturas aprobadas que cambiaron:"
  );

  for (
    const item of drift
  ) {
    console.log(
      `- ${item.file}`
    );
    console.log(
      "    Esperado:"
    );
    for (
      const css of item.expected
    ) {
      console.log(
        `      ${css}`
      );
    }

    console.log(
      "    Actual:"
    );
    for (
      const css of item.actual
    ) {
      console.log(
        `      ${css}`
      );
    }
  }
}

if (
  VERBOSE &&
  approved.length
) {
  console.log("");
  console.log(
    "Capas intencionales aprobadas:"
  );

  for (
    const item of approved
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

if (
  versioned.length
) {
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

if (
  STRICT &&
  (
    backups.length > 0 ||
    debt.length > 0 ||
    drift.length > 0 ||
    versioned.length > 0
  )
) {
  console.log("");
  console.error(
    "❌ Design audit estricto falló."
  );
  process.exit(1);
}

if (STRICT) {
  console.log("");
  console.log(
    "✅ Design audit estricto aprobado."
  );
}

console.log("");
console.log(
  "Este comando SOLO audita. No borra CSS activo."
);
