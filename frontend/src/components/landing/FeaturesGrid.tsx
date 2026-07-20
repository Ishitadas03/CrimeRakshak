"use client";

import React, { useRef, useState, useEffect } from 'react';
import { GlassPanel } from './GlassPanel';
import { ShieldAlert, Cpu, Network, Map, Activity, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useMotionTokens } from '@/lib/motion-tokens';

const features = [
  { 
    icon: Cpu, 
    title: "AI Prediction Engine", 
    description: "Simulate future crime trends based on historical patterns and seasonal data.",
    tint: "text-accent bg-accent/10 border-accent/20"
  },
  { 
    icon: Map, 
    title: "Interactive Heatmaps", 
    description: "Visualize high-risk zones across all Karnataka districts in real-time.",
    tint: "text-sky-600 bg-sky-600/10 border-sky-600/20"
  },
  { 
    icon: Activity, 
    title: "Anomaly Detection", 
    description: "Automated alerts for sudden crime surges or unusual patterns.",
    tint: "text-amber-600 bg-amber-600/10 border-amber-600/20"
  },
  { 
    icon: ShieldAlert, 
    title: "Digital Twin Simulator", 
    description: "Simulate the impact of patrol deployments and policy changes.",
    tint: "text-emerald-600 bg-emerald-600/10 border-emerald-600/20"
  },
  { 
    icon: Network, 
    title: "Advanced Analytics", 
    description: "Deep dive into district-level and category-specific crime statistics.",
    tint: "text-red-600 bg-red-600/10 border-red-600/20"
  },
  { 
    icon: Clock, 
    title: "AI Copilot", 
    description: "Query complex data streams in natural language for instant insights.",
    tint: "text-accent bg-accent/10 border-accent/20"
  },
];

function SpotlightCard({ children }: { children: React.ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDesktop(window.innerWidth >= 1024 && window.matchMedia("(hover: hover)").matches);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDesktop || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Use requestAnimationFrame for performance
    requestAnimationFrame(() => {
      if (cardRef.current) {
        cardRef.current.style.setProperty('--x', `${x}px`);
        cardRef.current.style.setProperty('--y', `${y}px`);
      }
    });
  };

  return (
    <div 
      ref={cardRef} 
      className="h-full relative group" 
      onMouseMove={handleMouseMove}
    >
      <GlassPanel hoverEffect className="p-6 h-full flex flex-col relative overflow-hidden bg-surface-glass">
        {/* Spotlight Effect overlay */}
        {isDesktop && (
          <div 
            className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: 'radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(37,99,235,0.06), transparent 60%)'
            }}
          />
        )}
        
        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          {children}
        </div>
      </GlassPanel>
    </div>
  );
}

export function FeaturesGrid() {
  const { tier1 } = useMotionTokens();

  const containerVariants = {
    hidden: {},
    show: {
      transition: { staggerChildren: tier1.stagger }
    }
  };

  const itemVariants = {
    hidden: tier1.initial,
    show: { ...tier1.animate, transition: tier1.transition }
  };

  return (
    <section className="py-24 bg-bg-base relative overflow-hidden" id="features">
      <div className="container max-w-[1200px] mx-auto px-4 relative z-10">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-text-primary mb-4">
            Everything you need to predict and prevent.
          </h2>
          <p className="text-text-muted">
            A complete suite of AI-powered tools designed specifically for modern law enforcement operations.
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.title} variants={itemVariants}>
                <SpotlightCard>
                  <div className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center mb-6 border transition-transform duration-300",
                    feature.tint,
                    "group-hover:scale-110 group-hover:rotate-6"
                  )}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-2 tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {feature.description}
                  </p>
                </SpotlightCard>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}
