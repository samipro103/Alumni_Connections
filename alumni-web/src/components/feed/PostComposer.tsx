"use client";

import { useEffect, useRef, useState } from "react";
import { Globe2, ImagePlus, Send, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";

interface Props {
  content: string;
  setContent: (v: string) => void;
  image: File | null;
  setImage: (file: File | null) => void;
  createPost: () => boolean | Promise<boolean>;
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
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
  if (!user) {
    setProfile(null);
    return;
  }

  const userId = user.id;
  let active = true;

  async function loadProfile() {
    const { data } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (active) {
      setProfile(data);
    }
  }

  void loadProfile();

  return () => {
    active = false;
  };
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

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || !expanded) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 96), 240)}px`;
  }, [content, expanded]);

  const canPublish = Boolean(content.trim() || image);

  function openComposer() {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    setExpanded(true);
    window.setTimeout(() => textareaRef.current?.focus(), 40);
  }

  async function publish() {
  if (!canPublish || publishing) return;

  setPublishing(true);

  try {
    const published =
      await createPost();

    if (published) {
      setExpanded(false);
    }
  } catch (error) {
    console.error(
      "Post publish error:",
      error
    );
  } finally {
    setPublishing(false);
  }
}


  function cancelComposer() {
    setExpanded(false);
    setContent("");
    setImage(null);
  }

  return (
    <section
      id="composer"
      data-pull-refresh-lock={
        expanded &&
        Boolean(
          content.trim() ||
            image
        )
          ? "true"
          : undefined
      }
      className="alumni-composer mb-6 scroll-mt-24 overflow-hidden rounded-[24px] border"
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--app-surface-2)] text-sm font-black text-[var(--app-text)] ring-1 ring-[var(--app-border)]">
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
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <button
                type="button"
                onClick={openComposer}
                className="min-w-0 flex-1 rounded-[18px] border border-[var(--app-border)] bg-[var(--app-soft)] px-4 py-3.5 text-left text-sm text-[var(--app-muted)] transition hover:bg-[var(--app-soft-strong)]"
              >
                ¿Qué quieres compartir hoy?
              </button>

              <button
                type="button"
                onClick={() => {
                  openComposer();
                  window.setTimeout(() => inputRef.current?.click(), 80);
                }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] text-[var(--app-accent)] transition hover:bg-[var(--app-accent-soft)]"
                aria-label="Agregar foto"
                title="Agregar foto"
              >
                <ImagePlus size={20} />
              </button>
            </div>
          ) : (
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2">
                <p className="truncate text-sm font-black text-[var(--app-text)]">
                  @{profile?.username || "alumni"}
                </p>

                <span className="flex items-center gap-1 rounded-full border border-[var(--app-border)] bg-[var(--app-soft)] px-2 py-1 text-[10px] font-bold text-[var(--app-muted)]">
                  <Globe2 size={11} />
                  Comunidad Alumni
                </span>
              </div>

              <textarea
                ref={textareaRef}
                rows={3}
                value={content}
                placeholder="Comparte una idea, un logro, una pregunta o algo que quieras contar..."
                onChange={(event) => setContent(event.target.value)}
                className="min-h-24 w-full resize-none overflow-y-auto bg-transparent py-2 text-[16px] leading-6 text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted-2)]"
              />

              {previewUrl && (
                <div className="relative mt-3 overflow-hidden rounded-[20px] border border-[var(--app-border)] bg-[var(--app-bg-2)]">
                  <img
                    src={previewUrl}
                    alt="Vista previa"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    draggable={false}
                    className="max-h-[520px] w-full object-contain"
                  />

                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur-xl"
                    aria-label="Quitar imagen"
                  >
                    <X size={17} />
                  </button>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 border-t border-[var(--app-border)] pt-3">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold text-[var(--app-accent)] transition hover:bg-[var(--app-accent-soft)]"
                >
                  <ImagePlus size={17} />
                  Foto
                </button>

                <span className="hidden text-[10px] text-[var(--app-muted-3)] sm:inline">
                  Las publicaciones son visibles para la comunidad.
                </span>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cancelComposer}
                    disabled={publishing}
                    className="h-10 rounded-xl px-3 text-xs font-bold text-[var(--app-muted)] transition hover:bg-[var(--app-soft)] hover:text-[var(--app-text-soft)] disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={publish}
                    disabled={!canPublish || publishing}
                    className="alumni-accent-button flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Send size={15} />
                    {publishing ? "Publicando..." : "Publicar"}
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
            onChange={(event) => {
              if (event.target.files?.[0]) {
                setImage(event.target.files[0]);
              }
            }}
          />
        </div>
      </div>
    </section>
  );
}
