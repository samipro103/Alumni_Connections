"use client";

import { useEffect, useRef, useState } from "react";
import {
  ImagePlus,
  Loader2,
  Send,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";

type Props = {
  open: boolean;
  onClose: () => void;
  onPublished: () => void | Promise<void>;
};

const MAX_WIDTH = 1080;
const MAX_HEIGHT = 1920;

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
          contentType: preparedFile.type || "image/jpeg",
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-[470px] overflow-hidden rounded-[28px] border border-white/[0.10] bg-[#0d1015] shadow-2xl">
        <div className="flex h-14 items-center justify-between border-b border-white/[0.07] px-4">
          <div>
            <p className="text-sm font-black text-white">
              Nueva historia
            </p>
            <p className="text-[10px] text-zinc-600">
              Visible durante 24 horas · optimizada hasta 1080p
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

        <div className="p-4">
          {previewUrl ? (
            <div className="relative overflow-hidden rounded-[22px] bg-black">
              {file?.type.startsWith("video/") ? (
                <video
                  src={previewUrl}
                  controls
                  className="aspect-[9/16] max-h-[68vh] w-full object-contain"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Vista previa de historia"
                  className="aspect-[9/16] max-h-[68vh] w-full object-contain"
                />
              )}

              <button
                type="button"
                onClick={() => setFile(null)}
                disabled={publishing}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur"
                aria-label="Quitar archivo"
              >
                <X size={17} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex aspect-[9/13] w-full flex-col items-center justify-center rounded-[22px] border border-dashed border-white/[0.12] bg-white/[0.025] px-8 text-center transition hover:border-[#7f8cff]/40 hover:bg-white/[0.04]"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6d7cff]/10 text-[#9ba5ff]">
                <ImagePlus size={25} />
              </span>

              <p className="mt-4 text-sm font-black text-zinc-200">
                Selecciona una foto
              </p>

              <p className="mt-2 max-w-[260px] text-xs leading-5 text-zinc-600">
                Subimos la historia con mejor estabilidad visual y optimización
                máxima de 1080p para mantener nitidez y buen rendimiento.
              </p>
            </button>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected) setFile(selected);
            }}
          />

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={publishing}
              className="h-10 rounded-xl px-3 text-xs font-bold text-zinc-500 transition hover:bg-white/[0.05] hover:text-zinc-200"
            >
              {file ? "Cambiar foto" : "Elegir foto"}
            </button>

            <button
              type="button"
              onClick={publishStory}
              disabled={!file || publishing}
              className="flex h-10 items-center gap-2 rounded-xl bg-[#6d7cff] px-4 text-xs font-black text-white transition hover:bg-[#7b87ff] disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-zinc-600"
            >
              {publishing ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}

              {publishing ? "Publicando..." : "Publicar historia"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
