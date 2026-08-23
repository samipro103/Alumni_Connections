"use client";

import { useEffect, useState } from "react";
import { Loader2, Maximize2, X } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  className?: string;
  variant?: "avatar" | "banner";
};

type NaturalSize = {
  width: number;
  height: number;
};

export default function HDProfileImage({
  src,
  alt,
  className = "",
  variant = "banner",
}: Props) {
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState(false);
  const [naturalSize, setNaturalSize] = useState<NaturalSize | null>(null);

  useEffect(() => {
    setNaturalSize(null);
  }, [src]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function openViewer() {
    if (opening) return;

    setOpening(true);

    try {
      const image = new Image();
      image.src = src;

      if (!image.complete) {
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error("No se pudo cargar la imagen"));
        });
      }

      if (typeof image.decode === "function") {
        try {
          await image.decode();
        } catch {
          // Ya puede estar decodificada por el navegador.
        }
      }

      setNaturalSize({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    } catch {
      setNaturalSize(null);
    } finally {
      setOpening(false);
      setOpen(true);
    }
  }

  const viewerStyle = naturalSize
    ? {
        width: `min(94vw, ${naturalSize.width}px)`,
        height: "auto",
        maxHeight: variant === "avatar" ? "82vh" : "92vh",
        imageRendering: "auto" as const,
      }
    : {
        width: "auto",
        height: "auto",
        maxWidth: "94vw",
        maxHeight: variant === "avatar" ? "82vh" : "92vh",
        imageRendering: "auto" as const,
      };

  return (
    <>
      <button
        type="button"
        onClick={openViewer}
        disabled={opening}
        className={`group relative block h-full w-full overflow-hidden ${
          variant === "avatar" ? "rounded-full" : ""
        }`}
        aria-label={`Ver ${alt.toLowerCase()}`}
      >
        <img
          src={src}
          alt={alt}
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          draggable={false}
          className={`${className} select-none`}
          style={{ imageRendering: "auto" }}
        />

        <span
          className={`pointer-events-none absolute flex items-center justify-center bg-black/45 text-white opacity-0 backdrop-blur-[2px] transition group-hover:opacity-100 ${
            variant === "avatar"
              ? "inset-0 rounded-full"
              : "bottom-3 right-3 h-9 w-9 rounded-xl"
          }`}
        >
          {opening ? (
            <Loader2
              size={variant === "avatar" ? 18 : 16}
              className="animate-spin"
            />
          ) : (
            <Maximize2 size={variant === "avatar" ? 18 : 16} />
          )}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/[0.94] p-4 backdrop-blur-md sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/15 sm:right-6 sm:top-6"
            aria-label="Cerrar imagen"
          >
            <X size={21} />
          </button>

          <img
            src={src}
            alt={alt}
            loading="eager"
            decoding="sync"
            fetchPriority="high"
            draggable={false}
            onLoad={(event) => {
              const image = event.currentTarget;
              if (!naturalSize && image.naturalWidth && image.naturalHeight) {
                setNaturalSize({
                  width: image.naturalWidth,
                  height: image.naturalHeight,
                });
              }
            }}
            onClick={(event) => event.stopPropagation()}
            className={`object-contain shadow-2xl ${
              variant === "avatar" ? "rounded-[28px]" : "rounded-2xl"
            }`}
            style={viewerStyle}
          />
        </div>
      )}
    </>
  );
}
