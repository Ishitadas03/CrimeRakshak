import React from 'react';
import { cn } from '@/lib/utils';

export interface MicroLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  dashed?: boolean;
}

export function MicroLabel({ children, className, dashed = false, ...props }: MicroLabelProps) {
  return (
    <span 
      className={cn(
        "text-[10px] font-bold uppercase tracking-widest text-text-muted", 
        dashed && "border-b border-dashed border-text-muted/50 pb-0.5",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
