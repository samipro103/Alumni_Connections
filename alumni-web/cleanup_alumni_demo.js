const fs = require("fs");
const path = require("path");
const os = require("os");
const { createClient } = require("@supabase/supabase-js");

const CONFIRM =
  "--confirm=DELETE-ALUMNI-QA";

function fail(message) {
  console.error("\n❌ " + message + "\n");
  process.exit(1);
}

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;

  const content =
    fs.readFileSync(file, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) continue;

    const index = line.indexOf("=");
    if (index <= 0) continue;

    const key =
      line.slice(0, index).trim();

    let value =
      line.slice(index + 1).trim();

    if (
      value.length >= 2 &&
      (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      )
    ) {
      value =
        value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(
  path.join(
    process.cwd(),
    ".env.local"
  )
);

loadEnvFile(
  path.join(
    process.cwd(),
    ".env"
  )
);

const SUPABASE_URL =
  String(
    process.env
      .NEXT_PUBLIC_SUPABASE_URL ||
      ""
  ).trim();

const SUPABASE_SECRET =
  String(
    process.env
      .SUPABASE_SECRET_KEY ||
      process.env
        .SUPABASE_SERVICE_ROLE_KEY ||
      ""
  ).trim();

if (!SUPABASE_URL) {
  fail(
    "Falta NEXT_PUBLIC_SUPABASE_URL."
  );
}

if (!SUPABASE_SECRET) {
  fail(
    "Falta SUPABASE_SECRET_KEY o SUPABASE_SERVICE_ROLE_KEY."
  );
}

const projectRef = (() => {
  try {
    return new URL(
      SUPABASE_URL
    ).hostname.split(".")[0] ||
      "supabase";
  } catch {
    return "supabase";
  }
})();

const manifestDir =
  path.join(
    os.homedir(),
    ".alumni_qa_demo",
    projectRef
  );

const manifestFile =
  path.join(
    manifestDir,
    "manifest.json"
  );

if (
  !fs.existsSync(
    manifestFile
  )
) {
  fail(
    "No encontré un manifiesto QA activo para este proyecto. " +
    "No borraré nada sin una lista exacta de IDs."
  );
}

const manifest =
  JSON.parse(
    fs.readFileSync(
      manifestFile,
      "utf8"
    )
  );

if (
  manifest.supabaseUrl !==
  SUPABASE_URL
) {
  fail(
    "El manifiesto pertenece a otro proyecto Supabase."
  );
}

if (
  !process.argv.includes(
    CONFIRM
  )
) {
  console.log(
    "ALUMNI QA CLEANUP"
  );
  console.log("");
  console.log(
    "Este script eliminará ÚNICAMENTE el run:"
  );
  console.log(
    manifest.runId
  );
  console.log("");
  console.log(
    "Para confirmar ejecutá:"
  );
  console.log(
    "node .\\scripts\\qa-demo\\cleanup_alumni_demo.js --confirm=DELETE-ALUMNI-QA"
  );
  process.exit(0);
}

const admin =
  createClient(
    SUPABASE_URL,
    SUPABASE_SECRET,
    {
      auth: {
        persistSession:
          false,
        autoRefreshToken:
          false,
        detectSessionInUrl:
          false,
      },
    }
  );

function chunks(list, size = 80) {
  const out = [];

  for (
    let i = 0;
    i < list.length;
    i += size
  ) {
    out.push(
      list.slice(
        i,
        i + size
      )
    );
  }

  return out;
}

async function deleteIn(
  table,
  column,
  values
) {
  if (!values.length) {
    return;
  }

  for (
    const batch of
    chunks(values)
  ) {
    const { error } =
      await admin
        .from(table)
        .delete()
        .in(
          column,
          batch
        );

    if (error) {
      throw new Error(
        `${table}.${column}: ${error.message}`
      );
    }
  }
}

async function removeStorage(
  items
) {
  const byBucket =
    new Map();

  for (const item of items) {
    if (
      !item?.bucket ||
      !item?.path
    ) {
      continue;
    }

    const current =
      byBucket.get(
        item.bucket
      ) || [];

    current.push(
      item.path
    );

    byBucket.set(
      item.bucket,
      current
    );
  }

  for (
    const [bucket, paths]
    of byBucket
  ) {
    for (
      const batch of
      chunks(paths, 50)
    ) {
      const { error } =
        await admin.storage
          .from(bucket)
          .remove(batch);

      if (error) {
        console.warn(
          `⚠ Storage ${bucket}:`,
          error.message
        );
      }
    }
  }
}

async function main() {
  const userIds =
    (manifest.users || [])
      .map(
        (user) =>
          user.id
      )
      .filter(Boolean);

  const postIds =
    (manifest.posts || [])
      .map(Number)
      .filter(
        Number.isFinite
      );

  const eventIds =
    (manifest.events || [])
      .map(Number)
      .filter(
        Number.isFinite
      );

  console.log("");
  console.log(
    "Limpiando ALUMNI QA:",
    manifest.runId
  );

  console.log(
    "1/6 Eliminando archivos de Storage..."
  );

  await removeStorage(
    manifest.storage || []
  );

  console.log(
    "2/6 Eliminando notificaciones QA..."
  );

  await deleteIn(
    "notifications",
    "actor_id",
    userIds
  );

  await deleteIn(
    "notifications",
    "user_id",
    userIds
  );

  console.log(
    "3/6 Eliminando eventos QA..."
  );

  await deleteIn(
    "event_rsvps",
    "event_id",
    eventIds
  );

  await deleteIn(
    "events",
    "id",
    eventIds
  );

  console.log(
    "4/6 Eliminando actividad social QA..."
  );

  await deleteIn(
    "likes",
    "post_id",
    postIds
  );

  await deleteIn(
    "comments",
    "post_id",
    postIds
  );

  await deleteIn(
    "post_media",
    "post_id",
    postIds
  );

  await deleteIn(
    "posts",
    "id",
    postIds
  );

  await deleteIn(
    "follows",
    "follower_id",
    userIds
  );

  await deleteIn(
    "follows",
    "following_id",
    userIds
  );

  console.log(
    "5/6 Eliminando usuarios QA..."
  );

  for (
    let i = 0;
    i < userIds.length;
    i += 1
  ) {
    const id =
      userIds[i];

    const { error } =
      await admin.auth.admin
        .deleteUser(
          id
        );

    if (error) {
      console.warn(
        `⚠ Usuario ${id}:`,
        error.message
      );
    }

    process.stdout.write(
      `\rUsuarios: ${i + 1}/${userIds.length}`
    );
  }

  if (userIds.length) {
    process.stdout.write(
      "\n"
    );
  }

  console.log(
    "6/6 Eliminando manifiesto..."
  );

  fs.rmSync(
    manifestFile,
    {
      force: true,
    }
  );

  try {
    fs.rmdirSync(
      manifestDir
    );
  } catch {}

  console.log("");
  console.log(
    "✅ QA Seed eliminado."
  );
  console.log(
    "✅ Usuarios reales y contenido real no fueron seleccionados por el cleanup."
  );
  console.log("");
}

main().catch(
  (error) => {
    console.error("");
    console.error(
      "❌ Cleanup incompleto:",
      error?.message ||
        error
    );
    console.error("");
    console.error(
      "El manifiesto NO se borró. Podés ejecutar el cleanup otra vez."
    );
    process.exit(1);
  }
);
