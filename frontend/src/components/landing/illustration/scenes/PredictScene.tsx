"use client";

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, TrendingUp, MapPin } from 'lucide-react';
import { SceneCard } from '../SceneCard';
import { AlertCard } from '../AlertCard';
import type { CyclePhase } from '@/hooks/useHeroCycle';

interface PredictSceneProps {
  phase: CyclePhase;
}

/**
 * Scene B — "Predictive Hotspot"
 * Cards positioned for 420px-high compact stage.
 * Amber on exactly 2 AlertCards.
 */
export function PredictScene({ phase }: PredictSceneProps) {
  const isVisible = phase === 'enter' || phase === 'idle';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          className="absolute inset-0"
        >
          {/* Top-left: Anomaly score */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 max-w-[190px]">
            <SceneCard variant="pill" delay={0.05}>
              <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center">
                  <Radio className="h-3.5 w-3.5 text-slate-600" />
                  <motion.div
                    className="absolute inset-[-3px] rounded-full border border-amber-400/40"
                    animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-700">Anomaly score rising</span>
              </div>
            </SceneCard>

            <div className="mt-2 ml-1 space-y-0.5">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-2.5 w-2.5 text-slate-400" />
                <p className="text-[9px] text-slate-500">Whitefield — theft <span className="text-amber-600 font-semibold">+34%</span></p>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-2.5 w-2.5 text-slate-400" />
                <p className="text-[9px] text-slate-500">Yeshwanthpur — snatching <span className="text-amber-600 font-semibold">+18%</span></p>
              </div>
            </div>
          </div>

          {/* Top-right: High-risk alert */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 max-w-[210px]">
            <AlertCard title="High-risk window" description="Whitefield · 8–10 PM tonight" delay={0.15} />
            <div className="mt-1 ml-1 flex items-center gap-1">
              <MapPin className="h-2 w-2 text-amber-500/40" />
              <span className="text-[8px] text-slate-400">12.9716°N, 77.5946°E</span>
            </div>
          </div>

          {/* Mid-right: Patrol reallocation */}
          <div className="absolute top-[45%] right-4 sm:right-6 max-w-[180px]">
            <SceneCard delay={0.28}>
              <p className="text-[11px] font-semibold text-slate-700 mb-1.5">Patrol reallocation</p>
              <div className="space-y-1">
                <motion.div className="h-1.5 bg-accent/10 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-accent/40 rounded-full" initial={{ width: '0%' }} animate={{ width: '85%' }} transition={{ delay: 0.5, duration: 0.6 }} />
                </motion.div>
                <motion.div className="h-1.5 bg-accent/10 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-accent/30 rounded-full" initial={{ width: '0%' }} animate={{ width: '60%' }} transition={{ delay: 0.6, duration: 0.6 }} />
                </motion.div>
              </div>
            </SceneCard>
          </div>

          {/* Bottom-left: Pattern alert */}
          <div className="absolute bottom-4 left-3 sm:bottom-6 sm:left-5 max-w-[230px]">
            <AlertCard title="New pattern detected" description="Chain-snatching cluster near MG Road" delay={0.35} />
          </div>

          {/* Bottom-right: Confidence */}
          <div className="absolute bottom-4 right-4 sm:bottom-6 hidden sm:block">
            <SceneCard variant="pill" delay={0.45}>
              <span className="text-[10px] font-medium text-slate-600">Confidence: <span className="text-accent font-bold">87%</span></span>
            </SceneCard>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
