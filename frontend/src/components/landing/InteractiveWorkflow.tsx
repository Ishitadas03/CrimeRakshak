"use client";

import React, { useRef, useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'motion/react';
import { Database, BrainCircuit, MapPin, CarFront } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PillButton } from './PillButton';
import { MicroLabel } from './MicroLabel';

const steps = [
  { icon: Database, title: "Ingest Data", desc: "CCTNS & live feeds" },
  { icon: BrainCircuit, title: "AI Analysis", desc: "Pattern recognition" },
  { icon: MapPin, title: "Predict Hotspots", desc: "High-risk zones" },
  { icon: CarFront, title: "Dispatch Units", desc: "Proactive patrol" },
];

export function InteractiveWorkflow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    // Map 0-1 to 0-3 index
    const index = Math.min(3, Math.max(0, Math.floor(latest * 4)));
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  });

  return (
    <section ref={containerRef} className="py-32 bg-bg-elevated relative">
      <div className="container max-w-[1000px] mx-auto px-4">
        
        <div className="text-center mb-16 md:mb-24">
          <MicroLabel className="mb-4 inline-block">The Operational Loop</MicroLabel>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-text-primary">
            From raw data to <span className="text-accent">deployment</span>.
          </h2>
        </div>

        <div className="relative">
          
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-12 right-12 h-1 bg-surface-border rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-accent"
              style={{ scaleX: scrollYProgress, transformOrigin: "left" }}
            />
          </div>
          
          {/* Connecting Line (Mobile) */}
          <div className="md:hidden absolute top-12 bottom-12 left-8 w-1 bg-surface-border rounded-full overflow-hidden">
             <motion.div 
              className="w-full bg-accent"
              style={{ scaleY: scrollYProgress, transformOrigin: "top" }}
            />
          </div>

          <div className="flex flex-col md:flex-row justify-between gap-8 md:gap-4 relative z-10">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = i <= activeIndex;
              const isCurrent = i === activeIndex;

              return (
                <div key={step.title} className="flex md:flex-col items-center gap-6 md:gap-4 flex-1">
                  
                  <motion.div 
                    animate={{ 
                      scale: isCurrent ? 1.1 : 1,
                      backgroundColor: isActive ? "var(--color-bg-base)" : "var(--color-bg-elevated)",
                      borderColor: isActive ? "var(--color-accent)" : "var(--color-surface-border)"
                    }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "w-16 h-16 md:w-24 md:h-24 rounded-2xl flex items-center justify-center border-2 transition-colors relative shadow-[0_8px_30px_rgba(15,23,42,0.08)]",
                      isActive ? "text-accent" : "text-text-muted"
                    )}
                  >
                    {isCurrent && (
                      <div className="absolute inset-0 bg-accent/20 blur-xl rounded-2xl" />
                    )}
                    <Icon className="w-8 h-8 md:w-10 md:h-10 relative z-10" />
                  </motion.div>

                  <div className="text-left md:text-center">
                    <h3 className={cn(
                      "text-lg font-bold tracking-tight transition-colors mb-1",
                      isActive ? "text-text-primary" : "text-text-muted"
                    )}>
                      {step.title}
                    </h3>
                    <p className="text-sm text-text-faint">{step.desc}</p>
                  </div>
                  
                </div>
              );
            })}
          </div>

        </div>
        
        {/* Scroll affordance */}
        <div className="mt-20 text-center text-text-muted/50 hidden md:block">
          <p className="text-sm tracking-widest uppercase">Scroll to progress workflow</p>
          <div className="w-px h-16 bg-gradient-to-b from-text-muted/50 to-transparent mx-auto mt-4" />
        </div>

      </div>
    </section>
  );
}
