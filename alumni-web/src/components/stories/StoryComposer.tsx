"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  AtSign,
  Award,
  Briefcase,
  Check,
  Film,
  ImagePlus,
  Images,
  Layers3,
  Loader2,
  Move,
  Palette,
  Play,
  SlidersHorizontal,
  Sparkles,
  UserRoundPlus,
  Type,
  WandSparkles,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { prepareStoryImage } from "@/lib/storyImagePipeline";
import StoryDesignOverlay from "@/components/stories/StoryDesignOverlay";
import StoryFreeOverlay, {
  STORY_FILTER_CSS,
  type SharedPostStoryPayload,
  type StoryMediaFilter,
  type StoryOverlayData,
  type StoryTextColor,
  type StoryTextFill,
} from "@/components/stories/StoryFreeOverlay";

type Props = {
  open: boolean;
  onClose: () => void;
  onPublished: () => void | Promise<void>;
  initialSharedPost?:
    | SharedPostStoryPayload
    | null;
};

type StoryKind =
  | "achievement"
  | "opportunity"
  | "standard";

type DesignTemplate = {
  id: string;
  label: string;
  kind:
    | "achievement"
    | "opportunity"
    | "standard";
  description: string;
};

const ACHIEVEMENT_TYPES = [
  "Graduación",
  "Certificación",
  "Nuevo empleo",
  "Ascenso",
  "Proyecto",
  "Reconocimiento",
  "Otro",
];

const OPPORTUNITY_TYPES = [
  "Empleo",
  "Práctica",
  "Freelance",
  "Beca",
  "Voluntariado",
  "Otro",
];

const WORK_MODES = [
  "Presencial",
  "Híbrido",
  "Remoto",
];

const TEMPLATES: DesignTemplate[] = [
  {
    id: "elegant",
    label: "Elegant Card",
    kind: "achievement",
    description:
      "Foto protagonista y composición premium.",
  },
  {
    id: "celebration",
    label: "Celebration",
    kind: "achievement",
    description:
      "Más energía y celebración visual.",
  },
  {
    id: "spotlight",
    label: "Spotlight",
    kind: "achievement",
    description:
      "Imagen central con atmósfera cinematográfica.",
  },
  {
    id: "prestige",
    label: "Minimal Prestige",
    kind: "achievement",
    description:
      "Limpio, elegante y muy editorial.",
  },
  {
    id: "editorial",
    label: "Editorial",
    kind: "achievement",
    description:
      "Sensación de revista profesional.",
  },
  {
    id: "job-card",
    label: "Job Card",
    kind: "opportunity",
    description:
      "Vacante clara con lectura inmediata.",
  },
  {
    id: "corporate-glass",
    label: "Corporate Glass",
    kind: "opportunity",
    description:
      "Panel profesional con efecto glass.",
  },
  {
    id: "startup",
    label: "Startup Modern",
    kind: "opportunity",
    description:
      "Visual fresco, moderno y tecnológico.",
  },
  {
    id: "hiring-focus",
    label: "Hiring Focus",
    kind: "opportunity",
    description:
      "Prioriza puesto, empresa y CTA.",
  },
  {
    id: "clean-recruit",
    label: "Clean Recruit",
    kind: "opportunity",
    description:
      "Minimal y corporativo.",
  },
];

const ACCENTS = [
  {
    id: "indigo",
    label: "Indigo",
    dot: "#818cf8",
  },
  {
    id: "violet",
    label: "Violeta",
    dot: "#a78bfa",
  },
  {
    id: "gold",
    label: "Dorado",
    dot: "#fbbf24",
  },
  {
    id: "emerald",
    label: "Esmeralda",
    dot: "#34d399",
  },
  {
    id: "cyan",
    label: "Cian",
    dot: "#22d3ee",
  },
  {
    id: "blue",
    label: "Azul",
    dot: "#60a5fa",
  },
];

const PHOTO_STYLES = [
  {
    id: "card",
    label: "Card",
  },
  {
    id: "polaroid",
    label: "Polaroid",
  },
  {
    id: "spotlight",
    label: "Spotlight",
  },
  {
    id: "glass",
    label: "Glass",
  },
  {
    id: "full",
    label: "Full",
  },
];

const DECORS = [
  {
    id: "sparkles",
    label: "Destellos",
  },
  {
    id: "rings",
    label: "Aros",
  },
  {
    id: "grid",
    label: "Grid",
  },
  {
    id: "confetti",
    label: "Confetti",
  },
  {
    id: "none",
    label: "Limpio",
  },
];

const ANIMATIONS = [
  {
    id: "fade",
    label: "Fade",
  },
  {
    id: "rise",
    label: "Rise",
  },
  {
    id: "pop",
    label: "Pop",
  },
  {
    id: "glow",
    label: "Glow",
  },
  {
    id: "float",
    label: "Float",
  },
  {
    id: "reveal",
    label: "Reveal",
  },
];

const FONT_STYLES = [
  {
    id: "modern",
    label: "Modern",
  },
  {
    id: "editorial",
    label: "Editorial",
  },
  {
    id: "serif",
    label: "Serif",
  },
  {
    id: "display",
    label: "Display",
  },
];

const MAX_VIDEO_BYTES =
  50 * 1024 * 1024;

function cleanName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "_")
    .slice(-120);
}

function loadImage(
  url: string
) {
  return new Promise<HTMLImageElement>(
    (resolve, reject) => {
      const img =
        new Image();

      img.onload = () =>
        resolve(img);
      img.onerror = () =>
        reject(
          new Error(
            "No se pudo leer la fotografía."
          )
        );
      img.src = url;
    }
  );
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const scale = Math.max(
    w / image.naturalWidth,
    h / image.naturalHeight
  );

  const sw =
    w / scale;
  const sh =
    h / scale;

  const sx =
    (image.naturalWidth - sw) /
    2;
  const sy =
    (image.naturalHeight - sh) /
    2;

  ctx.drawImage(
    image,
    sx,
    sy,
    sw,
    sh,
    x,
    y,
    w,
    h
  );
}

/* ALUMNI_1_0_19_NO_CROP */
function drawPhotoNoCrop(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  ctx.filter = "blur(30px)";
  ctx.globalAlpha = 0.72;
  drawCover(ctx, image, x - 42, y - 42, w + 84, h + 84);

  ctx.filter = "none";
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(0,0,0,.16)";
  ctx.fillRect(x, y, w, h);

  const fitScale = Math.min(
    w / image.naturalWidth,
    h / image.naturalHeight
  );
  const scale = Math.min(1, fitScale);
  const dw = image.naturalWidth * scale;
  const dh = image.naturalHeight * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;

  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    dx,
    dy,
    dw,
    dh
  );

  ctx.restore();
}

async function generateStoryBackground({
  file,
  kind,
  accent,
  photoStyle,
  decor,
}: {
  file: File | null;
  kind:
    | "achievement"
    | "opportunity";
  accent: string;
  photoStyle: string;
  decor: string;
}) {
  const canvas =
    document.createElement(
      "canvas"
    );

  // Resolución oficial 9:16.
  canvas.width = 1080;
  canvas.height = 1920;

  const ctx =
    canvas.getContext("2d");

  if (!ctx) {
    throw new Error(
      "No se pudo crear la historia."
    );
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const accentMap:
    Record<string, string> = {
      indigo: "#6366f1",
      violet: "#8b5cf6",
      gold: "#f59e0b",
      emerald: "#10b981",
      cyan: "#06b6d4",
      blue: "#3b82f6",
    };

  const accentColor =
    accentMap[accent] ||
    (kind === "achievement"
      ? "#6366f1"
      : "#10b981");

  const base =
    ctx.createLinearGradient(
      0,
      0,
      1080,
      1920
    );

  if (
    kind === "achievement"
  ) {
    base.addColorStop(
      0,
      "#111827"
    );
    base.addColorStop(
      0.52,
      "#0f172a"
    );
    base.addColorStop(
      1,
      "#090c12"
    );
  } else {
    base.addColorStop(
      0,
      "#0c1d18"
    );
    base.addColorStop(
      0.52,
      "#0c1714"
    );
    base.addColorStop(
      1,
      "#070c0a"
    );
  }

  ctx.fillStyle = base;
  ctx.fillRect(
    0,
    0,
    1080,
    1920
  );

  const halo =
    ctx.createRadialGradient(
      220,
      330,
      30,
      220,
      330,
      850
    );

  halo.addColorStop(
    0,
    `${accentColor}66`
  );
  halo.addColorStop(
    1,
    "rgba(0,0,0,0)"
  );

  ctx.fillStyle = halo;
  ctx.fillRect(
    0,
    0,
    1080,
    1100
  );

  if (decor === "grid") {
    ctx.strokeStyle =
      "rgba(255,255,255,.04)";
    ctx.lineWidth = 1;

    for (
      let x = 0;
      x <= 1080;
      x += 72
    ) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1920);
      ctx.stroke();
    }

    for (
      let y = 0;
      y <= 1920;
      y += 72
    ) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1080, y);
      ctx.stroke();
    }
  }

  if (decor === "rings") {
    ctx.strokeStyle =
      "rgba(255,255,255,.10)";
    ctx.lineWidth = 4;

    [
      [940, 520, 300],
      [940, 520, 200],
      [940, 520, 110],
    ].forEach(
      ([x, y, r]) => {
        ctx.beginPath();
        ctx.arc(
          x,
          y,
          r,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }
    );
  }

  if (
    decor === "confetti"
  ) {
    for (
      let i = 0;
      i < 44;
      i++
    ) {
      const x =
        (i * 173) % 1080;
      const y =
        (i * 311) % 1520;

      ctx.fillStyle =
        i % 3 === 0
          ? `${accentColor}aa`
          : "rgba(255,255,255,.22)";

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(
        (i * 0.57) % Math.PI
      );
      ctx.fillRect(
        -3,
        -12,
        6,
        24
      );
      ctx.restore();
    }
  }

  if (
    decor === "sparkles"
  ) {
    [
      [884, 350, 10],
      [920, 405, 5],
      [150, 1050, 6],
      [812, 1170, 4],
    ].forEach(
      ([x, y, r]) => {
        ctx.fillStyle =
          "rgba(255,255,255,.45)";
        ctx.beginPath();
        ctx.arc(
          x,
          y,
          r,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    );
  }

  if (file) {
    const objectUrl =
      URL.createObjectURL(
        file
      );

    try {
      const image =
        await loadImage(
          objectUrl
        );

      if (
        photoStyle === "full"
      ) {
        drawPhotoNoCrop(
          ctx,
          image,
          0,
          0,
          1080,
          1920
        );

        const shade =
          ctx.createLinearGradient(
            0,
            0,
            0,
            1920
          );

        shade.addColorStop(
          0,
          "rgba(0,0,0,.20)"
        );
        shade.addColorStop(
          0.55,
          "rgba(0,0,0,.08)"
        );
        shade.addColorStop(
          1,
          "rgba(0,0,0,.74)"
        );

        ctx.fillStyle = shade;
        ctx.fillRect(
          0,
          0,
          1080,
          1920
        );
      } else {
        const frame = {
          x: 125,
          y: 360,
          w: 830,
          h: 920,
        };

        if (
          photoStyle ===
          "polaroid"
        ) {
          ctx.fillStyle =
            "#f8fafc";
          ctx.shadowColor =
            "rgba(0,0,0,.35)";
          ctx.shadowBlur = 48;
          ctx.shadowOffsetY = 24;

          ctx.beginPath();
          ctx.roundRect(
            frame.x - 34,
            frame.y - 34,
            frame.w + 68,
            frame.h + 118,
            38
          );
          ctx.fill();

          ctx.shadowColor =
            "transparent";

          drawPhotoNoCrop(
            ctx,
            image,
            frame.x,
            frame.y,
            frame.w,
            frame.h
          );
        } else if (
          photoStyle ===
          "spotlight"
        ) {
          ctx.save();
          ctx.shadowColor =
            `${accentColor}88`;
          ctx.shadowBlur = 90;

          ctx.beginPath();
          ctx.roundRect(
            150,
            420,
            780,
            780,
            390
          );
          ctx.clip();

          drawPhotoNoCrop(
            ctx,
            image,
            150,
            420,
            780,
            780
          );

          ctx.restore();
        } else {
          ctx.save();

          ctx.shadowColor =
            photoStyle ===
            "glass"
              ? `${accentColor}66`
              : "rgba(0,0,0,.45)";
          ctx.shadowBlur =
            photoStyle ===
            "glass"
              ? 72
              : 44;
          ctx.shadowOffsetY = 20;

          ctx.beginPath();
          ctx.roundRect(
            frame.x,
            frame.y,
            frame.w,
            frame.h,
            photoStyle ===
            "glass"
              ? 56
              : 38
          );
          ctx.clip();

          drawPhotoNoCrop(
            ctx,
            image,
            frame.x,
            frame.y,
            frame.w,
            frame.h
          );

          ctx.restore();

          ctx.strokeStyle =
            photoStyle ===
            "glass"
              ? "rgba(255,255,255,.28)"
              : "rgba(255,255,255,.12)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(
            frame.x,
            frame.y,
            frame.w,
            frame.h,
            photoStyle ===
            "glass"
              ? 56
              : 38
          );
          ctx.stroke();
        }
      }
    } finally {
      URL.revokeObjectURL(
        objectUrl
      );
    }
  }

  return new Promise<File>(
    (resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error(
                "No se pudo generar el diseño."
              )
            );
            return;
          }

          resolve(
            new File(
              [blob],
              `alumni-story-${Date.now()}.jpg`,
              {
                type: "image/jpeg",
                lastModified:
                  Date.now(),
              }
            )
          );
        },
        "image/jpeg",
        0.98
      );
    }
  );
}

