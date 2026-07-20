"use client";

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Wifi, Activity, ArrowRight, Server, FileJson } from 'lucide-react';
import type { CyclePhase } from '@/hooks/useHeroCycle';
import { useMotionTokens } from '@/lib/motion-tokens';

interface PanelProps {
  phase: CyclePhase;
}

export function IngestPanel({ phase }: PanelProps) {
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
          {/* Main Dashboard Widget */}
          <div className="w-full max-w-lg bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden relative">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-100 rounded-md">
                  <Database className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 leading-tight">Data Pipeline</h3>
                  <p className="text-[10px] font-medium text-slate-500">Live ingestion network</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 font-medium mb-0.5">NET THROUGHPUT</span>
                <span className="text-xs font-mono font-bold text-slate-700">14.2 MB/s</span>
              </div>
            </div>

            {/* Pipeline Visualization */}
            <div className="p-5 flex items-center justify-between relative min-h-[160px]">
              
              {/* Left Side: Sources */}
              <div className="flex flex-col gap-4 w-[160px] z-10">
                <PipelineSource 
                  name="CCTNS API" 
                  icon={FileJson} 
                  rate="2.4k req/s" 
                  delay={0.1}
                  color="blue"
                  shouldReduceMotion={shouldReduceMotion}
                />
                <PipelineSource 
                  name="112 Dispatch" 
                  icon={Activity} 
                  rate="850 req/s" 
                  delay={0.2}
                  color="emerald"
                  shouldReduceMotion={shouldReduceMotion}
                />
                <PipelineSource 
                  name="Patrol GPS" 
                  icon={Wifi} 
                  rate="5.2k req/s" 
                  delay={0.3}
                  color="indigo"
                  shouldReduceMotion={shouldReduceMotion}
                />
              </div>

              {/* Connecting Lines (Background) */}
              <div className="absolute inset-y-5 left-[180px] right-[148px] pointer-events-none">
                {!shouldReduceMotion && (
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <motion.path 
                      d="M 0 16 C 50 16, 50 50, 100 50" 
                      fill="none" stroke="url(#blueGrad)" strokeWidth="2" strokeDasharray="6 6" vectorEffect="non-scaling-stroke"
                      animate={{ strokeDashoffset: [0, -20] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.path 
                      d="M 0 50 L 100 50.01" 
                      fill="none" stroke="url(#emeraldGrad)" strokeWidth="2" strokeDasharray="6 6" vectorEffect="non-scaling-stroke"
                      animate={{ strokeDashoffset: [0, -20] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.path 
                      d="M 0 84 C 50 84, 50 50, 100 50" 
                      fill="none" stroke="url(#indigoGrad)" strokeWidth="2" strokeDasharray="6 6" vectorEffect="non-scaling-stroke"
                      animate={{ strokeDashoffset: [0, -20] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    
                    <defs>
                      <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
                      </linearGradient>
                      <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                      </linearGradient>
                      <linearGradient id="indigoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
                      </linearGradient>
                    </defs>
                  </svg>
                )}
              </div>

              {/* Right Side: Processing Hub */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: 'spring' }}
                className="relative z-10 w-[120px] h-[120px] rounded-full bg-white border border-slate-100 shadow-xl flex items-center justify-center mr-2"
              >
                {!shouldReduceMotion && (
                  <motion.div 
                    className="absolute inset-[-15px] rounded-full border border-accent/20 border-dashed"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  />
                )}
                <div className="flex flex-col items-center text-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Server className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Engine</div>
                    <div className="text-[9px] text-emerald-500 font-medium flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Syncing
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>

            {/* Bottom Status */}
            <div className="px-5 py-3 bg-slate-900 flex items-center justify-between">
              <span className="text-[10px] font-medium text-slate-400">Total active connections</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">42 Nodes</span>
                <span className="inline-flex items-center text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                  99.9% Up
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PipelineSource({ name, icon: Icon, rate, delay, color, shouldReduceMotion }: any) {
  const colorMap: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  };
  
  const iconColorMap: any = {
    blue: "text-blue-500",
    emerald: "text-emerald-500",
    indigo: "text-indigo-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5, type: 'spring' }}
      className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-100 shadow-sm relative z-10"
    >
      <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex flex-col">
        <span className="text-[11px] font-bold text-slate-700 leading-tight">{name}</span>
        <div className="flex items-center gap-1 mt-0.5">
          <Activity className={`h-2.5 w-2.5 ${iconColorMap[color]}`} />
          <span className="text-[9px] font-mono text-slate-400">{rate}</span>
        </div>
      </div>
      {!shouldReduceMotion && (
        <motion.div 
          className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white border-2 border-slate-300"
          animate={{ borderColor: ['#cbd5e1', '#6366f1', '#cbd5e1'] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: delay * 2 }}
        />
      )}
    </motion.div>
  );
}
