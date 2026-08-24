"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Award,
  Briefcase,
  Check,
  Film,
  ImagePlus,
  Loader2,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";

type Props = {
  open: boolean;
  onClose: () => void;
  onPublished: () => void | Promise<void>;
};

type StoryKind = "achievement" | "opportunity" | "standard";

const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

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

function cleanName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "_")
    .slice(-120);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;

    if (
      ctx.measureText(test).width > maxWidth &&
      line
    ) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }

  if (line) lines.push(line);
  return lines;
}

async function createTemplateImage({
  kind,
  headline,
  organization,
  detail,
  description,
}: {
  kind: "achievement" | "opportunity";
  headline: string;
  organization?: string;
  detail?: string;
  description?: string;
}) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error(
      "No se pudo generar la plantilla."
    );
  }

  const isAchievement =
    kind === "achievement";

  const gradient =
    ctx.createLinearGradient(
      0,
      0,
      1080,
      1920
    );

  if (isAchievement) {
    gradient.addColorStop(
      0,
      "#12182a"
    );
    gradient.addColorStop(
      0.48,
      "#17234a"
    );
    gradient.addColorStop(
      1,
      "#0b0e13"
    );
  } else {
    gradient.addColorStop(
      0,
      "#0e211c"
    );
    gradient.addColorStop(
      0.48,
      "#123a31"
    );
    gradient.addColorStop(
      1,
      "#09110f"
    );
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  // Halo superior.
  const halo =
    ctx.createRadialGradient(
      220,
      250,
      20,
      220,
      250,
      760
    );

  halo.addColorStop(
    0,
    isAchievement
      ? "rgba(109,124,255,.42)"
      : "rgba(52,211,153,.34)"
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
    1050
  );

  // Marca Alumni.
  ctx.fillStyle =
    "rgba(255,255,255,.68)";
  ctx.font =
    "700 30px Arial, sans-serif";
  ctx.fillText(
    "Alumni.",
    82,
    104
  );

  // Badge.
  ctx.fillStyle =
    isAchievement
      ? "rgba(129,140,248,.18)"
      : "rgba(52,211,153,.16)";

  ctx.beginPath();
  ctx.roundRect(
    82,
    190,
    isAchievement ? 300 : 360,
    82,
    41
  );
  ctx.fill();

  ctx.fillStyle =
    isAchievement
      ? "#c7ceff"
      : "#b7f7da";
  ctx.font =
    "800 29px Arial, sans-serif";
  ctx.fillText(
    isAchievement
      ? "✦  NUEVO LOGRO"
      : "●  OPORTUNIDAD",
    116,
    243
  );

  // Titular.
  ctx.fillStyle = "#ffffff";
  ctx.font =
    "900 84px Arial, sans-serif";

  const titleLines =
    wrapText(
      ctx,
      headline,
      880
    ).slice(0, 5);

  let y = 460;

  titleLines.forEach(
    (line) => {
      ctx.fillText(
        line,
        82,
        y
      );
      y += 102;
    }
  );

  if (organization) {
    y += 35;
    ctx.fillStyle =
      "rgba(255,255,255,.72)";
    ctx.font =
      "700 38px Arial, sans-serif";

    wrapText(
      ctx,
      organization,
      860
    )
      .slice(0, 2)
      .forEach((line) => {
        ctx.fillText(
          line,
          84,
          y
        );
        y += 52;
      });
  }

  if (detail) {
    y += 54;

    ctx.fillStyle =
      "rgba(255,255,255,.09)";
    ctx.beginPath();
    ctx.roundRect(
      82,
      y - 44,
      850,
      94,
      28
    );
    ctx.fill();

    ctx.fillStyle =
      "rgba(255,255,255,.76)";
    ctx.font =
      "700 29px Arial, sans-serif";
    ctx.fillText(
      detail,
      116,
      y + 15
    );

    y += 105;
  }

  if (description) {
    y += 40;
    ctx.fillStyle =
      "rgba(255,255,255,.62)";
    ctx.font =
      "500 32px Arial, sans-serif";

    wrapText(
      ctx,
      description,
      840
    )
      .slice(0, 6)
      .forEach((line) => {
        ctx.fillText(
          line,
          84,
          y
        );
        y += 48;
      });
  }

  // Footer.
  ctx.fillStyle =
    "rgba(255,255,255,.24)";
  ctx.font =
    "600 27px Arial, sans-serif";
  ctx.fillText(
    isAchievement
      ? "Celebra los avances de tu comunidad."
      : "Conecta talento con oportunidades.",
    82,
    1760
  );

  ctx.fillStyle =
    isAchievement
      ? "#818cf8"
      : "#34d399";

  ctx.beginPath();
  ctx.arc(
    86,
    1822,
    8,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.fillStyle =
    "rgba(255,255,255,.52)";
  ctx.font =
    "600 23px Arial, sans-serif";
  ctx.fillText(
    "Compartido en Alumni",
    110,
    1831
  );

  return new Promise<File>(
    (resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error(
                "No se pudo generar la historia."
              )
            );
            return;
          }

          resolve(
            new File(
              [blob],
              `${kind}-${Date.now()}.jpg`,
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
    useState<StoryKind | null>(null);

  const [file, setFile] =
    useState<File | null>(null);
  const [previewUrl, setPreviewUrl] =
    useState("");
  const [publishing, setPublishing] =
    useState(false);

  const [headline, setHeadline] =
    useState("");
  const [description, setDescription] =
    useState("");
  const [organization, setOrganization] =
    useState("");

  const [achievementType, setAchievementType] =
    useState(ACHIEVEMENT_TYPES[0]);

  const [opportunityType, setOpportunityType] =
    useState(OPPORTUNITY_TYPES[0]);

  const [workMode, setWorkMode] =
    useState(WORK_MODES[0]);

  const [locationText, setLocationText] =
    useState("");

  const [actionUrl, setActionUrl] =
    useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }

    const url =
      URL.createObjectURL(file);

    setPreviewUrl(url);

    return () =>
      URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!open) {
      setKind(null);
      setFile(null);
      setPreviewUrl("");
      setPublishing(false);
      setHeadline("");
      setDescription("");
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
    }
  }, [open]);

  if (!open) return null;

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

    setFile(selected);
  }

  function normalizeUrl(
    value: string
  ) {
    const trimmed = value.trim();

    if (!trimmed) return null;

    if (
      /^https?:\/\//i.test(
        trimmed
      )
    ) {
      return trimmed;
    }

    return `https://${trimmed}`;
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
        "Escribe un título para la historia."
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

    let uploadPath:
      | string
      | null = null;

    try {
      let preparedFile = file;

      if (
        kind ===
          "achievement" ||
        kind ===
          "opportunity"
      ) {
        const detail =
          kind ===
          "achievement"
            ? [
                achievementType,
                organization,
              ]
                .filter(Boolean)
                .join(" · ")
            : [
                opportunityType,
                workMode,
                locationText,
              ]
                .filter(Boolean)
                .join(" · ");

        preparedFile =
          await createTemplateImage(
            {
              kind,
              headline:
                headline.trim(),
              organization:
                kind ===
                "achievement"
                  ? organization.trim()
                  : organization.trim() ||
                    undefined,
              detail,
              description:
                description.trim(),
            }
          );
      }

      if (!preparedFile) {
        throw new Error(
          "No hay contenido para publicar."
        );
      }

      uploadPath =
        `${user.id}/${Date.now()}-${cleanName(
          preparedFile.name
        )}`;

      const { error: uploadError } =
        await supabase.storage
          .from("stories")
          .upload(
            uploadPath,
            preparedFile,
            {
              cacheControl: "3600",
              upsert: false,
              contentType:
                preparedFile.type ||
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
            uploadPath
          );

      const { error: insertError } =
        await supabase
          .from("stories")
          .insert({
            user_id: user.id,
            media_url:
              urlData.publicUrl,
            media_path:
              uploadPath,
            media_type:
              kind === "standard" &&
              preparedFile.type.startsWith(
                "video/"
              )
                ? "video"
                : "image",

            caption:
              description.trim() ||
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
      if (uploadPath) {
        await supabase.storage
          .from("stories")
          .remove([
            uploadPath,
          ]);
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

  const title =
    !kind
      ? "Crear historia"
      : kind === "achievement"
      ? "Compartir un logro"
      : kind === "opportunity"
      ? "Publicar oportunidad"
      : "Foto o video";

  return (
    <div
      data-theme-lock="dark"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-0 backdrop-blur-xl sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex h-[100dvh] w-full max-w-[520px] flex-col overflow-hidden bg-[#0b0e13] sm:h-auto sm:max-h-[calc(100dvh-48px)] sm:rounded-[30px] sm:border sm:border-white/[0.09]">
        <header className="flex min-h-16 shrink-0 items-center gap-3 border-b border-white/[0.06] px-4 pt-[env(safe-area-inset-top)] sm:px-5 sm:pt-0">
          {kind && (
            <button
              type="button"
              onClick={() =>
                setKind(null)
              }
              disabled={publishing}
              className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-white/[0.06] hover:text-white"
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
            <p className="mt-0.5 text-[10px] text-zinc-600">
              Visible durante 24 horas
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={publishing}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-white/[0.06] hover:text-white"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-[max(18px,env(safe-area-inset-bottom))] sm:p-5">
          {!kind ? (
            <div>
              <div className="pb-5 pt-2">
                <p className="text-[24px] font-black tracking-[-0.04em] text-white">
                  ¿Qué quieres compartir?
                </p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-600">
                  Haz que tus historias sirvan para celebrar avances y conectar oportunidades.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setKind(
                    "achievement"
                  )
                }
                className="group flex w-full items-center gap-4 border-b border-white/[0.07] py-5 text-left"
              >
                <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-[18px] bg-[#6d7cff]/14 text-[#a7afff]">
                  <Award size={23} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-black text-white">
                    Compartir un logro
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-zinc-600">
                    Graduaciones, certificaciones, empleo, ascensos y proyectos.
                  </span>
                </span>

                <Sparkles
                  size={17}
                  className="text-zinc-700 transition group-hover:text-[#9ba5ff]"
                />
              </button>

              <button
                type="button"
                onClick={() =>
                  setKind(
                    "opportunity"
                  )
                }
                className="group flex w-full items-center gap-4 border-b border-white/[0.07] py-5 text-left"
              >
                <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-[18px] bg-emerald-400/10 text-emerald-300">
                  <Briefcase
                    size={22}
                  />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-black text-white">
                    Publicar oportunidad
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-zinc-600">
                    Empleos, prácticas, freelance, becas y oportunidades profesionales.
                  </span>
                </span>

                <Sparkles
                  size={17}
                  className="text-zinc-700 transition group-hover:text-emerald-300"
                />
              </button>

              <button
                type="button"
                onClick={() =>
                  setKind(
                    "standard"
                  )
                }
                className="flex w-full items-center gap-4 py-5 text-left"
              >
                <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-[18px] bg-white/[0.045] text-zinc-500">
                  <ImagePlus
                    size={22}
                  />
                </span>

                <span>
                  <span className="block text-sm font-black text-zinc-300">
                    Foto o video
                  </span>
                  <span className="mt-1 block text-xs text-zinc-700">
                    Publica una historia normal.
                  </span>
                </span>
              </button>
            </div>
          ) : kind ===
            "achievement" ? (
            <div className="space-y-5">
              <StoryPreviewCard
                kind="achievement"
                headline={
                  headline ||
                  "Tu próximo logro"
                }
                subtitle={
                  organization ||
                  achievementType
                }
              />

              <Field
                label="¿Qué lograste?"
                required
              >
                <input
                  value={headline}
                  onChange={(event) =>
                    setHeadline(
                      event.target.value
                    )
                  }
                  maxLength={110}
                  placeholder="Ej. ¡Terminé mi certificación en UX Design!"
                  className="story-field"
                />
              </Field>

              <Field label="Tipo de logro">
                <select
                  value={
                    achievementType
                  }
                  onChange={(event) =>
                    setAchievementType(
                      event.target.value
                    )
                  }
                  className="story-field"
                >
                  {ACHIEVEMENT_TYPES.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <Field label="Institución / empresa">
                <input
                  value={organization}
                  onChange={(event) =>
                    setOrganization(
                      event.target.value
                    )
                  }
                  maxLength={90}
                  placeholder="Ej. Universidad, empresa o institución"
                  className="story-field"
                />
              </Field>

              <Field label="Mensaje">
                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  rows={3}
                  maxLength={260}
                  placeholder="Cuenta brevemente qué significa este logro..."
                  className="story-field min-h-24 resize-none py-3"
                />
              </Field>
            </div>
          ) : kind ===
            "opportunity" ? (
            <div className="space-y-5">
              <StoryPreviewCard
                kind="opportunity"
                headline={
                  headline ||
                  "Nueva oportunidad"
                }
                subtitle={[
                  organization,
                  workMode,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              />

              <Field
                label="Puesto / oportunidad"
                required
              >
                <input
                  value={headline}
                  onChange={(event) =>
                    setHeadline(
                      event.target.value
                    )
                  }
                  maxLength={100}
                  placeholder="Ej. Diseñador UX Jr."
                  className="story-field"
                />
              </Field>

              <Field label="Empresa / organización">
                <input
                  value={organization}
                  onChange={(event) =>
                    setOrganization(
                      event.target.value
                    )
                  }
                  maxLength={90}
                  placeholder="Ej. Empresa XYZ"
                  className="story-field"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Tipo">
                  <select
                    value={
                      opportunityType
                    }
                    onChange={(event) =>
                      setOpportunityType(
                        event.target.value
                      )
                    }
                    className="story-field"
                  >
                    {OPPORTUNITY_TYPES.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </Field>

                <Field label="Modalidad">
                  <select
                    value={workMode}
                    onChange={(event) =>
                      setWorkMode(
                        event.target.value
                      )
                    }
                    className="story-field"
                  >
                    {WORK_MODES.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </Field>
              </div>

              <Field label="Ubicación">
                <input
                  value={locationText}
                  onChange={(event) =>
                    setLocationText(
                      event.target.value
                    )
                  }
                  maxLength={90}
                  placeholder="Ej. San Salvador"
                  className="story-field"
                />
              </Field>

              <Field label="Enlace para aplicar">
                <input
                  value={actionUrl}
                  onChange={(event) =>
                    setActionUrl(
                      event.target.value
                    )
                  }
                  inputMode="url"
                  placeholder="empresa.com/vacante"
                  className="story-field"
                />
              </Field>

              <Field label="Descripción breve">
                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  rows={3}
                  maxLength={260}
                  placeholder="Agrega los puntos más importantes..."
                  className="story-field min-h-24 resize-none py-3"
                />
              </Field>
            </div>
          ) : (
            <div>
              {previewUrl ? (
                <div className="relative overflow-hidden rounded-[24px] bg-black">
                  {file?.type.startsWith(
                    "video/"
                  ) ? (
                    <video
                      src={previewUrl}
                      controls
                      playsInline
                      className="aspect-[9/16] max-h-[62vh] w-full object-contain"
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Vista previa"
                      className="aspect-[9/16] max-h-[62vh] w-full object-contain"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setFile(null)
                    }
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xl"
                    aria-label="Quitar"
                  >
                    <X size={17} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    mediaInputRef.current?.click()
                  }
                  className="flex aspect-[9/12] w-full flex-col items-center justify-center rounded-[24px] border border-dashed border-white/[0.10] bg-white/[0.018] px-8 text-center"
                >
                  <div className="flex gap-2">
                    <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-[#6d7cff]/10 text-[#9ba5ff]">
                      <ImagePlus
                        size={23}
                      />
                    </span>
                    <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-white/[0.04] text-zinc-500">
                      <Film
                        size={22}
                      />
                    </span>
                  </div>

                  <p className="mt-4 text-sm font-black text-zinc-200">
                    Foto o video
                  </p>
                </button>
              )}
            </div>
          )}

          <input
            ref={mediaInputRef}
            type="file"
            hidden
            accept="image/*,video/mp4,video/webm,video/quicktime"
            onChange={(event) => {
              const selected =
                event.target.files?.[0];

              if (selected) {
                chooseMedia(selected);
              }

              event.currentTarget.value =
                "";
            }}
          />

          {kind && (
            <div className="mt-6 flex items-center gap-3 border-t border-white/[0.06] pt-4">
              <button
                type="button"
                onClick={() =>
                  setKind(null)
                }
                disabled={publishing}
                className="h-11 rounded-xl px-3 text-xs font-bold text-zinc-600 transition hover:bg-white/[0.04] hover:text-zinc-200"
              >
                Cambiar tipo
              </button>

              <button
                type="button"
                onClick={publishStory}
                disabled={
                  publishing ||
                  (kind ===
                    "standard" &&
                    !file) ||
                  (kind !==
                    "standard" &&
                    !headline.trim())
                }
                className="ml-auto flex h-11 items-center gap-2 rounded-xl bg-[#6d7cff] px-5 text-xs font-black text-white transition hover:bg-[#7b87ff] disabled:cursor-not-allowed disabled:bg-white/[0.05] disabled:text-zinc-700"
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
          )}
        </div>
      </div>
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
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-1.5 text-[11px] font-black text-zinc-500">
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

function StoryPreviewCard({
  kind,
  headline,
  subtitle,
}: {
  kind: "achievement" | "opportunity";
  headline: string;
  subtitle?: string;
}) {
  const achievement =
    kind === "achievement";

  return (
    <div
      className={`relative overflow-hidden rounded-[24px] border border-white/[0.08] p-5 ${
        achievement
          ? "bg-[radial-gradient(circle_at_15%_0%,rgba(109,124,255,.32),transparent_44%),#111827]"
          : "bg-[radial-gradient(circle_at_15%_0%,rgba(52,211,153,.22),transparent_44%),#0d1d18]"
      }`}
    >
      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] text-white/55">
        {achievement ? (
          <Award size={13} />
        ) : (
          <Briefcase
            size={13}
          />
        )}

        {achievement
          ? "Nuevo logro"
          : "Oportunidad"}
      </div>

      <p className="mt-10 text-[25px] font-black leading-[1.04] tracking-[-0.04em] text-white">
        {headline}
      </p>

      {subtitle && (
        <p className="mt-4 text-xs font-semibold text-white/48">
          {subtitle}
        </p>
      )}

      <div className="mt-10 flex items-center gap-2 text-[9px] font-bold text-white/30">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            achievement
              ? "bg-[#818cf8]"
              : "bg-emerald-400"
          }`}
        />
        Alumni.
      </div>
    </div>
  );
}
