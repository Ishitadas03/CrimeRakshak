"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Loader2, Database, BrainCircuit, Activity, Map, Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMotionTokens } from '@/lib/motion-tokens';
import { GlassPanel } from './GlassPanel';

const STAGES = [
  { id: 'ingest', label: 'Data Ingest', icon: Database },
  { id: 'pattern', label: 'Pattern Analysis', icon: BrainCircuit },
  { id: 'anomaly', label: 'Anomaly Scoring', icon: Activity },
  { id: 'hotspot', label: 'Hotspot Prediction', icon: Map },
  { id: 'dispatch', label: 'Unit Dispatch', icon: Car },
];

export function LivePipelineCard() {
  const [activeStageIndex, setActiveStageIndex] = useState(1); // 0 is done, 1 is running initially
  const [countdown, setCountdown] = useState(40);
  const [sources, setSources] = useState(247);
  
  const { shouldReduceMotion } = useMotionTokens();
  
  const activeStageRef = useRef(activeStageIndex);
  useEffect(() => {
    activeStageRef.current = activeStageIndex;
  }, [activeStageIndex]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    const startCycle = () => {
      intervalId = setInterval(() => {
        if (document.hidden) return; // Pause when tab inactive

        setActiveStageIndex((prev) => {
          if (prev >= STAGES.length - 1) {
            // End of cycle, trigger flash and reset
            setTimeout(() => {
              setActiveStageIndex(1);
              setCountdown(Math.floor(Math.random() * (55 - 35 + 1) + 35));
              setSources(s => s + Math.floor(Math.random() * 5));
            }, 600);
            return prev;
          }
          return prev + 1;
        });
      }, shouldReduceMotion ? 2000 : 1200); // 1.2 seconds per stage
    };

    startCycle();
    
    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(intervalId);
      } else {
        startCycle();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibility);
    
    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [shouldReduceMotion]);

  useEffect(() => {
    const timerId = setInterval(() => {
      if (!document.hidden && activeStageIndex < STAGES.length - 1) {
        setCountdown((prev) => Math.max(0, prev - 1));
      }
    }, 1000);
    return () => clearInterval(timerId);
  }, [activeStageIndex]);

  return (
    <motion.div 
      initial={{ scale: 0.96, opacity: 0, boxShadow: "0 0 0px rgba(37,99,235,0)" }}
      animate={{ scale: 1, opacity: 1, boxShadow: activeStageIndex === STAGES.length - 1 ? "0 0 80px rgba(37,99,235,0.4)" : "0 0 40px rgba(37,99,235,0.15)" }}
      transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
      className="w-full h-full transform-gpu rounded-3xl"
    >
      <GlassPanel className="px-8 md:px-10 py-5 md:py-6 flex flex-col gap-3 mesh-pipeline backdrop-blur-xl border border-slate-300 !rounded-[24px] relative overflow-hidden shadow-[0_8px_40px_rgba(37,99,235,0.08)]">
        
        {/* Glow pulse on completion */}
        <motion.div 
          animate={{ opacity: activeStageIndex === STAGES.length - 1 ? [0, 0.15, 0] : 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 bg-accent pointer-events-none"
        />

        <div className="flex flex-col gap-1.5 relative z-10">
          {STAGES.map((stage, index) => {
            const isDone = index < activeStageIndex;
            const isRunning = index === activeStageIndex;
            const isPending = index > activeStageIndex;
            
            const Icon = stage.icon;

            return (
              <motion.div 
                key={stage.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: isPending ? 0.55 : 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
                className={cn(
                  "flex items-center justify-between px-6 py-2.5 !rounded-xl border transition-all duration-500",
                  isRunning ? "bg-accent/5 border-blue-500 shadow-sm" : 
                  isDone ? "bg-transparent border-slate-300" : 
                  "bg-transparent border-slate-300/60"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-500",
                    isRunning ? "bg-accent/10 text-accent" :
                    isDone ? "bg-emerald-500/10 text-emerald-600" :
                    "bg-surface-border/50 text-text-faint"
                  )}>
                    {isDone ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: [1.15, 1] }} transition={{ duration: 0.3 }}>
                        <Check className="w-4 h-4" />
                      </motion.div>
                    ) : isRunning ? (
                      shouldReduceMotion ? (
                        <Icon className="w-4 h-4" />
                      ) : (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )
                    ) : (
                      <Icon className="w-4 h-4 opacity-50" />
                    )}
                  </div>
                  <span className={cn(
                    "text-sm font-medium tracking-tight transition-colors duration-500",
                    isRunning ? "text-text-primary" :
                    isDone ? "text-text-primary" :
                    "text-text-faint"
                  )}>
                    {stage.label}
                  </span>
                </div>
                
                <span className={cn(
                  "text-xs tracking-wide font-mono transition-colors duration-500 uppercase",
                  isRunning ? "text-accent" :
                  isDone ? "text-emerald-600" :
                  "text-text-faint"
                )}>
                  {index === 0 && isDone ? `${sources} sources` :
                   isRunning ? (shouldReduceMotion ? "Running..." : "Running") :
                   isDone ? "Complete" : "Queued"}
                </span>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-1 bg-white/80 backdrop-blur-sm border border-slate-300 !rounded-xl px-6 py-3 flex items-center justify-between relative z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative flex h-2 w-2 items-center justify-center">
              {!shouldReduceMotion && (
                <motion.div 
                  className="absolute inset-0 rounded-full bg-accent"
                  animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                />
              )}
              <div className="relative h-1.5 w-1.5 rounded-full bg-accent" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-text-primary">Pipeline ETA</span>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-accent">~{countdown}s</span>
          </div>
        </div>

      </GlassPanel>
    </motion.div>
  );
}
