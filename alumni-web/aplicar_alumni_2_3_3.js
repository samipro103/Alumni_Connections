const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PAYLOAD = path.join(__dirname, "payload");
const MARKER = "ALUMNI_2_3_3_PASSPORT_PROFILE_FEED_FIX";

function die(message) {
  console.error("\n[ERROR] " + message + "\n");
  process.exit(1);
}

function norm(text) {
  return text.replace(/\r\n/g, "\n");
}

function replaceOnce(source, from, to, label) {
  if (!source.includes(from)) {
    die("No encuentro ancla: " + label);
  }
  console.log("[OK] " + label);
  return source.replace(from, to);
}

function writeLikeOriginal(target, original, next) {
  const crlf = original.includes("\r\n");
  const normalized = norm(next);
  fs.writeFileSync(
    target,
    crlf ? normalized.replace(/\n/g, "\r\n") : normalized,
    "utf8"
  );
}

if (path.basename(ROOT).toLowerCase() !== "alumni-web") {
  die('Ejecuta dentro de "alumni-web".');
}

const required = [
  "src/components/profile/ProfilePassportPreview.tsx",
  "src/components/profile/ProfilePassportPreview.module.css",
  "src/app/passport/page.tsx",
  "src/components/layout/MobileNav.tsx",
  "src/app/feed/page.tsx",
  "src/lib/countries.ts",
];

for (const rel of required) {
  if (!fs.existsSync(path.join(ROOT, rel))) {
    die("No encuentro: " + rel);
  }
}

const currentFeed = fs.readFileSync(
  path.join(ROOT, "src/app/feed/page.tsx"),
  "utf8"
);

if (currentFeed.includes(MARKER)) {
  console.log("[SKIP] ALUMNI 2.3.3 ya estaba aplicado.");
  process.exit(0);
}

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-");

const backupRoot = path.join(
  ROOT,
  ".alumni_backups",
  "2.3.3-passport-profile-feed-fix",
  stamp
);

for (const rel of required) {
  const source = path.join(ROOT, rel);
  const backup = path.join(backupRoot, rel);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(source, backup);
}

/* ------------------------------------------------------------
   PROFILE PASSPORT
   One visual passport booklet outside on profile.
   Add country directly from profile via /passport?add=1.
   ------------------------------------------------------------ */
for (const rel of [
  "src/components/profile/ProfilePassportPreview.tsx",
  "src/components/profile/ProfilePassportPreview.module.css",
]) {
  const source = path.join(PAYLOAD, rel);
  const target = path.join(ROOT, rel);

  if (!fs.existsSync(source)) {
    die("Payload faltante: " + rel);
  }

  fs.copyFileSync(source, target);
  console.log("[OK] " + rel);
}

/* ------------------------------------------------------------
   PASSPORT PAGE
   ?add=1 opens the existing approved Add Country editor.
   Does not redesign /passport.
   ------------------------------------------------------------ */
{
  const rel = "src/app/passport/page.tsx";
  const file = path.join(ROOT, rel);
  const original = fs.readFileSync(file, "utf8");
  let src = norm(original);

  src = replaceOnce(
    src,
`  useEffect(() => {
    if (user?.id) void load();
  }, [user?.id]);

  useEffect(() => {
    if (!countryOpen && !photoOpen) return;`,
`  useEffect(() => {
    if (user?.id) void load();
  }, [user?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);

    if (url.searchParams.get("add") === "1") {
      setCountryOpen(true);

      url.searchParams.delete("add");

      window.history.replaceState(
        {},
        "",
        url.pathname +
          (url.searchParams.toString()
            ? \`?\${url.searchParams.toString()}\`
            : "")
      );
    }
  }, []);

  useEffect(() => {
    if (!countryOpen && !photoOpen) return;`,
    "Abrir Añadir país directamente desde perfil"
  );

  src += `\n/* ${MARKER}:PASSPORT_ADD_FROM_PROFILE */\n`;
  writeLikeOriginal(file, original, src);
}

/* ------------------------------------------------------------
   MOBILE NAV
   User clarified: remove PASSPORT from the three-dot More menu.
   Settings stays.
   ------------------------------------------------------------ */
{
  const rel = "src/components/layout/MobileNav.tsx";
  const file = path.join(ROOT, rel);
  const original = fs.readFileSync(file, "utf8");
  let src = norm(original);

  src = replaceOnce(
    src,
`  CalendarDays,
  Globe2,
} from "lucide-react";`,
`  CalendarDays,
} from "lucide-react";`,
    "Quitar icono Pasaporte de Más"
  );

  src = replaceOnce(
    src,
`  {
    href: "/passport",
    label: "Pasaporte",
    description: "Países, álbumes y recuerdos",
    icon: Globe2,
  },
`,
``,
    "Quitar Pasaporte de los 3 puntos"
  );

  src = replaceOnce(
    src,
`    pathname === "/events" ||
    pathname.startsWith(
      "/events/"
    ) ||
    pathname === "/passport" ||
    pathname.startsWith(
      "/passport/"
    ) ||
    pathname === "/settings" ||`,
`    pathname === "/events" ||
    pathname.startsWith(
      "/events/"
    ) ||
    pathname === "/settings" ||`,
    "Pasaporte deja de activar Más"
  );

  src += `\n/* ${MARKER}:REMOVE_PASSPORT_FROM_MORE */\n`;
  writeLikeOriginal(file, original, src);
}

