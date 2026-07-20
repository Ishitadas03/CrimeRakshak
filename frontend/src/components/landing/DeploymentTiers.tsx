"use client";

import React from 'react';
import { GlassPanel } from './GlassPanel';
import { PillButton } from './PillButton';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

const tiers = [
  {
    name: "Precinct Level",
    scope: "Single station/precinct",
    desc: "Core intelligence tools for local deployment.",
    features: [
      "Core dashboard & insights",
      "Interactive heatmaps",
      "Up to 5 officer seats",
      "Standard email support"
    ],
    elevated: false
  },
  {
    name: "District Command",
    scope: "Multi-precinct district",
    desc: "Advanced modeling for wide-area operations.",
    features: [
      "Everything in Precinct Level",
      "Digital Twin Simulator",
      "Cross-precinct analytics",
      "AI Copilot access",
      "Priority phone support"
    ],
    elevated: true
  },
  {
    name: "State Headquarters",
    scope: "State-wide",
    desc: "Full enterprise suite for state command.",
    features: [
      "Everything in District Command",
      "Full anomaly detection suite",
      "Custom integrations (CCTNS/112)",
      "Dedicated support SLA",
      "On-premise deployment options"
    ],
    elevated: false
  }
];

export function DeploymentTiers() {
  return (
    <section className="py-24 bg-bg-elevated relative overflow-hidden" id="deployment">
      <div className="container max-w-[1200px] mx-auto px-4 relative z-10">
        
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-24">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-text-primary mb-4">
            Scaled for your jurisdiction.
          </h2>
          <p className="text-text-muted">
            From single precincts to state-wide headquarters, deploy the intelligence tools that match your operational scope.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-center max-w-5xl mx-auto">
          {tiers.map((tier, i) => (
            <motion.div 
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={cn("h-full", tier.elevated && "md:-mt-8 md:-mb-8 relative z-10")}
            >
              <GlassPanel 
                className={cn(
                  "p-8 h-full flex flex-col relative",
                  tier.elevated ? "border-accent shadow-[0_0_40px_rgba(37,99,235,0.15)] bg-surface-glass/80" : "border-surface-border bg-surface-glass/40"
                )}
              >
                {/* Ambient glow on middle tier */}
                {tier.elevated && (
                  <motion.div 
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-accent/5 blur-2xl rounded-2xl pointer-events-none"
                  />
                )}
                {tier.elevated && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-accent text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                      Most Deployed
                    </span>
                  </div>
                )}
                
                <h3 className="text-xl font-bold text-text-primary mb-1">{tier.name}</h3>
                <p className="text-sm font-semibold text-accent mb-4">{tier.scope}</p>
                <p className="text-sm text-text-muted mb-8">{tier.desc}</p>
                
                <ul className="flex flex-col gap-4 mb-8 flex-grow">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-start gap-3">
                      <div className="mt-0.5 w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-accent" />
                      </div>
                      <span className="text-sm text-text-primary">{f}</span>
                    </li>
                  ))}
                </ul>

                <PillButton 
                  variant={tier.elevated ? "primary" : "ghost"} 
                  className="w-full"
                  onClick={() => window.location.href = '/overview'}
                >
                  Request Briefing
                </PillButton>
              </GlassPanel>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
