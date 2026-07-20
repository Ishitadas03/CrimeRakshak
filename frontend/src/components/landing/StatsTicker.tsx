"use client";

import React from 'react';
import { StatTile } from './StatTile';
import { Activity, ShieldCheck, Zap, Database } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { motion } from 'motion/react';
import { useMotionTokens } from '@/lib/motion-tokens';

function AnimatedStat({ 
  value, 
  suffix, 
  decimals = 0, 
  ...props 
}: Omit<React.ComponentProps<typeof StatTile>, 'value'> & { value: number, suffix: string, decimals?: number }) {
  const { count, ref } = useCountUp(value, decimals);
  
  const { tier1Variants } = useMotionTokens();
  
  return (
    <motion.div ref={ref} variants={tier1Variants}>
      <StatTile 
        {...props} 
        value={<><motion.span>{count}</motion.span>{suffix}</>} 
      />
    </motion.div>
  );
}

export function StatsTicker() {
  const { tier1 } = useMotionTokens();

  return (
    <section className="py-20 relative overflow-hidden bg-bg-base">
      <div className="container max-w-[1200px] mx-auto px-4 relative z-10">
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          transition={{ staggerChildren: tier1.stagger }}
        >
          <AnimatedStat
            icon={Activity}
            value={99.9}
            decimals={1}
            suffix="%"
            label="System Uptime"
            tint="emerald"
          />
          <AnimatedStat
            icon={Database}
            value={27}
            suffix="+"
            label="Crime Categories"
            tint="sky"
          />
          <AnimatedStat
            icon={ShieldCheck}
            value={68.4}
            decimals={1}
            suffix="%"
            label="Resolution Rate"
            tint="accent"
          />
          <AnimatedStat
            icon={Zap}
            value={15}
            suffix="ms"
            label="Query Latency"
            tint="amber"
          />
        </motion.div>
      </div>
    </section>
  );
}
