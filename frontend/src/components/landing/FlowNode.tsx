"use client";
import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassPanel } from './GlassPanel';

export interface FlowNodeProps extends HTMLMotionProps<"div"> {
  icon: LucideIcon;
  title: string;
  status?: 'default' | 'error' | 'warning' | 'success';
  className?: string;
  active?: boolean;
}

export function FlowNode({ icon: Icon, title, status = 'default', className, active, ...props }: FlowNodeProps) {
  const statusColors = {
    default: "bg-surface-border",
    error: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]",
    warning: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]",
    success: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]",
  };

  return (
    <motion.div
      className={cn("relative z-10 w-40", className)}
      {...props}
    >
      <GlassPanel className={cn(
        "p-4 flex flex-col items-center justify-center gap-3 text-center transition-colors",
        active && "border-accent shadow-[0_0_20px_rgba(139,92,246,0.2)]"
      )}>
        {status !== 'default' && (
          <div className="absolute top-3 right-3 flex items-center justify-center">
            <div className={cn("w-2 h-2 rounded-full", statusColors[status])} />
          </div>
        )}
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center border transition-colors",
          active ? "bg-accent/20 border-accent/50 text-accent" : "bg-bg-elevated/50 border-surface-border text-text-muted"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={cn(
          "text-xs font-bold uppercase tracking-wide",
          active ? "text-text-primary" : "text-text-muted"
        )}>
          {title}
        </span>
      </GlassPanel>
    </motion.div>
  );
}
