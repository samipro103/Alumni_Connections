"use client";

import {
  ReactNode,
} from "react";
import {
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  usePathname,
} from "next/navigation";

type MotionBaseProps = {
  children: ReactNode;
  className?: string;
};

export function AlumniRouteMotion({
  children,
  className = "",
}: MotionBaseProps) {
  const pathname =
    usePathname();

  const reduceMotion =
    useReducedMotion();

  return (
    <motion.div
      key={pathname}
      className={`alumni-motion-route ${className}`}
      initial={
        reduceMotion
          ? false
          : {
              opacity: 0,
              y: 8,
              scale: 0.995,
            }
      }
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration:
          reduceMotion
            ? 0
            : 0.34,
        ease: [
          0.2,
          0.8,
          0.2,
          1,
        ],
      }}
    >
      {children}
    </motion.div>
  );
}

export function MotionReveal({
  children,
  className = "",
  delay = 0,
}: MotionBaseProps & {
  delay?: number;
}) {
  const reduceMotion =
    useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={
        reduceMotion
          ? false
          : {
              opacity: 0,
              y: 18,
            }
      }
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.18,
      }}
      transition={{
        duration:
          reduceMotion
            ? 0
            : 0.48,
        delay:
          reduceMotion
            ? 0
            : delay,
        ease: [
          0.2,
          0.8,
          0.2,
          1,
        ],
      }}
    >
      {children}
    </motion.div>
  );
}

export function MotionCard({
  children,
  className = "",
  delay = 0,
}: MotionBaseProps & {
  delay?: number;
}) {
  const reduceMotion =
    useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={
        reduceMotion
          ? false
          : {
              opacity: 0,
              y: 14,
              scale: 0.99,
            }
      }
      whileInView={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      viewport={{
        once: true,
        amount: 0.16,
      }}
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -2,
            }
      }
      whileTap={
        reduceMotion
          ? undefined
          : {
              scale: 0.992,
            }
      }
      transition={{
        duration:
          reduceMotion
            ? 0
            : 0.38,
        delay:
          reduceMotion
            ? 0
            : delay,
        ease: [
          0.2,
          0.8,
          0.2,
          1,
        ],
      }}
    >
      {children}
    </motion.div>
  );
}

export function MotionPressable({
  children,
  className = "",
}: MotionBaseProps) {
  const reduceMotion =
    useReducedMotion();

  return (
    <motion.div
      className={className}
      whileTap={
        reduceMotion
          ? undefined
          : {
              scale: 0.975,
            }
      }
      transition={{
        duration: 0.13,
      }}
    >
      {children}
    </motion.div>
  );
}

export const alumniMotion = {
  page: {
    initial: {
      opacity: 0,
      y: 8,
      scale: 0.995,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
    transition: {
      duration: 0.34,
      ease: [
        0.2,
        0.8,
        0.2,
        1,
      ],
    },
  },
  reveal: {
    initial: {
      opacity: 0,
      y: 18,
    },
    animate: {
      opacity: 1,
      y: 0,
    },
  },
  press: {
    scale: 0.975,
  },
  cardHover: {
    y: -2,
  },
} as const;

/* ALUMNI_MOTION_SYSTEM_1_0 */
