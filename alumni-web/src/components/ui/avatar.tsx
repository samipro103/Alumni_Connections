import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ForwardedRef } from "react";

interface AvatarProps extends ComponentPropsWithoutRef<"div"> {}

export const Avatar = forwardRef(
  ({ className = "", ...props }: AvatarProps, ref: ForwardedRef<HTMLDivElement>) => (
    <div
      ref={ref}
      className={`relative inline-flex h-12 w-12 overflow-hidden rounded-full border border-zinc-800 bg-zinc-900 ${className}`.trim()}
      {...props}
    />
  )
);
Avatar.displayName = "Avatar";

interface AvatarImageProps extends ComponentPropsWithoutRef<"img"> {}

export const AvatarImage = forwardRef(
  ({ className = "", alt = "Avatar", ...props }: AvatarImageProps, ref: ForwardedRef<HTMLImageElement>) => (
    <img
      ref={ref}
      className={`h-full w-full object-cover ${className}`.trim()}
      alt={alt}
      {...props}
    />
  )
);
AvatarImage.displayName = "AvatarImage";

interface AvatarFallbackProps extends ComponentPropsWithoutRef<"div"> {}

export const AvatarFallback = forwardRef(
  ({ className = "", ...props }: AvatarFallbackProps, ref: ForwardedRef<HTMLDivElement>) => (
    <div
      ref={ref}
      className={`flex h-full w-full items-center justify-center bg-zinc-700 text-xl text-white ${className}`.trim()}
      {...props}
    />
  )
);
AvatarFallback.displayName = "AvatarFallback";
