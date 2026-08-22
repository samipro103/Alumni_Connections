import { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import clsx from "clsx";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export default function Button({
  loading,
  children,
  className,
  ...props
}: Props) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={clsx(
        "w-full",
        "rounded-2xl",
        "bg-gradient-to-r",
        "from-violet-600",
        "to-indigo-600",
        "px-6 py-4",
        "font-semibold",
        "text-white",
        "transition-all duration-300",
        "hover:scale-[1.02]",
        "hover:shadow-xl hover:shadow-violet-600/30",
        "disabled:opacity-60",
        "disabled:cursor-not-allowed",
        className
      )}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="animate-spin w-5 h-5" />
          Guardando...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
