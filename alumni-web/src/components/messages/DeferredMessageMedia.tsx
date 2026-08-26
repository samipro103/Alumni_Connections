"use client";

import {
  Download,
  Eye,
  Image as ImageIcon,
  Loader2,
  Play,
  Settings2,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  supabase,
} from "@/lib/supabase";
import {
  formatMediaSize,
} from "@/lib/messageMedia";

const MEDIA_PREF_KEY =
  "alumni_media_save_preference_v1";

type MediaPreference =
  | "ask"
  | "view"
  | "save";

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
  name,
  size,
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
  name?:
    | string
    | null;
  size?:
    | number
    | null;
}) {
  const [decisionOpen, setDecisionOpen] =
    useState(false);

  const [viewerOpen, setViewerOpen] =
    useState(false);

  const [viewerUrl, setViewerUrl] =
    useState("");

  const [busy, setBusy] =
    useState<
      "view" | "save" | null
    >(null);

  const [error, setError] =
    useState("");

  const [preference, setPreference] =
    useState<MediaPreference>(
      "ask"
    );

  const mountedRef =
    useRef(false);

  const video =
    mediaType === "video";

  const sizeLabel =
    formatMediaSize(size);

  useEffect(() => {
    mountedRef.current =
      true;

    setPreference(
      readPreference()
    );

    return () => {
      mountedRef.current =
        false;
    };
  }, []);

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
    setPreference(next);

    window.localStorage.setItem(
      MEDIA_PREF_KEY,
      next
    );
  }

  function resetPreference() {
    setPreference("ask");

    window.localStorage.removeItem(
      MEDIA_PREF_KEY
    );

    setDecisionOpen(
      true
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

    return data.signedUrl;
  }

  async function openViewer() {
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
      setDecisionOpen(
        false
      );
      setViewerOpen(
        true
      );
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
    alsoView = false,
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
              "Guardar en dispositivo",
          });
        } catch (cause: any) {
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

      if (
        alsoView &&
        mountedRef.current
      ) {
        const url =
          await signedUrl();

        setViewerUrl(url);
        setViewerOpen(true);
      }

      setDecisionOpen(
        false
      );
    } catch (cause: any) {
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

    const current =
      readPreference();

    setPreference(
      current
    );

    if (
      current === "ask"
    ) {
      setDecisionOpen(
        true
      );
      return;
    }

    if (
      current === "save"
    ) {
      await saveToDevice({
        alsoView: true,
      });
      return;
    }

    await openViewer();
  }

  async function chooseViewOnly() {
    remember("view");
    await openViewer();
  }

  async function chooseSaveAlways() {
    remember("save");

    await saveToDevice({
      alsoView: true,
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() =>
          void handleMediaTap()
        }
        className="group/media relative block min-h-[175px] w-full overflow-hidden bg-[var(--app-surface-2)] text-left"
        aria-label={
          video
            ? "Descargar y ver video"
            : "Descargar y ver foto"
        }
      >
        {preview ? (
          <img
            src={preview}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-110 object-cover blur-[18px] saturate-75 brightness-[0.72]"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,color-mix(in_srgb,var(--app-accent)_18%,transparent),transparent_44%),linear-gradient(145deg,var(--app-surface-2),var(--app-bg))]" />
        )}

        <div className="absolute inset-0 bg-black/18" />

        <div className="relative flex min-h-[175px] flex-col items-center justify-center gap-2 px-5 py-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/42 text-white shadow-[0_10px_30px_rgba(0,0,0,.25)] backdrop-blur-md transition group-active/media:scale-95">
            {busy ? (
              <Loader2
                size={19}
                className="animate-spin"
              />
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

          <p className="text-[13px] font-black text-white">
            {video
              ? "Video"
              : "Foto"}
          </p>

          <p className="text-[10px] font-semibold text-white/70">
            Toca para descargar
            {sizeLabel
              ? ` · ${sizeLabel}`
              : ""}
          </p>
        </div>
      </button>

      {decisionOpen && (
        <div
          className="fixed inset-0 z-[2147483200] flex items-end justify-center bg-black/72 backdrop-blur-md sm:items-center sm:p-5"
          role="dialog"
          aria-modal="true"
          data-pull-refresh-lock="true"
        >
          <div className="w-full max-w-[440px] rounded-t-[30px] border border-white/[0.08] bg-[var(--app-surface)] p-5 pb-[max(22px,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[30px]">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                <Download
                  size={18}
                />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-[18px] font-black tracking-[-0.025em] text-[var(--app-text)]">
                  Fotos y videos
                </h3>

                <p className="mt-1 text-[12px] leading-5 text-[var(--app-muted)]">
                  ¿Quieres que los archivos que abras se guarden también en tu dispositivo?
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
              <p className="mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-[11px] font-bold text-red-400">
                {error}
              </p>
            )}

            <div className="mt-6 space-y-2">
              <button
                type="button"
                onClick={() =>
                  void chooseSaveAlways()
                }
                disabled={
                  Boolean(busy)
                }
                className="alumni-accent-button flex h-13 w-full items-center justify-center gap-2 rounded-[16px] text-[13px] font-black disabled:opacity-50"
              >
                {busy ===
                "save" ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Download
                    size={16}
                  />
                )}
                Guardar automáticamente
              </button>

              <button
                type="button"
                onClick={() =>
                  void chooseViewOnly()
                }
                disabled={
                  Boolean(busy)
                }
                className="flex h-13 w-full items-center justify-center gap-2 rounded-[16px] border border-[var(--app-border)] bg-[var(--app-soft)] text-[13px] font-black text-[var(--app-text)] disabled:opacity-50"
              >
                {busy ===
                "view" ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Eye
                    size={16}
                  />
                )}
                Solo ver
              </button>
            </div>

            <p className="mt-4 text-center text-[10px] leading-4 text-[var(--app-muted-3)]">
              Puedes cambiar esta decisión desde cualquier foto o video abierto.
            </p>
          </div>
        </div>
      )}

      {viewerOpen &&
        viewerUrl && (
          <div
            className="fixed inset-0 z-[2147483300] overflow-hidden bg-black"
            role="dialog"
            aria-modal="true"
            data-pull-refresh-lock="true"
          >
            {!video && (
              <>
                <img
                  src={viewerUrl}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-[-8%] h-[116%] w-[116%] scale-110 object-cover blur-[42px] brightness-[0.42] saturate-75"
                />
                <div className="absolute inset-0 bg-black/24" />
              </>
            )}

            {video && (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--app-accent)_8%,black),black_72%)]" />
            )}

            <div className="relative z-10 flex h-full flex-col">
              <header className="flex min-h-[58px] shrink-0 items-center gap-2 px-3 pt-[env(safe-area-inset-top)]">
                <button
                  type="button"
                  onClick={() => {
                    setViewerOpen(
                      false
                    );
                    setViewerUrl(
                      ""
                    );
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>

                <p className="min-w-0 flex-1 truncate text-[12px] font-bold text-white/75">
                  {name ||
                    (video
                      ? "Video"
                      : "Foto")}
                </p>

                <button
                  type="button"
                  onClick={
                    resetPreference
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md"
                  aria-label="Cambiar preferencia de descarga"
                  title="Preferencia de descarga"
                >
                  <Settings2
                    size={17}
                  />
                </button>
              </header>

              <div className="flex min-h-0 flex-1 items-center justify-center px-2 pb-[max(8px,env(safe-area-inset-bottom))]">
                {video ? (
                  <video
                    src={viewerUrl}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-full max-w-full rounded-[10px] object-contain"
                  />
                ) : (
                  <img
                    src={viewerUrl}
                    alt={
                      name ||
                      "Foto"
                    }
                    className="max-h-full max-w-full object-contain drop-shadow-[0_20px_60px_rgba(0,0,0,.35)]"
                  />
                )}
              </div>
            </div>
          </div>
        )}
    </>
  );
}
