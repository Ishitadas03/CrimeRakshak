"use client";

import React from 'react';

/**
 * HeroWaveDivider — Mosey-style geometric flowing lines (not wavy).
 * Thin, gentle curves matching the connector line aesthetic.
 * Purely decorative — aria-hidden.
 */
export function HeroWaveDivider() {
  return (
    <div aria-hidden="true" className="relative w-full pointer-events-none select-none overflow-hidden -mt-2">
      <svg
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        className="w-full h-[40px] sm:h-[50px] md:h-[60px]"
        fill="none"
      >
        {/* Line 1 — primary, gentle curves */}
        <path
          d="M0 30 C 180 42, 360 18, 540 30 C 720 42, 900 22, 1080 32 C 1200 38, 1360 24, 1440 28"
          stroke="currentColor"
          strokeWidth="1"
          className="text-slate-300/20"
          fill="none"
        />

        {/* Line 2 — offset, more subtle */}
        <path
          d="M0 40 C 240 28, 480 48, 720 36 C 960 24, 1200 44, 1440 34"
          stroke="currentColor"
          strokeWidth="0.75"
          className="text-slate-300/12"
          fill="none"
        />

        {/* Dot anchors */}
        <circle cx="6" cy="30" r="2" className="fill-slate-400/20" />
        <circle cx="1434" cy="28" r="2" className="fill-slate-400/20" />
      </svg>
    </div>
  );
}
