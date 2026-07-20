"use client";

import React from 'react';
import { motion } from 'motion/react';
import { Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SceneIndex } from '@/hooks/useHeroCycle';
import { useMotionTokens } from '@/lib/motion-tokens';

const STEPS = [
  { label: 'Ingest', index: 0 },
  { label: 'Predict', index: 1 },
  { label: 'Dispatch', index: 2 },
] as const;

interface StepperProps {
  activeIndex: SceneIndex;
}

/**
 * Mosey-style stepper: 3 labels, active has spinner, progress bar
 * with extending connector lines + dot termini on both sides.
 */
export function Stepper({ activeIndex }: StepperProps) {
  const { shouldReduceMotion } = useMotionTokens();
  const progressPercent = (activeIndex / (STEPS.length - 1)) * 100;

  return (
    <div className="flex flex-col items-center gap-3 mt-6">
      {/* Labels row */}
      <div className="flex items-center justify-center gap-8 sm:gap-14">
        {STEPS.map((step) => {
          const isActive = step.index === activeIndex;
          const isDone = step.index < activeIndex;

          return (
            <div
              key={step.label}
              className={cn(
                "flex items-center gap-1.5 text-sm transition-colors duration-300",
                isActive
                  ? "text-text-primary font-bold"
                  : isDone
                  ? "text-text-muted font-medium"
                  : "text-text-faint font-medium"
              )}
            >
              {isActive && !shouldReduceMotion && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
              )}
              {isDone && (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              )}
              {step.label}
            </div>
          );
        })}
      </div>

      {/* Progress bar with extending side lines + dot termini */}
      <div className="relative flex items-center w-full max-w-lg px-4">
        {/* Left extending line + dot */}
        <div className="flex-1 flex items-center justify-end mr-0">
          <div className="h-px bg-slate-200/40 flex-1 max-w-[100px]" />
          <div className="w-2 h-2 rounded-full bg-accent/60 flex-shrink-0" />
        </div>

        {/* Center progress bar */}
        <div className="relative w-48 sm:w-64 h-[3px] flex items-center mx-0">
          {/* Background track */}
          <div className="absolute inset-0 rounded-full bg-slate-200/40" />

          {/* Filled portion */}
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-accent"
            initial={{ width: '0%' }}
            animate={{ width: `${progressPercent}%` }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
            }
          />

          {/* Dot anchors */}
          {STEPS.map((step) => {
            const leftPercent = (step.index / (STEPS.length - 1)) * 100;
            const isReached = step.index <= activeIndex;

            return (
              <div
                key={step.label}
                className="absolute top-1/2"
                style={{ left: `${leftPercent}%`, transform: 'translate(-50%, -50%)' }}
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full border-2 transition-colors duration-300",
                    isReached
                      ? "bg-accent border-accent"
                      : "bg-white border-slate-300"
                  )}
                />
              </div>
            );
          })}
        </div>

        {/* Right extending line + dot */}
        <div className="flex-1 flex items-center ml-0">
          <div className="w-2 h-2 rounded-full bg-accent/60 flex-shrink-0" />
          <div className="h-px bg-slate-200/40 flex-1 max-w-[100px]" />
        </div>
      </div>
    </div>
  );
}
