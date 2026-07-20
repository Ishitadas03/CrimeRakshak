"use client";

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useHeroCycle } from '@/hooks/useHeroCycle';
import { useMotionTokens } from '@/lib/motion-tokens';
import { Database, Radar, Navigation, Loader2, Check, Search, Filter, Activity } from 'lucide-react';
import { IngestPanel } from './scenes/IngestPanel';
import { PredictPanel } from './scenes/PredictPanel';
import { DispatchPanel } from './scenes/DispatchPanel';

const TABS = [
  { label: 'Ingest', icon: Database, index: 0 as const },
  { label: 'Predict', icon: Radar, index: 1 as const },
  { label: 'Dispatch', icon: Navigation, index: 2 as const },
] as const;

/**
 * IllustrationStage — Product preview panel.
 * A sleek glass container that looks like a real dashboard window,
 * with a top bar (dots + tabs) and scene content inside.
 */
export function IllustrationStage() {
  const { sceneIndex, phase } = useHeroCycle();
  const { shouldReduceMotion } = useMotionTokens();

  return (
    <div
      role="img"
      aria-label="Animated product preview showing CrimeRakshak's data ingestion, predictive hotspot detection, and patrol dispatch features."
      className="w-full"
    >
      {/* ═══ PRODUCT PREVIEW CONTAINER ═══ */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200/60 bg-white shadow-[0_25px_80px_-12px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.03)]">
        
        {/* ─── Top Bar: Advanced Dashboard Header ─── */}
        <div className="flex flex-col border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3">
            {/* Window dots & Search */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300/70" />
              </div>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-slate-200/60 shadow-sm w-48">
                <Search className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[10px] text-slate-400 font-medium">Search records...</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-100/80 rounded-lg p-0.5">
              {TABS.map((tab) => {
                const isActive = tab.index === sceneIndex;
                const isDone = tab.index < sceneIndex;
                const Icon = tab.icon;
                return (
                  <motion.div
                    key={tab.label}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-default ${
                      isActive
                        ? 'text-accent bg-white shadow-sm'
                        : isDone
                        ? 'text-emerald-600'
                        : 'text-slate-400'
                    }`}
                    layout
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  >
                    {isActive && !shouldReduceMotion ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : isDone ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Icon className="h-3 w-3" />
                    )}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </motion.div>
                );
              })}
            </div>

            {/* Status & Filters */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-white rounded-md border border-slate-200/60 shadow-sm text-[10px] font-medium text-slate-500">
                <Activity className="h-3 w-3 text-accent" />
                1.2M rows/s
              </div>
              <div className="hidden sm:flex p-1.5 rounded-md text-slate-400 hover:bg-slate-200/50 cursor-pointer transition-colors">
                <Filter className="h-3.5 w-3.5" />
              </div>
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-medium text-slate-400 hidden sm:inline">Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Main Content Area ─── */}
        <div className="relative min-h-[320px] sm:min-h-[380px] overflow-hidden group/stage">
          {/* Subtle grid background */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'radial-gradient(circle, var(--color-accent) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />
          
          {/* Glowing Inner Border */}
          <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(99,102,241,0.03)] pointer-events-none" />

          {/* Scene content */}
          <AnimatePresence mode="wait">
            {sceneIndex === 0 && <IngestPanel key="ingest" phase={phase} />}
            {sceneIndex === 1 && <PredictPanel key="predict" phase={phase} />}
            {sceneIndex === 2 && <DispatchPanel key="dispatch" phase={phase} />}
          </AnimatePresence>
        </div>

        {/* ─── Bottom Status Bar ─── */}
        <BottomBar sceneIndex={sceneIndex} />
      </div>

      {/* Scene label pill below container */}    </div>
  );
}

/** Bottom status bar inside the container */
function BottomBar({ sceneIndex }: { sceneIndex: number }) {
  const metrics = [
    ['247 sources', '31 districts', '99.7% uptime'],
    ['3 hotspots', '87% confidence', '2.4s latency'],
    ['Unit 12', 'ETA 6 min', 'Case #4821'],
  ];
  const current = metrics[sceneIndex] ?? metrics[0];

  return (
    <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-t border-slate-100 bg-slate-50/50">
      <div className="flex items-center gap-4 sm:gap-6">
        {current.map((text, i) => (
          <AnimatePresence key={`${sceneIndex}-${i}`} mode="wait">
            <motion.span
              key={`${sceneIndex}-${text}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ delay: i * 0.06, duration: 0.25 }}
              className="text-[10px] sm:text-xs font-medium text-slate-400"
            >
              {text}
            </motion.span>
          </AnimatePresence>
        ))}
      </div>
      {/* Progress dots */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
              i === sceneIndex ? 'bg-accent' : i < sceneIndex ? 'bg-emerald-400' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
