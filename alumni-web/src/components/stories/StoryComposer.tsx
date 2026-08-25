"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Award,
  Briefcase,
  Check,
  Film,
  ImagePlus,
  Layers3,
  Loader2,
  Palette,
  Play,
  Send,
  Sparkles,
  Type,
  WandSparkles,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import StoryDesignOverlay from "@/components/stories/StoryDesignOverlay";

type Props = {
  open: boolean;
  onClose: () => void;
  onPublished: () => void | Promise<void>;
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
        drawCover(
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

          drawCover(
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

          drawCover(
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

          drawCover(
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
        0.94
      );
    }
  );
}

export default function StoryComposer({
  open,
  onClose,
  onPublished,
}: Props) {
  const { user } = useAuth();

  const mediaInputRef =
    useRef<HTMLInputElement>(null);

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

    setFile(selected);
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
      !file
    ) {
      alert(
        "Selecciona una foto o video."
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
                "3600",
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
    return (
      <Shell
        title="Historia libre"
        subtitle="1080 × 1920 · 9:16"
        onClose={onClose}
        onBack={() =>
          setKind(null)
        }
      >
        <div className="p-4 pb-7 sm:p-5">
          {previewUrl ? (
            <div className="relative mx-auto aspect-[9/16] max-h-[70dvh] overflow-hidden rounded-[26px] bg-black">
              {file?.type.startsWith(
                "video/"
              ) ? (
                <video
                  src={previewUrl}
                  controls
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}

              <button
                type="button"
                onClick={() =>
                  setFile(null)
                }
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-xl"
                aria-label="Quitar"
              >
                <X
                  size={17}
                />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() =>
                mediaInputRef.current?.click()
              }
              className="mx-auto flex aspect-[9/16] max-h-[70dvh] w-full flex-col items-center justify-center rounded-[26px] border border-dashed border-white/[0.1] bg-white/[0.018]"
            >
              <div className="flex gap-2">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6d7cff]/12 text-[#9ba5ff]">
                  <ImagePlus
                    size={24}
                  />
                </span>
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-zinc-500">
                  <Film
                    size={23}
                  />
                </span>
              </div>
              <p className="mt-4 text-sm font-black text-white">
                Elegir foto o video
              </p>
              <p className="mt-1 text-[10px] text-zinc-600">
                Se mostrará en formato 9:16
              </p>
            </button>
          )}

          <PublishBar
            disabled={
              !file ||
              publishing
            }
            publishing={
              publishing
            }
            onPublish={
              publishStory
            }
          />

          <HiddenInput
            inputRef={
              mediaInputRef
            }
            onPick={
              chooseMedia
            }
          />
        </div>
      </Shell>
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

        <div className="min-h-0 flex-1 overflow-y-auto">
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

          <div className="p-4 pb-28 sm:p-5 sm:pb-28">
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

          <div className="fixed bottom-0 left-0 right-0 z-[120] border-t border-white/[0.07] bg-[#0b0e13]/96 p-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-2xl lg:absolute">
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
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/5 to-black/80" />
          </>
        ) : photoStyle ===
          "spotlight" ? (
          <div className="absolute left-1/2 top-[23%] aspect-square w-[74%] -translate-x-1/2 overflow-hidden rounded-full border border-white/15 shadow-[0_30px_90px_rgba(0,0,0,.45)]">
            <img
              src={previewUrl}
              alt=""
              className="h-full w-full object-cover"
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
            <img
              src={previewUrl}
              alt=""
              className={`w-full object-cover ${
                photoStyle ===
                "polaroid"
                  ? "aspect-[4/5]"
                  : "aspect-[4/5]"
              }`}
            />
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
  return (
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
    </div>
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
