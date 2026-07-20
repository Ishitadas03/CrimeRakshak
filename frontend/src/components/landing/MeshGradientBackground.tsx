"use client";

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';
import { cn } from '@/lib/utils';

export function MeshGradientBackground({ children, className }: { children?: React.ReactNode, className?: string }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDesktop(window.innerWidth >= 1024);
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isDesktop) return;
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isDesktop]);

  const springConfig = { stiffness: 50, damping: 20 };
  const smoothX = useSpring(mousePosition.x, springConfig);
  const smoothY = useSpring(mousePosition.y, springConfig);

  const x1 = useTransform(smoothX, [-1, 1], [-30, 30]);
  const y1 = useTransform(smoothY, [-1, 1], [-30, 30]);
  
  const x2 = useTransform(smoothX, [-1, 1], [30, -30]);
  const y2 = useTransform(smoothY, [-1, 1], [30, -30]);
  
  const x3 = useTransform(smoothX, [-1, 1], [-15, 15]);
  const y3 = useTransform(smoothY, [-1, 1], [15, -15]);

  return (
    <div className={cn("relative min-h-screen bg-slate-50 overflow-hidden selection:bg-accent/30 selection:text-white", className)}>
      <motion.div 
        className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Vibrant Plasma Blobs */}
        <motion.div 
          className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-blue-600/10 blur-[140px] mix-blend-multiply"
          style={isDesktop ? { x: x1, y: y1 } : undefined}
        />
        
        <motion.div 
          className="absolute top-[-5%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-600/10 blur-[150px] mix-blend-multiply"
          style={isDesktop ? { x: x2, y: y2 } : undefined}
        />
        
        <motion.div 
          className="absolute top-[20%] right-[20%] w-[40vw] h-[40vw] rounded-full bg-indigo-500/10 blur-[130px] mix-blend-multiply"
          style={isDesktop ? { x: x3, y: y3 } : undefined}
        />

        <motion.div 
          className="absolute bottom-[-15%] left-[-5%] w-[60vw] h-[50vw] rounded-full bg-cyan-500/10 blur-[160px] mix-blend-multiply"
          style={isDesktop ? { x: x3, y: y1 } : undefined}
        />
        
        <motion.div 
          className="absolute bottom-[-10%] right-[10%] w-[55vw] h-[45vw] rounded-full bg-purple-500/10 blur-[160px] mix-blend-multiply"
          style={isDesktop ? { x: x1, y: y2 } : undefined}
        />

        {/* Tech Grid Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZTJlOGYwIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1vcGFjaXR5PSIwLjUiLz4KPC9zdmc+')] opacity-40 mix-blend-overlay [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />

        {/* Floating Particles */}
        {isMounted && (
          <div className="absolute inset-0">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-accent/40"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  scale: Math.random() * 0.5 + 0.5,
                  opacity: Math.random() * 0.5 + 0.2
                }}
                animate={{
                  y: [null, Math.random() * -100 - 50],
                  opacity: [null, 0],
                }}
                transition={{
                  duration: Math.random() * 10 + 10,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            ))}
          </div>
        )}
        
        {/* Noise overlay to prevent banding */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay"></div>
      </motion.div>
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
