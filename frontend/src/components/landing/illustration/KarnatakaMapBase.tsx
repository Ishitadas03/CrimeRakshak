"use client";

import React from 'react';
import { motion } from 'motion/react';
import { useMotionTokens } from '@/lib/motion-tokens';

/**
 * KarnatakaMapBase — compact, clearly visible.
 * Centered within the fixed-height stage area.
 */
export function KarnatakaMapBase() {
  const { shouldReduceMotion } = useMotionTokens();

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg
        viewBox="0 0 400 400"
        className="w-[320px] h-[320px] sm:w-[360px] sm:h-[360px]"
        fill="none"
        aria-hidden="true"
      >
        {/* Orbit circles */}
        <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 8" className="text-slate-300/20" />
        <circle cx="200" cy="200" r="130" stroke="currentColor" strokeWidth="0.6" className="text-slate-300/12" />
        <circle cx="200" cy="200" r="80" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 8" className="text-slate-300/8" />

        {/* Tick marks on outer orbit */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 200 + 176 * Math.cos(rad);
          const y1 = 200 + 176 * Math.sin(rad);
          const x2 = 200 + 184 * Math.cos(rad);
          const y2 = 200 + 184 * Math.sin(rad);
          return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="0.6" className="text-slate-400/15" />;
        })}

        {/* Radar sweep */}
        {!shouldReduceMotion && (
          <g>
            <defs>
              <linearGradient id="radarSweep2" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0" />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.04" />
              </linearGradient>
            </defs>
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: '200px 200px' }}
            >
              <path d="M200 200 L200 20 A180 180 0 0 1 340 100 Z" fill="url(#radarSweep2)" />
              <line x1="200" y1="200" x2="200" y2="20" stroke="var(--color-accent)" strokeWidth="0.4" opacity="0.08" />
            </motion.g>
          </g>
        )}

        {/* Karnataka outline */}
        <path
          d="M185 65 L205 58 L228 65 L248 78 L262 95 L272 118 L278 145 L282 170 L285 193 L288 210 L290 230 L288 252 L278 273 L264 290 L245 305 L225 313 L210 318 L192 315 L174 310 L157 300 L143 288 L133 272 L128 252 L125 230 L124 208 L125 186 L128 163 L133 142 L140 122 L150 105 L163 90 L178 78 Z"
          stroke="var(--color-accent)"
          strokeWidth="1"
          opacity="0.12"
          fill="var(--color-accent)"
          fillOpacity="0.02"
          strokeLinejoin="round"
        />

        {/* Bengaluru pin */}
        <circle cx="225" cy="255" r="6" fill="var(--color-accent)" opacity="0.06" />
        <circle cx="225" cy="255" r="3" fill="var(--color-accent)" opacity="0.18" />
        {!shouldReduceMotion && (
          <motion.circle
            cx="225" cy="255" r="8"
            fill="none" stroke="var(--color-accent)" strokeWidth="0.6"
            initial={{ opacity: 0.25, scale: 1 }}
            animate={{ opacity: 0, scale: 2 }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
            style={{ transformOrigin: '225px 255px' }}
          />
        )}
        <circle cx="225" cy="255" r="1.5" fill="var(--color-accent)" opacity="0.35" />

        {/* Crosshair */}
        <line x1="200" y1="180" x2="200" y2="220" stroke="currentColor" strokeWidth="0.3" className="text-slate-300/8" />
        <line x1="180" y1="200" x2="220" y2="200" stroke="currentColor" strokeWidth="0.3" className="text-slate-300/8" />

        {/* Decorative UI fragments */}
        <g opacity="0.08" transform="translate(310, 80)">
          <rect width="30" height="5" rx="1.5" fill="currentColor" className="text-slate-400" />
          <rect y="8" width="20" height="3" rx="1" fill="currentColor" className="text-slate-300" />
        </g>
        <g opacity="0.06" transform="translate(50, 290)">
          <rect width="35" height="4" rx="1" fill="currentColor" className="text-slate-400" />
          <rect y="7" width="24" height="3" rx="1" fill="currentColor" className="text-slate-300" />
        </g>
        <g opacity="0.07" transform="translate(55, 120)">
          <rect width="30" height="12" rx="3" fill="currentColor" className="text-slate-400" />
        </g>
      </svg>
    </div>
  );
}
