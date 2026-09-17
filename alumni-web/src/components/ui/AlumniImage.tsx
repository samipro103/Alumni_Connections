"use client";

import {
  useEffect,
  useRef,
  useState,
  type ImgHTMLAttributes,
  type ReactNode,
} from "react";
import { ImageOff } from "lucide-react";
import { toPublicImageCdnUrl } from "@/lib/imageCdn";

const loadedSources =
  new Set<string>();

type ImageStatus =
  | "loading"
  | "loaded"
  | "error";

type ImageLoadState = {
  source: string;
  status: ImageStatus;
};

type AlumniImageProps =
  Omit<
    ImgHTMLAttributes<HTMLImageElement>,
    "src"
  > & {
    src?: string | null;
    shellClassName?: string;
    fallback?: ReactNode;
    priority?: boolean;
  };

function getInitialStatus(
  source: string
): ImageStatus {
  if (!source) {
    return "error";
  }

  return loadedSources.has(source)
    ? "loaded"
    : "loading";
}

export default function AlumniImage({
  src,
  alt = "",
  className = "",
  shellClassName = "",
  fallback,
  priority = false,
  loading,
  decoding = "async",
  fetchPriority,
  onLoad,
  onError,
  ...rest
}: AlumniImageProps) {
  const rawSource =
    typeof src === "string"
      ? src.trim()
      : "";

  const source =
    toPublicImageCdnUrl(
      rawSource
    );

  const [
    loadState,
    setLoadState,
  ] =
    useState<ImageLoadState>(
      () => ({
        source,
        status:
          getInitialStatus(
            source
          ),
      })
    );

  const state =
    loadState.source === source
      ? loadState.status
      : getInitialStatus(
          source
        );

  const imageRef =
    useRef<HTMLImageElement>(
      null
    );

  useEffect(() => {
    if (!source) {
      return;
    }

    const commitStatus = (
      status: ImageStatus
    ) => {
      setLoadState(
        (current) => {
          if (
            current.source ===
              source &&
            current.status ===
              status
          ) {
            return current;
          }

          return {
            source,
            status,
          };
        }
      );
    };

    const syncState = () => {
      const current =
        imageRef.current;

      if (!current) {
        return;
      }

      if (!current.complete) {
        commitStatus(
          "loading"
        );
        return;
      }

      if (
        current.naturalWidth >
        0
      ) {
        loadedSources.add(
          source
        );
        commitStatus(
          "loaded"
        );
      } else {
        commitStatus(
          "error"
        );
      }
    };

    const frame =
      window.requestAnimationFrame(
        syncState
      );

    const timer =
      window.setTimeout(
        syncState,
        80
      );

    const handleVisible =
      () => {
        if (
          document
            .visibilityState ===
          "visible"
        ) {
          syncState();
        }
      };

    window.addEventListener(
      "pageshow",
      syncState
    );

    document.addEventListener(
      "visibilitychange",
      handleVisible
    );

    return () => {
      window.cancelAnimationFrame(
        frame
      );

      window.clearTimeout(
        timer
      );

      window.removeEventListener(
        "pageshow",
        syncState
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisible
      );
    };
  }, [source]);

  return (
    <span
      className={`alumni-image-shell ${shellClassName}`}
      data-image-state={state}
    >
      {source ? (
        <>
          {/* Native img is intentional: this shared layer accepts dynamic CDN/external sources. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            {...rest}
            src={source}
            alt={alt}
            loading={
              priority
                ? "eager"
                : loading ||
                  "lazy"
            }
            decoding={
              decoding
            }
            fetchPriority={
              priority
                ? "high"
                : fetchPriority
            }
            draggable={
              rest.draggable ??
              false
            }
            className={`alumni-image-element ${className}`}
            onLoad={(
              event
            ) => {
              loadedSources.add(
                source
              );

              setLoadState({
                source,
                status:
                  "loaded",
              });

              onLoad?.(
                event
              );
            }}
            onError={(
              event
            ) => {
              setLoadState({
                source,
                status:
                  "error",
              });

              onError?.(
                event
              );
            }}
          />
        </>
      ) : null}

      {state ===
        "loading" && (
        <span
          className="alumni-image-shimmer"
          aria-hidden="true"
        />
      )}

      {state ===
        "error" && (
        <span
          className="alumni-image-fallback"
          aria-hidden="true"
        >
          {fallback ?? (
            <ImageOff
              size={18}
              strokeWidth={
                1.8
              }
            />
          )}
        </span>
      )}
    </span>
  );
}

export function AlumniAvatar({
  src,
  name,
  alt,
  className = "",
  imageClassName = "",
  fallbackClassName = "",
  priority = false,
}: {
  src?: string | null;
  name?: string | null;
  alt?: string;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  priority?: boolean;
}) {
  const cleanName =
    String(name || "")
      .replace(/^@/, "")
      .trim();

  const initial =
    Array.from(
      cleanName
    )[0]?.toUpperCase() ||
    "A";

  const resolvedAlt =
    alt !== undefined
      ? alt
      : cleanName
        ? `Avatar de ${cleanName}`
        : "Avatar";

  return (
    <AlumniImage
      src={src}
      alt={resolvedAlt}
      priority={priority}
      shellClassName={`alumni-avatar-image ${className}`}
      className={`h-full w-full object-cover ${imageClassName}`}
      fallback={
        <span
          className={`alumni-avatar-fallback ${fallbackClassName}`}
        >
          {initial}
        </span>
      }
    />
  );
}

/* ALUMNI_2_9_0_IMAGE_LAYER */

/* ALUMNI_2_9_2_PUBLIC_IMAGE_CDN:ALUMNI_IMAGE */

/* ALUMNI_FEED_IMAGE_RETURN_FIX_1_0:ALUMNI_IMAGE */