"use client";

import React from 'react';
import { motion } from 'motion/react';
import type { SceneIndex } from '@/hooks/useHeroCycle';
import { useMotionTokens } from '@/lib/motion-tokens';

interface FlowingConnectorsProps {
  sceneIndex: SceneIndex;
}

/**
 * Flowing connector lines — properly sized for the compact stage.
 * Left: accent-blue serpentine from off-screen → center (filled dot terminus)
 * Right: emerald from center → off-screen (open ring terminus)
 */
export function FlowingConnectors({ sceneIndex }: FlowingConnectorsProps) {
  const { shouldReduceMotion } = useMotionTokens();

  return (
    <div className="absolute inset-0 pointer-events-none hidden md:block" aria-hidden="true">
      <svg
        viewBox="0 0 800 420"
        className="absolute inset-0 w-full h-full"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* ═══ LEFT CONNECTOR — accent-blue ═══ */}
        <motion.path
          d="M -40 80 
             L 50 80 
             Q 80 80, 80 110 
             L 80 150 
             Q 80 180, 50 180 
             L -10 180 
             Q -40 180, -40 210 
             L -40 260 
             Q -40 290, -10 290 
             L 180 290 
             Q 220 290, 250 270 
             L 320 230"
          stroke="var(--color-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.25"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 2, ease: 'easeInOut' }}
        />
        {/* Filled dot terminus */}
        <motion.circle
          cx="320" cy="230" r="4"
          fill="var(--color-accent)"
          opacity="0.3"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={shouldReduceMotion ? { duration: 0 } : { delay: 1.8, duration: 0.3 }}
        />

        {/* ═══ RIGHT CONNECTOR — emerald ═══ */}
        <motion.path
          d="M 480 200 
             Q 530 185, 580 195 
             L 660 220 
             Q 710 235, 760 215 
             L 850 180"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.25"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 1.5, delay: 0.5, ease: 'easeInOut' }}
        />
        {/* Open ring terminus */}
        <motion.circle
          cx="850" cy="180" r="4"
          fill="none"
          stroke="#10b981"
          strokeWidth="1.5"
          opacity="0.25"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={shouldReduceMotion ? { duration: 0 } : { delay: 1.8, duration: 0.3 }}
        />

        {/* Subtle dashed arcs */}
        <motion.path
          d="M 340 150 Q 400 135, 460 160"
          stroke="currentColor" strokeWidth="0.6" strokeDasharray="3 5"
          className="text-slate-400/8"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 1, delay: 1, ease: 'easeOut' }}
        />
        <motion.path
          d="M 370 310 Q 430 330, 490 300"
          stroke="currentColor" strokeWidth="0.6" strokeDasharray="3 5"
          className="text-slate-400/8"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 1, delay: 1.2, ease: 'easeOut' }}
        />
      </svg>
    </div>
  );
}
