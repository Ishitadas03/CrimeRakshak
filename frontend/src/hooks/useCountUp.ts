import { useEffect, useRef } from 'react';
import { useInView, useSpring, useTransform } from 'motion/react';
import { useMotionTokens } from '@/lib/motion-tokens';

export function useCountUp(end: number, decimals: number = 0) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { shouldReduceMotion } = useMotionTokens();

  // Create a spring value that starts at 0
  const springValue = useSpring(0, {
    stiffness: 100,
    damping: 20,
    mass: 1,
    restDelta: 0.001
  });

  useEffect(() => {
    if (isInView) {
      if (shouldReduceMotion) {
        springValue.jump(end);
      } else {
        springValue.set(end);
      }
    }
  }, [isInView, end, shouldReduceMotion, springValue]);

  // Transform the numerical spring value into a formatted string
  const formattedCount = useTransform(springValue, (value) => value.toFixed(decimals));

  return { count: formattedCount, ref };
}
