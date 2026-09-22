import {
  execFileSync,
} from "node:child_process";
import {
  existsSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import {
  extname,
  join,
  relative,
} from "node:path";
import process from "node:process";

const root =
  process.cwd();

const failures = [];
const checks = [];

function ok(
  label
) {
  checks.push(
    label
  );
}

function fail(
  label
) {
  failures.push(
    label
  );
}

function file(
  relativePath
) {
  return join(
    root,
    relativePath
  );
}

function requireFile(
  relativePath
) {
  if (
    existsSync(
      file(
        relativePath
      )
    )
  ) {
    ok(
      `archivo ${relativePath}`
    );
  } else {
    fail(
      `falta ${relativePath}`
    );
  }
}

function requireText(
  relativePath,
  snippets
) {
  if (
    !existsSync(
      file(
        relativePath
      )
    )
  ) {
    fail(
      `falta ${relativePath}`
    );
    return;
  }

  const content =
    readFileSync(
      file(
        relativePath
      ),
      "utf8"
    );

  for (
    const snippet
    of snippets
  ) {
    if (
      !content.includes(
        snippet
      )
    ) {
      fail(
        `${relativePath} no contiene: ${snippet}`
      );
    }
  }

  ok(
    `contenido ${relativePath}`
  );
}

function walk(
  directory
) {
  const result = [];

  if (
    !existsSync(
      directory
    )
  ) {
    return result;
  }

  for (
    const entry
    of readdirSync(
      directory,
      {
        withFileTypes:
          true,
      }
    )
  ) {
    const full =
      join(
        directory,
        entry.name
      );

    if (
      entry.isDirectory()
    ) {
      result.push(
        ...walk(
          full
        )
      );
    } else {
      result.push(
        full
      );
    }
  }

  return result;
}

const requiredFiles = [
  "package-lock.json",
  "public/manifest.webmanifest",
  "public/sw.js",
  "public/icons/alumni-192.png",
  "public/icons/alumni-512.png",
  "public/icons/alumni-512-maskable.png",
  "src/app/page.tsx",
  "src/app/robots.ts",
  "src/app/sitemap.ts",
  "src/app/not-found.tsx",
  "src/app/legal/privacy/page.tsx",
  "src/app/legal/terms/page.tsx",
  "src/app/legal/community/page.tsx",
  "src/app/api/health/route.ts",
];

for (
  const required
  of requiredFiles
) {
  requireFile(
    required
  );
}

try {
  const manifest =
    JSON.parse(
      readFileSync(
        file(
          "public/manifest.webmanifest"
        ),
        "utf8"
      )
    );

  if (
    manifest.name !==
      "Alumni." ||
    manifest.display !==
      "standalone" ||
    manifest.start_url !==
      "/"
  ) {
    fail(
      "manifest PWA incompleto"
    );
  } else {
    ok(
      "manifest PWA"
    );
  }

  const purposes =
    new Set(
      (
        manifest.icons ||
        []
      ).map(
        (icon) =>
          icon.purpose
      )
    );

  if (
    !purposes.has(
      "maskable"
    )
  ) {
    fail(
      "manifest sin icono maskable"
    );
  } else {
    ok(
      "icono maskable"
    );
  }
} catch {
  fail(
    "manifest.webmanifest no es JSON válido"
  );
}

requireText(
  "src/app/layout.tsx",
  [
    'new URL("https://alumnisv.com")',
    '"/manifest.webmanifest"',
  ]
);

requireText(
  "src/app/robots.ts",
  [
    '"/admin"',
    '"/api"',
    '"/messages"',
    'https://alumnisv.com/sitemap.xml',
  ]
);

requireText(
  "next.config.ts",
  [
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Referrer-Policy",
    "Permissions-Policy",
    "Content-Security-Policy",
  ]
);

requireText(
  "src/app/api/health/route.ts",
  [
    '"ready"',
    '"no-store, max-age=0"',
    '"noindex, nofollow"',
  ]
);

let tracked = [];

try {
  tracked =
    execFileSync(
      "git",
      [
        "ls-files",
      ],
      {
        cwd:
          root,
        encoding:
          "utf8",
      }
    )
      .split(
        /\r?\n/
      )
      .map(
        (value) =>
          value.trim()
      )
      .filter(
        Boolean
      );
} catch {
  fail(
    "no se pudo consultar git ls-files"
  );
}

const secretName =
  (
    value
  ) => {
    const normalized =
      value
        .replace(
          /\\/g,
          "/"
        )
        .toLowerCase();

    const base =
      normalized
        .split("/")
        .pop() ||
      "";

    if (
      base ===
        "recovery-codes.txt" ||
      /^\.env(?:\.|$)/.test(
        base
      ) ||
      base.includes(
        "service-account"
      ) ||
      base.includes(
        "credentials"
      )
    ) {
      return true;
    }

    return [
      ".pem",
      ".key",
      ".p12",
      ".pfx",
    ].includes(
      extname(
        base
      )
    );
  };

for (
  const trackedFile
  of tracked
) {
  if (
    secretName(
      trackedFile
    ) &&
    existsSync(
      file(
        trackedFile
      )
    )
  ) {
    fail(
      `archivo sensible versionado: ${trackedFile}`
    );
  }
}

const auditedFolders = [
  "src",
  "public",
];

for (
  const folder
  of auditedFolders
) {
  for (
    const full
    of walk(
      file(
        folder
      )
    )
  ) {
    const name =
      full
        .toLowerCase();

    if (
      name.endsWith(
        ".bak"
      ) ||
      name.includes(
        ".before-"
      )
    ) {
      fail(
        `backup dentro del producto: ${relative(
          root,
          full
        )}`
      );
    }
  }
}

if (
  !failures.length
) {
  ok(
    "sin backups en src/public"
  );
  ok(
    "sin secretos sensibles presentes en archivos versionados"
  );
}

console.log("");
console.log(
  "ALUMNI — LAUNCH CHECK 10.10"
);
console.log(
  "==========================="
);

for (
  const check
  of checks
) {
  console.log(
    `[OK] ${check}`
  );
}

if (
  failures.length
) {
  console.error("");

  for (
    const failure
    of failures
  ) {
    console.error(
      `[FAIL] ${failure}`
    );
  }

  console.error("");
  console.error(
    `Launch check: ${failures.length} problema(s).`
  );

  process.exit(1);
}

console.log("");
console.log(
  "Launch check: OK"
);

/* ALUMNI_10_10_LAUNCH_CHECK */