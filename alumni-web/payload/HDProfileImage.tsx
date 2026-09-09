"use client";

import {
  useState,
} from "react";
import {
  Maximize2,
} from "lucide-react";
import AlumniImage from "@/components/ui/AlumniImage";
import AlumniMediaViewer from "@/components/ui/AlumniMediaViewer";

type Props = {
  src: string;
  alt: string;
  className?: string;
  variant?: "avatar" | "banner";
};

export default function HDProfileImage({
  src,
  alt,
  className = "",
  variant = "banner",
}: Props) {
  const [open, setOpen] =
    useState(false);

  return (
    <>
      <button
        type="button"
        data-pull-refresh-pass="true"
        onClick={() =>
          setOpen(true)
        }
        className={`group relative block h-full w-full overflow-hidden ${
          variant === "avatar"
            ? "rounded-full"
            : ""
        }`}
        aria-label={`Ver ${alt.toLowerCase()}`}
      >
        <AlumniImage
          src={src}
          alt={alt}
          priority
          shellClassName="h-full w-full"
          className={`${className} select-none`}
        />

        <span
          className={`pointer-events-none absolute flex items-center justify-center bg-black/45 text-white opacity-0 backdrop-blur-[2px] transition group-hover:opacity-100 ${
            variant === "avatar"
              ? "inset-0 rounded-full"
              : "bottom-3 right-3 h-9 w-9 rounded-xl"
          }`}
        >
          <Maximize2
            size={
              variant === "avatar"
                ? 18
                : 16
            }
          />
        </span>
      </button>

      {open && (
        <AlumniMediaViewer
          src={src}
          type="image"
          alt={alt}
          onClose={() =>
            setOpen(false)
          }
        />
      )}
    </>
  );
}

/* ALUMNI_2_9_0_HD_PROFILE_IMAGE */
