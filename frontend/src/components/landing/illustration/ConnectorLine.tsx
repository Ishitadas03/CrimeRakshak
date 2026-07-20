"use client";

import React, { useId } from 'react';
import { motion } from 'motion/react';
import { useMotionTokens } from '@/lib/motion-tokens';

interface ConnectorLineProps {
  d: string;
  color?: string;
  delay?: number;
  dotTerminus?: 'filled' | 'open-ring' | 'none';
  dotPosition?: 'start' | 'end';
  className?: string;
  width?: number;
  height?: number;
}

/**
 * Animated dashed SVG connector line with stroke-dashoffset draw-on.
 * Represents data flowing between elements in the illustration.
 */
export function ConnectorLine({
  d,
  color = 'var(--color-accent)',
  delay = 0,
  dotTerminus = 'none',
  dotPosition = 'end',
  className,
  width = 200,
  height = 100,
}: ConnectorLineProps) {
  const { shouldReduceMotion } = useMotionTokens();
  const id = useId();

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className={className}
      style={{ overflow: 'visible' }}
    >
      {/* Dashed track (background) */}
      <path
        d={d}
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray="6 4"
        strokeLinecap="round"
        opacity={0.15}
      />

      {/* Animated draw-on path */}
      <motion.path
        d={d}
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray="6 4"
        strokeLinecap="round"
        opacity={0.6}
        initial={shouldReduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        exit={{ pathLength: 0, opacity: 0 }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 0.6, delay: delay + 0.15, ease: [0.25, 0.46, 0.45, 0.94] }
        }
      />

      {/* Terminus dot markers */}
      {dotTerminus === 'filled' && (
        <motion.circle
          r="4"
          fill={color}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.3, delay: delay + 0.6 }
          }
        >
          {/* Position set via parent transform or explicit cx/cy */}
        </motion.circle>
      )}

      {dotTerminus === 'open-ring' && (
        <motion.circle
          r="4"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.3, delay: delay + 0.6 }
          }
        />
      )}
    </svg>
  );
}
