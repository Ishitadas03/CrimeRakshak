"use client";

import React, { useRef } from 'react';
import { FlowNode } from './FlowNode';
import { Database, Network, FileSpreadsheet, BrainCircuit, AlertTriangle, Clock, Map, Activity } from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';

export function SolutionWorkflow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const pathLength = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  return (
    <section ref={containerRef} className="py-24 bg-bg-base overflow-hidden">
      <div className="container max-w-[1200px] mx-auto px-4">
        
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-text-primary mb-6">
            Centralized intelligence. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-hover">Actionable predictions.</span>
          </h2>
          <p className="text-lg text-text-muted leading-relaxed">
            CrimeRakshak unifies your data streams into a single AI engine, turning historical logs and live feeds into predictive insights in real-time.
          </p>
        </div>

        <div className="relative h-[600px] max-w-4xl mx-auto flex items-center justify-center">
          
          {/* Animated SVG Connectors */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            <defs>
              <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--color-surface-border)" />
                <stop offset="100%" stopColor="var(--color-accent)" />
              </linearGradient>
            </defs>
            
            {/* Top Left to Center */}
            <motion.path 
              d="M 150 150 C 300 150, 200 300, 450 300" 
              fill="none" 
              stroke="url(#flow-gradient)" 
              strokeWidth="2" 
              strokeDasharray="1 1"
              style={{ pathLength }}
              className="hidden md:block"
            />
            {/* Bottom Left to Center */}
            <motion.path 
              d="M 150 450 C 300 450, 200 300, 450 300" 
              fill="none" 
              stroke="url(#flow-gradient)" 
              strokeWidth="2" 
              strokeDasharray="1 1"
              style={{ pathLength }}
              className="hidden md:block"
            />
            {/* Center to Right */}
            <motion.path 
              d="M 450 300 C 600 300, 700 300, 750 300" 
              fill="none" 
              stroke="var(--color-accent)" 
              strokeWidth="2" 
              strokeDasharray="1 1"
              style={{ pathLength }}
              className="hidden md:block"
            />
          </svg>

          {/* Input Nodes (Left) */}
          <div className="absolute left-0 inset-y-0 w-40 hidden md:flex flex-col justify-around">
            <FlowNode icon={Database} title="CCTNS Data" status="success" />
            <FlowNode icon={Network} title="IoT Sensors" status="success" />
            <FlowNode icon={FileSpreadsheet} title="Historical Logs" status="success" />
          </div>

          {/* Central AI Engine */}
          <div className="relative z-10 scale-125">
            <div className="absolute inset-0 bg-accent/20 blur-[50px] rounded-full" />
            <FlowNode 
              icon={BrainCircuit} 
              title="CrimeRakshak Engine" 
              active
              className="w-48 shadow-[0_0_50px_rgba(139,92,246,0.3)]"
            />
          </div>

          {/* Output Node (Right) */}
          <div className="absolute right-0 inset-y-0 w-40 hidden md:flex flex-col justify-center">
            <FlowNode 
              icon={Activity} 
              title="Predictive Insights" 
              active 
            />
          </div>

          {/* Mobile view fallback (stack) */}
          <div className="md:hidden flex flex-col items-center gap-8 w-full z-10">
            <div className="flex gap-4">
              <FlowNode icon={Database} title="CCTNS" status="success" className="w-32" />
              <FlowNode icon={Network} title="IoT" status="success" className="w-32" />
            </div>
            <div className="w-1 h-8 bg-accent/30 rounded-full" />
            <FlowNode icon={BrainCircuit} title="CrimeRakshak" active className="w-48 scale-110" />
            <div className="w-1 h-8 bg-accent/50 rounded-full" />
            <FlowNode icon={Activity} title="Insights" active className="w-40" />
          </div>

        </div>
      </div>
    </section>
  );
}
