import React from 'react';
import { GlassPanel } from './GlassPanel';
import { Lock, Shield, FileCheck, Globe } from 'lucide-react';
import { MicroLabel } from './MicroLabel';

const securityFeatures = [
  { icon: Lock, title: "End-to-End Encryption", desc: "Military-grade AES-256 encryption at rest and in transit." },
  { icon: Shield, title: "Role-Based Access", desc: "Granular permissions mapped to officer hierarchy and precinct." },
  { icon: FileCheck, title: "Immutable Audit Logs", desc: "Every query and action is cryptographically signed and logged." },
  { icon: Globe, title: "Data Sovereignty", desc: "All infrastructure hosted exclusively within Indian borders." },
];

export function SecurityCompliance() {
  return (
    <section className="py-24 bg-bg-elevated relative overflow-hidden">
      <div className="container max-w-[1200px] mx-auto px-4 relative z-10">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <MicroLabel className="mb-4 inline-block text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
            Government Grade
          </MicroLabel>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-text-primary mb-4">
            Security is not an afterthought.
          </h2>
          <p className="text-text-muted">
            Built from the ground up to meet the stringent security requirements of state and national law enforcement agencies.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {securityFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <GlassPanel key={feature.title} className="p-6 border-surface-border">
                <div className="w-10 h-10 rounded-lg bg-surface-glass border border-surface-border flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-text-primary" />
                </div>
                <h3 className="text-sm font-bold text-text-primary mb-2 tracking-tight">{feature.title}</h3>
                <p className="text-xs text-text-muted leading-relaxed">{feature.desc}</p>
              </GlassPanel>
            );
          })}
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-surface-border bg-surface-glass text-xs font-semibold text-text-muted">
            <Shield className="w-4 h-4 text-emerald-400" />
            ISO 27001 Architected
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-surface-border bg-surface-glass text-xs font-semibold text-text-muted">
            <Shield className="w-4 h-4 text-emerald-400" />
            100% Data Residency (India)
          </div>
        </div>

      </div>
    </section>
  );
}
