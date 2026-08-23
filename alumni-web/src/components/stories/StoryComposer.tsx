"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Check,
  Film,
  ImagePlus,
  Loader2,
  Music2,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import type { StoryMusicTrack } from "@/lib/musicCatalog";
import StoryMusicStartPicker from "@/components/stories/StoryMusicStartPicker";

type Props = {
  open: boolean;
  onClose: () => void;
  onPublished: () => void | Promise<void>;
};

const MAX_WIDTH = 1080;
const MAX_HEIGHT = 1920;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

function getMarketFromLocale() {
  if (typeof navigator === "undefined") return "SV";

  const locale =
    navigator.languages?.[0] ||
    navigator.language ||
    "es-SV";

  const match = locale.match(/[-_]([A-Za-z]{2})$/);

  return match?.[1]?.toUpperCase() || "SV";
}

export default function StoryComposer({
  open,
  onClose,
  onPublished,
}: Props) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<number | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [publishing, setPublishing] = useState(false);

  const [musicQuery, setMusicQuery] = useState("");
  const [musicResults, setMusicResults] = useState<
    StoryMusicTrack[]
  >([]);
  const [musicSearching, setMusicSearching] = useState(false);
  const [musicSearchError, setMusicSearchError] = useState("");
  const [music, setMusic] = useState<StoryMusicTrack | null>(null);
  const [musicClipStart, setMusicClipStart] = useState(0);
  const [musicClipConfirmed, setMusicClipConfirmed] = useState(false);
  const [musicTrackDuration, setMusicTrackDuration] = useState<number | null>(null);

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
    return () => {
      if (searchTimerRef.current !== null) {
        window.clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreviewUrl("");
      setPublishing(false);
      setMusicQuery("");
      setMusicResults([]);
      setMusicSearching(false);
      setMusicSearchError("");
      setMusic(null);
      setMusicClipStart(0);
      setMusicClipConfirmed(false);
      setMusicTrackDuration(null);
    }
  }, [open]);

  const hasSearch = musicQuery.trim().length >= 2;

  useEffect(() => {
    if (!open || !file) return;

    const query = musicQuery.trim();

    if (searchTimerRef.current !== null) {
      window.clearTimeout(searchTimerRef.current);
    }

    if (query.length < 2) {
      setMusicResults([]);
      setMusicSearching(false);
      setMusicSearchError("");
      return;
    }

    searchTimerRef.current = window.setTimeout(() => {
      void searchMusic(query);
    }, 350);

    return () => {
      if (searchTimerRef.current !== null) {
        window.clearTimeout(searchTimerRef.current);
      }
    };
  }, [musicQuery, open, file]);

  if (!open) return null;

  async function searchMusic(query: string) {
    setMusicSearching(true);
    setMusicSearchError("");

    try {
      const response = await fetch(
        `/api/music/search?q=${encodeURIComponent(
          query
        )}&market=${encodeURIComponent(getMarketFromLocale())}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "No se pudo buscar en Spotify."
        );
      }

      setMusicResults((data?.tracks || []) as StoryMusicTrack[]);
    } catch (error: any) {
      setMusicResults([]);
      setMusicSearchError(
        error?.message || "No se pudo buscar música."
      );
    } finally {
      setMusicSearching(false);
    }
  }

  async function optimizeImageForStory(originalFile: File) {
    if (!originalFile.type.startsWith("image/")) {
      return originalFile;
    }

    return new Promise<File>((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(originalFile);

      image.onload = async () => {
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
                new File([blob], `${nextName}-story.jpg`, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                })
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
        reject(new Error("No se pudo leer la imagen."));
      };

      image.src = objectUrl;
    });
  }

  function chooseFile(selected: File) {
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

  function selectTrack(track: StoryMusicTrack) {
    setMusic(track);
    setMusicClipStart(0);
    setMusicClipConfirmed(false);
    setMusicTrackDuration(
      typeof track.duration_ms === "number" && track.duration_ms > 0
        ? Math.floor(track.duration_ms / 1000)
        : null
    );
    setMusicQuery("");
    setMusicResults([]);
    setMusicSearchError("");
  }

  async function publishStory() {
    if (!user || !file || publishing) return;

    if (music && !musicClipConfirmed) {
      alert("Confirma primero desde dónde debe empezar la canción.");
      return;
    }

    setPublishing(true);

    try {
      const preparedFile =
        await optimizeImageForStory(file);

      const cleanName = preparedFile.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

      const path = `${user.id}/${Date.now()}-${cleanName}`;

      const { error: uploadError } = await supabase.storage
        .from("stories")
        .upload(path, preparedFile, {
          cacheControl: "3600",
          upsert: false,
          contentType:
            preparedFile.type ||
            (preparedFile.type.startsWith("video/")
              ? "video/mp4"
              : "image/jpeg"),
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("stories")
        .getPublicUrl(path);

      const { error: insertError } = await supabase
        .from("stories")
        .insert({
          user_id: user.id,
          media_url: publicUrlData.publicUrl,
          media_path: path,
          media_type: preparedFile.type.startsWith("video/")
            ? "video"
            : "image",
          music_provider: music?.provider || null,
          music_track_id:
            music?.provider_track_id || null,
          music_title: music?.track_title || null,
          music_artist: music?.artist_name || null,
          music_artwork_url: music?.artwork_url || null,
          music_track_url: music?.track_url || null,
          music_embed_url: music?.embed_url || null,
          music_preview_url: music?.preview_url || null,
          music_duration_ms: music?.duration_ms || null,
          music_clip_start_seconds: music
            ? Math.max(0, Math.floor(musicClipStart))
            : 0,
          music_clip_duration_seconds: 15,
        });

      if (insertError) {
        await supabase.storage
          .from("stories")
          .remove([path]);
        throw insertError;
      }

      await onPublished();
    } catch (error: any) {
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-3 backdrop-blur-xl sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-[500px] overflow-hidden rounded-[30px] border border-white/[0.09] bg-[#0b0e13] shadow-[0_30px_90px_rgba(0,0,0,.5)]">
        <div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-5">
          <div>
            <p className="text-sm font-black text-white">
              Nueva historia
            </p>
            <p className="mt-0.5 text-[10px] text-zinc-600">
              Foto o video · 15 segundos · visible durante 24 horas
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

        <div className="max-h-[calc(100dvh-110px)] overflow-y-auto p-4 sm:p-5">
          {previewUrl ? (
            <div className="relative overflow-hidden rounded-[24px] bg-black">
              {file?.type.startsWith("video/") ? (
                <video
                  src={previewUrl}
                  controls
                  playsInline
                  className="aspect-[9/16] max-h-[58vh] w-full object-contain"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Vista previa de historia"
                  className="aspect-[9/16] max-h-[58vh] w-full object-contain"
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

              {music && (
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-[18px] border border-white/10 bg-black/55 p-3 backdrop-blur-2xl">
                  {music.artwork_url ? (
                    <img
                      src={music.artwork_url}
                      alt=""
                      className="h-11 w-11 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                      <Music2 size={16} />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black text-white">
                      {music.track_title}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-white/50">
                      {music.artist_name}
                    </p>
                  </div>

                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 text-[9px] font-black tabular-nums text-white/55">
                    {Math.floor(musicClipStart / 60)}:{String(musicClipStart % 60).padStart(2, "0")} · 15s
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setMusic(null);
                      setMusicClipStart(0);
                      setMusicClipConfirmed(false);
                      setMusicTrackDuration(null);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white"
                    aria-label="Quitar música"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
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
            ref={inputRef}
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime"
            hidden
            onChange={(event) => {
              const selected =
                event.target.files?.[0];

              if (selected) chooseFile(selected);
              event.currentTarget.value = "";
            }}
          />

          {file && (
            <section className="mt-5 border-t border-white/[0.06] pt-5">
              <div className="flex items-center gap-2">
                <Music2
                  size={15}
                  className="text-[#8d98ff]"
                />
                <div>
                  <p className="text-xs font-black text-zinc-300">
                    Música
                  </p>
                  <p className="mt-0.5 text-[10px] text-zinc-700">
                    Busca una canción o artista y elige un tramo de 15 segundos.
                  </p>
                </div>
              </div>

              {!music && (
                <div className="relative mt-3">
                  <Search
                    size={14}
                    className="pointer-events-none absolute left-3 top-[19px] -translate-y-1/2 text-zinc-700"
                  />

                  <input
                    value={musicQuery}
                    onChange={(event) => {
                      setMusicQuery(event.target.value);
                      setMusicSearchError("");
                    }}
                    placeholder="Buscar canción o artista..."
                    autoComplete="off"
                    className="h-10 w-full rounded-xl border border-white/[0.07] bg-white/[0.025] pl-9 pr-10 text-xs text-zinc-300 outline-none placeholder:text-zinc-800 focus:border-[#6d7cff]/40"
                  />

                  {musicSearching && (
                    <Loader2
                      size={14}
                      className="absolute right-3 top-[19px] -translate-y-1/2 animate-spin text-zinc-600"
                    />
                  )}

                  {hasSearch && (
                    <div className="mt-2 overflow-hidden rounded-[16px] border border-white/[0.07] bg-[#0e1117]">
                      {musicSearchError ? (
                        <p className="px-4 py-4 text-[11px] font-bold text-red-300/80">
                          {musicSearchError}
                        </p>
                      ) : !musicSearching &&
                        musicResults.length === 0 ? (
                        <p className="px-4 py-4 text-[11px] text-zinc-700">
                          No encontré canciones con esa búsqueda.
                        </p>
                      ) : (
                        <div className="max-h-[280px] overflow-y-auto">
                          {musicResults.map((track) => (
                            <button
                              key={track.provider_track_id}
                              type="button"
                              onClick={() =>
                                selectTrack(track)
                              }
                              className="flex w-full items-center gap-3 border-b border-white/[0.045] px-3 py-3 text-left transition last:border-b-0 hover:bg-white/[0.035]"
                            >
                              {track.artwork_url ? (
                                <img
                                  src={track.artwork_url}
                                  alt=""
                                  className="h-11 w-11 shrink-0 rounded-xl object-cover"
                                />
                              ) : (
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-zinc-600">
                                  <Music2 size={15} />
                                </div>
                              )}

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-black text-zinc-200">
                                  {track.track_title}
                                </p>
                                <p className="mt-1 truncate text-[10px] text-zinc-600">
                                  {track.artist_name}
                                  {track.album_name
                                    ? ` · ${track.album_name}`
                                    : ""}
                                </p>
                              </div>

                              <div className="flex shrink-0 items-center gap-2">
                                {track.preview_url && (
                                  <span className="rounded-full bg-white/[0.05] px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-zinc-600">
                                    15s
                                  </span>
                                )}
                                <Check
                                  size={14}
                                  className="text-zinc-700"
                                />
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}


              {music && (
                <div className="mt-4">
                  <StoryMusicStartPicker
                    startSeconds={musicClipStart}
                    durationSeconds={
                      musicTrackDuration ||
                      (typeof music.duration_ms === "number" && music.duration_ms > 0
                        ? Math.floor(music.duration_ms / 1000)
                        : 240)
                    }
                    confirmed={musicClipConfirmed}
                    onStartChange={(value) => {
                      setMusicClipStart(value);
                      setMusicClipConfirmed(false);
                    }}
                    onConfirm={() => setMusicClipConfirmed(true)}
                  />
                </div>
              )}
            </section>
          )}

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                inputRef.current?.click()
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
              disabled={!file || publishing || Boolean(music && !musicClipConfirmed)}
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
