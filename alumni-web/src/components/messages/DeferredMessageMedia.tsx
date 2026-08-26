"use client";

import {
  Download,
  Eye,
  Image as ImageIcon,
  Loader2,
  Play,
  X,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import {
  supabase,
} from "@/lib/supabase";
import {
  formatMediaSize,
} from "@/lib/messageMedia";

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
  const [menuOpen, setMenuOpen] =
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

  const video =
    mediaType === "video";
  const sizeLabel =
    formatMediaSize(size);

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

  async function viewNow() {
    if (busy) return;

    setBusy("view");
    setError("");

    try {
      const url =
        await signedUrl();

      setViewerUrl(url);
      setMenuOpen(false);
      setViewerOpen(true);
    } catch (cause: any) {
      setError(
        cause?.message ||
          "No se pudo abrir."
      );
    } finally {
      setBusy(null);
    }
  }

  async function saveNow() {
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
        await navigator.share({
          files: [file],
          title:
            "Guardar archivo de Alumni",
        });
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
          1000
        );
      }

      setMenuOpen(false);
    } catch (cause: any) {
      if (
        cause?.name ===
        "AbortError"
      ) {
        return;
      }

      setError(
        cause?.message ||
          "No se pudo guardar."
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
          setMenuOpen(true)
        }
        className="group/media relative block min-h-[150px] w-full overflow-hidden bg-[var(--app-bg-2)] text-left"
        aria-label={
          video
            ? "Abrir video"
            : "Abrir foto"
        }
      >
        {preview ? (
          <img
            src={preview}
            alt=""
            aria-hidden="true"
            className="absolute inset-[-12%] h-[124%] w-[124%] scale-110 object-cover blur-xl saturate-75"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,color-mix(in_srgb,var(--app-accent)_16%,transparent),transparent_42%),linear-gradient(145deg,var(--app-surface-2),var(--app-bg))]" />
        )}

        <div className="absolute inset-0 bg-black/20" />

        <div className="relative flex min-h-[150px] flex-col items-center justify-center gap-2 px-5 py-8 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white backdrop-blur-md">
            {video ? (
              <Play
                size={19}
                fill="currentColor"
              />
            ) : (
              <ImageIcon
                size={19}
              />
            )}
          </span>

          <p className="text-[13px] font-black text-white">
            {video
              ? "Video privado"
              : "Foto privada"}
          </p>

          <p className="text-[10px] font-semibold text-white/65">
            Toca para ver
            {sizeLabel
              ? ` · ${sizeLabel}`
              : ""}
          </p>
        </div>
      </button>

      {menuOpen && (
        <div
          className="fixed inset-0 z-[2147483200] flex items-end justify-center bg-black/72 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          role="dialog"
          aria-modal="true"
          data-pull-refresh-lock="true"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setMenuOpen(
                false
              );
            }
          }}
        >
          <div className="w-full max-w-[430px] rounded-t-[28px] border border-white/[0.08] bg-[var(--app-surface)] p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[28px]">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.13em] text-[var(--app-accent)]">
                  Multimedia privada
                </p>
                <h3 className="mt-1 truncate text-[17px] font-black text-[var(--app-text)]">
                  {name ||
                    (video
                      ? "Video"
                      : "Foto")}
                </h3>
                {sizeLabel && (
                  <p className="mt-1 text-[11px] text-[var(--app-muted-2)]">
                    {sizeLabel}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setMenuOpen(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--app-muted)] hover:bg-[var(--app-soft)]"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mt-4 text-[12px] leading-5 text-[var(--app-muted)]">
              El archivo original no se descarga hasta que tú lo decidas.
            </p>

            {error && (
              <p className="mt-3 text-[11px] font-bold text-red-400">
                {error}
              </p>
            )}

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  void viewNow()
                }
                disabled={
                  Boolean(busy)
                }
                className="flex h-12 items-center justify-center gap-2 rounded-[15px] border border-[var(--app-border)] bg-[var(--app-soft)] text-[12px] font-black text-[var(--app-text)] disabled:opacity-50"
              >
                {busy ===
                "view" ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Eye size={16} />
                )}
                Solo ver
              </button>

              <button
                type="button"
                onClick={() =>
                  void saveNow()
                }
                disabled={
                  Boolean(busy)
                }
                className="alumni-accent-button flex h-12 items-center justify-center gap-2 rounded-[15px] text-[12px] font-black disabled:opacity-50"
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
                Guardar
              </button>
            </div>

            <p className="mt-3 text-center text-[10px] leading-4 text-[var(--app-muted-3)]">
              En teléfonos compatibles se abrirán las opciones nativas del dispositivo.
            </p>
          </div>
        </div>
      )}

      {viewerOpen &&
        viewerUrl && (
          <div
            className="fixed inset-0 z-[2147483300] flex flex-col bg-black"
            role="dialog"
            aria-modal="true"
            data-pull-refresh-lock="true"
          >
            <div className="flex h-14 shrink-0 items-center justify-between px-3 pt-[env(safe-area-inset-top)]">
              <p className="max-w-[75%] truncate text-[12px] font-bold text-white/70">
                {name ||
                  (video
                    ? "Video"
                    : "Foto")}
              </p>

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
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center p-3">
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
                  alt={
                    name ||
                    "Foto"
                  }
                  className="max-h-full max-w-full object-contain"
                />
              )}
            </div>
          </div>
        )}
    </>
  );
}
