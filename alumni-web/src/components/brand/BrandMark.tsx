"use client";

type Props = {
  compact?: boolean;
  className?: string;
  animated?: boolean;
};

export default function BrandMark({
  compact = false,
  className = "",
  animated = false,
}: Props) {
  return (
    <span
      className={`alumni-brand inline-flex items-baseline font-black tracking-[-0.055em] ${className}`}
      aria-label="Alumni."
    >
      <span>
        {compact ? "A" : "Alumni"}
      </span>

      <span
        aria-hidden="true"
        className={`alumni-brand-dot ${
          animated
            ? "alumni-brand-dot-animated"
            : ""
        }`}
      >
        .
      </span>
    </span>
  );
}
