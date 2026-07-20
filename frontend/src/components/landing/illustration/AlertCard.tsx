"use client";

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface AlertCardProps {
  title: string;
  description: string;
  className?: string;
  delay?: number;
  showIcon?: boolean;
}

/**
 * Amber-only alert card. EXCLUSIVELY used inside PredictScene.
 * This component enforces the amber color discipline — it must never
 * appear outside of Scene B (Predictive Hotspot).
 */
export function AlertCard({ title, description, className, delay = 0, showIcon = true }: AlertCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={cn(
        "rounded-2xl px-5 py-4 backdrop-blur-sm",
        "bg-amber-500/10 border border-amber-500/20",
        "shadow-[0_4px_20px_rgba(245,158,11,0.08)]",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {showIcon && (
          <div className="flex-shrink-0 mt-0.5">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 leading-snug">{title}</p>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}
