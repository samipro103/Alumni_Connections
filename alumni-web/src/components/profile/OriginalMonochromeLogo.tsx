"use client";

import { useState } from "react";

type Props = {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
};

function initials(name?: string | null) {
  const words = String(name || "Alumni")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter(
      (word) =>
        !["universidad", "centro", "de", "del", "la", "el", "y", "en"].includes(
          word.toLowerCase()
        )
    );

  return (words.length ? words : ["A"])
    .slice(0, 3)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export default function OriginalMonochromeLogo({
  src,
  name,
  size = 42,
  className = "",
}: Props) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <span
      className={`alumni-original-logo inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-label={name || "Logo"}
      title={name || undefined}
    >
      {showImage ? (
        <img
          src={src || ""}
          alt=""
          className="alumni-original-logo-image h-full w-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className="font-black tracking-[-0.07em] text-[var(--app-text-soft)]"
          style={{ fontSize: Math.max(8, size * 0.23) }}
        >
          {initials(name)}
        </span>
      )}
    </span>
  );
}
