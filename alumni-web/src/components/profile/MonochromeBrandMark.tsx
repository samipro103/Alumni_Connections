"use client"

import React from "react"
import { findUniversity } from "@/data/academicCatalog"

type Props = {
  name?: string | null
  kind?: "university" | "program"
  size?: number
  className?: string
}

const paths = {
  shield: "M12 2.7 19 5.5v5.1c0 4.7-2.8 8.7-7 10.7-4.2-2-7-6-7-10.7V5.5l7-2.8Z",
  circle: "M12 3.2a8.8 8.8 0 1 0 0 17.6 8.8 8.8 0 0 0 0-17.6Z",
  diamond: "M12 2.8 21.2 12 12 21.2 2.8 12 12 2.8Z",
  arch: "M4.5 20V11.5C4.5 6.8 7.5 3 12 3s7.5 3.8 7.5 8.5V20h-4v-8.2c0-2.4-1.4-4.4-3.5-4.4s-3.5 2-3.5 4.4V20h-4Z",
  hex: "M7.2 3.7h9.6l4.8 8.3-4.8 8.3H7.2L2.4 12l4.8-8.3Z",
  book: "M4 4.5c3.4-.8 5.9-.2 8 1.4 2.1-1.6 4.6-2.2 8-1.4V19c-3.2-.7-5.7-.1-8 1.6-2.3-1.7-4.8-2.3-8-1.6V4.5Z"
}

function initials(name?: string | null) {
  if (!name) return "A"
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
  const important = words.filter((w) => !["de", "del", "la", "el", "y", "en"].includes(w.toLowerCase()))
  const base = important.length ? important : words
  return base.slice(0, 3).map((w) => w[0]?.toUpperCase()).join("")
}

export default function MonochromeBrandMark({
  name,
  kind = "university",
  size = 38,
  className = ""
}: Props) {
  const university = kind === "university" ? findUniversity(name) : null
  const mark = university?.mark ?? (kind === "program" ? "circle" : "shield")
  const label = university?.shortName ?? initials(name)

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center text-current ${className}`}
      style={{ width: size, height: size }}
      aria-label={name || "Marca"}
      title={name || undefined}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        aria-hidden="true"
      >
        <path d={paths[mark]} stroke="currentColor" strokeWidth="1.45" />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-semibold tracking-[-0.04em]"
        style={{ fontSize: Math.max(7, size * 0.21) }}
      >
        {label}
      </span>
    </span>
  )
}
