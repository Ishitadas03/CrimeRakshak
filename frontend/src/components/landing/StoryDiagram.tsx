"use client";

import React, { useRef, useState } from 'react';
import { FlowNode } from './FlowNode';
import { Database, FolderOpen, Network, FileSpreadsheet, BrainCircuit, Activity } from 'lucide-react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'motion/react';
import { DrawLine } from './DrawLine';
import { useMotionTokens } from '@/lib/motion-tokens';

export function StoryDiagram() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSolved, setIsSolved] = useState(false);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 70%", "end 30%"]
  });
  
  const { shouldReduceMotion } = useMotionTokens();

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest > 0.3 && !isSolved) setIsSolved(true);
    if (latest <= 0.3 && isSolved) setIsSolved(false);
  });

  const NODES = [
    { id: "cctns", icon: Database, title: "CCTNS Data", 
      prob: { left: "20%", top: "15%" }, 
      sol: { left: "15%", top: "20%" }, 
      delay: 0 },
    { id: "logs", icon: FileSpreadsheet, title: "Manual Logs", 
      prob: { left: "35%", top: "80%" }, 
      sol: { left: "15%", top: "40%" }, 
      delay: 1 },
    { id: "files", icon: FolderOpen, title: "Local Files", 
      prob: { left: "10%", top: "65%" }, 
      sol: { left: "15%", top: "60%" }, 
      delay: 0.5 },
    { id: "iot", icon: Network, title: "IoT Sensors", 
      prob: { left: "40%", top: "25%" }, 
      sol: { left: "15%", top: "80%" }, 
      delay: 1.5 },
  ];

  return (
    <section ref={containerRef} className="relative bg-bg-base overflow-hidden py-16 lg:py-24">
      <div className="container max-w-[1200px] mx-auto px-4">
          
          {/* Text Content Morphing */}
          <div className="relative h-40 max-w-2xl mx-auto text-center mb-10">
            <AnimatePresence mode="wait">
              {!isSolved ? (
                <motion.div
                  key="problem-text"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0"
                >
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-text-primary mb-6">
                    The cost of <span className="text-red-600">fragmented</span> intelligence.
                  </h2>
                  <p className="text-base md:text-lg text-text-muted leading-relaxed">
                    Reactive responses. Siloed data. Manual analytics. Patterns hidden until it&apos;s too late. When law enforcement relies on disconnected systems, the advantage belongs to the criminals.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="solution-text"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0"
                >
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-text-primary mb-6">
                    Centralized intelligence. <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-hover">Actionable predictions.</span>
                  </h2>
                  <p className="text-base md:text-lg text-text-muted leading-relaxed">
                    CrimeRakshak unifies your data streams into a single AI engine, turning historical logs and live feeds into predictive insights in real-time.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Diagram Area */}
          <div className="relative h-[400px] md:h-[500px] w-full max-w-5xl mx-auto hidden sm:block">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none" />

            {/* Connectors (Only visible in solution state) */}
            <AnimatePresence>
              {isSolved && (
                <motion.svg 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 w-full h-full pointer-events-none z-0"
                  viewBox="0 0 1000 500"
                  preserveAspectRatio="none"
                >
                  <DrawLine d="M 150 100 C 300 100, 300 250, 500 250" delay={0.2} pulse />
                  <DrawLine d="M 150 200 C 300 200, 300 250, 500 250" delay={0.4} pulse />
                  <DrawLine d="M 150 300 C 300 300, 300 250, 500 250" delay={0.6} pulse />
                  <DrawLine d="M 150 400 C 300 400, 300 250, 500 250" delay={0.8} pulse />
                  <DrawLine d="M 500 250 L 850 250" delay={1.2} pulse className="stroke-accent" />
                </motion.svg>
              )}
            </AnimatePresence>

            {/* Source Nodes */}
            {NODES.map((node, i) => {
              const activePos = isSolved ? node.sol : node.prob;
              const floating = shouldReduceMotion ? {} : {
                y: isSolved ? 0 : [0, (i % 2 === 0 ? -8 : 8), 0],
                rotate: isSolved ? 0 : [0, (i % 2 === 0 ? 3 : -3), 0],
              };
              
              return (
                <motion.div
                  key={node.id}
                  layout
                  initial={false}
                  animate={{
                    left: activePos.left,
                    top: activePos.top,
                    ...floating
                  }}
                  transition={{
                    layout: { type: "spring", stiffness: 60, damping: 15 },
                    y: { repeat: Infinity, duration: 4 + i, ease: "easeInOut" },
                    rotate: { repeat: Infinity, duration: 5 + i, ease: "easeInOut" }
                  }}
                  className="absolute z-10 w-[140px] md:w-[160px] -translate-x-1/2 -translate-y-1/2"
                >
                  <FlowNode icon={node.icon} title={node.title} status={isSolved ? "success" : "warning"} />
                </motion.div>
              );
            })}

            {/* Central AI Engine */}
            <AnimatePresence>
              {isSolved && (
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1.25, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
                >
                  <div className="absolute inset-0 bg-accent/20 blur-[40px] rounded-full" />
                  <FlowNode 
                    icon={BrainCircuit} 
                    title="CrimeRakshak Engine" 
                    active
                    className="w-[180px] shadow-[0_0_50px_rgba(37,99,235,0.2)]"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Output Node (Right) */}
            <AnimatePresence>
              {isSolved && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: -20 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.8 }}
                  className="absolute left-[85%] top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-[140px] md:w-[160px]"
                >
                  <FlowNode 
                    icon={Activity} 
                    title="Predictive Insights" 
                    active 
                  />
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
    </section>
  );
}
