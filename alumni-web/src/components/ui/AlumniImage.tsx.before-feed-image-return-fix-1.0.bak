"use client";

import {
  useEffect,
  useState,
  type ImgHTMLAttributes,
  type ReactNode,
} from "react";
import { ImageOff } from "lucide-react";
import { toPublicImageCdnUrl } from "@/lib/imageCdn";

const loadedSources =
  new Set<string>();

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

  const initialState =
    !source
      ? "error"
      : loadedSources.has(source)
      ? "loaded"
      : "loading";

  const [state, setState] =
    useState<
      "loading" | "loaded" | "error"
    >(initialState);

  useEffect(() => {
    if (!source) {
      setState("error");
      return;
    }

    setState(
      loadedSources.has(source)
        ? "loaded"
        : "loading"
    );
  }, [source]);

  return (
    <span
      className={`alumni-image-shell ${shellClassName}`}
      data-image-state={state}
    >
      {source ? (
        <img
          {...rest}
          src={source}
          alt={alt}
          loading={
            priority
              ? "eager"
              : loading || "lazy"
          }
          decoding={decoding}
          fetchPriority={
            priority
              ? "high"
              : fetchPriority
          }
          draggable={
            rest.draggable ?? false
          }
          className={`alumni-image-element ${className}`}
          onLoad={(event) => {
            loadedSources.add(source);
            setState("loaded");
            onLoad?.(event);
          }}
          onError={(event) => {
            setState("error");
            onError?.(event);
          }}
        />
      ) : null}

      {state === "loading" && (
        <span
          className="alumni-image-shimmer"
          aria-hidden="true"
        />
      )}

      {state === "error" && (
        <span
          className="alumni-image-fallback"
          aria-hidden="true"
        >
          {fallback ?? (
            <ImageOff
              size={18}
              strokeWidth={1.8}
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
    Array.from(cleanName)[0]
      ?.toUpperCase() || "A";

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
