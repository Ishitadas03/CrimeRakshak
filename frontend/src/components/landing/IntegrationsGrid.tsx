import React from 'react';
import { GlassPanel } from './GlassPanel';
import { Database, Video, PhoneCall, Network } from 'lucide-react';
import { MicroLabel } from './MicroLabel';

const integrations = [
  { icon: Database, name: "CCTNS API" },
  { icon: Video, name: "Traffic Cameras" },
  { icon: PhoneCall, name: "Emergency 112" },
  { icon: Network, name: "IoT Sensors" },
];

export function IntegrationsGrid() {
  return (
    <section className="py-24 border-y border-surface-border bg-bg-elevated overflow-hidden">
      <div className="container max-w-[1000px] mx-auto px-4 text-center">
        <MicroLabel className="mb-12 inline-block">Seamless Integrations</MicroLabel>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {integrations.map((item) => {
            const Icon = item.icon;
            return (
              <GlassPanel key={item.name} hoverEffect className="p-6 flex flex-col items-center justify-center gap-4 border-surface-border bg-surface-glass/50">
                <Icon className="w-8 h-8 text-text-muted" />
                <span className="text-sm font-semibold text-text-primary">{item.name}</span>
              </GlassPanel>
            );
          })}
        </div>
      </div>
    </section>
  );
}
