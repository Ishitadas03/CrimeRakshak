"use client";

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface SceneCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'dark' | 'pill';
  className?: string;
  delay?: number;
}

/**
 * Flat, clean card matching Mosey's minimal style.
 * White bg, very thin border, minimal shadow — NOT frosted glass.
 */
export function SceneCard({ children, variant = 'default', className, delay = 0 }: SceneCardProps) {
  const variants = {
    default: "bg-white border border-slate-200/70 shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
    dark: "bg-slate-900 text-white border border-slate-700/40 shadow-[0_4px_20px_rgba(0,0,0,0.15)]",
    pill: "bg-white border border-slate-200/70 shadow-[0_1px_4px_rgba(0,0,0,0.03)]",
  };

  const sizes = {
    default: "rounded-xl px-4 py-3",
    dark: "rounded-xl px-4 py-3",
    pill: "rounded-full px-4 py-2",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={cn(variants[variant], sizes[variant], className)}
    >
      {children}
    </motion.div>
  );
}
