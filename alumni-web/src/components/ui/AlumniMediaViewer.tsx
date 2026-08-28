"use client";

import {
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    setMounted(true);

    return () => {
      setMounted(false);
    };
  }, []);

  useEffect(() => {
    if (!mounted || !src) return;

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
  }, [mounted, src, onClose]);

  if (
    !mounted ||
    !src ||
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
          width: 52,
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          border:
            "2px solid rgba(255,255,255,.92)",
          borderRadius: "999px",
          background:
            "rgba(0,0,0,.84)",
          color: "#fff",
          boxShadow:
            "0 10px 34px rgba(0,0,0,.55)",
          cursor: "pointer",
          WebkitTapHighlightColor:
            "transparent",
        }}
      >
        <X
          size={28}
          strokeWidth={2.8}
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
          src={src}
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
