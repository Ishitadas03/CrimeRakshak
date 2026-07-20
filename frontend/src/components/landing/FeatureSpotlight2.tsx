"use client";

import React from 'react';
import { GlassPanel } from './GlassPanel';
import { MicroLabel } from './MicroLabel';
import { PillButton } from './PillButton';
import { ArrowRight, BarChartHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import { useMotionTokens } from '@/lib/motion-tokens';
import { cn } from '@/lib/utils';

const shapData = [
  { name: 'Historical Density', impact: 45 },
  { name: 'Time of Day', impact: 30 },
  { name: 'Event Proximity', impact: 15 },
  { name: 'Weather Index', impact: -10 },
];

export function FeatureSpotlight2() {

  return (
    <section className="py-24 bg-bg-base relative overflow-hidden">
      <div className="container max-w-[1200px] mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Visual (Left) */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative rounded-2xl p-2 bg-surface-glass border border-sky-600/20 shadow-[0_8px_30px_rgba(2,132,199,0.15)] backdrop-blur-xl">
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-bg-elevated border border-surface-border">
                {/* Fallback pattern */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                
                {/* Image Placeholder */}
                <Image 
                  src="/copilot-mockup.webp" 
                  alt="AI Copilot & Explainability"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover opacity-90"
                />
              </div>

              {/* SHAP Chart Callout */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="absolute -bottom-8 md:-bottom-12 -right-4 md:-right-12 w-72 md:w-80"
              >
                <GlassPanel className="p-4 md:p-5 shadow-[0_12px_40px_rgba(15,23,42,0.15)] border-surface-border">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-accent/10 p-1.5 rounded text-accent">
                      <BarChartHorizontal className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Feature Importance</span>
                  </div>
                  
                  {/* Custom animated SHAP bars */}
                  <motion.div 
                    className="flex flex-col gap-3"
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                    transition={{ staggerChildren: 0.15, delayChildren: 0.6 }}
                  >
                    {shapData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <span className="text-[10px] md:text-xs font-medium text-text-muted w-24 shrink-0 truncate">
                          {entry.name}
                        </span>
                        <div className="flex-1 h-3 bg-surface-border/50 rounded-full overflow-hidden relative flex items-center">
                          {/* Center zero line */}
                          <div className="absolute left-[20%] top-0 bottom-0 w-px bg-text-muted/30 z-10" />
                          
                          {/* The Bar */}
                          <motion.div 
                            variants={{
                              initial: { scaleX: 0 },
                              animate: { scaleX: 1, transition: { type: "spring", stiffness: 100, damping: 20 } }
                            }}
                            style={{ 
                              width: `${Math.abs(entry.impact)}%`, 
                              marginLeft: entry.impact > 0 ? '20%' : `${20 + entry.impact}%`,
                              transformOrigin: entry.impact > 0 ? 'left' : 'right'
                            }}
                            className={cn(
                              "h-full rounded-full relative z-0",
                              entry.impact > 0 ? "bg-accent" : "bg-sky-500"
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </motion.div>
                  
                </GlassPanel>
              </motion.div>

            </div>
          </motion.div>

          {/* Text Content (Right) */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-xl order-1 lg:order-2"
          >
            <MicroLabel className="mb-4 inline-block px-2 py-1 bg-sky-600/10 text-sky-600 rounded">
              Explainable AI
            </MicroLabel>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-text-primary mb-6">
              Every prediction, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">explained.</span>
            </h2>
            <p className="text-lg text-text-muted leading-relaxed mb-8">
              Black-box models don&apos;t hold up in court. CrimeRakshak provides full transparency through natural language querying and SHAP-value feature decompositions, so you always know <i>why</i> a prediction was made.
            </p>
            <PillButton variant="ghost" icon={ArrowRight}>
              See Model Transparency
            </PillButton>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
