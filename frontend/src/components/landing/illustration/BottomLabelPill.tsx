"use client";

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { SceneIndex, CyclePhase } from '@/hooks/useHeroCycle';

const LABELS: Record<SceneIndex, string> = {
  0: 'New data syncing',
  1: 'Hotspot flagged',
  2: 'Unit dispatched',
};

interface BottomLabelPillProps {
  sceneIndex: SceneIndex;
  phase: CyclePhase;
}

/**
 * Mosey-style bottom label pill: dark bg, white text, no icon.
 * Crossfades per scene — matches Mosey's "New state setup" / "New Legislation" pills.
 */
export function BottomLabelPill({ sceneIndex, phase }: BottomLabelPillProps) {
  const isVisible = phase === 'enter' || phase === 'idle';

  return (
    <div className="flex justify-center mt-6">
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            key={sceneIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="inline-flex items-center px-5 py-2 rounded-full bg-slate-900 shadow-[0_4px_15px_rgba(0,0,0,0.12)]"
          >
            <span className="text-xs font-medium text-white tracking-wide">
              {LABELS[sceneIndex]}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
