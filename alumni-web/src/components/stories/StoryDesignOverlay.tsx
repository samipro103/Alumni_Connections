"use client";

import {
  Award,
  Briefcase,
  Building2,
  MapPin,
  Sparkles,
} from "lucide-react";

export type StoryDesignMeta = {
  story_kind?: "standard" | "achievement" | "opportunity";
  headline?: string | null;
  caption?: string | null;
  achievement_type?: string | null;
  organization?: string | null;
  opportunity_type?: string | null;
  work_mode?: string | null;
  location_text?: string | null;
  action_url?: string | null;
  story_template?: string | null;
  story_accent?: string | null;
  story_animation?: string | null;
  story_photo_style?: string | null;
  story_decor?: string | null;
  story_font_style?: string | null;
};

const accents: Record<
  string,
  {
    glow: string;
    badge: string;
    badgeText: string;
    accent: string;
  }
> = {
  indigo: {
    glow: "rgba(99,102,241,.34)",
    badge: "rgba(99,102,241,.28)",
    badgeText: "#e0e7ff",
    accent: "#818cf8",
  },
  violet: {
    glow: "rgba(139,92,246,.32)",
    badge: "rgba(139,92,246,.27)",
    badgeText: "#ede9fe",
    accent: "#a78bfa",
  },
  gold: {
    glow: "rgba(245,158,11,.30)",
    badge: "rgba(245,158,11,.22)",
    badgeText: "#fef3c7",
    accent: "#fbbf24",
  },
  emerald: {
    glow: "rgba(16,185,129,.28)",
    badge: "rgba(16,185,129,.22)",
    badgeText: "#d1fae5",
    accent: "#34d399",
  },
  cyan: {
    glow: "rgba(6,182,212,.28)",
    badge: "rgba(6,182,212,.22)",
    badgeText: "#cffafe",
    accent: "#22d3ee",
  },
  blue: {
    glow: "rgba(59,130,246,.28)",
    badge: "rgba(59,130,246,.22)",
    badgeText: "#dbeafe",
    accent: "#60a5fa",
  },
};

function fontClass(style?: string | null) {
  switch (style) {
    case "serif":
      return "font-serif";
    case "editorial":
      return "font-serif tracking-[-0.045em]";
    case "display":
      return "tracking-[-0.055em]";
    default:
      return "tracking-[-0.04em]";
  }
}

function animationClass(
  value?: string | null
) {
  switch (value) {
    case "rise":
      return "story-anim-rise";
    case "pop":
      return "story-anim-pop";
    case "glow":
      return "story-anim-glow";
    case "float":
      return "story-anim-float";
    case "reveal":
      return "story-anim-reveal";
    default:
      return "story-anim-fade";
  }
}

export default function StoryDesignOverlay({
  story,
  compact = false,
}: {
  story: StoryDesignMeta;
  compact?: boolean;
}) {
  const kind = story.story_kind;

  if (
    kind !== "achievement" &&
    kind !== "opportunity"
  ) {
    return null;
  }

  const achievement =
    kind === "achievement";

  const accent =
    accents[
      story.story_accent ||
        (achievement
          ? "indigo"
          : "emerald")
    ] ||
    accents.indigo;

  const template =
    story.story_template ||
    (achievement
      ? "elegant"
      : "job-card");

  const center =
    template === "spotlight" ||
    template === "celebration" ||
    template === "startup";

  return (
    <>
      {!compact && (
        <div
          className="pointer-events-none absolute inset-0 z-20"
          aria-hidden="true"
        >
          <div
            className="absolute -left-32 top-[7%] h-80 w-80 rounded-full blur-[110px]"
            style={{
              background:
                accent.glow,
            }}
          />

          {story.story_decor ===
            "rings" && (
            <>
              <div
                className="absolute -right-24 top-[24%] h-64 w-64 rounded-full border border-white/10"
                style={{
                  boxShadow: `0 0 80px ${accent.glow}`,
                }}
              />
              <div className="absolute -right-10 top-[30%] h-32 w-32 rounded-full border border-white/10" />
            </>
          )}

          {story.story_decor ===
            "grid" && (
            <div className="story-decor-grid absolute inset-0 opacity-30" />
          )}

          {story.story_decor ===
            "sparkles" && (
            <>
              <Sparkles
                size={25}
                className="absolute right-[12%] top-[19%] text-white/35"
              />
              <Sparkles
                size={15}
                className="absolute left-[11%] top-[58%] text-white/20"
              />
            </>
          )}

          {story.story_decor ===
            "confetti" && (
            <div className="story-confetti absolute inset-0" />
          )}
        </div>
      )}

      <div
        className={`pointer-events-none absolute inset-x-0 z-30 ${
          compact
            ? "bottom-2.5 px-2.5"
            : center
            ? "bottom-[17%] px-7 text-center sm:px-10"
            : "bottom-[16%] px-6 sm:px-9"
        } ${animationClass(
          story.story_animation
        )}`}
      >
        <div
          className={`${
            center
              ? "items-center"
              : "items-start"
          } flex flex-col`}
        >
          <span
            className={`inline-flex items-center gap-1.5 rounded-full font-black uppercase tracking-[0.12em] backdrop-blur-xl ${
              compact
                ? "px-2 py-1 text-[7px]"
                : "px-3 py-2 text-[9px]"
            }`}
            style={{
              background:
                accent.badge,
              color:
                accent.badgeText,
              border: `1px solid ${accent.accent}35`,
            }}
          >
            {achievement ? (
              <Award
                size={
                  compact ? 9 : 12
                }
              />
            ) : (
              <Briefcase
                size={
                  compact ? 9 : 12
                }
              />
            )}

            {achievement
              ? story.achievement_type ||
                "Nuevo logro"
              : story.opportunity_type ||
                "Oportunidad"}
          </span>

          {!compact && (
            <>
              <h2
                className={`mt-4 max-w-[92%] text-[clamp(28px,7.6vw,49px)] font-black leading-[0.98] text-white drop-shadow-[0_10px_35px_rgba(0,0,0,.45)] ${fontClass(
                  story.story_font_style
                )}`}
              >
                {story.headline}
              </h2>

              {(story.organization ||
                story.location_text ||
                story.work_mode) && (
                <div
                  className={`mt-4 flex flex-wrap gap-x-3 gap-y-2 text-[11px] font-bold text-white/70 ${
                    center
                      ? "justify-center"
                      : ""
                  }`}
                >
                  {story.organization && (
                    <span className="inline-flex items-center gap-1.5">
                      <Building2
                        size={12}
                      />
                      {
                        story.organization
                      }
                    </span>
                  )}

                  {story.location_text && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin
                        size={12}
                      />
                      {
                        story.location_text
                      }
                    </span>
                  )}

                  {story.work_mode && (
                    <span
                      className="rounded-full px-2 py-1"
                      style={{
                        background:
                          accent.badge,
                        color:
                          accent.badgeText,
                      }}
                    >
                      {
                        story.work_mode
                      }
                    </span>
                  )}
                </div>
              )}

              {story.caption && (
                <p
                  className={`mt-4 max-w-[88%] text-[12px] leading-5 text-white/62 ${
                    center
                      ? "mx-auto"
                      : ""
                  }`}
                >
                  {story.caption}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
