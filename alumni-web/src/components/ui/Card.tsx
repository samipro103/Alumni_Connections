import { ReactNode } from "react";
import clsx from "clsx";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({
  children,
  className,
}: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-[26px] border border-white/[0.07] bg-[#101318]/95 p-6",
        "shadow-[0_16px_50px_rgba(0,0,0,0.18)]",
        className
      )}
    >
      {children}
    </div>
  );
}
