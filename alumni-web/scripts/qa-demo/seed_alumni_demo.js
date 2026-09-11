const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const zlib = require("zlib");
const { createClient } = require("@supabase/supabase-js");

const VERSION = "ALUMNI_QA_SEED_1_0";
const CONFIRM = "--confirm=ALUMNI-QA";

function fail(message) {
  console.error("\n❌ " + message + "\n");
  process.exit(1);
}

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;

  const content = fs.readFileSync(file, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) continue;

    const index = line.indexOf("=");
    if (index <= 0) continue;

    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();

    if (
      value.length >= 2 &&
      (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      )
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(process.cwd(), ".env.local"));
loadEnvFile(path.join(process.cwd(), ".env"));

const SUPABASE_URL =
  String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();

const SUPABASE_SECRET =
  String(
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  ).trim();

if (!SUPABASE_URL) {
  fail(
    "Falta NEXT_PUBLIC_SUPABASE_URL en .env.local."
  );
}

if (!SUPABASE_SECRET) {
  fail(
    "Falta SUPABASE_SECRET_KEY o SUPABASE_SERVICE_ROLE_KEY en .env.local. " +
    "No uses la ANON KEY para este seed."
  );
}

if (!process.argv.includes(CONFIRM)) {
  console.log("ALUMNI QA SEED 1.0");
  console.log("");
  console.log("Este script CREARÁ datos temporales en Supabase.");
  console.log("Destino:", SUPABASE_URL);
  console.log("");
  console.log("Para confirmar ejecutá:");
  console.log(
    "node .\\scripts\\qa-demo\\seed_alumni_demo.js --confirm=ALUMNI-QA"
  );
  process.exit(0);
}

function parseIntArg(name, fallback, min, max) {
  const prefix = `--${name}=`;
  const raw = process.argv.find((arg) => arg.startsWith(prefix));
  const value = raw ? Number(raw.slice(prefix.length)) : fallback;

  if (!Number.isInteger(value) || value < min || value > max) {
    fail(
      `--${name} debe estar entre ${min} y ${max}.`
    );
  }

  return value;
}

const USER_COUNT = parseIntArg("users", 18, 8, 30);
const POST_COUNT = parseIntArg("posts", 72, 20, 140);
const EVENT_COUNT = parseIntArg("events", 8, 4, 16);

const admin = createClient(
  SUPABASE_URL,
  SUPABASE_SECRET,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

const projectRef = (() => {
  try {
    return new URL(SUPABASE_URL).hostname.split(".")[0] || "supabase";
  } catch {
    return "supabase";
  }
})();

const manifestDir = path.join(
  os.homedir(),
  ".alumni_qa_demo",
  projectRef
);

const manifestFile = path.join(
  manifestDir,
  "manifest.json"
);

if (fs.existsSync(manifestFile)) {
  fail(
    "Ya existe un QA Seed activo para este proyecto.\n" +
    "Primero ejecutá cleanup_alumni_demo.js para evitar mezclar dos simulaciones."
  );
}

fs.mkdirSync(manifestDir, { recursive: true });

const runId =
  new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14) +
  "-" +
  crypto.randomBytes(3).toString("hex");

const manifest = {
  version: VERSION,
  runId,
  createdAt: new Date().toISOString(),
  supabaseUrl: SUPABASE_URL,
  projectRef,
  users: [],
  posts: [],
  events: [],
  storage: [],
  loginDemo: null,
  summary: {},
};

function saveManifest() {
  fs.writeFileSync(
    manifestFile,
    JSON.stringify(manifest, null, 2),
    "utf8"
  );
}

saveManifest();

console.log("");
console.log("╔════════════════════════════════════════╗");
console.log("║       ALUMNI QA — COMUNIDAD ACTIVA    ║");
console.log("╚════════════════════════════════════════╝");
console.log("Proyecto:", projectRef);
console.log("Run:", runId);
console.log(
  `Objetivo: ${USER_COUNT} usuarios · ${POST_COUNT} posts · ${EVENT_COUNT} eventos`
);
console.log("");

/* =========================================================
   DETERMINISTIC RANDOM
   ========================================================= */

