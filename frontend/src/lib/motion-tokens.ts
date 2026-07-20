"use client";

import { useReducedMotion } from 'motion/react';

export function useMotionTokens() {
  const shouldReduceMotion = useReducedMotion();

  const instantTransition = { duration: 0 };

  const tier1Config = {
    initial: { opacity: 0, y: 20 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: shouldReduceMotion 
      ? instantTransition 
      : { type: "spring" as const, stiffness: 300, damping: 25 },
    stagger: 0.05
  };

  const tier2Config = {
    initial: { opacity: 0, y: 30 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: shouldReduceMotion
      ? instantTransition
      : { type: "spring" as const, stiffness: 200, damping: 30 },
    stagger: 0.12
  };

  // Variants-safe versions (without stagger, which isn't a valid Variant key)
  const { stagger: _s1, ...tier1Variants } = tier1Config;
  const { stagger: _s2, ...tier2Variants } = tier2Config;

  return {
    tier1: tier1Config,
    tier1Variants,
    tier2: tier2Config,
    tier2Variants,

    tier3: {
      transition: shouldReduceMotion
        ? instantTransition
        : { duration: 14, ease: "easeInOut" as const, repeat: Infinity, repeatType: "reverse" as const }
    },

    exit: {
      initial: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -8 },
      transition: shouldReduceMotion
        ? instantTransition
        : { duration: 0.15, ease: "easeIn" as const }
    },
    
    shouldReduceMotion
  };
}
