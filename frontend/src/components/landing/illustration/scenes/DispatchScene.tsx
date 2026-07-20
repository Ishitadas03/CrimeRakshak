"use client";

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Car, Radio as RadioIcon, Headphones, Check, Navigation } from 'lucide-react';
import { SceneCard } from '../SceneCard';
import type { CyclePhase } from '@/hooks/useHeroCycle';

interface DispatchSceneProps {
  phase: CyclePhase;
}

/**
 * Scene C — "Unit Dispatch"
 * Cards positioned for 420px-high compact stage.
 */
export function DispatchScene({ phase }: DispatchSceneProps) {
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
          {/* Top-right: Unit dispatched (dark) */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 max-w-[200px]">
            <SceneCard variant="dark" delay={0.1}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0">
                  <Navigation className="h-3.5 w-3.5 text-accent" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">Unit 12 dispatched</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <motion.div className="h-1 w-1 rounded-full bg-emerald-400" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                    <p className="text-[9px] text-emerald-400 font-medium">ETA 6 min</p>
                  </div>
                </div>
              </div>
            </SceneCard>
          </div>

          {/* Center: Whitefield pin */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.06 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 shadow-[0_4px_16px_rgba(0,0,0,0.18)]"
            >
              <motion.div
                className="h-1.5 w-1.5 rounded-full bg-accent"
                animate={{ boxShadow: ['0 0 0px rgba(37,99,235,0.3)', '0 0 6px rgba(37,99,235,0.5)', '0 0 0px rgba(37,99,235,0.3)'] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
              <span className="text-[9px] font-bold text-white tracking-wide">Whitefield</span>
            </motion.div>
          </div>

          {/* Left stack: patrol / backup / control */}
          <div className="absolute bottom-4 left-3 sm:bottom-6 sm:left-5 flex flex-col gap-1.5 max-w-[185px]">
            {[
              { icon: Car, label: 'Nearest patrol unit', active: true },
              { icon: RadioIcon, label: 'Backup unit alerted', active: false },
              { icon: Headphones, label: 'Control room notified', active: false },
            ].map((item, i) => (
              <SceneCard key={item.label} variant="pill" delay={0.16 + i * 0.08} className="!py-1 !px-2.5">
                <div className="flex items-center gap-1.5">
                  <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${item.active ? 'bg-accent/10' : 'bg-slate-50'}`}>
                    <item.icon className={`h-2.5 w-2.5 ${item.active ? 'text-accent' : 'text-slate-400'}`} />
                  </div>
                  <span className="text-[9px] font-medium text-slate-700">{item.label}</span>
                </div>
              </SceneCard>
            ))}
          </div>

          {/* Top-left: Intel verified */}
          <div className="absolute top-4 left-4 hidden sm:block">
            <SceneCard variant="pill" delay={0.3}>
              <div className="flex items-center gap-1">
                <Check className="h-2.5 w-2.5 text-accent" />
                <span className="text-[9px] font-medium text-slate-600">Intel verified</span>
              </div>
            </SceneCard>
          </div>

          {/* Bottom-right: Resolved */}
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45, duration: 0.3 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="h-2 w-2 text-emerald-600" />
              </div>
              <span className="text-[10px] font-bold text-emerald-700">Resolved</span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
