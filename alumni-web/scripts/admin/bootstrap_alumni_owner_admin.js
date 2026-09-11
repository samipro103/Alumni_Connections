const fs = require("fs");
const path = require("path");
const {
  createClient,
} = require("@supabase/supabase-js");

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;

  const raw = fs.readFileSync(
    file,
    "utf8"
  );

  for (const line of raw.split(
    /\r?\n/
  )) {
    const clean = line.trim();

    if (
      !clean ||
      clean.startsWith("#")
    ) {
      continue;
    }

    const index =
      clean.indexOf("=");

    if (index <= 0) continue;

    const key =
      clean
        .slice(0, index)
        .trim();

    let value =
      clean
        .slice(index + 1)
        .trim();

    if (
      (value.startsWith('"') &&
        value.endsWith('"')) ||
      (value.startsWith("'") &&
        value.endsWith("'"))
    ) {
      value =
        value.slice(1, -1);
    }

    if (
      !process.env[key]
    ) {
      process.env[key] =
        value;
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

const url =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env
    .SUPABASE_SECRET_KEY ||
  process.env
    .SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "❌ Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY."
  );
  process.exit(1);
}

const username =
  process.argv
    .find((arg) =>
      arg.startsWith(
        "--username="
      )
    )
    ?.slice(
      "--username=".length
    )
    ?.trim();

if (!username) {
  console.error(
    "❌ Uso: node .\\scripts\\admin\\bootstrap_alumni_owner_admin.js --username=TU_USUARIO"
  );
  process.exit(1);
}

const supabase =
  createClient(
    url,
    key,
    {
      auth: {
        persistSession:
          false,
        autoRefreshToken:
          false,
      },
    }
  );

(async () => {
  const {
    data: profile,
    error: profileError,
  } =
    await supabase
      .from("profiles")
      .select(
        "id,username,full_name"
      )
      .ilike(
        "username",
        username
      )
      .maybeSingle();

  if (
    profileError ||
    !profile
  ) {
    console.error(
      "❌ No encontré ese username en profiles.",
      profileError?.message ||
        ""
    );
    process.exit(1);
  }

  const payload = {
    user_id: profile.id,
    manage_feedback: true,
    manage_users: true,
    manage_posts: true,
    manage_events: true,
    view_stats: true,
    manage_admins: true,
    manage_moderation: true,
    manage_verifications: true,
    updated_at:
      new Date().toISOString(),
  };

  const {
    error: accessError,
  } =
    await supabase
      .from(
        "admin_permissions"
      )
      .upsert(
        payload,
        {
          onConflict:
            "user_id",
        }
      );

  if (accessError) {
    console.error(
      "❌ No se pudo otorgar acceso:",
      accessError.message
    );
    process.exit(1);
  }

  await supabase
    .from("profiles")
    .update({
      role: "admin",
    })
    .eq(
      "id",
      profile.id
    );

  console.log("");
  console.log(
    "✅ Propietario administrador configurado."
  );
  console.log(
    `✅ @${profile.username}`
  );
  console.log(
    "✅ Permisos completos de Centro de Control."
  );
  console.log("");
  console.log(
    "Ya podés entrar a /admin con esa cuenta."
  );
})().catch(
  (error) => {
    console.error(
      "❌ Error inesperado:",
      error?.message ||
        error
    );
    process.exit(1);
  }
);
