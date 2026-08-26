"use client";

import {
  Download,
  Eye,
  Flag,
  Loader2,
  MoreHorizontal,
  Play,
  Share2,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useAuth,
} from "@/components/auth/AuthProvider";
import ForwardMessageMediaModal from "@/components/messages/ForwardMessageMediaModal";
import {
  supabase,
} from "@/lib/supabase";
import {
  formatMediaSize,
} from "@/lib/messageMedia";

const MEDIA_PREF_KEY =
  "alumni_media_save_preference_v2";

type MediaPreference =
  | "ask"
  | "view"
  | "save";

type OpenedMediaEntry = {
  url: string;
  expiresAt: number;
};

const openedMediaCache =
  new Map<string, OpenedMediaEntry>();


function readPreference(): MediaPreference {
  if (
    typeof window ===
    "undefined"
  ) {
    return "ask";
  }

  const value =
    window.localStorage.getItem(
      MEDIA_PREF_KEY
    );

  return value ===
    "save" ||
    value === "view"
    ? value
    : "ask";
}

export default function DeferredMessageMedia({
  bucket,
  path,
  preview,
  mediaType,
  mediaMime,
  name,
  size,
  messageId,
  senderId,
  reportType = "message",
}: {
  bucket: string;
  path:
    | string
    | null
    | undefined;
  preview?:
    | string
    | null;
  mediaType?:
    | string
    | null;
  mediaMime?:
    | string
    | null;
  name?:
    | string
    | null;
  size?:
    | number
    | null;
  messageId?:
    | number
    | string
    | null;
  senderId?:
    | string
    | null;
  reportType?:
    | "message"
    | "group_message";
}) {
  const { user } =
    useAuth();

  const [
    decisionOpen,
    setDecisionOpen,
  ] = useState(false);

  const [
    viewerOpen,
    setViewerOpen,
  ] = useState(false);

  const [
    viewerUrl,
    setViewerUrl,
  ] = useState("");

  const [
    viewerMenuOpen,
    setViewerMenuOpen,
  ] = useState(false);

  const [
    forwardOpen,
    setForwardOpen,
  ] = useState(false);

  const [busy, setBusy] =
    useState<
      "view" | "save" | "report" | null
    >(null);

  const [error, setError] =
    useState("");

  const [
    inlineUrl,
    setInlineUrl,
  ] = useState("");

  const [
    previewRatio,
    setPreviewRatio,
  ] = useState(4 / 3);

  const mountedRef =
    useRef(false);

  const video =
    mediaType ===
    "video";

  const sizeLabel =
    formatMediaSize(size);

  const naturalRatio =
    Number.isFinite(
      previewRatio
    ) &&
    previewRatio > 0
      ? previewRatio
      : 4 / 3;

  /*
   * WhatsApp-like media box:
   * the media itself defines the shape.
   * 320px max width / 410px max height.
   */
  const displayWidthPx =
    Math.max(
      118,
      Math.min(
        320,
        Math.round(
          410 *
            naturalRatio
        )
      )
    );

  const displayWidth =
    `min(${displayWidthPx}px, 78vw)`;

  function rememberRatio(
    width: number,
    height: number
  ) {
    if (
      width > 0 &&
      height > 0
    ) {
      setPreviewRatio(
        width / height
      );
    }
  }

  useEffect(() => {
    mountedRef.current =
      true;

    if (path) {
      const key =
        `${bucket}:${path}`;

      const cached =
        openedMediaCache.get(
          key
        );

      if (
        cached &&
        cached.expiresAt >
          Date.now()
      ) {
        setInlineUrl(
          cached.url
        );
      } else if (cached) {
        openedMediaCache.delete(
          key
        );
      }
    }

    return () => {
      mountedRef.current =
        false;
    };
  }, [
    bucket,
    path,
  ]);

  useEffect(() => {
    return () => {
      if (
        viewerUrl.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          viewerUrl
        );
      }
    };
  }, [viewerUrl]);

  function remember(
    next: Exclude<
      MediaPreference,
      "ask"
    >
  ) {
    window.localStorage.setItem(
      MEDIA_PREF_KEY,
      next
    );
  }

  async function signedUrl() {
    if (!path) {
      throw new Error(
        "Archivo no disponible."
      );
    }

    const {
      data,
      error:
        signedError,
    } =
      await supabase.storage
        .from(bucket)
        .createSignedUrl(
          path,
          10 * 60
        );

    if (
      signedError ||
      !data?.signedUrl
    ) {
      throw (
        signedError ||
        new Error(
          "No se pudo abrir el archivo."
        )
      );
    }

    const signed =
      data.signedUrl;

    if (path) {
      openedMediaCache.set(
        `${bucket}:${path}`,
        {
          url: signed,
          expiresAt:
            Date.now() +
            9 * 60 * 1000,
        }
      );
    }

    return signed;
  }

  async function openViewer() {
    if (busy) return;

    setBusy("view");
    setError("");

    try {
      const url =
        await signedUrl();

      if (
        !mountedRef.current
      ) {
        return;
      }

      setViewerUrl(url);
      setInlineUrl(url);
      setDecisionOpen(
        false
      );
      setViewerOpen(true);
    } catch (cause: any) {
      setError(
        cause?.message ||
          "No se pudo abrir."
      );
    } finally {
      if (
        mountedRef.current
      ) {
        setBusy(null);
      }
    }
  }

  async function saveToDevice({
    alsoView = false
  } = {}) {
    if (
      busy ||
      !path
    ) {
      return;
    }

    setBusy("save");
    setError("");

    try {
      const {
        data,
        error:
          downloadError,
      } =
        await supabase.storage
          .from(bucket)
          .download(path);

      if (
        downloadError ||
        !data
      ) {
        throw (
          downloadError ||
          new Error(
            "No se pudo descargar."
          )
        );
      }

      const safeName =
        name ||
        `${video
          ? "video"
          : "foto"}-${Date.now()}${
          video
            ? ".mp4"
            : ".jpg"
        }`;

      const file =
        new File(
          [data],
          safeName,
          {
            type:
              data.type ||
              mediaMime ||
              (video
                ? "video/mp4"
                : "image/jpeg"),
          }
        );

      const canNativeShare =
        typeof navigator !==
          "undefined" &&
        typeof navigator.share ===
          "function" &&
        typeof navigator.canShare ===
          "function" &&
        navigator.canShare({
          files: [file],
        });

      if (canNativeShare) {
        try {
          await navigator.share({
            files: [file],
            title:
              "Guardar archivo",
          });
        } catch (
          cause: any
        ) {
          if (
            cause?.name !==
            "AbortError"
          ) {
            throw cause;
          }
        }
      } else {
        const url =
          URL.createObjectURL(
            data
          );

        const anchor =
          document.createElement(
            "a"
          );

        anchor.href = url;
        anchor.download =
          safeName;

        document.body.appendChild(
          anchor
        );
        anchor.click();
        anchor.remove();

        window.setTimeout(
          () =>
            URL.revokeObjectURL(
              url
            ),
          1500
        );
      }

      if (alsoView) {
        const url =
          await signedUrl();

        if (
          mountedRef.current
        ) {
          setViewerUrl(url);
          setInlineUrl(url);
          setViewerOpen(true);
        }
      }

      setDecisionOpen(
        false
      );
      setViewerMenuOpen(
        false
      );
    } catch (
      cause: any
    ) {
      if (
        cause?.name !==
        "AbortError"
      ) {
        setError(
          cause?.message ||
            "No se pudo guardar."
        );
      }
    } finally {
      if (
        mountedRef.current
      ) {
        setBusy(null);
      }
    }
  }

  async function handleMediaTap() {
    if (
      busy ||
      !path
    ) {
      return;
    }

    const preference =
      readPreference();

    if (
      preference ===
      "ask"
    ) {
      setDecisionOpen(
        true
      );
      return;
    }

    if (
      preference ===
      "save"
    ) {
      await saveToDevice({
        alsoView: true,
      });
      return;
    }

    await openViewer();
  }

  async function chooseSave() {
    remember("save");

    await saveToDevice({
      alsoView: true,
    });
  }

  async function chooseNowNot() {
    remember("view");
    await openViewer();
  }

  async function reportContent() {
    if (
      !user ||
      !messageId ||
      !senderId ||
      senderId === user.id
    ) {
      setViewerMenuOpen(
        false
      );
      return;
    }

    if (
      !confirm(
        "¿Reportar este contenido para revisión?"
      )
    ) {
      return;
    }

    setBusy("report");

    try {
      const {
        error,
      } =
        await supabase
          .from(
            "user_reports"
          )
          .insert({
            reporter_id:
              user.id,
            target_user_id:
              senderId,
            target_type:
              reportType,
            target_id:
              String(
                messageId
              ),
            reason:
              "inappropriate",
            details:
              "Contenido multimedia reportado desde Mensajes.",
          });

      if (error) {
        throw error;
      }

      setViewerMenuOpen(
        false
      );

      alert(
        "Reporte enviado. Gracias."
      );
    } catch (
      cause: any
    ) {
      alert(
        cause?.message ||
          "No se pudo enviar el reporte."
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() =>
          void handleMediaTap()
        }
        className="group/media relative block max-w-full overflow-hidden rounded-[14px] bg-transparent text-left"
        style={{
          width:
            displayWidth,
        }}
        aria-label={
          video
            ? "Ver video"
            : "Ver foto"
        }
      >
        <div className="relative overflow-hidden rounded-[14px]">
          {inlineUrl ? (
            video ? (
              <>
                {preview && (
                  <img
                    src={preview}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}

                <video
                  src={inlineUrl}
                  muted
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={(
                    event
                  ) =>
                    rememberRatio(
                      event.currentTarget
                        .videoWidth,
                      event.currentTarget
                        .videoHeight
                    )
                  }
                  className="relative block h-auto max-h-[410px] w-full object-contain"
                />
              </>
            ) : (
              <img
                src={inlineUrl}
                alt="Foto"
                onLoad={(
                  event
                ) =>
                  rememberRatio(
                    event.currentTarget
                      .naturalWidth,
                    event.currentTarget
                      .naturalHeight
                  )
                }
                className="block h-auto max-h-[410px] w-full object-contain"
              />
            )
          ) : preview ? (
            <img
              src={preview}
              alt=""
              aria-hidden="true"
              onLoad={(
                event
              ) =>
                rememberRatio(
                  event.currentTarget
                    .naturalWidth,
                  event.currentTarget
                    .naturalHeight
                )
              }
              className="block h-auto w-full object-contain blur-[13px] saturate-75 brightness-[0.74]"
            />
          ) : (
            <div className="aspect-[4/3] w-full bg-[var(--app-soft-strong)]" />
          )}

          {!inlineUrl && (
            <div className="pointer-events-none absolute inset-0 bg-black/10" />
          )}

          <span
            className={`absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/46 text-white shadow-[0_8px_28px_rgba(0,0,0,.24)] backdrop-blur-sm transition group-active/media:scale-95 ${
              inlineUrl &&
              !video
                ? "opacity-0 group-hover/media:opacity-100"
                : ""
            }`}
          >
            {busy ? (
              <Loader2
                size={19}
                className="animate-spin"
              />
            ) : inlineUrl ? (
              video ? (
                <Play
                  size={19}
                  fill="currentColor"
                />
              ) : (
                <Eye
                  size={18}
                />
              )
            ) : video ? (
              <Play
                size={19}
                fill="currentColor"
              />
            ) : (
              <Download
                size={18}
              />
            )}
          </span>

          {!inlineUrl &&
            sizeLabel && (
              <span className="absolute bottom-2 right-2 rounded-full bg-black/42 px-2 py-1 text-[9px] font-black text-white/85 backdrop-blur-sm">
                {sizeLabel}
              </span>
            )}
        </div>
      </button>

      {decisionOpen && (
        <div
          className="fixed inset-0 z-[2147483200] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-5"
          role="dialog"
          aria-modal="true"
          data-pull-refresh-lock="true"
        >
          <div className="w-full max-w-[430px] rounded-t-[28px] bg-[var(--app-surface)] p-5 pb-[max(22px,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[28px]">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-[18px] font-black text-[var(--app-text)]">
                  Guardar fotos y videos
                </h3>

                <p className="mt-2 text-[12px] leading-5 text-[var(--app-muted)]">
                  ¿Quieres que los archivos que abras también se guarden en tu dispositivo?
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setDecisionOpen(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--app-muted)] hover:bg-[var(--app-soft)]"
              >
                <X size={16} />
              </button>
            </div>

            {error && (
              <p className="mt-3 text-[11px] font-bold text-red-400">
                {error}
              </p>
            )}

            <div className="mt-6 space-y-2">
              <button
                type="button"
                onClick={() =>
                  void chooseSave()
                }
                disabled={
                  Boolean(busy)
                }
                className="alumni-accent-button flex h-12 w-full items-center justify-center gap-2 rounded-[15px] text-[13px] font-black disabled:opacity-50"
              >
                <Download
                  size={16}
                />
                Sí, guardar
              </button>

              <button
                type="button"
                onClick={() =>
                  void chooseNowNot()
                }
                disabled={
                  Boolean(busy)
                }
                className="flex h-12 w-full items-center justify-center rounded-[15px] bg-[var(--app-soft)] text-[13px] font-black text-[var(--app-text)] disabled:opacity-50"
              >
                Ahora no
              </button>
            </div>

            <p className="mt-4 text-center text-[10px] leading-4 text-[var(--app-muted-3)]">
              Esta pregunta aparece solo una vez.
            </p>
          </div>
        </div>
      )}

      {viewerOpen &&
        viewerUrl && (
          <div
            className="fixed inset-0 z-[2147483300] flex flex-col bg-[var(--app-bg)]"
            role="dialog"
            aria-modal="true"
            data-pull-refresh-lock="true"
          >
            <header className="relative z-20 flex min-h-[58px] shrink-0 items-center gap-2 border-b border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_94%,transparent)] px-3 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
              <button
                type="button"
                onClick={() => {
                  setViewerOpen(
                    false
                  );
                  setViewerUrl(
                    ""
                  );
                  setViewerMenuOpen(
                    false
                  );
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--app-text)] hover:bg-[var(--app-soft)]"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>

              <div className="min-w-0 flex-1" />

              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setViewerMenuOpen(
                      (value) =>
                        !value
                    )
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--app-text)] hover:bg-[var(--app-soft)]"
                  aria-label="Opciones"
                >
                  <MoreHorizontal
                    size={20}
                  />
                </button>

                {viewerMenuOpen && (
                  <div className="absolute right-0 top-11 z-30 w-52 overflow-hidden rounded-[16px] bg-[var(--app-surface)] p-1.5 shadow-[0_18px_55px_var(--app-shadow)] ring-1 ring-[var(--app-border)]">
                    <button
                      type="button"
                      onClick={() =>
                        void saveToDevice()
                      }
                      disabled={
                        Boolean(busy)
                      }
                      className="flex w-full items-center gap-3 rounded-[12px] px-3 py-3 text-left text-[12px] font-bold text-[var(--app-text)] hover:bg-[var(--app-soft)]"
                    >
                      <Download
                        size={15}
                      />
                      {video
                        ? "Guardar video"
                        : "Guardar foto"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setViewerMenuOpen(
                          false
                        );
                        setForwardOpen(
                          true
                        );
                      }}
                      className="flex w-full items-center gap-3 rounded-[12px] px-3 py-3 text-left text-[12px] font-bold text-[var(--app-text)] hover:bg-[var(--app-soft)]"
                    >
                      <Share2
                        size={15}
                      />
                      {video
                        ? "Reenviar video"
                        : "Reenviar foto"}
                    </button>

                    {senderId &&
                      senderId !==
                        user?.id && (
                        <button
                          type="button"
                          onClick={() =>
                            void reportContent()
                          }
                          disabled={
                            busy ===
                            "report"
                          }
                          className="flex w-full items-center gap-3 rounded-[12px] px-3 py-3 text-left text-[12px] font-bold text-red-400 hover:bg-red-500/10"
                        >
                          <Flag
                            size={15}
                          />
                          Reportar contenido
                        </button>
                      )}
                  </div>
                )}
              </div>
            </header>

            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-0 sm:p-4">
              {video ? (
                <video
                  src={viewerUrl}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <img
                  src={viewerUrl}
                  alt="Foto"
                  className="block max-h-full max-w-full object-contain"
                />
              )}
            </div>
          </div>
        )}

      {path && (
        <ForwardMessageMediaModal
          open={forwardOpen}
          onClose={() =>
            setForwardOpen(
              false
            )
          }
          bucket={bucket}
          path={path}
          preview={preview}
          mediaType={
            video
              ? "video"
              : "image"
          }
          mediaMime={
            mediaMime
          }
          name={name}
          size={size}
        />
      )}
    </>
  );
}

/* ALUMNI_1_3_3_MEDIA_ASPECT_POLISH */

/* ALUMNI_1_3_4_MEDIA_NATURAL_FORMAT */

/* ALUMNI_1_3_5_MEDIA_LAYOUT_FIX */
