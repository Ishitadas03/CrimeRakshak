"use client";
import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'motion/react';
import { LucideIcon } from 'lucide-react';

export interface PillButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  className?: string;
}

export const PillButton = React.forwardRef<HTMLButtonElement, PillButtonProps>(
  ({ children, variant = 'primary', icon: Icon, iconPosition = 'right', className, ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-base";
    
    const variants = {
      primary: "bg-accent text-white hover:bg-accent-hover shadow-[0_0_15px_var(--color-accent-glow)] hover:shadow-[0_0_25px_var(--color-accent-glow)]",
      ghost: "bg-surface-glass text-text-primary border border-surface-border hover:bg-surface-border",
    };

    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        whileHover={{ y: -2, scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        {...props}
      >
        {Icon && iconPosition === 'left' && <Icon className="h-4 w-4" />}
        {children}
        {Icon && iconPosition === 'right' && (
          <motion.div
            className="inline-flex"
            whileHover={{ x: 3 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Icon className="h-4 w-4" />
          </motion.div>
        )}
      </motion.button>
    );
  }
);

PillButton.displayName = "PillButton";
