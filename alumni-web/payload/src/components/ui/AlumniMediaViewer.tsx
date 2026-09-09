"use client";

import {
  useEffect,
} from "react";
import { X } from "lucide-react";

export default function AlumniMediaViewer({
  src,
  type = "image",
  alt = "Contenido ampliado",
  onClose,
}: {
  src: string;
  type?: "image" | "video";
  alt?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const previous =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function keyDown(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener(
      "keydown",
      keyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        keyDown
      );
      document.body.style.overflow =
        previous;
    };
  }, [onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[2147483500] flex items-center justify-center overflow-auto bg-[#030405]/[.97]"
      role="dialog"
      aria-modal="true"
      aria-label="Visor de contenido"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar visor"
        title="Cerrar"
        className="fixed right-[14px] z-[2147483600] flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/75 text-white shadow-[0_10px_32px_rgba(0,0,0,.38)] backdrop-blur-xl transition hover:bg-black/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        style={{
          top:
            "max(14px, env(safe-area-inset-top))",
        }}
      >
        <X
          size={25}
          strokeWidth={2.4}
        />
      </button>

      {type === "video" ? (
        <video
          src={src}
          controls
          autoPlay
          playsInline
          className="block max-h-[100dvh] w-auto max-w-[100vw] bg-black object-contain"
        />
      ) : (
        <img
          src={src}
          alt={alt}
          className="m-auto block h-auto max-h-[100dvh] w-auto max-w-[100vw] select-none object-contain"
          draggable={false}
        />
      )}
    </div>
  );
}

/* ALUMNI_2_8_0_MEDIA_VIEWER */