type MentionProfile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
};

const STORY_FILTERS: Array<{
  id: StoryMediaFilter;
  label: string;
}> = [
  {
    id: "original",
    label: "Original",
  },
  {
    id: "vivid",
    label: "Vivo",
  },
  {
    id: "warm",
    label: "Cálido",
  },
  {
    id: "cool",
    label: "Frío",
  },
  {
    id: "mono",
    label: "B&N",
  },
  {
    id: "fade",
    label: "Fade",
  },
];

const STORY_TEXT_COLORS: Array<{
  id: StoryTextColor;
  label: string;
  value: string;
}> = [
  {
    id: "white",
    label: "Blanco",
    value: "#ffffff",
  },
  {
    id: "black",
    label: "Negro",
    value: "#090b10",
  },
  {
    id: "indigo",
    label: "Indigo",
    value: "#aeb6ff",
  },
  {
    id: "cyan",
    label: "Cian",
    value: "#8be9ff",
  },
  {
    id: "emerald",
    label: "Verde",
    value: "#8cf2c6",
  },
  {
    id: "gold",
    label: "Dorado",
    value: "#ffd782",
  },
  {
    id: "rose",
    label: "Rosa",
    value: "#ff9fc2",
  },
];

function drawCollageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const scale =
    Math.max(
      w /
        image.naturalWidth,
      h /
        image.naturalHeight
    );

  const sw = w / scale;
  const sh = h / scale;
  const sx =
    (image.naturalWidth -
      sw) /
    2;
  const sy =
    (image.naturalHeight -
      sh) /
    2;

  ctx.drawImage(
    image,
    sx,
    sy,
    sw,
    sh,
    x,
    y,
    w,
    h
  );
}

function collageFrames(
  count: number
) {
  const gap = 12;

  if (count === 2) {
    return [
      {
        x: 0,
        y: 0,
        w: 1080,
        h:
          960 -
          gap / 2,
      },
      {
        x: 0,
        y:
          960 +
          gap / 2,
        w: 1080,
        h:
          960 -
          gap / 2,
      },
    ];
  }

  if (count === 3) {
    return [
      {
        x: 0,
        y: 0,
        w: 1080,
        h: 960 - gap / 2,
      },
      {
        x: 0,
        y: 960 + gap / 2,
        w: 540 - gap / 2,
        h: 960 - gap / 2,
      },
      {
        x: 540 + gap / 2,
        y: 960 + gap / 2,
        w: 540 - gap / 2,
        h: 960 - gap / 2,
      },
    ];
  }

  return [
    {
      x: 0,
      y: 0,
      w: 540 - gap / 2,
      h: 960 - gap / 2,
    },
    {
      x: 540 + gap / 2,
      y: 0,
      w: 540 - gap / 2,
      h: 960 - gap / 2,
    },
    {
      x: 0,
      y: 960 + gap / 2,
      w: 540 - gap / 2,
      h: 960 - gap / 2,
    },
    {
      x: 540 + gap / 2,
      y: 960 + gap / 2,
      w: 540 - gap / 2,
      h: 960 - gap / 2,
    },
  ];
}

async function generateCollageImage(
  files: File[]
) {
  if (
    files.length < 2 ||
    files.length > 4
  ) {
    throw new Error(
      "El collage admite de 2 a 4 fotografías."
    );
  }

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width = 1080;
  canvas.height = 1920;

  const ctx =
    canvas.getContext(
      "2d"
    );

  if (!ctx) {
    throw new Error(
      "No se pudo crear el collage."
    );
  }

  ctx.imageSmoothingEnabled =
    true;

  ctx.imageSmoothingQuality =
    "high";

  ctx.fillStyle =
    "#07090e";

  ctx.fillRect(
    0,
    0,
    1080,
    1920
  );

  const urls =
    files.map(
      (file) =>
        URL.createObjectURL(
          file
        )
    );

  try {
    const images =
      await Promise.all(
        urls.map(
          (url) =>
            loadImage(url)
        )
      );

    const frames =
      collageFrames(
        images.length
      );

    images.forEach(
      (
        image,
        index
      ) => {
        const frame =
          frames[index];

        drawCollageCover(
          ctx,
          image,
          frame.x,
          frame.y,
          frame.w,
          frame.h
        );
      }
    );
  } finally {
    urls.forEach(
      (url) =>
        URL.revokeObjectURL(
          url
        )
    );
  }

  return new Promise<File>(
    (
      resolve,
      reject
    ) => {
      const done = (
        blob:
          | Blob
          | null
      ) => {
        if (!blob) {
          reject(
            new Error(
              "No se pudo guardar el collage."
            )
          );
          return;
        }

        resolve(
          new File(
            [blob],
            `alumni-collage-${Date.now()}.webp`,
            {
              type:
                blob.type ||
                "image/webp",
              lastModified:
                Date.now(),
            }
          )
        );
      };

      canvas.toBlob(
        done,
        "image/webp",
        0.97
      );
    }
  );
}

function activeMentionToken(
  value: string
) {
  const match =
    value.match(
      /(?:^|\s)@([a-zA-Z0-9._-]*)$/
    );

  return match
    ? match[1]
    : null;
}

async function generateSharedPostBackground() {
  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width = 1080;
  canvas.height = 1920;

  const ctx =
    canvas.getContext(
      "2d"
    );

  if (!ctx) {
    throw new Error(
      "No se pudo crear la historia."
    );
  }

  ctx.imageSmoothingEnabled =
    true;
  ctx.imageSmoothingQuality =
    "high";

  const gradient =
    ctx.createLinearGradient(
      0,
      0,
      1080,
      1920
    );

  gradient.addColorStop(
    0,
    "#111b35"
  );
  gradient.addColorStop(
    0.45,
    "#0c1221"
  );
  gradient.addColorStop(
    1,
    "#080b11"
  );

  ctx.fillStyle =
    gradient;

  ctx.fillRect(
    0,
    0,
    1080,
    1920
  );

  const halo =
    ctx.createRadialGradient(
      540,
      680,
      20,
      540,
      680,
      760
    );

  halo.addColorStop(
    0,
    "rgba(109,124,255,.34)"
  );
  halo.addColorStop(
    1,
    "rgba(109,124,255,0)"
  );

  ctx.fillStyle =
    halo;

  ctx.fillRect(
    0,
    0,
    1080,
    1500
  );

  ctx.strokeStyle =
    "rgba(255,255,255,.045)";
  ctx.lineWidth = 2;

  for (
    let y = 280;
    y < 1680;
    y += 210
  ) {
    ctx.beginPath();
    ctx.moveTo(
      110,
      y
    );
    ctx.lineTo(
      970,
      y
    );
    ctx.stroke();
  }

  return new Promise<File>(
    (resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error(
                "No se pudo preparar la historia."
              )
            );
            return;
          }

          resolve(
            new File(
              [blob],
              `alumni-shared-post-${Date.now()}.jpg`,
              {
                type:
                  "image/jpeg",
                lastModified:
                  Date.now(),
              }
            )
          );
        },
        "image/jpeg",
        0.96
      );
    }
  );
}

