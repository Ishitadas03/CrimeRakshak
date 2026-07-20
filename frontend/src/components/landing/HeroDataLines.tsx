"use client";

import React from 'react';
import { motion } from 'motion/react';

export function HeroDataLines() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden lg:overflow-visible">
      <svg
        className="absolute top-0 left-0 w-full h-full opacity-60"
        viewBox="0 0 1000 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="line-gradient-1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--accent)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="line-gradient-2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
          
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Base faint lines */}
        <path d="M -100,150 C 200,150 400,300 1100,300" stroke="currentColor" strokeWidth="1" className="text-slate-200/20" strokeDasharray="4 4" />
        <path d="M -100,450 C 300,450 500,100 1100,100" stroke="currentColor" strokeWidth="1" className="text-slate-200/20" strokeDasharray="4 4" />
        <path d="M 400,-100 C 400,200 700,500 700,700" stroke="currentColor" strokeWidth="1" className="text-slate-200/20" strokeDasharray="4 4" />

        {/* Animated glowing lines */}
        <motion.path
          d="M -100,150 C 200,150 400,300 1100,300"
          stroke="url(#line-gradient-1)"
          strokeWidth="2"
          filter="url(#glow)"
          strokeLinecap="round"
          initial={{ pathLength: 0, pathOffset: 0, opacity: 0 }}
          animate={{
            pathLength: [0, 0.3, 0],
            pathOffset: [0, 0.7, 1],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
            delay: 0
          }}
        />

        <motion.path
          d="M -100,450 C 300,450 500,100 1100,100"
          stroke="url(#line-gradient-2)"
          strokeWidth="2"
          filter="url(#glow)"
          strokeLinecap="round"
          initial={{ pathLength: 0, pathOffset: 0, opacity: 0 }}
          animate={{
            pathLength: [0, 0.4, 0],
            pathOffset: [0, 0.6, 1],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "linear",
            delay: 1.5
          }}
        />

        <motion.path
          d="M 400,-100 C 400,200 700,500 700,700"
          stroke="url(#line-gradient-1)"
          strokeWidth="1.5"
          filter="url(#glow)"
          strokeLinecap="round"
          initial={{ pathLength: 0, pathOffset: 0, opacity: 0 }}
          animate={{
            pathLength: [0, 0.2, 0],
            pathOffset: [0, 0.8, 1],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "linear",
            delay: 0.5
          }}
        />
        
        {/* Connection nodes */}
        <motion.circle 
          cx="330" cy="270" r="3" 
          className="fill-accent/80"
          filter="url(#glow)"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.circle 
          cx="420" cy="180" r="3" 
          fill="#8b5cf6"
          filter="url(#glow)"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
        />
      </svg>
    </div>
  );
}
