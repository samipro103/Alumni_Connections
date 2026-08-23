"use client";

import { useEffect, useRef, useState } from "react";
import {
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
import type { SpotifyTrackImport } from "@/lib/profileMusic";

type Props = {
  open: boolean;
  onClose: () => void;
  onPublished: () => void | Promise<void>;
};

const MAX_WIDTH = 1080;
const MAX_HEIGHT = 1920;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export default function StoryComposer({
  open,
  onClose,
  onPublished,
}: Props) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [publishing, setPublishing] = useState(false);

  const [musicUrl, setMusicUrl] = useState("");
  const [music, setMusic] = useState<SpotifyTrackImport | null>(null);
  const [musicBusy, setMusicBusy] = useState(false);
  const [musicError, setMusicError] = useState("");

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
    if (!open) {
      setFile(null);
      setPreviewUrl("");
      setPublishing(false);
      setMusicUrl("");
      setMusic(null);
      setMusicBusy(false);
      setMusicError("");
    }
  }, [open]);

  if (!open) return null;

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

          const targetWidth = Math.max(1, Math.round(width * scale));
          const targetHeight = Math.max(1, Math.round(height * scale));

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
          context.drawImage(image, 0, 0, targetWidth, targetHeight);

          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(objectUrl);

              if (!blob) {
                resolve(originalFile);
                return;
              }

              const nextName = originalFile.name.replace(/\.[^.]+$/, "");

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

  async function loadMusic() {
    const cleanUrl = musicUrl.trim();

    if (!cleanUrl || musicBusy) return;

    setMusicBusy(true);
    setMusicError("");

    try {
      const response = await fetch(
        `/api/music/spotify?url=${encodeURIComponent(cleanUrl)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo leer la canción.");
      }

      setMusic(data as SpotifyTrackImport);
    } catch (error: any) {
      setMusic(null);
      setMusicError(error?.message || "No se pudo leer la canción.");
    } finally {
      setMusicBusy(false);
    }
  }

  async function publishStory() {
    if (!user || !file || publishing) return;

    setPublishing(true);

    try {
      const preparedFile = await optimizeImageForStory(file);

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
          music_track_id: music?.provider_track_id || null,
          music_title: music?.track_title || null,
          music_artist: music?.artist_name || null,
          music_artwork_url: music?.artwork_url || null,
          music_track_url: music?.track_url || null,
          music_embed_url: music?.embed_url || null,
        });

      if (insertError) {
        await supabase.storage.from("stories").remove([path]);
        throw insertError;
      }

      await onPublished();
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "No se pudo publicar la historia.");
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
              Foto o video · visible durante 24 horas
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
                {file?.type.startsWith("video/") ? "Video" : "Foto"}
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
                      Spotify
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMusic(null);
                      setMusicUrl("");
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
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

              <p className="mt-2 max-w-[280px] text-xs leading-5 text-zinc-600">
                Comparte un momento en imagen o video y, si quieres,
                acompáñalo con una canción.
              </p>
            </button>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime"
            hidden
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected) chooseFile(selected);
              event.currentTarget.value = "";
            }}
          />

          {file && (
            <section className="mt-5 border-t border-white/[0.06] pt-5">
              <div className="flex items-center gap-2">
                <Music2 size={15} className="text-[#8d98ff]" />
                <div>
                  <p className="text-xs font-black text-zinc-300">
                    Música
                  </p>
                  <p className="mt-0.5 text-[10px] text-zinc-700">
                    Opcional · agrega un sticker musical a tu historia.
                  </p>
                </div>
              </div>

              {!music && (
                <>
                  <div className="mt-3 flex gap-2">
                    <div className="relative min-w-0 flex-1">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700"
                      />
                      <input
                        value={musicUrl}
                        onChange={(event) => {
                          setMusicUrl(event.target.value);
                          setMusicError("");
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            void loadMusic();
                          }
                        }}
                        placeholder="Pega enlace de Spotify"
                        className="h-10 w-full rounded-xl border border-white/[0.07] bg-white/[0.025] pl-9 pr-3 text-xs text-zinc-300 outline-none placeholder:text-zinc-800 focus:border-[#6d7cff]/40"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={loadMusic}
                      disabled={!musicUrl.trim() || musicBusy}
                      className="flex h-10 items-center gap-2 rounded-xl bg-white/[0.06] px-3 text-[10px] font-black text-zinc-300 transition hover:bg-white/[0.09] disabled:opacity-40"
                    >
                      {musicBusy ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Music2 size={13} />
                      )}
                      Añadir
                    </button>
                  </div>

                  {musicError && (
                    <p className="mt-2 text-[10px] font-bold text-red-300/80">
                      {musicError}
                    </p>
                  )}
                </>
              )}
            </section>
          )}

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={publishing}
              className="h-10 rounded-xl px-3 text-xs font-bold text-zinc-600 transition hover:bg-white/[0.04] hover:text-zinc-200"
            >
              {file ? "Cambiar archivo" : "Elegir archivo"}
            </button>

            <button
              type="button"
              onClick={publishStory}
              disabled={!file || publishing}
              className="flex h-10 items-center gap-2 rounded-xl bg-[#6d7cff] px-4 text-xs font-black text-white transition hover:bg-[#7b87ff] disabled:cursor-not-allowed disabled:bg-white/[0.05] disabled:text-zinc-700"
            >
              {publishing ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
              {publishing ? "Publicando..." : "Publicar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
