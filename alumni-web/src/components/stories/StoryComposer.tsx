"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Film,
  ImagePlus,
  Loader2,
  Music2,
  Send,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import StoryMusicStartPicker from "@/components/stories/StoryMusicStartPicker";

type Props = {
  open: boolean;
  onClose: () => void;
  onPublished: () => void | Promise<void>;
};

const MAX_WIDTH = 1080;
const MAX_HEIGHT = 1920;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_AUDIO_BYTES = 20 * 1024 * 1024;
const AUDIO_BUCKET = "story-audio";

function cleanName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "_")
    .slice(-140);
}

function displaySongName(name: string) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

export default function StoryComposer({
  open,
  onClose,
  onPublished,
}: Props) {
  const { user } = useAuth();

  const mediaInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [publishing, setPublishing] = useState(false);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState("");
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioClipStart, setAudioClipStart] = useState(0);
  const [audioClipConfirmed, setAudioClipConfirmed] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!audioFile) {
      setAudioPreviewUrl("");
      setAudioDuration(0);
      setAudioClipStart(0);
      setAudioClipConfirmed(false);
      return;
    }

    const url = URL.createObjectURL(audioFile);
    setAudioPreviewUrl(url);

    const probe = new Audio(url);

    const onMetadata = () => {
      const duration = Number.isFinite(probe.duration)
        ? Math.max(15, Math.floor(probe.duration))
        : 240;

      setAudioDuration(duration);
    };

    probe.addEventListener("loadedmetadata", onMetadata);

    return () => {
      probe.pause();
      probe.removeEventListener("loadedmetadata", onMetadata);
      URL.revokeObjectURL(url);
    };
  }, [audioFile]);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreviewUrl("");
      setPublishing(false);
      setAudioFile(null);
      setAudioPreviewUrl("");
      setAudioDuration(0);
      setAudioClipStart(0);
      setAudioClipConfirmed(false);
    }
  }, [open]);

  useEffect(() => {
    const audio = audioPreviewRef.current;
    if (!audio || !audioPreviewUrl) return;

    audio.currentTime = Math.max(0, audioClipStart);
  }, [audioClipStart, audioPreviewUrl]);

  if (!open) return null;

  async function optimizeImageForStory(originalFile: File) {
    if (!originalFile.type.startsWith("image/")) {
      return originalFile;
    }

    return new Promise<File>((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(originalFile);

      image.onload = () => {
        try {
          const width = image.naturalWidth;
          const height = image.naturalHeight;

          const scale = Math.min(
            1,
            MAX_WIDTH / width,
            MAX_HEIGHT / height
          );

          if (scale === 1) {
            URL.revokeObjectURL(objectUrl);
            resolve(originalFile);
            return;
          }

          const targetWidth = Math.max(
            1,
            Math.round(width * scale)
          );
          const targetHeight = Math.max(
            1,
            Math.round(height * scale)
          );

          const canvas = document.createElement("canvas");
          canvas.width = targetWidth;
          canvas.height = targetHeight;

          const context = canvas.getContext("2d");

          if (!context) {
            URL.revokeObjectURL(objectUrl);
            resolve(originalFile);
            return;
          }

          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = "high";
          context.drawImage(
            image,
            0,
            0,
            targetWidth,
            targetHeight
          );

          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(objectUrl);

              if (!blob) {
                resolve(originalFile);
                return;
              }

              const nextName = originalFile.name.replace(
                /\.[^.]+$/,
                ""
              );

              resolve(
                new File(
                  [blob],
                  `${nextName}-story.jpg`,
                  {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  }
                )
              );
            },
            "image/jpeg",
            0.95
          );
        } catch (error) {
          URL.revokeObjectURL(objectUrl);
          reject(error);
        }
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(
          new Error("No se pudo leer la imagen.")
        );
      };

      image.src = objectUrl;
    });
  }

  function chooseMedia(selected: File) {
    const valid =
      selected.type.startsWith("image/") ||
      selected.type.startsWith("video/");

    if (!valid) {
      alert("Selecciona una foto o un video.");
      return;
    }

    if (
      selected.type.startsWith("video/") &&
      selected.size > MAX_VIDEO_BYTES
    ) {
      alert("El video no puede superar 50 MB.");
      return;
    }

    setFile(selected);
  }

  function chooseAudio(selected: File) {
    if (!selected.type.startsWith("audio/")) {
      alert("Selecciona un archivo de audio.");
      return;
    }

    if (selected.size > MAX_AUDIO_BYTES) {
      alert("La canción no puede superar 20 MB.");
      return;
    }

    setAudioFile(selected);
    setAudioClipStart(0);
    setAudioClipConfirmed(false);
  }

  function clearAudio() {
    audioPreviewRef.current?.pause();
    setAudioFile(null);
    setAudioPreviewUrl("");
    setAudioDuration(0);
    setAudioClipStart(0);
    setAudioClipConfirmed(false);

    if (audioInputRef.current) {
      audioInputRef.current.value = "";
    }
  }

  function previewSelectedClip() {
    const audio = audioPreviewRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, audioClipStart);

    void audio.play().catch(() => {});

    window.setTimeout(() => {
      if (!audio.paused) {
        audio.pause();
      }
    }, 15000);
  }

  async function publishStory() {
    if (!user || !file || publishing) return;

    if (audioFile && !audioClipConfirmed) {
      alert(
        "Confirma primero desde dónde debe empezar la canción."
      );
      return;
    }

    setPublishing(true);

    let storyPath: string | null = null;
    let audioPath: string | null = null;

    try {
      const preparedFile =
        await optimizeImageForStory(file);

      storyPath =
        `${user.id}/${Date.now()}-${cleanName(
          preparedFile.name
        )}`;

      const { error: uploadError } =
        await supabase.storage
          .from("stories")
          .upload(storyPath, preparedFile, {
            cacheControl: "3600",
            upsert: false,
            contentType:
              preparedFile.type ||
              (preparedFile.type.startsWith("video/")
                ? "video/mp4"
                : "image/jpeg"),
          });

      if (uploadError) throw uploadError;

      const { data: storyUrlData } =
        supabase.storage
          .from("stories")
          .getPublicUrl(storyPath);

      let audioPublicUrl: string | null = null;

      if (audioFile) {
        audioPath =
          `${user.id}/${Date.now()}-${cleanName(
            audioFile.name
          )}`;

        const { error: audioUploadError } =
          await supabase.storage
            .from(AUDIO_BUCKET)
            .upload(audioPath, audioFile, {
              cacheControl: "3600",
              upsert: false,
              contentType:
                audioFile.type || "audio/mpeg",
            });

        if (audioUploadError) {
          throw audioUploadError;
        }

        const { data: audioUrlData } =
          supabase.storage
            .from(AUDIO_BUCKET)
            .getPublicUrl(audioPath);

        audioPublicUrl =
          audioUrlData.publicUrl;
      }

      const { error: insertError } =
        await supabase
          .from("stories")
          .insert({
            user_id: user.id,
            media_url:
              storyUrlData.publicUrl,
            media_path: storyPath,
            media_type:
              preparedFile.type.startsWith("video/")
                ? "video"
                : "image",

            music_provider:
              audioFile ? "upload" : null,
            music_track_id: null,
            music_title:
              audioFile
                ? displaySongName(
                    audioFile.name
                  )
                : null,
            music_artist:
              audioFile
                ? "Audio de la historia"
                : null,
            music_artwork_url: null,
            music_track_url:
              audioPublicUrl,
            music_embed_url: null,
            music_preview_url: null,
            music_duration_ms:
              audioFile
                ? Math.max(
                    15000,
                    Math.floor(
                      (audioDuration || 15) *
                        1000
                    )
                  )
                : null,
            music_clip_start_seconds:
              audioFile
                ? Math.max(
                    0,
                    Math.floor(audioClipStart)
                  )
                : 0,
            music_clip_duration_seconds: 15,
            music_storage_path:
              audioPath,
          });

      if (insertError) {
        throw insertError;
      }

      await onPublished();
    } catch (error: any) {
      if (storyPath) {
        await supabase.storage
          .from("stories")
          .remove([storyPath]);
      }

      if (audioPath) {
        await supabase.storage
          .from(AUDIO_BUCKET)
          .remove([audioPath]);
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

  return (
    <div
      data-theme-lock="dark"
      className="alumni-story-composer fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-0 backdrop-blur-xl sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex h-[100dvh] w-full max-w-[500px] flex-col overflow-hidden bg-[#0b0e13] shadow-[0_30px_90px_rgba(0,0,0,.5)] sm:h-auto sm:max-h-[calc(100dvh-48px)] sm:rounded-[30px] sm:border sm:border-white/[0.09]">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] px-5 pt-[env(safe-area-inset-top)] sm:pt-0">
          <div>
            <p className="text-sm font-black text-white">
              Nueva historia
            </p>
            <p className="mt-0.5 text-[10px] text-zinc-600">
              Foto o video · 15 segundos
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
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-[max(16px,env(safe-area-inset-bottom))] sm:p-5">
          {previewUrl ? (
            <div className="relative overflow-hidden rounded-[24px] bg-black">
              {file?.type.startsWith("video/") ? (
                <video
                  src={previewUrl}
                  controls
                  playsInline
                  className="aspect-[9/16] max-h-[54vh] w-full object-contain"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Vista previa de historia"
                  className="aspect-[9/16] max-h-[54vh] w-full object-contain"
                />
              )}

              <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/55 px-3 py-2 text-[10px] font-black text-white/80 backdrop-blur-xl">
                {file?.type.startsWith("video/") ? (
                  <Film size={13} />
                ) : (
                  <ImagePlus size={13} />
                )}
                {file?.type.startsWith("video/")
                  ? "Video"
                  : "Foto"}
              </div>

              <button
                type="button"
                onClick={() => setFile(null)}
                disabled={publishing}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white backdrop-blur-xl"
                aria-label="Quitar archivo"
              >
                <X size={17} />
              </button>

              {audioFile && (
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-[18px] border border-white/10 bg-black/60 p-3 backdrop-blur-2xl">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                    <Music2 size={17} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black text-white">
                      {displaySongName(
                        audioFile.name
                      )}
                    </p>
                    <p className="mt-0.5 text-[9px] text-white/45">
                      Desde {Math.floor(audioClipStart / 60)}:
                      {String(audioClipStart % 60).padStart(2, "0")} · 15s
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() =>
                mediaInputRef.current?.click()
              }
              className="flex aspect-[9/12] w-full flex-col items-center justify-center rounded-[24px] border border-dashed border-white/[0.10] bg-white/[0.018] px-8 text-center transition hover:border-[#7f8cff]/35 hover:bg-white/[0.03]"
            >
              <div className="flex gap-2">
                <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-[#6d7cff]/10 text-[#9ba5ff]">
                  <ImagePlus size={23} />
                </span>
                <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-white/[0.04] text-zinc-500">
                  <Film size={22} />
                </span>
              </div>

              <p className="mt-4 text-sm font-black text-zinc-200">
                Foto o video
              </p>
            </button>
          )}

          <input
            ref={mediaInputRef}
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime"
            hidden
            onChange={(event) => {
              const selected =
                event.target.files?.[0];

              if (selected) {
                chooseMedia(selected);
              }

              event.currentTarget.value = "";
            }}
          />

          <input
            ref={audioInputRef}
            type="file"
            accept="audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/x-wav,audio/ogg,audio/webm"
            hidden
            onChange={(event) => {
              const selected =
                event.target.files?.[0];

              if (selected) {
                chooseAudio(selected);
              }
            }}
          />

          {file && (
            <section className="mt-5 border-t border-white/[0.06] pt-5">
              <div className="flex items-center gap-2">
                <Music2
                  size={16}
                  className="text-[#8d98ff]"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-zinc-300">
                    Canción
                  </p>
                  <p className="mt-0.5 text-[10px] text-zinc-700">
                    Agrega audio propio o con licencia a tu historia.
                  </p>
                </div>
              </div>

              {!audioFile ? (
                <button
                  type="button"
                  onClick={() =>
                    audioInputRef.current?.click()
                  }
                  className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-[15px] border border-white/[0.08] bg-white/[0.035] text-xs font-black text-zinc-300 transition hover:bg-white/[0.06]"
                >
                  <Upload size={16} />
                  Elegir canción
                </button>
              ) : (
                <div className="mt-3 rounded-[18px] border border-white/[0.08] bg-white/[0.025] p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#6d7cff]/12 text-[#9ba5ff]">
                      <Music2 size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black text-zinc-200">
                        {displaySongName(
                          audioFile.name
                        )}
                      </p>
                      <p className="mt-1 text-[9px] text-zinc-600">
                        {(audioFile.size / 1024 / 1024).toFixed(1)} MB
                        {audioDuration > 0
                          ? ` · ${Math.floor(audioDuration / 60)}:${String(
                              audioDuration % 60
                            ).padStart(2, "0")}`
                          : ""}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={clearAudio}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-600 transition hover:bg-white/[0.06] hover:text-red-300"
                      aria-label="Quitar canción"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <audio
                    ref={audioPreviewRef}
                    src={audioPreviewUrl}
                    preload="metadata"
                    className="hidden"
                  />

                  <div className="mt-4">
                    <StoryMusicStartPicker
                      startSeconds={audioClipStart}
                      durationSeconds={
                        audioDuration || 240
                      }
                      confirmed={
                        audioClipConfirmed
                      }
                      onStartChange={(value) => {
                        setAudioClipStart(value);
                        setAudioClipConfirmed(false);
                      }}
                      onConfirm={() => {
                        setAudioClipConfirmed(true);
                        previewSelectedClip();
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={previewSelectedClip}
                    className="mt-2 h-9 w-full rounded-xl bg-white/[0.045] text-[10px] font-black text-zinc-400 transition hover:bg-white/[0.07] hover:text-zinc-200"
                  >
                    Escuchar fragmento
                  </button>
                </div>
              )}
            </section>
          )}

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                mediaInputRef.current?.click()
              }
              disabled={publishing}
              className="h-10 rounded-xl px-3 text-xs font-bold text-zinc-600 transition hover:bg-white/[0.04] hover:text-zinc-200"
            >
              {file
                ? "Cambiar archivo"
                : "Elegir archivo"}
            </button>

            <button
              type="button"
              onClick={publishStory}
              disabled={
                !file ||
                publishing ||
                Boolean(
                  audioFile &&
                    !audioClipConfirmed
                )
              }
              className="flex h-10 items-center gap-2 rounded-xl bg-[#6d7cff] px-4 text-xs font-black text-white transition hover:bg-[#7b87ff] disabled:cursor-not-allowed disabled:bg-white/[0.05] disabled:text-zinc-700"
            >
              {publishing ? (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <Send size={15} />
              )}

              {publishing
                ? "Publicando..."
                : "Publicar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
