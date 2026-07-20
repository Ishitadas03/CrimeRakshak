"use client";

import React from 'react';
import { motion } from 'motion/react';
import { useMotionTokens } from '@/lib/motion-tokens';
import { cn } from '@/lib/utils';

interface ConnectingPillProps {
  layoutId: string;
  className?: string;
}

export function ConnectingPill({ layoutId, className }: ConnectingPillProps) {
  const { shouldReduceMotion } = useMotionTokens();
  
  const baseClasses = cn("absolute inset-0 rounded-md z-[-1] bg-surface-border", className);

  if (shouldReduceMotion) {
    return <div className={baseClasses} />;
  }

  return (
    <motion.div
      layoutId={layoutId}
      className={baseClasses}
      initial={false}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    />
  );
}
