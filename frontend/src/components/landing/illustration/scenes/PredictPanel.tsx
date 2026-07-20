"use client";

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, MapPin, TrendingUp, AlertTriangle, Target, Activity } from 'lucide-react';
import type { CyclePhase } from '@/hooks/useHeroCycle';
import { useMotionTokens } from '@/lib/motion-tokens';

interface PanelProps {
  phase: CyclePhase;
}

export function PredictPanel({ phase }: PanelProps) {
  const isVisible = phase === 'enter' || phase === 'idle';
  const { shouldReduceMotion } = useMotionTokens();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-6"
        >
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden relative">
            
            {/* Background Grid & Radar */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxwYXRoIGQ9Ik0wIDBoMjB2MjBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjM2IzYjRiIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1vcGFjaXR5PSIwLjUiLz4KPC9zdmc+')] opacity-50" />
              {!shouldReduceMotion && (
                <motion.div 
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-accent/40 rounded-full"
                  animate={{ scale: [0.8, 1.5], opacity: [1, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                />
              )}
            </div>

            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur-sm z-10 relative">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-rose-500/20 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">Risk Assessment</h3>
                  <p className="text-[10px] font-medium text-slate-400">AI Pattern Recognition</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">High Risk</span>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-5 flex flex-col gap-4 relative z-10">
              
              {/* Primary Alert Block */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center shrink-0 border border-slate-600">
                  <Target className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-bold text-white">Cluster Forming: Sector 4</h4>
                    <span className="text-[10px] font-mono font-bold text-emerald-400">87% CONFIDENCE</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                    Anomalous activity detected matching historical theft patterns along the Whitefield transit corridor.
                  </p>
                  
                  {/* Progress Bars */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                      <span>Pattern Match</span>
                      <span className="text-white">92%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: '92%' }} transition={{ delay: 0.5, duration: 1 }}
                        className="h-full bg-accent rounded-full" 
                      />
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                      <span>Historical Correlation</span>
                      <span className="text-white">84%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: '84%' }} transition={{ delay: 0.6, duration: 1 }}
                        className="h-full bg-indigo-400 rounded-full" 
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Data Cards Row */}
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 flex flex-col justify-between"
                >
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Time Window</div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-700 rounded text-slate-300"><Activity className="h-3 w-3" /></div>
                    <div>
                      <div className="text-xs font-bold text-white">20:00 - 23:00</div>
                      <div className="text-[9px] text-slate-500 font-medium">+6 hrs from now</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 z-10 relative">Action Required</div>
                  <div className="flex items-center gap-2 z-10 relative">
                    <div className="p-1.5 bg-rose-500/20 rounded text-rose-500"><TrendingUp className="h-3 w-3" /></div>
                    <div>
                      <div className="text-xs font-bold text-white">Deploy Units</div>
                      <div className="text-[9px] text-rose-400 font-medium">Preventive Protocol</div>
                    </div>
                  </div>
                  {/* Subtle highlight */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-rose-500/5" />
                </motion.div>
              </div>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