let rngState =
  parseInt(
    crypto
      .createHash("sha256")
      .update(runId)
      .digest("hex")
      .slice(0, 8),
    16
  ) >>> 0;

function random() {
  rngState ^= rngState << 13;
  rngState ^= rngState >>> 17;
  rngState ^= rngState << 5;
  return (rngState >>> 0) / 4294967296;
}

function pick(list) {
  return list[Math.floor(random() * list.length)];
}

function sample(list, count) {
  const copy = [...list];
  const out = [];

  while (copy.length && out.length < count) {
    const index = Math.floor(random() * copy.length);
    out.push(copy.splice(index, 1)[0]);
  }

  return out;
}

function shuffled(list) {
  return sample(list, list.length);
}

function daysAgo(days, hours = 0) {
  return new Date(
    Date.now() -
      days * 86400000 -
      hours * 3600000
  ).toISOString();
}

function daysFromNow(days, hour = 18) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

/* =========================================================
   PNG GENERATOR — no external image dependency
   ========================================================= */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);

  for (let n = 0; n < 256; n += 1) {
    let c = n;

    for (let k = 0; k < 8; k += 1) {
      c =
        c & 1
          ? 0xedb88320 ^ (c >>> 1)
          : c >>> 1;
    }

    table[n] = c >>> 0;
  }

  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;

  for (const byte of buffer) {
    c =
      CRC_TABLE[(c ^ byte) & 0xff] ^
      (c >>> 8);
  }

  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(
    crc32(Buffer.concat([typeBuffer, data])),
    0
  );

  return Buffer.concat([
    length,
    typeBuffer,
    data,
    crcBuffer,
  ]);
}

const PALETTES = [
  [[30, 58, 95], [76, 123, 180], [241, 180, 110], [242, 231, 207]],
  [[40, 38, 68], [93, 77, 137], [220, 125, 112], [244, 218, 183]],
  [[24, 73, 73], [52, 126, 111], [219, 171, 91], [239, 229, 199]],
  [[48, 54, 71], [83, 102, 129], [176, 114, 91], [228, 206, 179]],
  [[36, 50, 80], [70, 95, 145], [181, 132, 168], [236, 218, 230]],
  [[55, 43, 35], [126, 86, 65], [206, 154, 92], [241, 220, 183]],
];

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function mix(a, b, t) {
  return [
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t),
    lerp(a[2], b[2], t),
  ];
}

