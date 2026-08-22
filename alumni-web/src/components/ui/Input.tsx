import { InputHTMLAttributes } from "react";
import clsx from "clsx";

interface Props extends InputHTMLAttributes<HTMLInputElement> {}

export default function Input({
  className,
  ...props
}: Props) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full",
        "rounded-2xl",
        "border border-white/10",
        "bg-zinc-900/70",
        "px-4 py-3",
        "text-white",
        "placeholder:text-zinc-500",
        "outline-none",
        "transition-all duration-200",
        "focus:border-violet-500",
        "focus:ring-4",
        "focus:ring-violet-500/20",
        className
      )}
    />
  );
}
