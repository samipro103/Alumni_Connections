"use client";

import {
  Globe2,
  ImagePlus,
  Play,
  Plus,
  Send,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { validatePostMediaFiles } from "@/lib/feedMedia";

interface Props {
  content: string;
  setContent: (value: string) => void;
  mediaFiles: File[];
  setMediaFiles: (files: File[]) => void;
  createPost: () => boolean | Promise<boolean>;
}

type Preview = {
  file: File;
  url: string;
};

export default function PostComposer({
  content,
  setContent,
  mediaFiles,
  setMediaFiles,
  createPost,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previews, setPreviews] = useState<Preview[]>([]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    let active = true;

    void supabase
      .from("profiles")
      .select("username,avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setProfile(data || null);
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    const next = mediaFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setPreviews(next);

    if (mediaFiles.length) {
      setExpanded(true);
    }

    return () => {
      for (const preview of next) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [mediaFiles]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || !expanded) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(
      Math.max(textarea.scrollHeight, 96),
      260
    )}px`;
  }, [content, expanded]);

  const canPublish = Boolean(content.trim() || mediaFiles.length);

  const mediaLabel = useMemo(() => {
    if (!mediaFiles.length) return "Foto o video";

    const photos = mediaFiles.filter((file) =>
      file.type.startsWith("image/")
    ).length;
    const videos = mediaFiles.length - photos;

    const parts = [];

    if (photos) {
      parts.push(`${photos} ${photos === 1 ? "foto" : "fotos"}`);
    }

    if (videos) {
      parts.push(`${videos} ${videos === 1 ? "video" : "videos"}`);
    }

    return parts.join(" · ");
  }, [mediaFiles]);

  function openComposer() {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    setExpanded(true);

    window.setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  }

  function addFiles(list: FileList | null) {
    if (!list?.length) return;

    try {
      const next = [...mediaFiles, ...Array.from(list)].slice(0, 10);
      validatePostMediaFiles(next);
      setMediaFiles(next);
    } catch (error: any) {
      alert(error?.message || "No se pudieron agregar los archivos.");
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function removeFile(index: number) {
    setMediaFiles(
      mediaFiles.filter((_, current) => current !== index)
    );
  }

  async function publish() {
    if (!canPublish || publishing) return;

    setPublishing(true);

    try {
      const ok = await createPost();

      if (ok) {
        setExpanded(false);
      }
    } catch (error) {
      console.error("Post publish error:", error);
    } finally {
      setPublishing(false);
    }
  }

  function cancel() {
    setContent("");
    setMediaFiles([]);
    setExpanded(false);
  }

  return (
    <section
      id="composer"
      className="alumni-pro-composer"
      data-pull-refresh-lock={
        expanded && canPublish ? "true" : undefined
      }
    >
      <div className="alumni-pro-composer-row">
        <div className="alumni-pro-composer-avatar">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
            />
          ) : (
            profile?.username?.charAt(0)?.toUpperCase() || "A"
          )}
        </div>

        {!expanded ? (
          <>
            <button
              type="button"
              className="alumni-pro-composer-open"
              onClick={openComposer}
            >
              ¿Qué quieres compartir hoy?
            </button>

            <button
              type="button"
              className="alumni-pro-composer-media-shortcut"
              onClick={() => {
                openComposer();
                window.setTimeout(
                  () => inputRef.current?.click(),
                  80
                );
              }}
              aria-label="Agregar fotos o videos"
            >
              <ImagePlus size={21} />
            </button>
          </>
        ) : (
          <div className="alumni-pro-composer-main">
            <div className="alumni-pro-composer-meta">
              <strong>@{profile?.username || "alumni"}</strong>
              <span>
                <Globe2 size={12} />
                Comunidad Alumni
              </span>
            </div>

            <textarea
              ref={textareaRef}
              rows={3}
              value={content}
              placeholder="Comparte una idea, un logro, una pregunta o algo que quieras contar..."
              onChange={(event) => setContent(event.target.value)}
            />

            {previews.length > 0 && (
              <div className="alumni-pro-composer-previews">
                {previews.map((preview, index) => (
                  <div
                    key={`${preview.file.name}-${index}`}
                    className="alumni-pro-composer-preview"
                  >
                    {preview.file.type.startsWith("video/") ? (
                      <>
                        <video
                          src={preview.url}
                          muted
                          playsInline
                          preload="metadata"
                        />
                        <span className="alumni-pro-composer-video-badge">
                          <Play size={14} fill="currentColor" />
                        </span>
                      </>
                    ) : (
                      <img
                        src={preview.url}
                        alt=""
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      aria-label="Quitar archivo"
                    >
                      <X size={15} />
                    </button>

                    {previews.length > 1 && (
                      <span className="alumni-pro-composer-order">
                        {index + 1}
                      </span>
                    )}
                  </div>
                ))}

                {previews.length < 10 && (
                  <button
                    type="button"
                    className="alumni-pro-composer-add-more"
                    onClick={() => inputRef.current?.click()}
                  >
                    <Plus size={22} />
                    <span>Agregar</span>
                  </button>
                )}
              </div>
            )}

            <div className="alumni-pro-composer-footer">
              <button
                type="button"
                className="alumni-pro-composer-media-button"
                onClick={() => inputRef.current?.click()}
              >
                <ImagePlus size={18} />
                {mediaLabel}
              </button>

              <span className="alumni-pro-composer-limit">
                Hasta 10 archivos
              </span>

              <div className="alumni-pro-composer-submit">
                <button
                  type="button"
                  onClick={cancel}
                  disabled={publishing}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="is-primary"
                  onClick={publish}
                  disabled={!canPublish || publishing}
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
          multiple
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
          onChange={(event) => addFiles(event.target.files)}
        />
      </div>
    </section>
  );
}

/* ALUMNI_1_4_0_MULTI_MEDIA_COMPOSER */
