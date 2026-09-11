"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";
import {
  ArrowLeft,
  Check,
  ImagePlus,
  Send,
  X,
} from "lucide-react";
import {
  motion,
  useReducedMotion,
} from "framer-motion";
import AppShell from "@/components/layout/AppShell";
import {
  useAuth,
} from "@/components/auth/AuthProvider";
import {
  supabase,
} from "@/lib/supabase";
import {
  APP_VERSION,
} from "@/lib/appVersion";
import "./feedback-simple-4-0.css";

const MAX_FILES = 4;
const MAX_FILE_SIZE =
  8 * 1024 * 1024;

function detectPlatform() {
  if (
    typeof navigator ===
    "undefined"
  ) {
    return "Web";
  }

  const ua =
    navigator.userAgent
      .toLowerCase();

  if (
    ua.includes(
      "android"
    )
  ) {
    return "Android";
  }

  if (
    /iphone|ipad|ipod/.test(
      ua
    )
  ) {
    return "iOS";
  }

  return "Web";
}

export default function FeedbackPage() {
  const router =
    useRouter();

  const {
    user,
    loading,
  } = useAuth();

  const reduceMotion =
    useReducedMotion();

  const inputRef =
    useRef<HTMLInputElement>(
      null
    );

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    files,
    setFiles,
  ] = useState<File[]>([]);

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    sent,
    setSent,
  ] = useState(false);

  const [
    sourcePath,
    setSourcePath,
  ] = useState("/");

  useEffect(() => {
    if (
      !loading &&
      !user
    ) {
      router.replace(
        "/login"
      );
    }
  }, [
    loading,
    user,
    router,
  ]);

  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    setSourcePath(
      sessionStorage.getItem(
        "alumni_feedback_from"
      ) ||
        document.referrer ||
        "/"
    );
  }, []);

  const previews =
    useMemo(
      () =>
        files.map(
          (file) => ({
            file,
            url:
              URL.createObjectURL(
                file
              ),
          })
        ),
      [files]
    );

  useEffect(() => {
    return () => {
      previews.forEach(
        ({ url }) =>
          URL.revokeObjectURL(
            url
          )
      );
    };
  }, [previews]);

  function addFiles(
    selected:
      FileList | null
  ) {
    if (!selected) {
      return;
    }

    const next =
      [...files];

    for (
      const file
      of Array.from(
        selected
      )
    ) {
      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        continue;
      }

      if (
        file.size >
        MAX_FILE_SIZE
      ) {
        alert(
          `"${file.name}" supera 8 MB.`
        );
        continue;
      }

      if (
        next.length >=
        MAX_FILES
      ) {
        break;
      }

      next.push(file);
    }

    setFiles(
      next.slice(
        0,
        MAX_FILES
      )
    );

    if (
      inputRef.current
    ) {
      inputRef.current.value =
        "";
    }
  }

  function removeFile(
    index: number
  ) {
    setFiles(
      (current) =>
        current.filter(
          (
            _,
            currentIndex
          ) =>
            currentIndex !==
            index
        )
    );
  }

  async function sendFeedback() {
    const clean =
      message.trim();

    if (
      !user ||
      sending ||
      !clean
    ) {
      return;
    }

    setSending(true);

    const reportId =
      crypto.randomUUID();

    const uploadedPaths:
      string[] = [];

    try {
      for (
        let index = 0;
        index <
        files.length;
        index += 1
      ) {
        const file =
          files[index];

        const extension =
          file.name
            .split(".")
            .pop()
            ?.toLowerCase() ||
          (
            file.type.includes(
              "png"
            )
              ? "png"
              : "jpg"
          );

        const path =
          `${user.id}/${reportId}/${Date.now()}-${index}.${extension}`;

        const {
          error:
            uploadError,
        } =
          await supabase.storage
            .from(
              "feedback"
            )
            .upload(
              path,
              file,
              {
                cacheControl:
                  "3600",
                upsert:
                  false,
                contentType:
                  file.type,
              }
            );

        if (
          uploadError
        ) {
          throw uploadError;
        }

        uploadedPaths.push(
          path
        );
      }

      const generatedTitle =
        clean
          .replace(
            /\s+/g,
            " "
          )
          .slice(
            0,
            90
          ) ||
        "Feedback";

      const {
        error,
      } =
        await supabase
          .from(
            "feedback_reports"
          )
          .insert({
            id: reportId,
            user_id:
              user.id,
            type: "other",
            priority:
              "medium",
            title:
              generatedTitle,
            description:
              clean,
            expected_behavior:
              null,
            steps_to_reproduce:
              null,
            source_path:
              sourcePath,
            platform:
              detectPlatform(),
            app_version:
              APP_VERSION,
            attachments:
              uploadedPaths,
          });

      if (error) {
        throw error;
      }

      sessionStorage
        .removeItem(
          "alumni_feedback_from"
        );

      setMessage("");
      setFiles([]);
      setSent(true);
    } catch (
      error: any
    ) {
      if (
        uploadedPaths.length
      ) {
        await supabase.storage
          .from("feedback")
          .remove(
            uploadedPaths
          );
      }

      console.error(
        error
      );

      alert(
        error?.message ||
          "No se pudo enviar el feedback."
      );
    } finally {
      setSending(false);
    }
  }

  if (
    loading ||
    !user
  ) {
    return (
      <AppShell>
        <main className="alumni-feedback-simple">
          <div className="alumni-feedback-simple-loading">
            Cargando...
          </div>
        </main>
      </AppShell>
    );
  }

  if (sent) {
    return (
      <AppShell>
        <main
          className="alumni-feedback-simple"
          data-alumni-motion-ignore="true"
        >
          <motion.section
            className="alumni-feedback-simple-success"
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    y: 12,
                    scale: 0.98,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
          >
            <span>
              <Check
                size={22}
              />
            </span>

            <h1>Enviado</h1>

            <p>
              Gracias por ayudarnos a mejorar ALUMNI.
            </p>

            <button
              type="button"
              onClick={() =>
                setSent(false)
              }
            >
              Enviar otro
            </button>
          </motion.section>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main
        className="alumni-feedback-simple"
        data-alumni-motion-ignore="true"
      >
        <header className="alumni-feedback-simple-header">
          <button
            type="button"
            onClick={() =>
              router.back()
            }
            aria-label="Volver"
          >
            <ArrowLeft
              size={19}
            />
          </button>

          <h1>
            Feedback
          </h1>

          <span />
        </header>

        <motion.section
          className="alumni-feedback-simple-body"
          initial={
            reduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 12,
                }
          }
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.42,
            ease: [
              0.2,
              0.8,
              0.2,
              1,
            ],
          }}
        >
          <p>
            Cuéntanos qué podemos mejorar.
          </p>

          <textarea
            value={message}
            onChange={(
              event
            ) =>
              setMessage(
                event.target
                  .value
              )
            }
            maxLength={3000}
            placeholder="Escribe aquí..."
            autoFocus
          />

          {previews.length >
            0 && (
            <div className="alumni-feedback-simple-previews">
              {previews.map(
                (
                  preview,
                  index
                ) => (
                  <div
                    key={
                      preview.url
                    }
                    className="alumni-feedback-simple-preview"
                  >
                    <img
                      src={
                        preview.url
                      }
                      alt=""
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removeFile(
                          index
                        )
                      }
                      aria-label="Quitar foto"
                    >
                      <X
                        size={14}
                      />
                    </button>
                  </div>
                )
              )}
            </div>
          )}

          <div className="alumni-feedback-simple-actions">
            <button
              type="button"
              className="alumni-feedback-simple-photo"
              onClick={() =>
                inputRef.current
                  ?.click()
              }
              disabled={
                files.length >=
                MAX_FILES
              }
            >
              <ImagePlus
                size={18}
              />
              Fotos
              {files.length >
                0 && (
                <span>
                  {files.length}/
                  {MAX_FILES}
                </span>
              )}
            </button>

            <button
              type="button"
              className="alumni-feedback-simple-send"
              disabled={
                !message.trim() ||
                sending
              }
              onClick={() =>
                void sendFeedback()
              }
            >
              <Send
                size={17}
              />
              {sending
                ? "Enviando..."
                : "Enviar"}
            </button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(
              event
            ) =>
              addFiles(
                event.target
                  .files
              )
            }
          />
        </motion.section>
      </main>
    </AppShell>
  );
}

/* ALUMNI_FEEDBACK_SIMPLE_4_0 */
/* ALUMNI_CLEAN_RESET_1_0 */