export default function StoryComposer({
  open,
  onClose,
  onPublished,
  initialSharedPost = null,
}: Props) {
  const { user } = useAuth();

  const mediaInputRef =
    useRef<HTMLInputElement>(null);

  const collageInputRef =
    useRef<HTMLInputElement>(null);

  const mentionTimerRef =
    useRef<number | null>(
      null
    );

  const [kind, setKind] =
    useState<StoryKind | null>(
      null
    );

  const [file, setFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [publishing, setPublishing] =
    useState(false);

  const [headline, setHeadline] =
    useState("");

  const [caption, setCaption] =
    useState("");

  const [
    organization,
    setOrganization,
  ] = useState("");

  const [
    achievementType,
    setAchievementType,
  ] = useState(
    ACHIEVEMENT_TYPES[0]
  );

  const [
    opportunityType,
    setOpportunityType,
  ] = useState(
    OPPORTUNITY_TYPES[0]
  );

  const [
    workMode,
    setWorkMode,
  ] = useState(
    WORK_MODES[0]
  );

  const [
    locationText,
    setLocationText,
  ] = useState("");

  const [actionUrl, setActionUrl] =
    useState("");

  const [template, setTemplate] =
    useState("elegant");

  const [accent, setAccent] =
    useState("indigo");

  const [
    photoStyle,
    setPhotoStyle,
  ] = useState("card");

  const [decor, setDecor] =
    useState("sparkles");

  const [
    animation,
    setAnimation,
  ] = useState("rise");

  const [
    fontStyle,
    setFontStyle,
  ] = useState("modern");

  const [
    storyText,
    setStoryText,
  ] = useState("");

  const [
    storyTextStyle,
    setStoryTextStyle,
  ] =
    useState<
      "clean" |
      "glass" |
      "accent"
    >("clean");

  const [
    storyTextSize,
    setStoryTextSize,
  ] =
    useState<
      "small" |
      "medium" |
      "large"
    >("medium");

  const [
    storyTextPosition,
    setStoryTextPosition,
  ] = useState({
    x: 50,
    y: 38,
  });

  const [
    sharedPost,
    setSharedPost,
  ] =
    useState<SharedPostStoryPayload | null>(
      null
    );

  const [
    storyTextScale,
    setStoryTextScale,
  ] = useState(1);

  const [
    storyTextEditing,
    setStoryTextEditing,
  ] = useState(false);

  const [
    storyStyleOpen,
    setStoryStyleOpen,
  ] = useState(false);

  const [
    storyTextColor,
    setStoryTextColor,
  ] =
    useState<StoryTextColor>(
      "white"
    );

  const [
    storyTextFill,
    setStoryTextFill,
  ] =
    useState<StoryTextFill>(
      "none"
    );

  const [
    storyFilter,
    setStoryFilter,
  ] =
    useState<StoryMediaFilter>(
      "original"
    );

  const [
    storyFilterOpen,
    setStoryFilterOpen,
  ] = useState(false);

  const [
    collageFiles,
    setCollageFiles,
  ] = useState<File[]>([]);

  const [
    collagePreviewUrls,
    setCollagePreviewUrls,
  ] = useState<string[]>([]);

  const [
    followingProfiles,
    setFollowingProfiles,
  ] =
    useState<MentionProfile[]>(
      []
    );

  const [
    mentionResults,
    setMentionResults,
  ] =
    useState<MentionProfile[]>(
      []
    );

  const [
    mentionLoading,
    setMentionLoading,
  ] = useState(false);

  const [editorTab, setEditorTab] =
    useState<
      | "content"
      | "template"
      | "style"
      | "animate"
    >("content");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }

    const url =
      URL.createObjectURL(
        file
      );

    setPreviewUrl(url);

    return () =>
      URL.revokeObjectURL(
        url
      );
  }, [file]);

  useEffect(() => {
    if (!open) {
      resetAll();
    }
  }, [open]);

  useEffect(() => {
    const urls =
      collageFiles.map(
        (item) =>
          URL.createObjectURL(
            item
          )
      );

    setCollagePreviewUrls(
      urls
    );

    return () => {
      urls.forEach(
        (url) =>
          URL.revokeObjectURL(
            url
          )
      );
    };
  }, [collageFiles]);

  useEffect(() => {
    if (
      !open ||
      !user ||
      kind !== "standard"
    ) {
      return;
    }

    /*
      ALUMNI_1_1_0_D2_1_USER_NARROW
      El guard superior confirma que user existe,
      pero TypeScript pierde ese narrowing dentro
      de una función async anidada. Conservamos
      una referencia no nula estable.
    */
    const currentUser =
      user;

    let cancelled =
      false;

    async function loadFollowingProfiles() {
      const {
        data: followsData,
      } =
        await supabase
          .from("follows")
          .select(
            "following_id"
          )
          .eq(
            "follower_id",
            currentUser.id
          );

      const ids =
        (followsData ||
          []).map(
          (item: any) =>
            item.following_id
        );

      if (
        !ids.length ||
        cancelled
      ) {
        setFollowingProfiles(
          []
        );
        return;
      }

      const {
        data:
          profilesData,
      } =
        await supabase
          .from("profiles")
          .select(
            "id, username, full_name, avatar_url"
          )
          .in(
            "id",
            ids
          )
          .limit(80);

      if (!cancelled) {
        setFollowingProfiles(
          (profilesData ||
            []) as MentionProfile[]
        );
      }
    }

    void loadFollowingProfiles();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    user?.id,
    kind,
  ]);

  const mentionQuery =
    useMemo(
      () =>
        activeMentionToken(
          storyText
        ),
      [storyText]
    );

  useEffect(() => {
    if (
      mentionTimerRef.current !==
      null
    ) {
      window.clearTimeout(
        mentionTimerRef.current
      );
    }

    if (
      !storyTextEditing ||
      mentionQuery === null
    ) {
      setMentionResults(
        []
      );
      setMentionLoading(
        false
      );
      return;
    }

    const normalized =
      mentionQuery.toLowerCase();

    const followedMatches =
      followingProfiles.filter(
        (profile) =>
          profile.username
            ?.toLowerCase()
            .startsWith(
              normalized
            ) ||
          profile.full_name
            ?.toLowerCase()
            .startsWith(
              normalized
            )
      );

    if (!normalized) {
      setMentionResults(
        followedMatches.slice(
          0,
          7
        )
      );
      return;
    }

    setMentionResults(
      followedMatches.slice(
        0,
        7
      )
    );

    mentionTimerRef.current =
      window.setTimeout(
        () => {
          void (async () => {
            setMentionLoading(
              true
            );

            const {
              data:
                globalProfiles,
            } =
              await supabase
                .from(
                  "profiles"
                )
                .select(
                  "id, username, full_name, avatar_url"
                )
                .neq(
                  "id",
                  user?.id ||
                    ""
                )
                .ilike(
                  "username",
                  `${normalized}%`
                )
                .limit(8);

            const combined =
              [
                ...followedMatches,
                ...((globalProfiles ||
                  []) as MentionProfile[]),
              ];

            const unique =
              Array.from(
                new Map(
                  combined.map(
                    (
                      item
                    ) => [
                      item.id,
                      item,
                    ]
                  )
                ).values()
              ).slice(
                0,
                8
              );

            setMentionResults(
              unique
            );

            setMentionLoading(
              false
            );
          })();
        },
        130
      );

    return () => {
      if (
        mentionTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          mentionTimerRef.current
        );
      }
    };
  }, [
    storyTextEditing,
    mentionQuery,
    followingProfiles,
    user?.id,
  ]);

  useEffect(() => {
    if (
      !open ||
      !initialSharedPost
    ) {
      return;
    }

    setKind(
      "standard"
    );

    setFile(null);

    setSharedPost(
      initialSharedPost
    );

    setStoryText("");
    setStoryTextPosition({
      x: 50,
      y: 28,
    });
  }, [
    open,
    initialSharedPost?.id,
  ]);

  useEffect(() => {
    if (
      kind === "achievement"
    ) {
      setTemplate(
        "elegant"
      );
      setAccent(
        "indigo"
      );
      setDecor(
        "sparkles"
      );
    }

    if (
      kind === "opportunity"
    ) {
      setTemplate(
        "job-card"
      );
      setAccent(
        "emerald"
      );
      setDecor(
        "grid"
      );
    }
  }, [kind]);

  function resetAll() {
    setKind(null);
    setFile(null);
    setPreviewUrl("");
    setPublishing(false);
    setHeadline("");
    setCaption("");
    setOrganization("");
    setAchievementType(
      ACHIEVEMENT_TYPES[0]
    );
    setOpportunityType(
      OPPORTUNITY_TYPES[0]
    );
    setWorkMode(
      WORK_MODES[0]
    );
    setLocationText("");
    setActionUrl("");
    setTemplate("elegant");
    setAccent("indigo");
    setPhotoStyle("card");
    setDecor("sparkles");
    setAnimation("rise");
    setFontStyle("modern");
    setStoryText("");
    setStoryTextStyle(
      "clean"
    );
    setStoryTextSize(
      "medium"
    );
    setStoryTextPosition({
      x: 50,
      y: 38,
    });
    setStoryTextScale(1);
    setStoryTextEditing(false);
    setStoryStyleOpen(false);
    setStoryTextColor(
      "white"
    );
    setStoryTextFill(
      "none"
    );
    setStoryFilter(
      "original"
    );
    setStoryFilterOpen(
      false
    );
    setCollageFiles([]);
    setCollagePreviewUrls(
      []
    );
    setMentionResults(
      []
    );
    setSharedPost(null);
    setEditorTab("content");
  }

  const availableTemplates =
    TEMPLATES.filter(
      (item) =>
        item.kind === kind
    );

  const previewStory =
    useMemo(
      () => ({
        story_kind:
          kind || "standard",
        headline:
          headline ||
          (kind ===
          "achievement"
            ? "Tu próximo gran logro"
            : "Una oportunidad para crecer"),
        caption:
          caption || null,
        achievement_type:
          achievementType,
        opportunity_type:
          opportunityType,
        organization:
          organization || null,
        work_mode:
          workMode,
        location_text:
          locationText || null,
        action_url:
          actionUrl || null,
        story_template:
          template,
        story_accent: accent,
        story_animation:
          animation,
        story_photo_style:
          photoStyle,
        story_decor: decor,
        story_font_style:
          fontStyle,
      }),
      [
        kind,
        headline,
        caption,
        achievementType,
        opportunityType,
        organization,
        workMode,
        locationText,
        actionUrl,
        template,
        accent,
        animation,
        photoStyle,
        decor,
        fontStyle,
      ]
    );

  const standardOverlay =
    useMemo<StoryOverlayData | null>(
      () => {
        if (
          kind !==
          "standard"
        ) {
          return null;
        }

        const textValue =
          storyText.trim();

        if (
          !textValue &&
          !sharedPost &&
          storyFilter ===
            "original"
        ) {
          return null;
        }

        return {
          version: 1,
          text:
            textValue
              ? {
                  value:
                    textValue,
                  x:
                    storyTextPosition.x,
                  y:
                    storyTextPosition.y,
                  size:
                    storyTextSize,
                  scale:
                    storyTextScale,
                  style:
                    "clean",
                  color:
                    storyTextColor,
                  fill:
                    storyTextFill,
                }
              : undefined,
          media_filter:
            storyFilter,
          shared_post:
            sharedPost ||
            undefined,
        };
      },
      [
        kind,
        storyText,
        storyTextColor,
        storyTextFill,
        storyTextSize,
        storyTextScale,
        storyTextPosition.x,
        storyTextPosition.y,
        storyFilter,
        sharedPost,
      ]
    );

  if (!open) {
    return null;
  }

  function chooseMedia(
    selected: File
  ) {
    const valid =
      selected.type.startsWith(
        "image/"
      ) ||
      selected.type.startsWith(
        "video/"
      );

    if (!valid) {
      alert(
        "Selecciona una foto o un video."
      );
      return;
    }

    if (
      selected.type.startsWith(
        "video/"
      ) &&
      selected.size >
        MAX_VIDEO_BYTES
    ) {
      alert(
        "El video no puede superar 50 MB."
      );
      return;
    }

    if (
      kind !== "standard" &&
      selected.type.startsWith(
        "video/"
      )
    ) {
      alert(
        "Para Logros y Oportunidades usa una fotografía. Los videos siguen disponibles en Historia libre."
      );
      return;
    }

    setCollageFiles([]);
    setFile(selected);
  }

  function chooseCollage(
    files: FileList | null
  ) {
    const selected =
      Array.from(
        files || []
      ).filter(
        (item) =>
          item.type.startsWith(
            "image/"
          )
      );

    if (
      selected.length < 2 ||
      selected.length > 4
    ) {
      alert(
        "Selecciona 2, 3 o 4 fotografías para el collage."
      );
      return;
    }

    setFile(null);
    setSharedPost(null);
    setCollageFiles(
      selected
    );
  }

  function insertMention(
    profile: MentionProfile
  ) {
    const replacement =
      `@${profile.username} `;

    setStoryText(
      (current) =>
        current.replace(
          /(?:^|\s)@[a-zA-Z0-9._-]*$/,
          (match) => {
            const prefix =
              match.startsWith(
                " "
              )
                ? " "
                : "";

            return (
              prefix +
              replacement
            );
          }
        )
    );

    setMentionResults(
      []
    );
  }

  function normalizeUrl(
    value: string
  ) {
    const trimmed =
      value.trim();

    if (!trimmed) {
      return null;
    }

    return /^https?:\/\//i.test(
      trimmed
    )
      ? trimmed
      : `https://${trimmed}`;
  }

  async function publishStory() {
    if (
      !user ||
      !kind ||
      publishing
    ) {
      return;
    }

    if (
      kind !== "standard" &&
      !headline.trim()
    ) {
      alert(
        "Escribe el título de la historia."
      );
      return;
    }

    if (
      kind === "standard" &&
      !file &&
      !sharedPost &&
      collageFiles.length < 2
    ) {
      alert(
        "Selecciona una foto o video, o comparte una publicación."
      );
      return;
    }

    setPublishing(true);

    let path:
      | string
      | null = null;

    try {
      let prepared =
        file;

      if (
        kind ===
          "standard" &&
        collageFiles.length >=
          2
      ) {
        prepared =
          await generateCollageImage(
            collageFiles
          );
      }

      if (
        kind ===
          "standard" &&
        !prepared &&
        sharedPost
      ) {
        prepared =
          await generateSharedPostBackground();
      }

      /*
        ALUMNI 1.0.22:
        Historia libre conserva el original si ya está optimizado.
        Solo procesa fotos realmente grandes/pesadas.
        Videos no pasan por este pipeline.
      */
      if (
        kind === "standard" &&
        prepared?.type.startsWith(
          "image/"
        )
      ) {
        prepared =
          (
            await prepareStoryImage(
              prepared
            )
          ).file;
      }

      if (
        kind ===
          "achievement" ||
        kind ===
          "opportunity"
      ) {
        prepared =
          await generateStoryBackground(
            {
              file:
                file &&
                file.type.startsWith(
                  "image/"
                )
                  ? file
                  : null,
              kind,
              accent,
              photoStyle,
              decor,
            }
          );
      }

      if (!prepared) {
        throw new Error(
          "No hay contenido para publicar."
        );
      }

      path =
        `${user.id}/${Date.now()}-${cleanName(
          prepared.name
        )}`;

      const { error: uploadError } =
        await supabase.storage
          .from("stories")
          .upload(
            path,
            prepared,
            {
              cacheControl:
                "31536000",
              upsert: false,
              contentType:
                prepared.type ||
                "image/jpeg",
            }
          );

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } =
        supabase.storage
          .from("stories")
          .getPublicUrl(
            path
          );

      const { error: insertError } =
        await supabase
          .from("stories")
          .insert({
            user_id: user.id,
            media_url:
              urlData.publicUrl,
            media_path: path,
            media_type:
              kind ===
                "standard" &&
              prepared.type.startsWith(
                "video/"
              )
                ? "video"
                : "image",
            caption:
              caption.trim() ||
              null,
            story_kind:
              kind,
            headline:
              kind === "standard"
                ? null
                : headline.trim(),
            achievement_type:
              kind ===
              "achievement"
                ? achievementType
                : null,
            organization:
              kind === "standard"
                ? null
                : organization.trim() ||
                  null,
            opportunity_type:
              kind ===
              "opportunity"
                ? opportunityType
                : null,
            work_mode:
              kind ===
              "opportunity"
                ? workMode
                : null,
            location_text:
              kind ===
              "opportunity"
                ? locationText.trim() ||
                  null
                : null,
            action_url:
              kind ===
              "opportunity"
                ? normalizeUrl(
                    actionUrl
                  )
                : null,
            story_template:
              kind === "standard"
                ? null
                : template,
            story_accent:
              kind === "standard"
                ? null
                : accent,
            story_animation:
              kind === "standard"
                ? null
                : animation,
            story_photo_style:
              kind === "standard"
                ? null
                : photoStyle,
            story_decor:
              kind === "standard"
                ? null
                : decor,
            story_font_style:
              kind === "standard"
                ? null
                : fontStyle,
            story_overlay:
              kind ===
              "standard"
                ? standardOverlay
                : null,

            music_provider: null,
            music_track_id: null,
            music_title: null,
            music_artist: null,
            music_artwork_url: null,
            music_track_url: null,
            music_embed_url: null,
            music_preview_url: null,
            music_duration_ms: null,
            music_clip_start_seconds: 0,
            music_clip_duration_seconds: 15,
          });

      if (insertError) {
        throw insertError;
      }

      await onPublished();
    } catch (error: any) {
      if (path) {
        await supabase.storage
          .from("stories")
          .remove([path]);
      }

      console.error(error);
      alert(
        error?.message ||
          "No se pudo publicar la historia."
      );
    } finally {
      setPublishing(false);
    }
  }

  if (!kind) {
    return (
      <Shell
        title="Crear historia"
        subtitle="Logros, oportunidades y momentos"
        onClose={onClose}
      >
        <div className="px-5 pb-7 pt-4">
          <div className="mb-6">
            <p className="text-[28px] font-black leading-[1.02] tracking-[-0.045em] text-white">
              ¿Qué quieres compartir?
            </p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-600">
              Crea una historia con identidad propia de Alumni.
            </p>
          </div>

          <KindOption
            icon={
              <Award
                size={24}
              />
            }
            title="Compartir un logro"
            text="Graduaciones, certificaciones, empleo, ascensos, proyectos y reconocimientos."
            tone="indigo"
            onClick={() =>
              setKind(
                "achievement"
              )
            }
          />

          <KindOption
            icon={
              <Briefcase
                size={23}
              />
            }
            title="Publicar oportunidad"
            text="Empleos, prácticas, freelance, becas y oportunidades profesionales."
            tone="emerald"
            onClick={() =>
              setKind(
                "opportunity"
              )
            }
          />

          <KindOption
            icon={
              <ImagePlus
                size={23}
              />
            }
            title="Historia libre"
            text="Foto o video en formato vertical 9:16."
            tone="neutral"
            onClick={() =>
              setKind(
                "standard"
              )
            }
          />
        </div>
      </Shell>
    );
  }

  if (
    kind === "standard"
  ) {
    /*
      ALUMNI_1_1_0_D2_STUDIO_PRO
      Todo el editor vive encima de la historia.
      Móvil: pinch directo para escala.
      Desktop: controles A-/A+ auxiliares.
    */
    const editorColor =
      STORY_TEXT_COLORS.find(
        (item) =>
          item.id ===
          storyTextColor
      )?.value ||
      "#ffffff";

    const editorFontSize =
      `clamp(${(
        20 *
        storyTextScale
      ).toFixed(1)}px, ${(
        5.2 *
        storyTextScale
      ).toFixed(2)}vw, ${(
        34 *
        storyTextScale
      ).toFixed(1)}px)`;

    const overlayForCanvas =
      storyTextEditing &&
      standardOverlay
        ? {
            ...standardOverlay,
            text:
              undefined,
          }
        : standardOverlay;

    const hasMedia =
      Boolean(
        previewUrl ||
        sharedPost ||
        collageFiles.length >=
          2
      );

    return createPortal(
      <div
        className="fixed inset-0 z-[2147483000] overflow-hidden bg-[#05070b] text-white"
        data-pull-refresh-lock="true"
      >
        <div className="relative mx-auto h-[100dvh] w-full max-w-[560px] overflow-hidden bg-black shadow-[0_0_90px_rgba(0,0,0,.55)]">
          {collagePreviewUrls.length >=
          2 ? (
            <div
              className="absolute inset-0 grid gap-[3px] bg-[#07090e]"
              style={{
                filter:
                  STORY_FILTER_CSS[
                    storyFilter
                  ],
                gridTemplateColumns:
                  collagePreviewUrls.length ===
                  2
                    ? "1fr"
                    : "1fr 1fr",
                gridTemplateRows:
                  collagePreviewUrls.length ===
                  2
                    ? "1fr 1fr"
                    : collagePreviewUrls.length ===
                      3
                    ? "1fr 1fr"
                    : "1fr 1fr",
              }}
            >
              {collagePreviewUrls.map(
                (
                  url,
                  index
                ) => (
                  <div
                    key={url}
                    className="min-h-0 min-w-0 overflow-hidden"
                    style={
                      collagePreviewUrls.length ===
                        3 &&
                      index === 0
                        ? {
                            gridColumn:
                              "1 / span 2",
                          }
                        : undefined
                    }
                  >
                    <img
                      src={url}
                      alt=""
                      draggable={false}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )
              )}
            </div>
          ) : previewUrl ? (
            file?.type.startsWith(
              "video/"
            ) ? (
              <video
                src={previewUrl}
                autoPlay
                muted
                loop
                playsInline
                style={{
                  filter:
                    STORY_FILTER_CSS[
                      storyFilter
                    ],
                }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <>
                <img
                  src={previewUrl}
                  alt=""
                  aria-hidden="true"
                  style={{
                    filter:
                      STORY_FILTER_CSS[
                        storyFilter
                      ],
                  }}
                  className="absolute inset-0 h-full w-full scale-110 object-cover opacity-55 blur-3xl"
                />

                <div className="absolute inset-0 bg-black/15" />

                <img
                  src={previewUrl}
                  alt=""
                  draggable={false}
                  style={{
                    filter:
                      STORY_FILTER_CSS[
                        storyFilter
                      ],
                  }}
                  className="absolute inset-0 h-full w-full object-contain"
                />
              </>
            )
          ) : sharedPost ? (
            <>
              <div className="absolute inset-0 bg-[linear-gradient(160deg,#111b35_0%,#0c1221_45%,#080b11_100%)]" />
              <div className="absolute left-1/2 top-[18%] h-[58%] w-[120%] -translate-x-1/2 rounded-full bg-[#6d7cff]/14 blur-[90px]" />
              <div className="absolute inset-x-[12%] top-[20%] h-px bg-white/[0.06]" />
              <div className="absolute inset-x-[18%] top-[31%] h-px bg-white/[0.035]" />
            </>
          ) : (
            <button
              type="button"
              onClick={() =>
                mediaInputRef.current?.click()
              }
              className="absolute inset-0 flex flex-col items-center justify-center bg-[#090c12]"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/[0.08] bg-white/[0.045] text-[#aeb6ff] shadow-[0_18px_50px_rgba(0,0,0,.35)]">
                <ImagePlus
                  size={26}
                />
              </span>

              <p className="mt-4 text-sm font-black">
                Elegir foto o video
              </p>

              <p className="mt-1 text-[10px] text-zinc-600">
                Se conserva la calidad original
              </p>
            </button>
          )}

          <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-40 bg-gradient-to-b from-black/70 via-black/20 to-transparent" />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-48 bg-gradient-to-t from-black/72 via-black/24 to-transparent" />

          <StoryFreeOverlay
            overlay={
              overlayForCanvas
            }
            editable={
              !storyTextEditing
            }
            onPositionChange={
              setStoryTextPosition
            }
            onScaleChange={
              setStoryTextScale
            }
          />

          <div className="absolute left-[max(14px,env(safe-area-inset-left))] top-[max(14px,env(safe-area-inset-top))] z-[80] flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setStoryTextEditing(
                  false
                );
                setStoryStyleOpen(
                  false
                );
                setStoryFilterOpen(
                  false
                );
                setKind(null);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.12] bg-black/28 text-white/90 shadow-[0_10px_30px_rgba(0,0,0,.28)] backdrop-blur-2xl transition active:scale-95"
              aria-label="Volver"
            >
              <ArrowLeft
                size={18}
              />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.12] bg-black/28 text-white/65 shadow-[0_10px_30px_rgba(0,0,0,.28)] backdrop-blur-2xl transition active:scale-95"
              aria-label="Cerrar"
            >
              <X
                size={17}
              />
            </button>
          </div>

          {hasMedia && (
            <div className="absolute right-[max(14px,env(safe-area-inset-right))] top-[max(14px,env(safe-area-inset-top))] z-[80] flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setStoryTextEditing(
                    true
                  );
                  setStoryStyleOpen(
                    false
                  );
                  setStoryFilterOpen(
                    false
                  );
                }}
                className={`flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-2xl transition active:scale-95 ${
                  storyTextEditing
                    ? "border-[#aeb6ff]/50 bg-[#6d7cff]/25 text-white"
                    : "border-white/[0.12] bg-black/28 text-white/90"
                }`}
                aria-label="Texto"
              >
                <Type
                  size={19}
                />
              </button>

              <button
                type="button"
                onClick={() => {
                  setStoryText(
                    (current) =>
                      current
                        ? current.endsWith(
                            " "
                          )
                          ? current +
                            "@"
                          : current +
                            " @"
                        : "@"
                  );

                  setStoryTextEditing(
                    true
                  );

                  setStoryStyleOpen(
                    false
                  );

                  setStoryFilterOpen(
                    false
                  );
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.12] bg-black/28 text-white/85 backdrop-blur-2xl transition active:scale-95"
                aria-label="Mención"
              >
                <UserRoundPlus
                  size={18}
                />
              </button>

              <button
                type="button"
                onClick={() => {
                  setStoryStyleOpen(
                    (value) =>
                      !value
                  );

                  setStoryTextEditing(
                    false
                  );

                  setStoryFilterOpen(
                    false
                  );
                }}
                className={`flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-2xl transition active:scale-95 ${
                  storyStyleOpen
                    ? "border-[#aeb6ff]/50 bg-[#6d7cff]/25 text-white"
                    : "border-white/[0.12] bg-black/28 text-white/85"
                }`}
                aria-label="Color y fondo del texto"
              >
                <Palette
                  size={18}
                />
              </button>

              <button
                type="button"
                onClick={() => {
                  setStoryFilterOpen(
                    (value) =>
                      !value
                  );

                  setStoryTextEditing(
                    false
                  );

                  setStoryStyleOpen(
                    false
                  );
                }}
                className={`flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-2xl transition active:scale-95 ${
                  storyFilterOpen
                    ? "border-[#aeb6ff]/50 bg-[#6d7cff]/25 text-white"
                    : "border-white/[0.12] bg-black/28 text-white/85"
                }`}
                aria-label="Filtros"
              >
                <SlidersHorizontal
                  size={18}
                />
              </button>

              <button
                type="button"
                onClick={() =>
                  collageInputRef.current?.click()
                }
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.12] bg-black/28 text-white/85 backdrop-blur-2xl transition active:scale-95"
                aria-label="Crear collage"
              >
                <Images
                  size={18}
                />
              </button>

              <button
                type="button"
                onClick={() =>
                  mediaInputRef.current?.click()
                }
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.12] bg-black/28 text-white/85 backdrop-blur-2xl transition active:scale-95"
                aria-label="Cambiar foto o video"
              >
                <ImagePlus
                  size={18}
                />
              </button>
            </div>
          )}

          {/*
            PC: controles auxiliares.
            Móvil: el tamaño se cambia con pinch sobre el texto.
          */}
          {storyText && (
            <div className="absolute left-[max(14px,env(safe-area-inset-left))] top-1/2 z-[82] hidden -translate-y-1/2 flex-col items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={() =>
                  setStoryTextScale(
                    (value) =>
                      Math.max(
                        0.55,
                        Number(
                          (
                            value -
                            0.1
                          ).toFixed(2)
                        )
                      )
                  )
                }
                className="flex h-10 min-w-10 items-center justify-center rounded-full border border-white/[0.12] bg-black/28 px-2.5 text-[11px] font-black text-white/85 backdrop-blur-2xl transition active:scale-95"
              >
                A−
              </button>

              <div className="flex min-h-8 min-w-10 items-center justify-center rounded-full border border-white/[0.08] bg-black/20 px-2 text-[8px] font-black text-white/50 backdrop-blur-xl">
                {Math.round(
                  storyTextScale *
                    100
                )}%
              </div>

              <button
                type="button"
                onClick={() =>
                  setStoryTextScale(
                    (value) =>
                      Math.min(
                        2.2,
                        Number(
                          (
                            value +
                            0.1
                          ).toFixed(2)
                        )
                      )
                  )
                }
                className="flex h-10 min-w-10 items-center justify-center rounded-full border border-white/[0.12] bg-black/28 px-2.5 text-[11px] font-black text-white/85 backdrop-blur-2xl transition active:scale-95"
              >
                A+
              </button>
            </div>
          )}

          {storyTextEditing && (
            <div
              className="absolute z-[95] w-[84%] max-w-[430px] -translate-x-1/2 -translate-y-1/2"
              style={{
                left:
                  `${storyTextPosition.x}%`,
                top:
                  `${storyTextPosition.y}%`,
              }}
            >
              <div
                className={`relative ${
                  storyTextFill ===
                  "black"
                    ? "rounded-[20px] bg-black/72 px-4 py-3 backdrop-blur-lg"
                    : storyTextFill ===
                      "white"
                    ? "rounded-[20px] bg-white/92 px-4 py-3 backdrop-blur-lg"
                    : ""
                }`}
              >
                <textarea
                  autoFocus
                  value={
                    storyText
                  }
                  onChange={(event) =>
                    setStoryText(
                      event.target.value.slice(
                        0,
                        180
                      )
                    )
                  }
                  placeholder="Escribe… @usuario"
                  rows={3}
                  style={{
                    fontSize:
                      editorFontSize,
                    color:
                      storyTextFill ===
                        "white" &&
                      storyTextColor ===
                        "white"
                        ? "#090b10"
                        : editorColor,
                  }}
                  className="w-full resize-none bg-transparent text-center font-black leading-[1.04] tracking-[-0.045em] outline-none placeholder:text-current/35"
                />

                <button
                  type="button"
                  onClick={() =>
                    setStoryTextEditing(
                      false
                    )
                  }
                  className="absolute -right-2 -top-12 flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.14] bg-black/42 text-white shadow-lg backdrop-blur-2xl"
                  aria-label="Listo"
                >
                  <Check
                    size={16}
                  />
                </button>

                {mentionQuery !==
                  null && (
                  <div className="absolute left-1/2 top-[calc(100%+12px)] w-[min(88vw,330px)] -translate-x-1/2 overflow-hidden rounded-[22px] border border-white/[0.11] bg-[#0b0f17]/94 p-1.5 shadow-[0_24px_70px_rgba(0,0,0,.50)] backdrop-blur-2xl">
                    <div className="flex items-center gap-2 px-3 py-2">
                      <AtSign
                        size={13}
                        className="text-[#aeb6ff]"
                      />

                      <p className="text-[9px] font-black uppercase tracking-[0.11em] text-white/45">
                        {mentionQuery
                          ? `@ ${mentionQuery}`
                          : "Personas que sigues"}
                      </p>

                      {mentionLoading && (
                        <Loader2
                          size={12}
                          className="ml-auto animate-spin text-white/35"
                        />
                      )}
                    </div>

                    {mentionResults.length >
                    0 ? (
                      mentionResults.map(
                        (
                          profile
                        ) => (
                          <button
                            key={
                              profile.id
                            }
                            type="button"
                            onClick={() =>
                              insertMention(
                                profile
                              )
                            }
                            className="flex w-full items-center gap-3 rounded-[16px] px-3 py-2.5 text-left transition hover:bg-white/[0.055]"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.06] text-[10px] font-black">
                              {profile.avatar_url ? (
                                <img
                                  src={
                                    profile.avatar_url
                                  }
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                profile.username
                                  .charAt(
                                    0
                                  )
                                  .toUpperCase()
                              )}
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[11px] font-black text-white/90">
                                @
                                {
                                  profile.username
                                }
                              </span>

                              {profile.full_name && (
                                <span className="mt-0.5 block truncate text-[9px] text-white/35">
                                  {
                                    profile.full_name
                                  }
                                </span>
                              )}
                            </span>

                            {followingProfiles.some(
                              (
                                item
                              ) =>
                                item.id ===
                                profile.id
                            ) && (
                              <span className="rounded-full bg-[#6d7cff]/12 px-2 py-1 text-[7px] font-black uppercase tracking-[0.08em] text-[#aeb6ff]">
                                Sigues
                              </span>
                            )}
                          </button>
                        )
                      )
                    ) : (
                      <p className="px-3 pb-3 pt-1 text-[10px] text-white/30">
                        {mentionLoading
                          ? "Buscando…"
                          : "Sin coincidencias"}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {storyStyleOpen && (
            <div className="absolute right-[70px] top-[max(58px,calc(env(safe-area-inset-top)+46px))] z-[94] w-[218px] overflow-hidden rounded-[24px] border border-white/[0.12] bg-[#0b0f17]/92 p-3 shadow-[0_24px_70px_rgba(0,0,0,.50)] backdrop-blur-2xl">
              <p className="px-1 text-[8px] font-black uppercase tracking-[0.13em] text-white/35">
                Color del texto
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {STORY_TEXT_COLORS.map(
                  (item) => (
                    <button
                      key={
                        item.id
                      }
                      type="button"
                      onClick={() =>
                        setStoryTextColor(
                          item.id
                        )
                      }
                      title={
                        item.label
                      }
                      className={`relative h-8 w-8 rounded-full border transition ${
                        storyTextColor ===
                        item.id
                          ? "scale-110 border-white/80"
                          : "border-white/10"
                      }`}
                      style={{
                        background:
                          item.value,
                      }}
                    >
                      {storyTextColor ===
                        item.id && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <Check
                            size={13}
                            className={
                              item.id ===
                              "white" ||
                              item.id ===
                              "gold"
                                ? "text-black"
                                : "text-white"
                            }
                          />
                        </span>
                      )}
                    </button>
                  )
                )}
              </div>

              <div className="my-4 h-px bg-white/[0.07]" />

              <p className="px-1 text-[8px] font-black uppercase tracking-[0.13em] text-white/35">
                Relleno
              </p>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  [
                    "none",
                    "Sin fondo",
                  ],
                  [
                    "black",
                    "Negro",
                  ],
                  [
                    "white",
                    "Blanco",
                  ],
                ].map(
                  ([
                    id,
                    label,
                  ]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        setStoryTextFill(
                          id as StoryTextFill
                        )
                      }
                      className={`rounded-[14px] border px-2 py-2.5 text-[8px] font-black transition ${
                        storyTextFill ===
                        id
                          ? "border-[#aeb6ff]/45 bg-[#6d7cff]/13 text-[#c4c9ff]"
                          : "border-white/[0.07] text-white/42"
                      }`}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {storyFilterOpen && (
            <div className="absolute inset-x-3 bottom-[94px] z-[94]">
              <div className="mx-auto flex max-w-[520px] gap-2 overflow-x-auto rounded-[24px] border border-white/[0.11] bg-[#0b0f17]/90 p-2.5 shadow-[0_24px_70px_rgba(0,0,0,.45)] backdrop-blur-2xl">
                {STORY_FILTERS.map(
                  (item) => (
                    <button
                      key={
                        item.id
                      }
                      type="button"
                      onClick={() =>
                        setStoryFilter(
                          item.id
                        )
                      }
                      className={`shrink-0 rounded-full border px-3.5 py-2 text-[9px] font-black transition ${
                        storyFilter ===
                        item.id
                          ? "border-[#aeb6ff]/45 bg-[#6d7cff]/15 text-[#c5caff]"
                          : "border-white/[0.07] text-white/45"
                      }`}
                    >
                      {
                        item.label
                      }
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {storyText &&
            !storyTextEditing && (
            <div className="pointer-events-none absolute bottom-[max(88px,calc(env(safe-area-inset-bottom)+76px))] left-[max(14px,env(safe-area-inset-left))] z-[70] max-w-[235px] sm:hidden">
              <p className="rounded-full border border-white/[0.08] bg-black/24 px-3 py-1.5 text-[8px] font-bold text-white/42 backdrop-blur-xl">
                Arrastra para mover · pellizca para cambiar tamaño
              </p>
            </div>
          )}

          {hasMedia && (
            <button
              type="button"
              onClick={
                publishStory
              }
              disabled={
                publishing
              }
              className="group absolute bottom-[max(16px,env(safe-area-inset-bottom))] right-[max(14px,env(safe-area-inset-right))] z-[100] flex h-12 items-center gap-3 rounded-full border border-[#aeb6ff]/20 bg-[#6d7cff] pl-3 pr-5 text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-[0_18px_50px_rgba(72,82,205,.38)] transition active:scale-[0.97] disabled:opacity-60"
            >
              {publishing ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                  Subiendo
                </>
              ) : (
                <>
                  <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.11] text-[14px] font-black tracking-[-0.08em]">
                    A
                    <span className="ml-[1px] text-[#c9ceff]">
                      .
                    </span>
                    <span className="absolute inset-[-3px] rounded-full border border-white/[0.08] opacity-0 transition group-active:opacity-100" />
                  </span>
                  Publicar
                </>
              )}
            </button>
          )}

          {sharedPost && (
            <button
              type="button"
              onClick={() =>
                setSharedPost(
                  null
                )
              }
              className="absolute bottom-[max(22px,env(safe-area-inset-bottom))] left-[max(14px,env(safe-area-inset-left))] z-[80] text-[9px] font-black uppercase tracking-[0.1em] text-white/45"
            >
              Quitar publicación
            </button>
          )}

          {collageFiles.length >=
            2 && (
            <button
              type="button"
              onClick={() =>
                setCollageFiles(
                  []
                )
              }
              className="absolute bottom-[max(22px,env(safe-area-inset-bottom))] left-[max(14px,env(safe-area-inset-left))] z-[80] text-[9px] font-black uppercase tracking-[0.1em] text-white/45"
            >
              Quitar collage
            </button>
          )}

          <HiddenInput
            inputRef={
              mediaInputRef
            }
            onPick={
              chooseMedia
            }
          />

          <input
            ref={
              collageInputRef
            }
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => {
              chooseCollage(
                event.target.files
              );
              event.currentTarget.value =
                "";
            }}
          />
        </div>
      </div>,
      document.body
    );
  }

  return (
    <Shell
      title={
        kind ===
        "achievement"
          ? "Story de Logro"
          : "Story de Oportunidad"
      }
      subtitle="Studio · 1080 × 1920 · 9:16"
      onClose={onClose}
      onBack={() =>
        setKind(null)
      }
    >
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="shrink-0 border-b border-white/[0.06] p-3 lg:w-[47%] lg:border-b-0 lg:border-r lg:p-5">
          <div className="relative mx-auto aspect-[9/16] h-[45dvh] max-h-[610px] overflow-hidden rounded-[24px] bg-[#090b10] shadow-[0_28px_80px_rgba(0,0,0,.34)] lg:h-[65dvh]">
            <StoryCanvasBackground
              previewUrl={
                previewUrl
              }
              photoStyle={
                photoStyle
              }
              accent={accent}
              decor={decor}
              kind={kind}
            />

            <StoryDesignOverlay
              story={
                previewStory
              }
            />

            <div className="absolute left-3 top-3 z-40 rounded-full border border-white/10 bg-black/35 px-2.5 py-1.5 text-[8px] font-black text-white/55 backdrop-blur-xl">
              9:16 · PREVIEW
            </div>

            <button
              type="button"
              onClick={() =>
                mediaInputRef.current?.click()
              }
              className="absolute right-3 top-3 z-40 flex h-9 items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 text-[9px] font-black text-white/75 backdrop-blur-xl"
            >
              <ImagePlus
                size={13}
              />
              {file
                ? "Cambiar"
                : "Foto"}
            </button>
          </div>

          <p className="mt-3 text-center text-[9px] leading-4 text-zinc-700">
            Área segura aplicada para evitar que la interfaz tape texto o acciones.
          </p>
        </div>

        <div className="alumni-story-studio-panel min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0b0e13]/95 px-3 py-3 backdrop-blur-xl">
            <div className="grid grid-cols-4 gap-1">
              <EditorTab
                active={
                  editorTab ===
                  "content"
                }
                icon={
                  <Type
                    size={14}
                  />
                }
                label="Texto"
                onClick={() =>
                  setEditorTab(
                    "content"
                  )
                }
              />

              <EditorTab
                active={
                  editorTab ===
                  "template"
                }
                icon={
                  <Layers3
                    size={14}
                  />
                }
                label="Plantilla"
                onClick={() =>
                  setEditorTab(
                    "template"
                  )
                }
              />

              <EditorTab
                active={
                  editorTab ===
                  "style"
                }
                icon={
                  <Palette
                    size={14}
                  />
                }
                label="Estilo"
                onClick={() =>
                  setEditorTab(
                    "style"
                  )
                }
              />

              <EditorTab
                active={
                  editorTab ===
                  "animate"
                }
                icon={
                  <WandSparkles
                    size={14}
                  />
                }
                label="Animar"
                onClick={() =>
                  setEditorTab(
                    "animate"
                  )
                }
              />
            </div>
          </div>

          <div className="p-4 pb-6 sm:p-5 sm:pb-6">
            {editorTab ===
              "content" && (
              <ContentEditor
                kind={kind}
                headline={
                  headline
                }
                setHeadline={
                  setHeadline
                }
                caption={
                  caption
                }
                setCaption={
                  setCaption
                }
                organization={
                  organization
                }
                setOrganization={
                  setOrganization
                }
                achievementType={
                  achievementType
                }
                setAchievementType={
                  setAchievementType
                }
                opportunityType={
                  opportunityType
                }
                setOpportunityType={
                  setOpportunityType
                }
                workMode={
                  workMode
                }
                setWorkMode={
                  setWorkMode
                }
                locationText={
                  locationText
                }
                setLocationText={
                  setLocationText
                }
                actionUrl={
                  actionUrl
                }
                setActionUrl={
                  setActionUrl
                }
              />
            )}

            {editorTab ===
              "template" && (
              <div>
                <SectionTitle
                  title="Plantillas"
                  text="Cambia por completo la composición de tu Story."
                />

                <div className="grid grid-cols-2 gap-2">
                  {availableTemplates.map(
                    (item) => (
                      <ChoiceCard
                        key={
                          item.id
                        }
                        active={
                          template ===
                          item.id
                        }
                        title={
                          item.label
                        }
                        text={
                          item.description
                        }
                        onClick={() =>
                          setTemplate(
                            item.id
                          )
                        }
                      />
                    )
                  )}
                </div>

                <SectionTitle
                  title="Foto"
                  text="Elige cómo Alumni enmarca la fotografía."
                  className="mt-7"
                />

                <ChipGrid
                  items={
                    PHOTO_STYLES
                  }
                  value={
                    photoStyle
                  }
                  onChange={
                    setPhotoStyle
                  }
                />
              </div>
            )}

            {editorTab ===
              "style" && (
              <div>
                <SectionTitle
                  title="Color principal"
                  text="Cada color cambia el halo, badge y acentos."
                />

                <div className="grid grid-cols-3 gap-2">
                  {ACCENTS.map(
                    (item) => (
                      <button
                        key={
                          item.id
                        }
                        type="button"
                        onClick={() =>
                          setAccent(
                            item.id
                          )
                        }
                        className={`flex items-center gap-2 rounded-[14px] border px-3 py-3 text-left text-[10px] font-black transition ${
                          accent ===
                          item.id
                            ? "border-white/20 bg-white/[0.075] text-white"
                            : "border-white/[0.06] bg-white/[0.025] text-zinc-600"
                        }`}
                      >
                        <span
                          className="h-3.5 w-3.5 rounded-full"
                          style={{
                            background:
                              item.dot,
                          }}
                        />
                        {
                          item.label
                        }
                      </button>
                    )
                  )}
                </div>

                <SectionTitle
                  title="Decoración"
                  text="Detalles visuales sutiles para darle personalidad."
                  className="mt-7"
                />

                <ChipGrid
                  items={
                    DECORS
                  }
                  value={decor}
                  onChange={
                    setDecor
                  }
                />

                <SectionTitle
                  title="Tipografía"
                  text="Ajusta la personalidad del titular."
                  className="mt-7"
                />

                <ChipGrid
                  items={
                    FONT_STYLES
                  }
                  value={
                    fontStyle
                  }
                  onChange={
                    setFontStyle
                  }
                />
              </div>
            )}

            {editorTab ===
              "animate" && (
              <div>
                <SectionTitle
                  title="Animaciones"
                  text="La información entra de forma elegante cuando abren la Story."
                />

                <div className="grid grid-cols-2 gap-2">
                  {ANIMATIONS.map(
                    (item) => (
                      <button
                        key={
                          item.id
                        }
                        type="button"
                        onClick={() =>
                          setAnimation(
                            item.id
                          )
                        }
                        className={`group rounded-[16px] border p-4 text-left transition ${
                          animation ===
                          item.id
                            ? "border-[#8792ff]/35 bg-[#6d7cff]/10"
                            : "border-white/[0.06] bg-white/[0.025]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Play
                            size={13}
                            className={
                              animation ===
                              item.id
                                ? "text-[#a7afff]"
                                : "text-zinc-700"
                            }
                          />
                          <span className="text-xs font-black text-white">
                            {
                              item.label
                            }
                          </span>
                        </div>
                        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
                          <div
                            className={`h-full w-2/3 rounded-full bg-[#7c88ff] ${
                              animation ===
                              item.id
                                ? "story-anim-rise"
                                : ""
                            }`}
                          />
                        </div>
                      </button>
                    )
                  )}
                </div>

                <div className="mt-6 rounded-[18px] border border-white/[0.06] bg-white/[0.025] p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles
                      size={17}
                      className="mt-0.5 text-[#9ba5ff]"
                    />
                    <div>
                      <p className="text-xs font-black text-white">
                        Animación inteligente
                      </p>
                      <p className="mt-1 text-[10px] leading-5 text-zinc-600">
                        La imagen permanece estable y la información entra encima, así la Story mantiene calidad y movimiento sin depender de música.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 z-40 border-t border-white/[0.07] bg-[#0b0e13]/96 p-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-2xl">
            <div className="mx-auto flex max-w-xl items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  mediaInputRef.current?.click()
                }
                className="flex h-11 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 text-[10px] font-black text-zinc-400"
              >
                <ImagePlus
                  size={14}
                />
                {file
                  ? "Cambiar foto"
                  : "Agregar foto"}
              </button>

              <button
                type="button"
                onClick={
                  publishStory
                }
                disabled={
                  publishing ||
                  !headline.trim()
                }
                className="ml-auto flex h-11 items-center gap-2 rounded-xl bg-[#6d7cff] px-5 text-[11px] font-black text-white transition disabled:bg-white/[0.05] disabled:text-zinc-700"
              >
                {publishing ? (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <Send
                    size={15}
                  />
                )}

                {publishing
                  ? "Publicando..."
                  : "Publicar historia"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <HiddenInput
        inputRef={
          mediaInputRef
        }
        onPick={
          chooseMedia
        }
        imagesOnly
      />
    </Shell>
  );
}

function StoryCanvasBackground({
  previewUrl,
  photoStyle,
  accent,
  decor,
  kind,
}: {
  previewUrl: string;
  photoStyle: string;
  accent: string;
  decor: string;
  kind:
    | "achievement"
    | "opportunity";
}) {
  const accentColor =
    ACCENTS.find(
      (item) =>
        item.id === accent
    )?.dot || "#818cf8";

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0a0d13]">
      <div
        className="absolute -left-20 top-10 h-72 w-72 rounded-full blur-[90px]"
        style={{
          background:
            `${accentColor}42`,
        }}
      />

      {decor === "grid" && (
        <div className="story-decor-grid absolute inset-0 opacity-30" />
      )}

      {decor ===
        "rings" && (
        <>
          <div className="absolute -right-20 top-40 h-56 w-56 rounded-full border border-white/10" />
          <div className="absolute -right-6 top-[220px] h-28 w-28 rounded-full border border-white/10" />
        </>
      )}

      {decor ===
        "confetti" && (
        <div className="story-confetti absolute inset-0" />
      )}

      {previewUrl ? (
        photoStyle ===
        "full" ? (
          <>
            <img
              src={previewUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-3xl"
            />
            <div className="absolute inset-0 bg-black/10" />
            <img
              src={previewUrl}
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full object-contain"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/5 to-black/80" />
          </>
        ) : photoStyle ===
          "spotlight" ? (
          <div className="absolute left-1/2 top-[23%] aspect-square w-[74%] -translate-x-1/2 overflow-hidden rounded-full border border-white/15 shadow-[0_30px_90px_rgba(0,0,0,.45)]">
            <img
              src={previewUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl"
            />
            <div className="absolute inset-0 bg-black/10" />
            <img
              src={previewUrl}
              alt=""
              draggable={false}
              className="relative h-full w-full object-contain"
            />
          </div>
        ) : (
          <div
            className={`absolute left-1/2 top-[19%] w-[77%] -translate-x-1/2 overflow-hidden shadow-[0_30px_85px_rgba(0,0,0,.42)] ${
              photoStyle ===
              "polaroid"
                ? "rotate-[-2deg] rounded-[18px] border-[10px] border-white bg-white pb-12"
                : photoStyle ===
                  "glass"
                ? "rounded-[28px] border border-white/25 bg-white/10 p-2 backdrop-blur-xl"
                : "rounded-[26px] border border-white/10"
            }`}
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-black">
              <img
                src={previewUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl"
              />
              <div className="absolute inset-0 bg-black/10" />
              <img
                src={previewUrl}
                alt=""
                draggable={false}
                className="relative h-full w-full object-contain"
              />
            </div>
          </div>
        )
      ) : (
        <div className="absolute left-1/2 top-[26%] flex aspect-[4/5] w-[70%] -translate-x-1/2 flex-col items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-white/[0.025] text-center">
          <ImagePlus
            size={27}
            className="text-white/20"
          />
          <p className="mt-3 text-[10px] font-black text-white/35">
            Agrega una foto
          </p>
          <p className="mt-1 px-8 text-[8px] leading-4 text-white/20">
            También puedes publicar una plantilla sin foto.
          </p>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 h-[47%] bg-gradient-to-t from-black/88 via-black/35 to-transparent" />

      <div
        className="absolute bottom-5 left-5 h-1.5 w-1.5 rounded-full"
        style={{
          background:
            accentColor,
        }}
      />

      <span className="absolute bottom-[18px] left-9 text-[8px] font-black text-white/25">
        Alumni.
      </span>

      {kind ===
        "opportunity" && (
        <div className="absolute right-4 top-[12%] rounded-full border border-white/8 bg-black/20 px-2 py-1 text-[7px] font-black uppercase tracking-widest text-white/25">
          Conecta talento
        </div>
      )}
    </div>
  );
}

function ContentEditor({
  kind,
  headline,
  setHeadline,
  caption,
  setCaption,
  organization,
  setOrganization,
  achievementType,
  setAchievementType,
  opportunityType,
  setOpportunityType,
  workMode,
  setWorkMode,
  locationText,
  setLocationText,
  actionUrl,
  setActionUrl,
}: any) {
  return (
    <div className="space-y-5">
      <SectionTitle
        title={
          kind ===
          "achievement"
            ? "Tu logro"
            : "La oportunidad"
        }
        text="Escribe poco y deja que el diseño haga el resto."
      />

      <Field
        label={
          kind ===
          "achievement"
            ? "Título del logro"
            : "Puesto / oportunidad"
        }
        required
      >
        <input
          className="story-field"
          value={
            headline
          }
          onChange={(event) =>
            setHeadline(
              event.target.value
            )
          }
          maxLength={105}
          placeholder={
            kind ===
            "achievement"
              ? "Ej. ¡Terminé mi certificación en UX Design!"
              : "Ej. Diseñador UX Jr."
          }
        />
      </Field>

      {kind ===
      "achievement" ? (
        <Field label="Tipo de logro">
          <select
            className="story-field"
            value={
              achievementType
            }
            onChange={(event) =>
              setAchievementType(
                event.target.value
              )
            }
          >
            {ACHIEVEMENT_TYPES.map(
              (item) => (
                <option
                  key={
                    item
                  }
                  value={
                    item
                  }
                >
                  {item}
                </option>
              )
            )}
          </select>
        </Field>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo">
            <select
              className="story-field"
              value={
                opportunityType
              }
              onChange={(event) =>
                setOpportunityType(
                  event.target.value
                )
              }
            >
              {OPPORTUNITY_TYPES.map(
                (item) => (
                  <option
                    key={
                      item
                    }
                    value={
                      item
                    }
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </Field>

          <Field label="Modalidad">
            <select
              className="story-field"
              value={
                workMode
              }
              onChange={(event) =>
                setWorkMode(
                  event.target.value
                )
              }
            >
              {WORK_MODES.map(
                (item) => (
                  <option
                    key={
                      item
                    }
                    value={
                      item
                    }
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </Field>
        </div>
      )}

      <Field
        label={
          kind ===
          "achievement"
            ? "Institución / empresa"
            : "Empresa / organización"
        }
      >
        <input
          className="story-field"
          value={
            organization
          }
          onChange={(event) =>
            setOrganization(
              event.target.value
            )
          }
          maxLength={90}
          placeholder="Nombre de la institución"
        />
      </Field>

      {kind ===
        "opportunity" && (
        <>
          <Field label="Ubicación">
            <input
              className="story-field"
              value={
                locationText
              }
              onChange={(event) =>
                setLocationText(
                  event.target.value
                )
              }
              maxLength={80}
              placeholder="Ej. San Salvador"
            />
          </Field>

          <Field label="Enlace para aplicar">
            <input
              className="story-field"
              value={
                actionUrl
              }
              onChange={(event) =>
                setActionUrl(
                  event.target.value
                )
              }
              inputMode="url"
              placeholder="empresa.com/vacante"
            />
          </Field>
        </>
      )}

      <Field
        label={
          kind ===
          "achievement"
            ? "Comentario"
            : "Descripción breve"
        }
      >
        <textarea
          className="story-field min-h-24 resize-none py-3"
          rows={3}
          maxLength={240}
          value={
            caption
          }
          onChange={(event) =>
            setCaption(
              event.target.value
            )
          }
          placeholder={
            kind ===
            "achievement"
              ? "Cuenta brevemente qué significa este logro para ti..."
              : "Agrega lo más importante de la oportunidad..."
          }
        />
      </Field>
    </div>
  );
}

function Shell({
  title,
  subtitle,
  onClose,
  onBack,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  onBack?: () => void;
  children: ReactNode;
}) {
  return createPortal(
    <div
      data-theme-lock="dark"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-0 backdrop-blur-xl sm:p-5"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative flex h-[100dvh] w-full max-w-[980px] flex-col overflow-hidden bg-[#0b0e13] shadow-[0_30px_100px_rgba(0,0,0,.55)] sm:h-[calc(100dvh-40px)] sm:rounded-[30px] sm:border sm:border-white/[0.09]">
        <header className="flex min-h-16 shrink-0 items-center gap-3 border-b border-white/[0.06] px-4 pt-[env(safe-area-inset-top)] sm:px-5 sm:pt-0">
          {onBack && (
            <button
              type="button"
              onClick={
                onBack
              }
              className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-white/[0.05] hover:text-white"
              aria-label="Volver"
            >
              <ArrowLeft
                size={18}
              />
            </button>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-white">
              {title}
            </p>
            <p className="mt-0.5 truncate text-[10px] text-zinc-600">
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-white/[0.05] hover:text-white"
            aria-label="Cerrar"
          >
            <X
              size={18}
            />
          </button>
        </header>

        {children}
      </div>
    </div>,
    document.body
  );
}

function KindOption({
  icon,
  title,
  text,
  tone,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  tone:
    | "indigo"
    | "emerald"
    | "neutral";
  onClick: () => void;
}) {
  const toneClass =
    tone === "indigo"
      ? "bg-[#6d7cff]/12 text-[#a7afff]"
      : tone ===
        "emerald"
      ? "bg-emerald-400/10 text-emerald-300"
      : "bg-white/[0.045] text-zinc-500";

  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className="group flex w-full items-center gap-4 border-b border-white/[0.065] py-5 text-left last:border-b-0"
    >
      <span
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[19px] ${toneClass}`}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-black text-white">
          {title}
        </span>
        <span className="mt-1 block max-w-md text-xs leading-5 text-zinc-600">
          {text}
        </span>
      </span>

      <Sparkles
        size={16}
        className="text-zinc-800 transition group-hover:text-zinc-500"
      />
    </button>
  );
}

function EditorTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`flex h-10 items-center justify-center gap-1.5 rounded-xl text-[9px] font-black transition ${
        active
          ? "bg-white/[0.08] text-white"
          : "text-zinc-700 hover:bg-white/[0.03] hover:text-zinc-400"
      }`}
    >
      {icon}
      <span className="hidden min-[390px]:inline">
        {label}
      </span>
    </button>
  );
}

function SectionTitle({
  title,
  text,
  className = "",
}: {
  title: string;
  text: string;
  className?: string;
}) {
  return (
    <div
      className={`mb-4 ${className}`}
    >
      <p className="text-sm font-black text-white">
        {title}
      </p>
      <p className="mt-1 text-[10px] leading-5 text-zinc-650">
        {text}
      </p>
    </div>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-1.5 text-[10px] font-black text-zinc-500">
        {label}
        {required && (
          <span className="text-[#8d98ff]">
            *
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

function ChoiceCard({
  active,
  title,
  text,
  onClick,
}: {
  active: boolean;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`rounded-[16px] border p-3 text-left transition ${
        active
          ? "border-[#8d98ff]/35 bg-[#6d7cff]/10"
          : "border-white/[0.06] bg-white/[0.02]"
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black text-white">
            {title}
          </p>
          <p className="mt-1 text-[9px] leading-4 text-zinc-650">
            {text}
          </p>
        </div>

        {active && (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7c88ff] text-white">
            <Check
              size={11}
            />
          </span>
        )}
      </div>
    </button>
  );
}

function ChipGrid({
  items,
  value,
  onChange,
}: {
  items: {
    id: string;
    label: string;
  }[];
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(
        (item) => (
          <button
            key={
              item.id
            }
            type="button"
            onClick={() =>
              onChange(
                item.id
              )
            }
            className={`rounded-full border px-3 py-2 text-[9px] font-black transition ${
              value ===
              item.id
                ? "border-white/20 bg-white/[0.09] text-white"
                : "border-white/[0.06] bg-white/[0.025] text-zinc-600"
            }`}
          >
            {
              item.label
            }
          </button>
        )
      )}
    </div>
  );
}

function PublishBar({
  disabled,
  publishing,
  onPublish,
}: {
  disabled: boolean;
  publishing: boolean;
  onPublish: () => void;
}) {
  return (
    <div className="mt-5 flex justify-end">
      <button
        type="button"
        onClick={
          onPublish
        }
        disabled={
          disabled
        }
        className="flex h-11 items-center gap-2 rounded-xl bg-[#6d7cff] px-5 text-[11px] font-black text-white disabled:bg-white/[0.05] disabled:text-zinc-700"
      >
        {publishing ? (
          <Loader2
            size={15}
            className="animate-spin"
          />
        ) : (
          <Send
            size={15}
          />
        )}

        {publishing
          ? "Publicando..."
          : "Publicar"}
      </button>
    </div>
  );
}

function HiddenInput({
  inputRef,
  onPick,
  imagesOnly = false,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onPick: (
    file: File
  ) => void;
  imagesOnly?: boolean;
}) {
  return (
    <input
      ref={
        inputRef
      }
      type="file"
      hidden
      accept={
        imagesOnly
          ? "image/*"
          : "image/*,video/mp4,video/webm,video/quicktime"
      }
      onChange={(event) => {
        const selected =
          event.target.files?.[0];

        if (selected) {
          onPick(
            selected
          );
        }

        event.currentTarget.value =
          "";
      }}
    />
  );
}
