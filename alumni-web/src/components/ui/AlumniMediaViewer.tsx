"use client";

import {
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { toPublicImageCdnUrl } from "@/lib/imageCdn";

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
  const [mounted, setMounted] =
    useState(false);

  const resolvedSrc =
    type === "image"
      ? toPublicImageCdnUrl(src)
      : src;

  useEffect(() => {
    setMounted(true);

    return () => {
      setMounted(false);
    };
  }, []);

  useEffect(() => {
    if (!mounted || !resolvedSrc) return;

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
  }, [mounted, resolvedSrc, onClose]);

  if (
    !mounted ||
    !resolvedSrc ||
    typeof document === "undefined"
  ) {
    return null;
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Visor de contenido"
      onPointerDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483646,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "auto",
        background:
          "rgba(3,4,5,.98)",
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar visor"
        title="Cerrar"
        style={{
          position: "fixed",
          top:
            "max(14px, env(safe-area-inset-top))",
          right:
            "max(14px, env(safe-area-inset-right))",
          zIndex: 2147483647,
          width: 42,
          height: 42,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          border:
            "1px solid rgba(255,255,255,.14)",
          borderRadius: "999px",
          background:
            "rgba(15,17,21,.72)",
          color:
            "rgba(255,255,255,.94)",
          boxShadow:
            "0 8px 28px rgba(0,0,0,.32)",
          backdropFilter:
            "blur(14px)",
          WebkitBackdropFilter:
            "blur(14px)",
          cursor: "pointer",
          WebkitTapHighlightColor:
            "transparent",
        }}
      >
        <X
          size={20}
          strokeWidth={2.15}
          aria-hidden="true"
        />
      </button>

      {type === "video" ? (
        <video
          src={src}
          controls
          autoPlay
          playsInline
          style={{
            display: "block",
            width: "auto",
            maxWidth: "100vw",
            maxHeight: "100dvh",
            objectFit: "contain",
            background: "#000",
          }}
        />
      ) : (
        <img
          src={resolvedSrc}
          alt={alt}
          draggable={false}
          style={{
            display: "block",
            width: "auto",
            height: "auto",
            maxWidth: "100vw",
            maxHeight: "100dvh",
            margin: "auto",
            objectFit: "contain",
            userSelect: "none",
          }}
        />
      )}
    </div>,
    document.body
  );
}

/* ALUMNI_2_9_0_MEDIA_VIEWER */

/* ALUMNI_2_9_2_PUBLIC_IMAGE_CDN:MEDIA_VIEWER */

/* ALUMNI_3_1_2A_SAFE_PRODUCT_FLOWS */
