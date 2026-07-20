"use client";

import React, { useRef, useState, useEffect } from 'react';
import { GlassPanel } from './GlassPanel';
import { Quote } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useMotionTokens } from '@/lib/motion-tokens';

const testimonials = [
  {
    quote: "The ability to simulate patrol deployments during major festivals before committing resources on the ground has fundamentally changed how we operate.",
    name: "A. Kumar",
    role: "District Command (Illustrative)",
    initials: "AK"
  },
  {
    quote: "We used to analyze hotspots days after incidents occurred. Now, the AI Copilot flags anomalous patterns in real-time, allowing proactive intervention.",
    name: "S. Rao",
    role: "Nodal Officer (Illustrative)",
    initials: "SR"
  },
  {
    quote: "Explainable AI is the difference-maker. When we present predictive deployment plans, we can actually point to the exact variables driving the decision.",
    name: "Dr. M. Singh",
    role: "Strategic Analysis (Illustrative)",
    initials: "MS"
  }
];

function TiltCard({ children }: { children: React.ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const { shouldReduceMotion } = useMotionTokens();

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [4, -4]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-4, 4]), { stiffness: 300, damping: 30 });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDesktop(window.innerWidth >= 1024 && window.matchMedia("(hover: hover)").matches);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDesktop || shouldReduceMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(normX);
    y.set(normY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: isDesktop && !shouldReduceMotion ? rotateX : 0,
        rotateY: isDesktop && !shouldReduceMotion ? rotateY : 0,
        perspective: 1000
      }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

export function Testimonials() {
  const { tier1, tier1Variants } = useMotionTokens();

  return (
    <section className="py-24 bg-bg-base overflow-hidden">
      <div className="container max-w-[1200px] mx-auto px-4">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-text-primary mb-4">
            Trusted by commanders.
          </h2>
          <p className="text-text-muted">
            See how predictive intelligence transforms reactive policing into proactive strategy.
          </p>
        </div>

        <motion.div 
          className="grid md:grid-cols-3 gap-6"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          transition={{ staggerChildren: tier1.stagger }}
        >
          {testimonials.map((t, i) => (
            <motion.div 
              key={i}
              variants={tier1Variants}
              className="h-full"
            >
              <TiltCard>
                <GlassPanel hoverEffect={false} className="p-8 h-full flex flex-col relative overflow-hidden group">
                  <Quote className="absolute top-4 right-4 w-24 h-24 text-surface-border opacity-50 -rotate-12 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500 pointer-events-none" />
                  
                  <p className="text-sm text-text-primary leading-relaxed mb-8 relative z-10 font-medium">
                    &quot;{t.quote}&quot;
                  </p>
                  
                  <div className="mt-auto flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent font-bold text-xs">
                      {t.initials}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">{t.name}</h4>
                      <p className="text-xs text-text-muted">{t.role}</p>
                    </div>
                  </div>
                </GlassPanel>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