/* ------------------------------------------------------------
   FEED
   There are real posts in production.
   Replace fragile embedded relation query with independent reads.
   This prevents one relation error from blanking the whole feed.
   ------------------------------------------------------------ */
{
  const rel = "src/app/feed/page.tsx";
  const file = path.join(ROOT, rel);
  const original = fs.readFileSync(file, "utf8");
  let src = norm(original);

  const oldQuery =
`    const { data: postsData } = await supabase
      .from("posts")
      .select(\`
        *,
        profiles (
          username,
          avatar_url,
          full_name,
          university,
          education_institution_name,
          education_program_name,
          career,
          city,
          country,
          residence_country_code
        ),
        likes (
          user_id
        )
      \`)
      .order("created_at", { ascending: false });

    if (requestId !== feedRequestRef.current) return;

    if (!postsData) {
      if (showLoader) {
        setPosts([]);
        setLoading(false);
      }
      return;
    }`;

  const newQuery =
`    const {
      data: basePosts,
      error: postsError,
    } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (requestId !== feedRequestRef.current) return;

    if (postsError) {
      console.error(
        "[Alumni Feed] posts:",
        postsError
      );

      setPosts([]);
      setLoading(false);
      showToast(
        "No se pudieron cargar las publicaciones."
      );
      return;
    }

    const basePostIds = (basePosts || []).map(
      (post: any) => post.id
    );

    const authorIds = [
      ...new Set(
        (basePosts || [])
          .map((post: any) => post.user_id)
          .filter(Boolean)
      ),
    ];

    const [authorsResult, likesResult] =
      await Promise.all([
        authorIds.length
          ? supabase
              .from("profiles")
              .select(
                "id,username,avatar_url,full_name,university,education_institution_name,education_program_name,career,city,country,residence_country_code"
              )
              .in("id", authorIds)
          : Promise.resolve({
              data: [],
              error: null,
            } as any),

        basePostIds.length
          ? supabase
              .from("likes")
              .select("post_id,user_id")
              .in("post_id", basePostIds)
          : Promise.resolve({
              data: [],
              error: null,
            } as any),
      ]);

    if (requestId !== feedRequestRef.current) return;

    if (authorsResult.error) {
      console.warn(
        "[Alumni Feed] authors:",
        authorsResult.error
      );
    }

    if (likesResult.error) {
      console.warn(
        "[Alumni Feed] likes:",
        likesResult.error
      );
    }

    const authorById = new Map(
      (authorsResult.data || []).map(
        (profile: any) => [
          profile.id,
          profile,
        ]
      )
    );

    const likesByPost =
      new Map<number, any[]>();

    for (const like of likesResult.data || []) {
      const postId = Number(like.post_id);
      const current =
        likesByPost.get(postId) || [];

      current.push({
        user_id: like.user_id,
      });

      likesByPost.set(
        postId,
        current
      );
    }

    const postsData = (basePosts || []).map(
      (post: any) => ({
        ...post,
        profiles:
          authorById.get(post.user_id) || null,
        likes:
          likesByPost.get(Number(post.id)) || [],
      })
    );`;

  src = replaceOnce(
    src,
    oldQuery,
    newQuery,
    "Hacer carga del feed independiente y resistente"
  );

  src = replaceOnce(
    src,
`    const legacyReady = await hydratePostMedia(visibleBase);
    const mediaRows = await hydratePostMediaItems(
      (mediaRowsRaw || []) as any[]
    );`,
`    let legacyReady = visibleBase;

    try {
      legacyReady =
        await hydratePostMedia(visibleBase);
    } catch (error) {
      console.warn(
        "[Alumni Feed] legacy media:",
        error
      );
    }

    let mediaRows: any[] = [];

    try {
      mediaRows =
        await hydratePostMediaItems(
          (mediaRowsRaw || []) as any[]
        );
    } catch (error) {
      console.warn(
        "[Alumni Feed] media items:",
        error
      );
    }`,
    "Evitar que una foto dañada o inaccesible vacíe todo el feed"
  );

  src += `\n/* ${MARKER}:FEED_RESILIENT_LOAD */\n`;
  writeLikeOriginal(file, original, src);
}

console.log("");
console.log("============================================================");
console.log(" ALUMNI 2.3.3 - PASSPORT PROFILE + FEED FIX");
console.log("============================================================");
console.log("[OK] Carta visual Pasaporte aparece en perfil");
console.log("[OK] Añadir país disponible desde perfil");
console.log("[OK] /passport conserva el diseño aprobado");
console.log("[OK] Perfil abre directamente Añadir país con ?add=1");
console.log("[OK] Pasaporte QUITADO de los 3 puntos");
console.log("[OK] Ajustes SE QUEDA en los 3 puntos");
console.log("[OK] Feed carga posts/autores/likes por separado");
console.log("[OK] Un error de relación ya no vacía el feed");
console.log("[OK] Un error de media ya no vacía publicaciones de texto");
console.log("[OK] No requiere SQL");
console.log("[OK] Backup: " + backupRoot);
console.log("");
console.log("Ejecuta ahora: npm run build");
console.log("============================================================");
