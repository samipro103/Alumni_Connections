"use client";

import React from "react";
import {
  findUniversity,
  normalizeAcademicText,
  type AcademicMark,
} from "@/data/academicCatalog";

type Props = {
  name?: string | null;
  kind?: "university" | "program";
  size?: number;
  className?: string;
};

const paths: Record<AcademicMark, string> = {
  shield: "M12 2.7 19 5.5v5.1c0 4.7-2.8 8.7-7 10.7-4.2-2-7-6-7-10.7V5.5l7-2.8Z",
  circle: "M12 3.2a8.8 8.8 0 1 0 0 17.6 8.8 8.8 0 0 0 0-17.6Z",
  diamond: "M12 2.8 21.2 12 12 21.2 2.8 12 12 2.8Z",
  arch: "M4.7 20V11.4C4.7 6.7 7.6 3 12 3s7.3 3.7 7.3 8.4V20M8.5 20v-8.1c0-2.5 1.4-4.4 3.5-4.4s3.5 1.9 3.5 4.4V20",
  hex: "M7.2 3.7h9.6l4.8 8.3-4.8 8.3H7.2L2.4 12l4.8-8.3Z",
  book: "M4 4.5c3.4-.8 5.9-.2 8 1.4 2.1-1.6 4.6-2.2 8-1.4V19c-3.2-.7-5.7-.1-8 1.6-2.3-1.7-4.8-2.3-8-1.6V4.5ZM12 5.9v14.7",
  columns: "M4 20h16M5.5 17.5h13M6.5 7.5v10M10.2 7.5v10M13.8 7.5v10M17.5 7.5v10M4.5 6.5 12 3l7.5 3.5H4.5Z",
  triangle: "M12 3 21 20H3L12 3ZM12 8v7M8.8 16.5h6.4",
  orbit: "M12 3.3a8.7 8.7 0 1 0 0 17.4 8.7 8.7 0 0 0 0-17.4ZM3.8 9.1c4.7 1.4 9.4 3.6 15.9 7.7M5.1 16.8c4.8-1.4 9.1-4.1 13.7-8.7",
  spark: "M12 2.8l1.9 6.1 6.1 1.9-6.1 1.9-1.9 6.1-1.9-6.1-6.1-1.9 6.1-1.9L12 2.8ZM18.5 3.7l.6 1.8 1.8.6-1.8.6-.6 1.8-.6-1.8-1.8-.6 1.8-.6.6-1.8Z",
};

const programMarks: Array<{
  test: (name: string) => boolean;
  label: string;
  mark: AcademicMark;
}> = [
  { test: (n) => n.includes("adoc"), label: "A", mark: "diamond" },
  { test: (n) => n.includes("poma"), label: "P", mark: "arch" },
  { test: (n) => n.includes("grupo q"), label: "Q", mark: "hex" },
  { test: (n) => n.includes("hilasal"), label: "H", mark: "orbit" },
  { test: (n) => n.includes("merlet"), label: "M", mark: "circle" },
];

function initials(name?: string | null) {
  if (!name) return "A";
  const words = String(name)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

  const important = words.filter(
    (word) =>
      !["de", "del", "la", "el", "y", "en", "centro", "universidad"].includes(
        word.toLowerCase()
      )
  );

  return (important.length ? important : words)
    .slice(0, 3)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export default function MonochromeBrandMark({
  name,
  kind = "university",
  size = 38,
  className = "",
}: Props) {
  const normalized = normalizeAcademicText(name);
  const university = kind === "university" ? findUniversity(name) : null;
  const program = kind === "program"
    ? programMarks.find((item) => item.test(normalized))
    : null;

  const mark: AcademicMark =
    university?.mark ?? program?.mark ?? (kind === "program" ? "spark" : "shield");

  const label =
    university?.shortName ?? program?.label ?? initials(name);

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
        <path
          d={paths[mark]}
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <span
        className="absolute inset-0 flex items-center justify-center font-black tracking-[-0.07em]"
        style={{ fontSize: Math.max(6.5, size * 0.185) }}
      >
        {label}
      </span>
    </span>
  );
}
