"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type LandingRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function LandingReveal({
  children,
  className,
  delay = 0,
}: LandingRevealProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
