"use client";

import { useEffect, useState } from "react";
import { Maximize2, X } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  className?: string;
  variant?: "avatar" | "banner";
};

export default function HDProfileImage({
  src,
  alt,
  className = "",
  variant = "banner",
}: Props) {
  const [open, setOpen] = useState(false);

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group relative block h-full w-full overflow-hidden ${
          variant === "avatar" ? "rounded-full" : ""
        }`}
        aria-label={`Ver ${alt.toLowerCase()} en alta resolución`}
      >
        <img
          src={src}
          alt={alt}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          draggable={false}
          className={`${className} select-none`}
        />

        <span
          className={`pointer-events-none absolute flex items-center justify-center bg-black/45 text-white opacity-0 backdrop-blur-[2px] transition group-hover:opacity-100 ${
            variant === "avatar"
              ? "inset-0 rounded-full"
              : "bottom-3 right-3 h-9 w-9 rounded-xl"
          }`}
        >
          <Maximize2 size={variant === "avatar" ? 18 : 16} />
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/[0.94] p-4 backdrop-blur-md sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} en alta resolución`}
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
            decoding="async"
            draggable={false}
            onClick={(event) => event.stopPropagation()}
            className={`max-h-[92vh] max-w-[96vw] object-contain shadow-2xl ${
              variant === "avatar"
                ? "max-h-[76vh] rounded-[32px]"
                : "rounded-2xl"
            }`}
          />

          <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/55 backdrop-blur-md">
            Imagen original · HD
          </div>
        </div>
      )}
    </>
  );
}
