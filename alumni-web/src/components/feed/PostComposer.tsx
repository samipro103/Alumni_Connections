"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ImagePlus, Send, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";

interface Props {
  content: string;
  setContent: (v: string) => void;
  image: File | null;
  setImage: (file: File | null) => void;
  createPost: () => void;
}

export default function PostComposer({
  content,
  setContent,
  image,
  setImage,
  createPost,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    async function loadProfile() {
      const { data } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user!.id)
        .maybeSingle();

      setProfile(data);
    }

    loadProfile();
  }, [user?.id]);

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    setExpanded(true);

    return () => URL.revokeObjectURL(url);
  }, [image]);

  const canPublish = Boolean(content.trim() || image);

  function openComposer() {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    setExpanded(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  async function publish() {
    await createPost();
    setExpanded(false);
  }

  return (
    <section
      id="composer"
      className="mb-5 scroll-mt-24 overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#101318]/95"
    >
      <div className="flex items-center gap-3 p-4 sm:p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1a1f29] text-sm font-bold">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Perfil"
              className="h-full w-full object-cover"
            />
          ) : (
            profile?.username?.charAt(0)?.toUpperCase() || "A"
          )}
        </div>

        {!expanded ? (
          <>
            <button
              type="button"
              onClick={openComposer}
              className="min-w-0 flex-1 rounded-2xl bg-white/[0.035] px-4 py-3 text-left text-sm text-zinc-600 transition hover:bg-white/[0.055] hover:text-zinc-400"
            >
              Comparte una idea, logro o actualización...
            </button>

            <button
              type="button"
              onClick={() => {
                openComposer();
                setTimeout(() => inputRef.current?.click(), 80);
              }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-white/[0.05] hover:text-zinc-300"
              aria-label="Agregar foto"
            >
              <ImagePlus size={19} />
            </button>
          </>
        ) : (
          <div className="min-w-0 flex-1">
            <textarea
              ref={textareaRef}
              rows={4}
              value={content}
              placeholder="¿Qué quieres compartir con tu comunidad?"
              onChange={(e) => setContent(e.target.value)}
              className="w-full resize-none bg-transparent pt-1 text-[15px] leading-6 text-zinc-100 outline-none placeholder:text-zinc-600"
            />

            {previewUrl && (
              <div className="relative mt-3 overflow-hidden rounded-2xl border border-white/[0.07]">
                <img
                  src={previewUrl}
                  alt="Vista previa"
                  className="max-h-[440px] w-full object-cover"
                />

                <button
                  type="button"
                  onClick={() => setImage(null)}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur"
                  aria-label="Quitar imagen"
                >
                  <X size={17} />
                </button>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-zinc-500 transition hover:bg-white/[0.05] hover:text-zinc-200"
                >
                  <ImagePlus size={17} />
                  <span className="hidden sm:inline">Foto</span>
                </button>

                <button
                  type="button"
                  className="flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-zinc-500 transition hover:bg-white/[0.05] hover:text-zinc-200"
                  title="Próximamente: compartir evento"
                >
                  <CalendarDays size={17} />
                  <span className="hidden sm:inline">Evento</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setExpanded(false);
                    setContent("");
                    setImage(null);
                  }}
                  className="h-9 rounded-xl px-3 text-xs font-bold text-zinc-600 transition hover:bg-white/[0.04] hover:text-zinc-300"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={publish}
                  disabled={!canPublish}
                  className="flex h-9 items-center gap-2 rounded-xl bg-[#6d7cff] px-4 text-xs font-bold text-white transition hover:bg-[#7b87ff] disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-zinc-600"
                >
                  <Send size={15} />
                  Publicar
                </button>
              </div>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          hidden
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              setImage(e.target.files[0]);
            }
          }}
        />
      </div>
    </section>
  );
}
