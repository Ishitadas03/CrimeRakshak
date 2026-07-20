"use client";

import React from 'react';
import { motion, useInView, SVGMotionProps } from 'motion/react';
import { useMotionTokens } from '@/lib/motion-tokens';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface DrawLineProps extends SVGMotionProps<SVGPathElement> {
  delay?: number;
  pulse?: boolean;
}

export function DrawLine({ delay = 0, pulse = false, className, d, ...props }: DrawLineProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const { shouldReduceMotion } = useMotionTokens();

  return (
    <g ref={ref}>
      {/* Base line that draws on */}
      <motion.path
        d={d}
        className={cn("stroke-accent/30 fill-none", className)}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={isInView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.8, delay, ease: "easeInOut" }}
        {...props}
      />
      
      {/* Pulse overlay that flows along the path if pulse is true */}
      {pulse && isInView && !shouldReduceMotion && (
        <motion.path
          d={d}
          className={cn("stroke-accent fill-none blur-[2px]", className)}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="0 1"
          initial={{ pathLength: 0, pathOffset: 1, opacity: 0 }}
          animate={{ pathLength: 0.2, pathOffset: 0, opacity: [0, 1, 1, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: delay + 1.5,
            ease: "linear"
          }}
          {...props}
        />
      )}
    </g>
  );
}
