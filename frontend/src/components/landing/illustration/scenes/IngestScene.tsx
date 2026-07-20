"use client";

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Database, Wifi } from 'lucide-react';
import { SceneCard } from '../SceneCard';
import type { CyclePhase } from '@/hooks/useHeroCycle';

interface IngestSceneProps {
  phase: CyclePhase;
}

/**
 * Scene A — "Data Ingest"
 * Center badge + spread-out cards positioned for 420px-high stage.
 */
export function IngestScene({ phase }: IngestSceneProps) {
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
          {/* Center badge: 247 Active Sources */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] rounded-full bg-slate-900 flex flex-col items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
            >
              <span className="text-[8px] font-bold text-accent/80 uppercase tracking-[0.15em]">Live</span>
              <span className="text-2xl sm:text-3xl font-bold text-white leading-none mt-0.5">247</span>
              <span className="text-[8px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">Sources</span>
            </motion.div>
          </div>

          {/* Top-right: Data feeds card */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 max-w-[210px]">
            <SceneCard delay={0.1}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Database className="h-3 w-3 text-accent/50" />
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Data Feeds</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[11px] font-medium text-slate-700">CCTNS incident feed</span>
                <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-emerald-600 bg-emerald-50 rounded-full px-1.5 py-0.5">
                  <Check className="h-2 w-2" /> Synced
                </span>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex items-center justify-between py-1">
                <span className="text-[11px] font-medium text-slate-700">112 dispatch log</span>
                <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-emerald-600 bg-emerald-50 rounded-full px-1.5 py-0.5">
                  <Check className="h-2 w-2" /> Synced
                </span>
              </div>
            </SceneCard>
          </div>

          {/* Bottom-left: GPS telemetry */}
          <div className="absolute bottom-4 left-3 sm:bottom-6 sm:left-4 max-w-[200px]">
            <SceneCard variant="pill" delay={0.22}>
              <div className="flex items-center gap-2">
                <Wifi className="h-3 w-3 text-accent" />
                <span className="text-[11px] font-medium text-slate-700">Patrol GPS telemetry</span>
                <span className="text-[9px] font-bold text-accent bg-accent/8 rounded-full px-1.5 py-0.5">Live</span>
              </div>
            </SceneCard>
          </div>

          {/* Mid-right: Districts */}
          <div className="absolute bottom-[35%] right-3 sm:right-5">
            <SceneCard variant="pill" delay={0.34} className="!bg-slate-900 !border-slate-700/30">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-medium text-slate-300">31 districts online</span>
              </div>
            </SceneCard>
          </div>

          {/* Top-left: Social media */}
          <div className="absolute top-4 left-4 hidden sm:block">
            <SceneCard variant="pill" delay={0.4}>
              <div className="flex items-center gap-1.5">
                <Check className="h-2.5 w-2.5 text-emerald-500" />
                <span className="text-[10px] font-medium text-slate-600">Social media intel</span>
              </div>
            </SceneCard>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
