import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { GlassPanel } from './GlassPanel';
import { MicroLabel } from './MicroLabel';

export interface StatTileProps {
  icon: LucideIcon;
  value: React.ReactNode;
  label: string;
  tint?: 'accent' | 'sky' | 'emerald' | 'amber' | 'red';
  className?: string;
}

export function StatTile({ icon: Icon, value, label, tint = 'accent', className }: StatTileProps) {
  const tintStyles = {
    accent: "bg-accent/10 text-accent border-accent/20",
    sky: "bg-sky-600/10 text-sky-600 border-sky-600/20",
    emerald: "bg-emerald-600/10 text-emerald-600 border-emerald-600/20",
    amber: "bg-amber-600/10 text-amber-600 border-amber-600/20",
    red: "bg-red-600/10 text-red-600 border-red-600/20",
  };

  return (
    <GlassPanel hoverEffect className={cn("p-6 flex flex-col items-start gap-4", className)}>
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border", tintStyles[tint])}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-3xl lg:text-4xl font-black text-text-primary tracking-tight mb-1">
          {value}
        </div>
        <MicroLabel>{label}</MicroLabel>
      </div>
    </GlassPanel>
  );
}
