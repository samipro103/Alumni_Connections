"use client";

import {
  Crop,
  Globe2,
  GripVertical,
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
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAlumniUX } from "@/components/ui/AlumniUXProvider";
import ImageCropEditor from "@/components/feed/ImageCropEditor";
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

type ReorderState = {
  pointerId: number;
  file: File;
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
  const previewsRowRef = useRef<HTMLDivElement>(null);
  const mediaFilesRef = useRef<File[]>(mediaFiles);
  const fileKeysRef = useRef<WeakMap<File, string>>(new WeakMap());
  const fileKeyCounterRef = useRef(0);
  const reorderRef = useRef<ReorderState | null>(null);
  const { user } = useAuth();
  const { notify } = useAlumniUX();

  const [profile, setProfile] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [draggingFile, setDraggingFile] = useState<File | null>(null);

  useEffect(() => {
    mediaFilesRef.current = mediaFiles;
  }, [mediaFiles]);

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
    setCropQueue((current) =>
      current.filter((file) => mediaFiles.includes(file))
    );
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

  const canPublish = Boolean(
    (content.trim() || mediaFiles.length) && !cropQueue.length
  );

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

  const currentCropFile = cropQueue[0] || null;
  const currentCropIndex = currentCropFile
    ? mediaFiles.indexOf(currentCropFile)
    : -1;

  function keyForFile(file: File) {
    const existing = fileKeysRef.current.get(file);
    if (existing) return existing;

    fileKeyCounterRef.current += 1;
    const next = `media-${fileKeyCounterRef.current}`;
    fileKeysRef.current.set(file, next);
    return next;
  }

  function commitMediaFiles(next: File[]) {
    mediaFilesRef.current = next;
    setMediaFiles(next);
  }

  function moveFileToIndex(file: File, targetIndex: number) {
    const current = mediaFilesRef.current;
    const fromIndex = current.indexOf(file);

    if (
      fromIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= current.length ||
      fromIndex === targetIndex
    ) {
      return;
    }

    const next = [...current];
    next.splice(fromIndex, 1);
    next.splice(targetIndex, 0, file);
    commitMediaFiles(next);
  }

  function moveFileBy(file: File, delta: number) {
    const current = mediaFilesRef.current;
    const fromIndex = current.indexOf(file);
    if (fromIndex < 0) return;

    const targetIndex = Math.max(
      0,
      Math.min(current.length - 1, fromIndex + delta)
    );
    moveFileToIndex(file, targetIndex);
  }

  function startReorder(
    event: ReactPointerEvent<HTMLButtonElement>,
    file: File
  ) {
    if (mediaFilesRef.current.length < 2 || publishing) return;

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    reorderRef.current = {
      pointerId: event.pointerId,
      file,
    };
    setDraggingFile(file);
  }

  function moveReorder(event: ReactPointerEvent<HTMLButtonElement>) {
    const active = reorderRef.current;
    if (!active || active.pointerId !== event.pointerId) return;

    event.preventDefault();

    const row = previewsRowRef.current;
    if (row) {
      const rect = row.getBoundingClientRect();
      const edge = 42;

      if (event.clientX < rect.left + edge) {
        row.scrollBy({ left: -14 });
      } else if (event.clientX > rect.right - edge) {
        row.scrollBy({ left: 14 });
      }
    }

    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-alumni-media-index]");

    if (!target) return;

    const targetIndex = Number(target.dataset.alumniMediaIndex);
    if (!Number.isInteger(targetIndex)) return;

    moveFileToIndex(active.file, targetIndex);
  }

  function endReorder(event: ReactPointerEvent<HTMLButtonElement>) {
    const active = reorderRef.current;
    if (!active || active.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    reorderRef.current = null;
    setDraggingFile(null);
  }

  function reorderWithKeyboard(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    file: File
  ) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveFileBy(file, -1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      moveFileBy(file, 1);
    }
  }

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
      const current = mediaFilesRef.current;
      const available = Math.max(0, 10 - current.length);
      const appended = Array.from(list).slice(0, available);
      const next = [...current, ...appended];

      validatePostMediaFiles(next);
      commitMediaFiles(next);

      const imagesToCrop = appended.filter((file) =>
        file.type.startsWith("image/")
      );

      if (imagesToCrop.length) {
        setCropQueue((currentQueue) => [
          ...currentQueue,
          ...imagesToCrop,
        ]);
      }
    } catch (error: any) {
      notify(
        error?.message || "No se pudieron agregar los archivos.",
        "error"
      );
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function removeFile(index: number) {
    const current = mediaFilesRef.current;
    const target = current[index];

    commitMediaFiles(
      current.filter((_, currentIndex) => currentIndex !== index)
    );

    if (target) {
      setCropQueue((currentQueue) =>
        currentQueue.filter((file) => file !== target)
      );
    }
  }

  function editFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setCropQueue([file]);
  }

  function applyCrop(croppedFile: File) {
    const sourceFile = cropQueue[0];
    if (!sourceFile) return;

    commitMediaFiles(
      mediaFilesRef.current.map((file) =>
        file === sourceFile ? croppedFile : file
      )
    );
    setCropQueue((currentQueue) => currentQueue.slice(1));
  }

  function skipCrop() {
    setCropQueue((currentQueue) => currentQueue.slice(1));
  }

  async function publish() {
    if (!canPublish || publishing) return;

    setPublishing(true);

    try {
      const ok = await createPost();

      if (ok) {
        setExpanded(false);
        setCropQueue([]);
        setDraggingFile(null);
      }
    } catch (error) {
      console.error("Post publish error:", error);
    } finally {
      setPublishing(false);
    }
  }

  function cancel() {
    setContent("");
    commitMediaFiles([]);
    setCropQueue([]);
    setDraggingFile(null);
    setExpanded(false);
  }

  return (
    <>
      <section
        id="composer"
        className="alumni-pro-composer"
        data-pull-refresh-lock={
          expanded && (canPublish || cropQueue.length) ? "true" : undefined
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
                <div
                  ref={previewsRowRef}
                  className="alumni-pro-composer-previews alumni-feed-reorder-row"
                  data-reordering={draggingFile ? "true" : "false"}
                >
                  {previews.map((preview, index) => (
                    <div
                      key={keyForFile(preview.file)}
                      className="alumni-pro-composer-preview alumni-feed-visual-preview"
                      data-alumni-media-index={index}
                      data-dragging={
                        draggingFile === preview.file ? "true" : "false"
                      }
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
                        <>
                          <img
                            src={preview.url}
                            alt=""
                          />

                          <button
                            type="button"
                            className="alumni-feed-preview-crop"
                            onClick={() => editFile(preview.file)}
                            aria-label={`Ajustar foto ${index + 1}`}
                          >
                            <Crop size={14} />
                            <span>Ajustar</span>
                          </button>
                        </>
                      )}

                      {previews.length > 1 && (
                        <button
                          type="button"
                          className="alumni-feed-preview-reorder"
                          onPointerDown={(event) =>
                            startReorder(event, preview.file)
                          }
                          onPointerMove={moveReorder}
                          onPointerUp={endReorder}
                          onPointerCancel={endReorder}
                          onLostPointerCapture={() => {
                            reorderRef.current = null;
                            setDraggingFile(null);
                          }}
                          onKeyDown={(event) =>
                            reorderWithKeyboard(event, preview.file)
                          }
                          disabled={publishing}
                          aria-label={`Reordenar archivo ${index + 1}. Usa flechas izquierda o derecha con teclado.`}
                          title="Mantén y arrastra para ordenar"
                        >
                          <GripVertical size={15} />
                        </button>
                      )}

                      <button
                        type="button"
                        className="alumni-feed-preview-remove"
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
                      className="alumni-pro-composer-add-more alumni-feed-visual-add-more"
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
                  Hasta 10 · Arrastra para ordenar · Fotos 4:5
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

      {currentCropFile && currentCropIndex >= 0 && (
        <ImageCropEditor
          file={currentCropFile}
          position={Math.max(
            1,
            previews
              .filter((item) => item.file.type.startsWith("image/"))
              .findIndex((item) => item.file === currentCropFile) + 1
          )}
          total={
            previews.filter((item) => item.file.type.startsWith("image/"))
              .length
          }
          onApply={applyCrop}
          onSkip={skipCrop}
          onClose={() => setCropQueue([])}
        />
      )}
    </>
  );
}

/* ALUMNI_2_5_0_FEED_VISUAL_COMPOSER */

/* ALUMNI_2_6_0_GLOBAL_UX:POST_COMPOSER */
