import { ReactNode } from "react";
import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .25 }}
      className={clsx(
        "rounded-3xl border border-white/10",
        "bg-white/5 backdrop-blur-xl",
        "shadow-2xl shadow-black/20",
        "p-6",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
