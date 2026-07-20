"use client";

import React, { MouseEvent } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'motion/react';
import { ArrowRight, ChevronDown, Activity, MapPin, Database, PhoneCall, ShieldCheck } from 'lucide-react';
import { PillButton } from './PillButton';
import { useMotionTokens } from '@/lib/motion-tokens';
import { IllustrationStage } from './illustration/IllustrationStage';

export function Hero() {
  const { tier2, shouldReduceMotion } = useMotionTokens();
  const { scrollY } = useScroll();
  
  // Parallax offsets
  const textY = useTransform(scrollY, [0, 600], [0, -40]);
  const illustrationY = useTransform(scrollY, [0, 600], [0, -10]);
  const floatingY1 = useTransform(scrollY, [0, 600], [0, -60]);
  const floatingY2 = useTransform(scrollY, [0, 600], [0, -30]);

  // Spotlight Cursor Glow
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 100 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const containerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.25,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
    },
  };

  const scrollToFinalCTA = () => {
    const sections = document.querySelectorAll('section');
    const lastSection = sections[sections.length - 2];
    if (lastSection) {
      lastSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToIllustration = () => {
    const stage = document.getElementById('hero-illustration-stage');
    if (stage) {
      stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <section 
      className="relative pt-24 pb-12 lg:pt-32 lg:pb-16 overflow-hidden flex flex-col items-center min-h-screen group justify-center mesh-pipeline"
      onMouseMove={handleMouseMove}
    >
      {/* Interactive Spotlight Glow */}
      <motion.div
        className="pointer-events-none absolute w-[800px] h-[800px] bg-indigo-400/10 rounded-full blur-[150px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out hidden xl:block z-0"
        style={{
          x: smoothMouseX,
          y: smoothMouseY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />

      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="container max-w-[1400px] mx-auto px-4 sm:px-6 relative z-10 w-full flex flex-col items-center"
      >
        
        {/* ─── Top Section: Centered Typography & CTAs ─── */}
        <motion.div
          style={!shouldReduceMotion ? { y: textY } : undefined}
          className="flex flex-col items-center text-center max-w-4xl mx-auto z-10 w-full mb-12 lg:mb-20"
        >
          <motion.h1 
            variants={itemVariants}
            className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-[4.25rem] tracking-tight leading-[1.05] hero-headline mb-8 text-slate-900"
          >
            Predict the next crime.
            <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              Before it happens.
            </span>
          </motion.h1>

          <motion.div 
            variants={itemVariants}
            className="flex items-center justify-center gap-4 text-sm text-text-muted/80 mb-8"
          >
            <div className="flex items-center gap-1.5">
              <Database className="h-4 w-4 text-indigo-500" />
              <span className="font-medium">CCTNS Integrated</span>
            </div>
            <span className="text-slate-300">·</span>
            <div className="flex items-center gap-1.5">
              <PhoneCall className="h-4 w-4 text-rose-500" />
              <span className="font-medium">112 Compatible</span>
            </div>
            <span className="text-slate-300">·</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span className="font-medium">Data Sovereign</span>
            </div>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            {/* Primary Button with continuous animated glow */}
            <motion.div
              className="relative group/btn"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <motion.div 
                className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-60 blur-md group-hover/btn:opacity-100 transition-opacity duration-300"
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <button
                onClick={scrollToFinalCTA}
                className="relative inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-sm font-bold text-white shadow-xl hover:bg-slate-800 transition-colors border border-slate-700"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>

            {/* Secondary Button */}
            <PillButton
              variant="ghost"
              onClick={scrollToIllustration}
              className="px-8 py-4 bg-white/80 hover:bg-white border-slate-200/60 shadow-lg text-slate-700 hover:text-accent font-semibold"
            >
              Learn More
            </PillButton>
          </motion.div>
        </motion.div>

        {/* ─── Bottom Section: Wide Boxed Illustration ─── */}
        <motion.div
          id="hero-illustration-stage"
          variants={itemVariants}
          style={!shouldReduceMotion ? { y: illustrationY } : undefined}
          className="w-full relative z-10 flex flex-col items-center"
        >
           <div className="relative w-full max-w-[850px] flex items-center justify-center mx-auto">
             <IllustrationStage />
             
             {/* Floating Elements */}
             <motion.div 
               style={!shouldReduceMotion ? { y: floatingY1 } : undefined}
               whileHover={{ scale: 1.05, y: -5 }}
               className="hidden lg:flex absolute left-0 lg:-left-4 xl:-left-8 top-16 z-20 items-center gap-3 px-5 py-3 rounded-2xl bg-white/90 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl cursor-pointer group/float hover:shadow-[0_20px_40px_rgba(239,68,68,0.15)] hover:border-red-100 transition-all duration-300"
             >
               <div className="bg-red-50 p-2 rounded-xl group-hover/float:bg-red-500 transition-colors duration-300 shadow-sm border border-red-100/50">
                 <Activity className="h-4 w-4 text-red-500 group-hover/float:text-white transition-colors duration-300" />
               </div>
               <div className="flex flex-col">
                 <span className="text-[13px] font-semibold text-slate-800 leading-tight mb-0.5">Anomaly Detected</span>
                 <span className="text-[11px] font-medium text-slate-500">Sector 4, Bangalore</span>
               </div>
             </motion.div>

             <motion.div 
               style={!shouldReduceMotion ? { y: floatingY2 } : undefined}
               whileHover={{ scale: 1.05, y: -5 }}
               className="hidden lg:flex absolute right-0 lg:-right-4 xl:-right-8 bottom-16 z-20 items-center gap-3 px-5 py-3 rounded-2xl bg-white/90 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl cursor-pointer group/float hover:shadow-[0_20px_40px_rgba(99,102,241,0.15)] hover:border-indigo-100 transition-all duration-300"
             >
               <div className="bg-indigo-50 p-2 rounded-xl group-hover/float:bg-accent transition-colors duration-300 shadow-sm border border-indigo-100/50">
                 <MapPin className="h-4 w-4 text-accent group-hover/float:text-white transition-colors duration-300" />
               </div>
               <div className="flex flex-col">
                 <span className="text-[13px] font-semibold text-slate-800 leading-tight mb-0.5">Patrol Dispatched</span>
                 <span className="text-[11px] font-medium text-slate-500">ETA: 3 mins</span>
               </div>
             </motion.div>
           </div>
        </motion.div>
        
      </motion.div>
    </section>
  );
}