function scenePng(width, height, seed, mode = "campus") {
  let s = (seed * 2654435761) >>> 0;

  function prng() {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  }

  const palette = PALETTES[seed % PALETTES.length];
  const raw = Buffer.alloc((width * 4 + 1) * height);

  const horizon =
    mode === "avatar"
      ? Math.floor(height * 0.72)
      : Math.floor(height * (0.58 + prng() * 0.16));

  const sunX = width * (0.2 + prng() * 0.6);
  const sunY = height * (0.16 + prng() * 0.22);
  const sunR = Math.min(width, height) * (0.08 + prng() * 0.05);

  const skinChoices = [
    [237, 188, 146],
    [213, 158, 116],
    [183, 127, 90],
    [146, 94, 68],
    [106, 67, 50],
  ];

  const skin = skinChoices[seed % skinChoices.length];
  const hair = mix(palette[0], [20, 18, 18], 0.55);
  const shirt = palette[1];

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;

    for (let x = 0; x < width; x += 1) {
      const offset = rowStart + 1 + x * 4;
      let color;

      const t = y / Math.max(1, height - 1);

      if (mode === "avatar") {
        color = mix(palette[0], palette[1], Math.min(1, t * 1.2));

        const dx = x - width * 0.5;
        const dy = y - height * 0.42;
        const headR = width * 0.19;
        const inHead = dx * dx + dy * dy < headR * headR;

        const hairDy = y - height * 0.34;
        const inHair =
          dx * dx + hairDy * hairDy <
            (headR * 1.03) * (headR * 1.03) &&
          y < height * 0.41;

        const shoulderX = dx / (width * 0.34);
        const shoulderY = (y - height * 0.86) / (height * 0.25);
        const inShoulders =
          shoulderX * shoulderX +
            shoulderY * shoulderY <
          1;

        if (inShoulders) color = shirt;
        if (inHead) color = skin;
        if (inHair) color = hair;

        const eyeY = height * 0.41;
        const eyeR = Math.max(1.5, width * 0.008);

        for (const eyeX of [width * 0.445, width * 0.555]) {
          const ex = x - eyeX;
          const ey = y - eyeY;

          if (ex * ex + ey * ey < eyeR * eyeR) {
            color = [45, 35, 30];
          }
        }
      } else {
        if (y < horizon) {
          color = mix(palette[1], palette[3], t * 0.85);

          const dx = x - sunX;
          const dy = y - sunY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < sunR) {
            color = mix(color, palette[2], 0.72);
          }
        } else {
          color = mix(palette[0], palette[1], (y - horizon) / Math.max(1, height - horizon));
        }

        if (mode === "campus" || mode === "graduation") {
          const buildingTop = horizon - height * 0.14;
          const buildingBottom = horizon + height * 0.08;

          if (
            y > buildingTop &&
            y < buildingBottom &&
            x > width * 0.12 &&
            x < width * 0.88
          ) {
            color = mix(palette[3], palette[0], 0.18);

            const windowW = Math.max(12, Math.floor(width * 0.07));
            const localX = Math.floor((x - width * 0.12) / windowW);

            if (
              localX % 2 === 0 &&
              y > buildingTop + height * 0.035 &&
              y < buildingBottom - height * 0.035
            ) {
              color = mix(palette[1], [20, 30, 42], 0.48);
            }
          }
        }

        if (mode === "city") {
          if (y > horizon - height * 0.22) {
            const block = Math.max(36, Math.floor(width / 9));
            const col = Math.floor(x / block);
            const localTop =
              horizon -
              ((col * 37 + seed * 19) % Math.floor(height * 0.25));

            if (y > localTop) {
              color = mix(
                palette[(col + 1) % 2],
                [25, 30, 40],
                0.45
              );
            }
          }
        }

        if (mode === "cafe") {
          if (y > height * 0.66) {
            color = mix(palette[2], palette[0], 0.5);
          }

          const cx = width * 0.58;
          const cy = height * 0.62;
          const rx = width * 0.13;
          const ry = height * 0.055;
          const ex = (x - cx) / rx;
          const ey = (y - cy) / ry;

          if (ex * ex + ey * ey < 1) {
            color = [230, 221, 202];
          }

          const coffeeEx = (x - cx) / (rx * 0.72);
          const coffeeEy = (y - cy) / (ry * 0.52);

          if (coffeeEx * coffeeEx + coffeeEy * coffeeEy < 1) {
            color = [82, 55, 38];
          }
        }

        if (mode === "sports") {
          const lineY = height * 0.78;

          if (y > lineY) {
            color = [65, 121, 72];
          }

          if (
            Math.abs(y - height * 0.86) < 2 ||
            Math.abs(x - width * 0.5) < 2
          ) {
            color = [230, 233, 228];
          }
        }

        if (mode === "notebook") {
          color = [229, 220, 202];

          if (
            y > height * 0.18 &&
            y < height * 0.84 &&
            x > width * 0.18 &&
            x < width * 0.82
          ) {
            color = [248, 246, 239];

            if (
              (Math.floor(y / Math.max(14, height * 0.045)) % 2) === 0
            ) {
              color = [239, 241, 236];
            }
          }
        }
      }

      const grain = Math.floor((prng() - 0.5) * 8);

      raw[offset] = Math.max(0, Math.min(255, color[0] + grain));
      raw[offset + 1] = Math.max(0, Math.min(255, color[1] + grain));
      raw[offset + 2] = Math.max(0, Math.min(255, color[2] + grain));
      raw[offset + 3] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([
      0x89, 0x50, 0x4e, 0x47,
      0x0d, 0x0a, 0x1a, 0x0a,
    ]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw, { level: 6 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

async function uploadPublicPng(bucket, objectPath, buffer) {
  const { error } = await admin.storage
    .from(bucket)
    .upload(objectPath, buffer, {
      contentType: "image/png",
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) throw error;

  manifest.storage.push({
    bucket,
    path: objectPath,
  });
  saveManifest();

  return admin.storage
    .from(bucket)
    .getPublicUrl(objectPath)
    .data.publicUrl;
}

/* =========================================================
   DEMO CONTENT
   ========================================================= */

const FIRST_NAMES = [
  "Valeria", "Sofía", "Andrea", "Camila", "Mariana", "Natalia",
  "Daniel", "Mateo", "Diego", "Javier", "Carlos", "Gabriel",
  "Paola", "Lucía", "Fernanda", "Alejandro", "Emilia", "Ricardo",
  "Elena", "Samuel", "Isabella", "Martín", "Gabriela", "Nicolás",
  "Ana", "Luis", "Mónica", "Tomás", "Julia", "Sebastián",
];

const LAST_NAMES = [
  "Cruz", "Molina", "Rivas", "Morales", "López", "Rivera",
  "Castillo", "Hernández", "Flores", "Martínez", "Pineda", "Mejía",
  "Campos", "Aguilar", "Romero", "Escobar", "Navarro", "Santos",
  "Vega", "Reyes", "Díaz", "Guzmán", "Ortiz", "Salazar",
];

const CAREERS = [
  "Ingeniería Industrial",
  "Ingeniería de Software",
  "Administración de Empresas",
  "Diseño Estratégico",
  "Marketing",
  "Arquitectura",
  "Economía",
  "Psicología",
  "Comunicación",
  "Ingeniería Civil",
  "Relaciones Internacionales",
  "Finanzas",
];

const UNIVERSITIES = [
  "Universidad de El Salvador",
  "Universidad Centroamericana José Simeón Cañas",
  "Universidad Don Bosco",
  "Universidad Dr. José Matías Delgado",
  "Universidad Francisco Gavidia",
  "Universidad Tecnológica de El Salvador",
];

const CITIES = [
  "San Salvador",
  "Santa Tecla",
  "Santa Ana",
  "San Miguel",
  "Sonsonate",
  "Antiguo Cuscatlán",
  "Ahuachapán",
  "Usulután",
];

const BIOS = [
  "Construyendo proyectos con impacto y aprendiendo de personas que hacen cosas interesantes.",
  "Me interesa conectar ideas, equipos y oportunidades. Siempre aprendiendo.",
  "Profesional creativo con curiosidad por tecnología, negocios y comunidad.",
  "Alumni, café, proyectos y conversaciones que terminan convirtiéndose en ideas.",
  "Aprendiendo, trabajando y compartiendo lo que me funciona en el camino.",
  "Conectando experiencia profesional con proyectos que valen la pena.",
];

const POST_TEXTS = [
  "Qué buena sensación volver a conectar con personas de distintas generaciones. Hay conversaciones que te recuerdan por qué una comunidad profesional sí importa.",
  "Hoy cerramos una semana intensa de proyecto. Lo mejor no fue solo el resultado, sino todo lo que aprendimos trabajando en equipo.",
  "Pequeño recordatorio: actualizar el portafolio antes de necesitarlo cambia completamente la conversación cuando aparece una oportunidad.",
  "¿Qué herramienta les ha ayudado más a organizar proyectos últimamente? Estoy probando nuevas formas de trabajar con equipos pequeños.",
  "Volver al campus siempre se siente distinto. Mismos pasillos, nuevas etapas.",
  "Una buena reunión de networking no se trata de coleccionar contactos, sino de salir con una conversación que quieras continuar.",
  "Terminando una presentación que empezó como una idea en una libreta. A veces avanzar es simplemente convertir el primer borrador en algo visible.",
  "Hoy tocó aprender algo fuera de mi área. Incómodo al principio, útil al final.",
  "Compartiendo una foto del encuentro de esta semana. Muy buenas conversaciones y varias ideas para colaborar.",
  "Estoy armando una lista de recursos para recién graduados. ¿Qué les hubiera gustado saber durante su primer año profesional?",
  "Después de varias semanas de trabajo, por fin salió esta iniciativa. Todavía falta mucho, pero ya se siente real.",
  "Una de las cosas que más valoro de una comunidad Alumni es poder preguntar sin empezar desde cero.",
  "Día de trabajo fuera de la oficina. Cambio de espacio, cambio de perspectiva.",
  "Hoy tuvimos sesión de mentoría. Una sola pregunta bien hecha puede ahorrar semanas de dar vueltas.",
  "Celebrando un pequeño avance. No todo tiene que ser un lanzamiento gigante para contar.",
  "Interesante conversación sobre cómo están cambiando los perfiles profesionales híbridos. Cada vez pesa más saber conectar disciplinas.",
  "Hay proyectos que enseñan más por los problemas que aparecen que por el resultado final.",
  "Preparando todo para el próximo encuentro. Si alguien está trabajando en proyectos de innovación, sería bueno conectar.",
  "Comparto esto porque sé que varios están pasando por procesos de entrevistas: practicar historias concretas funciona mucho mejor que memorizar respuestas.",
  "Hoy fue uno de esos días en los que una conversación casual terminó abriendo una posibilidad inesperada.",
];

const COMMENT_TEXTS = [
  "Buenísimo esto.",
  "Totalmente de acuerdo.",
  "Me interesa mucho ese tema.",
  "Qué buena iniciativa 🙌",
  "Gracias por compartirlo.",
  "Justo estaba pensando en algo parecido.",
  "Excelente punto.",
  "Se ve muy bien.",
  "Hay que seguir esa conversación.",
  "Me sumo.",
  "Qué buen recuerdo.",
  "Esto sí aporta.",
];

const SCENE_MODES = [
  "campus",
  "city",
  "cafe",
  "notebook",
  "sports",
  "graduation",
];

const RATIOS = [
  { width: 600, height: 750, label: "portrait" },
  { width: 640, height: 640, label: "square" },
  { width: 800, height: 600, label: "landscape" },
  { width: 960, height: 540, label: "wide" },
];

function makeDemoPeople(count) {
  const usedNames = new Set();
  const people = [];
  const suffix = runId.slice(-4);

  for (let i = 0; i < count; i += 1) {
    let fullName;

    do {
      fullName =
        `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    } while (usedNames.has(fullName));

    usedNames.add(fullName);

    const career = CAREERS[i % CAREERS.length];
    const university = UNIVERSITIES[i % UNIVERSITIES.length];
    const city = CITIES[i % CITIES.length];

    people.push({
      fullName,
      career,
      university,
      city,
      bio: BIOS[i % BIOS.length],
      username:
        `${slugify(fullName).replace(/\./g, "_")}_${suffix}_${String(i + 1).padStart(2, "0")}`,
    });
  }

  return people;
}

function progress(label, current, total) {
  process.stdout.write(
    `\r${label}: ${String(current).padStart(3, " ")}/${total}`
  );

  if (current === total) {
    process.stdout.write("\n");
  }
}

/* =========================================================
   SEED
   ========================================================= */

async function main() {
  const people = makeDemoPeople(USER_COUNT);
  const users = [];

  console.log("1/7 Creando usuarios y perfiles QA...");

  for (let i = 0; i < people.length; i += 1) {
    const person = people[i];

    const email =
      `alumni.qa.${runId}.${String(i + 1).padStart(2, "0")}@example.com`;

    const password =
      crypto.randomBytes(18).toString("base64url") + "!Q9";

    const {
      data: authData,
      error: authError,
    } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        alumni_qa_seed: true,
        alumni_qa_run_id: runId,
        full_name: person.fullName,
      },
    });

    if (authError || !authData.user) {
      throw new Error(
        `No se pudo crear ${email}: ${authError?.message || "sin usuario"}`
      );
    }

    const userId = authData.user.id;

    manifest.users.push({
      id: userId,
      email,
      username: person.username,
    });

    if (i === 0) {
      manifest.loginDemo = {
        email,
        password,
        username: person.username,
      };
    }

    saveManifest();

    const avatarPath =
      `avatars/qa-demo/${runId}/${userId}.png`;

    const bannerPath =
      `banners/qa-demo/${runId}/${userId}.png`;

    const avatarUrl = await uploadPublicPng(
      "profiles",
      avatarPath,
      scenePng(320, 320, i + 1, "avatar")
    );

    let bannerUrl = null;

    if (i < Math.ceil(USER_COUNT * 0.72)) {
      bannerUrl = await uploadPublicPng(
        "profiles",
        bannerPath,
        scenePng(
          1200,
          420,
          200 + i,
          SCENE_MODES[i % SCENE_MODES.length]
        )
      );
    }

    const { error: profileError } = await admin
      .from("profiles")
      .upsert(
        {
          id: userId,
          username: person.username,
          full_name: person.fullName,
          bio: person.bio,
          university: person.university,
          career: person.career,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
          city: person.city,
          country: "El Salvador",
          residence_country_code: "SV",
          nationality_primary_code: "SV",
          nationality_primary_name: "Salvadoreña",
          education_institution_name: person.university,
          education_program_name: person.career,
          is_private: false,
        },
        { onConflict: "id" }
      );

    if (profileError) {
      throw new Error(
        `Perfil ${person.username}: ${profileError.message}`
      );
    }

    users.push({
      id: userId,
      ...person,
      email,
      password,
      avatarUrl,
      bannerUrl,
    });

    progress("Usuarios", i + 1, people.length);
  }

  console.log("2/7 Creando relaciones entre Alumni...");

  const followPairs = new Set();

  for (let i = 0; i < users.length; i += 1) {
    const targets = sample(
      users.filter((_, index) => index !== i),
      Math.min(
        users.length - 1,
        5 + Math.floor(random() * 5)
      )
    );

    for (const target of targets) {
      followPairs.add(`${users[i].id}:${target.id}`);
    }
  }

  const followRows = [...followPairs].map((pair, index) => {
    const [follower_id, following_id] = pair.split(":");

    return {
      follower_id,
      following_id,
      created_at: daysAgo(
        20 - (index % 18),
        index % 12
      ),
    };
  });

  if (followRows.length) {
    const { error } = await admin
      .from("follows")
      .insert(followRows);

    if (error) {
      throw new Error(
        `Follows: ${error.message}`
      );
    }
  }

  console.log(
    `   ✓ ${followRows.length} relaciones creadas`
  );

  console.log("3/7 Creando publicaciones...");

  const postRecords = [];

  for (let i = 0; i < POST_COUNT; i += 1) {
    const author =
      users[i % users.length];

    const ageDays =
      Math.max(
        0,
        28 - Math.floor(
          (i / Math.max(1, POST_COUNT - 1)) * 28
        )
      );

    const createdAt =
      daysAgo(
        ageDays,
        (POST_COUNT - i) % 16
      );

    const content =
      POST_TEXTS[i % POST_TEXTS.length] +
      (
        i % 5 === 0
          ? "\n\n#Alumni #Comunidad"
          : i % 7 === 0
          ? "\n\n#Carrera #Networking"
          : ""
      );

    const {
      data: post,
      error: postError,
    } = await admin
      .from("posts")
      .insert({
        user_id: author.id,
        content,
        image_url: null,
        image_path: null,
        media_bucket: null,
        created_at: createdAt,
      })
      .select("id")
      .single();

    if (postError || !post) {
      throw new Error(
        `Post ${i + 1}: ${postError?.message || "sin ID"}`
      );
    }

    const record = {
      id: Number(post.id),
      userId: author.id,
      createdAt,
      hasMedia: false,
    };

    manifest.posts.push(record.id);
    saveManifest();

    const mediaChance = i % 8;

    if (mediaChance < 5) {
      const carouselCount =
        mediaChance === 4
          ? 2 + (i % 2)
          : 1;

      const ratio =
        RATIOS[i % RATIOS.length];

      const mediaRows = [];

      for (
        let mediaIndex = 0;
        mediaIndex < carouselCount;
        mediaIndex += 1
      ) {
        const mode =
          SCENE_MODES[
            (i + mediaIndex) % SCENE_MODES.length
          ];

        const objectPath =
          `qa-demo/${runId}/${author.id}/${record.id}/${mediaIndex}.png`;

        const mediaUrl = await uploadPublicPng(
          "posts",
          objectPath,
          scenePng(
            ratio.width,
            ratio.height,
            1000 + i * 7 + mediaIndex,
            mode
          )
        );

        mediaRows.push({
          post_id: record.id,
          user_id: author.id,
          media_type: "image",
          media_url: mediaUrl,
          media_path: objectPath,
          media_bucket: "posts",
          mime_type: "image/png",
          sort_order: mediaIndex,
          width: ratio.width,
          height: ratio.height,
          created_at: createdAt,
        });
      }

      const { error: mediaError } = await admin
        .from("post_media")
        .insert(mediaRows);

      if (mediaError) {
        throw new Error(
          `Media post ${record.id}: ${mediaError.message}`
        );
      }

      const first = mediaRows[0];

      const { error: updateError } = await admin
        .from("posts")
        .update({
          image_url: first.media_url,
          image_path: first.media_path,
          media_bucket: "posts",
        })
        .eq("id", record.id);

      if (updateError) {
        throw new Error(
          `Actualizar imagen post ${record.id}: ${updateError.message}`
        );
      }

      record.hasMedia = true;
    }

    postRecords.push(record);
    progress("Posts", i + 1, POST_COUNT);
  }

  console.log("4/7 Agregando likes y comentarios...");

  const likeKeys = new Set();
  const likeRows = [];

  for (const post of postRecords) {
    const possible =
      users.filter(
        (user) =>
          user.id !== post.userId
      );

    const likerCount =
      Math.min(
        possible.length,
        3 + Math.floor(random() * 9)
      );

    for (const liker of sample(possible, likerCount)) {
      const key =
        `${post.id}:${liker.id}`;

      if (likeKeys.has(key)) continue;
      likeKeys.add(key);

      likeRows.push({
        post_id: post.id,
        user_id: liker.id,
        created_at: new Date(
          new Date(post.createdAt).getTime() +
            (1 + Math.floor(random() * 72)) *
              3600000
        ).toISOString(),
      });
    }
  }

  if (likeRows.length) {
    const { error } = await admin
      .from("likes")
      .insert(likeRows);

    if (error) {
      throw new Error(
        `Likes: ${error.message}`
      );
    }
  }

  const commentRows = [];

  for (let i = 0; i < postRecords.length; i += 1) {
    const post = postRecords[i];

    if (i % 3 === 2) continue;

    const possible =
      users.filter(
        (user) =>
          user.id !== post.userId
      );

    const count =
      1 + Math.floor(random() * 4);

    for (const commenter of sample(possible, count)) {
      commentRows.push({
        post_id: post.id,
        user_id: commenter.id,
        content:
          COMMENT_TEXTS[
            Math.floor(
              random() * COMMENT_TEXTS.length
            )
          ],
        created_at: new Date(
          new Date(post.createdAt).getTime() +
            (2 + Math.floor(random() * 96)) *
              3600000
        ).toISOString(),
      });
    }
  }

  if (commentRows.length) {
    const { error } = await admin
      .from("comments")
      .insert(commentRows);

    if (error) {
      throw new Error(
        `Comentarios: ${error.message}`
      );
    }
  }

  console.log(
    `   ✓ ${likeRows.length} likes · ${commentRows.length} comentarios`
  );

  console.log("5/7 Creando eventos Alumni...");

  const EVENT_TITLES = [
    "Encuentro Alumni · Café y conexiones",
    "Taller de portafolio profesional",
    "After Office de Ingeniería y Tecnología",
    "Conversatorio: Primeros años de carrera",
    "Jornada deportiva Alumni",
    "Sesión de mentoría abierta",
    "Networking creativo y diseño",
    "Reencuentro de generaciones",
    "Charla de liderazgo joven",
    "Voluntariado Alumni en comunidad",
    "Panel de emprendimiento",
    "Encuentro de profesionales en finanzas",
    "Noche cultural Alumni",
    "Workshop de entrevistas",
    "Reunión de comunidad profesional",
    "Encuentro de graduados recientes",
  ];

  const eventRows = [];

  for (let i = 0; i < EVENT_COUNT; i += 1) {
    const past =
      i < Math.floor(EVENT_COUNT / 2);

    const eventDate =
      past
        ? daysAgo(
            3 + i * 6,
            0
          )
        : daysFromNow(
            3 + (i - Math.floor(EVENT_COUNT / 2)) * 7,
            18 + (i % 2)
          );

    eventRows.push({
      title: EVENT_TITLES[i % EVENT_TITLES.length],
      description:
        "Un espacio para conectar con otros Alumni, compartir experiencias y conocer proyectos de la comunidad.",
      location:
        [
          "San Salvador",
          "Santa Tecla",
          "Antiguo Cuscatlán",
          "Santa Ana",
          "San Miguel",
        ][i % 5],
      event_date:
        eventDate.replace("Z", "").slice(0, 19),
      end_date:
        new Date(
          new Date(eventDate).getTime() +
            2 * 3600000
        )
          .toISOString()
          .replace("Z", "")
          .slice(0, 19),
      created_by:
        users[i % users.length].id,
      visibility: "public",
      event_type:
        [
          "meetup",
          "academic",
          "meetup",
          "academic",
          "sports",
          "academic",
          "cultural",
          "party",
        ][i % 8],
      max_attendees:
        30 + (i % 4) * 20,
    });
  }

  const {
    data: insertedEvents,
    error: eventError,
  } = await admin
    .from("events")
    .insert(eventRows)
    .select("id,title,event_date");

  if (eventError) {
    throw new Error(
      `Eventos: ${eventError.message}`
    );
  }

  const events =
    insertedEvents || [];

  manifest.events =
    events.map(
      (event) =>
        Number(event.id)
    );
  saveManifest();

  console.log(
    `   ✓ ${events.length} eventos creados`
  );

  console.log("6/7 Agregando participación en eventos...");

  const rsvpRows = [];

  for (let i = 0; i < events.length; i += 1) {
    const attendees =
      sample(
        users,
        Math.min(
          users.length,
          6 + Math.floor(random() * 7)
        )
      );

    for (
      let j = 0;
      j < attendees.length;
      j += 1
    ) {
      rsvpRows.push({
        event_id:
          Number(events[i].id),
        user_id:
          attendees[j].id,
        status:
          j < Math.ceil(attendees.length * 0.7)
            ? "going"
            : "interested",
        created_at:
          daysAgo(
            6 + (i % 8),
            j
          ),
        updated_at:
          daysAgo(
            2 + (i % 3),
            j
          ),
      });
    }
  }

  if (rsvpRows.length) {
    const { error } = await admin
      .from("event_rsvps")
      .insert(rsvpRows);

    if (error) {
      throw new Error(
        `RSVP: ${error.message}`
      );
    }
  }

  console.log(
    `   ✓ ${rsvpRows.length} respuestas a eventos`
  );

  console.log("7/7 Finalizando manifiesto reversible...");

  manifest.summary = {
    users: users.length,
    follows: followRows.length,
    posts: postRecords.length,
    mediaObjects:
      manifest.storage.filter(
        (item) =>
          item.bucket === "posts"
      ).length,
    profileImages:
      manifest.storage.filter(
        (item) =>
          item.bucket === "profiles"
      ).length,
    likes: likeRows.length,
    comments: commentRows.length,
    events: events.length,
    eventRsvps: rsvpRows.length,
  };

  manifest.completedAt =
    new Date().toISOString();

  saveManifest();

  console.log("");
  console.log("✅ ALUMNI YA TIENE COMUNIDAD QA TEMPORAL");
  console.log("");
  console.table(manifest.summary);

  console.log("");
  console.log("Cuenta demo para entrar como un usuario ficticio:");
  console.log("Email:   ", manifest.loginDemo.email);
  console.log("Password:", manifest.loginDemo.password);
  console.log("Usuario: @", manifest.loginDemo.username);
  console.log("");
  console.log("El manifiesto quedó FUERA del repositorio:");
  console.log(manifestFile);
  console.log("");
  console.log("Cuando termines de revisar la app ejecutá:");
  console.log(
    "node .\\scripts\\qa-demo\\cleanup_alumni_demo.js --confirm=DELETE-ALUMNI-QA"
  );
  console.log("");
}

main().catch((error) => {
  console.error("");
  console.error("❌ QA Seed se detuvo:", error?.message || error);
  console.error("");
  console.error(
    "El manifiesto parcial fue conservado para poder limpiar lo creado:"
  );
  console.error(manifestFile);
  console.error("");
  console.error("Ejecutá:");
  console.error(
    "node .\\scripts\\qa-demo\\cleanup_alumni_demo.js --confirm=DELETE-ALUMNI-QA"
  );
  process.exit(1);
});
