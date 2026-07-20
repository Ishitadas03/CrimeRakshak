"use client";
import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'motion/react';

export interface GlassPanelProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export function GlassPanel({ children, className, hoverEffect = false, ...props }: GlassPanelProps) {
  return (
    <motion.div
      className={cn(
        "bg-surface-glass backdrop-blur-xl border border-surface-border rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.08)]",
        className
      )}
      whileHover={hoverEffect ? { y: -3, scale: 1.02 } : undefined}
      transition={hoverEffect ? { type: "spring", stiffness: 300, damping: 25 } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
}
