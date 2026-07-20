"use client";

import React from 'react';
import { GlassPanel } from './GlassPanel';
import { MicroLabel } from './MicroLabel';
import { PillButton } from './PillButton';
import { ArrowRight, Settings2, SlidersHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';

export function FeatureSpotlight1() {
  return (
    <section className="py-24 bg-bg-elevated relative overflow-hidden">
      <div className="container max-w-[1200px] mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Text Content (Left) */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="max-w-xl"
          >
            <MicroLabel className="mb-4 inline-block px-2 py-1 bg-accent/10 text-accent rounded">
              Feature Spotlight
            </MicroLabel>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-text-primary mb-6">
              Test policies safely. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-hover">Before deployment.</span>
            </h2>
            <p className="text-lg text-text-muted leading-relaxed mb-8">
              Model curfews, festival crowds, and resource shifts before they happen. The Digital Twin Simulator lets you instantly see how environmental modifiers and patrol deployments impact city-wide crime rates.
            </p>
            <PillButton variant="ghost" icon={ArrowRight}>
              Explore the Simulator
            </PillButton>
          </motion.div>

          {/* Visual (Right) */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl p-2 bg-surface-glass border border-accent/20 shadow-[0_8px_30px_rgba(37,99,235,0.15)] backdrop-blur-xl">
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-bg-elevated border border-surface-border">
                {/* Fallback pattern */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                
                {/* Image Placeholder */}
                <Image 
                  src="/simulator-mockup.webp" 
                  alt="Digital Twin Simulator"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-left-top opacity-90"
                />
              </div>

              {/* Callouts */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="absolute top-[20%] -left-8 md:-left-12"
              >
                <GlassPanel className="flex items-center gap-2 p-2 pr-4 shadow-[0_8px_30px_rgba(15,23,42,0.12)] border-accent/30">
                  <div className="bg-accent/10 p-1.5 rounded-lg text-accent">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-text-primary">Policy Modifiers</span>
                </GlassPanel>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 }}
                className="absolute bottom-[20%] -right-8 md:-right-12"
              >
                <GlassPanel className="flex items-center gap-2 p-2 pr-4 shadow-[0_8px_30px_rgba(15,23,42,0.12)] border-sky-600/30">
                  <div className="bg-sky-600/10 p-1.5 rounded-lg text-sky-600">
                    <Settings2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-text-primary">Resource Allocation</span>
                </GlassPanel>
              </motion.div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
