import React from 'react';
import { MicroLabel } from './MicroLabel';
import { motion } from 'motion/react';

const LOGOS = [
  { name: 'Karnataka Police', url: '/logos/ksp.png' },
  { name: 'Bengaluru City Police', url: '/logos/bcp.png' },
  { name: 'CID', url: '/logos/cid.png' },
  { name: 'Traffic Police', url: '/logos/traffic.png' },
  { name: 'Cyber Crime', url: '/logos/cyber.png' },
  { name: 'AWS Govt', url: '/logos/aws.png' },
];

export function TrustMarquee() {
  // Duplicate for seamless infinite scrolling
  const marqueeItems = [...LOGOS, ...LOGOS, ...LOGOS, ...LOGOS];

  return (
    <section className="py-12 md:py-16 border-b border-surface-border bg-bg-elevated overflow-hidden">
      <div className="container mx-auto px-4 text-center mb-8">
        <MicroLabel>Supporting Law Enforcement Across Karnataka</MicroLabel>
      </div>
      
      <div className="relative flex overflow-hidden group">
        <div className="animate-marquee flex gap-16 md:gap-24 items-center pl-16 md:pl-24 group-hover:[animation-play-state:paused]">
          {marqueeItems.map((logo, index) => (
            <div 
              key={`${logo.name}-${index}`} 
              className="flex-shrink-0 flex items-center justify-center grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300 group/logo cursor-pointer"
            >
              {/* Fallback text if images are missing */}
              <span className="text-xl md:text-2xl font-bold font-heading text-black tracking-tighter whitespace-nowrap transition-all duration-300 group-hover/logo:text-blue-900 group-hover/logo:drop-shadow-[0_0_15px_rgba(30,58,138,0.6)]">
                {logo.name}
              </span>
            </div>
          ))}
        </div>
        
        {/* Gradient fades for the edges */}
        <div className="absolute inset-y-0 left-0 w-24 md:w-48 bg-gradient-to-r from-bg-elevated to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 md:w-48 bg-gradient-to-l from-bg-elevated to-transparent z-10 pointer-events-none" />
      </div>
    </section>
  );
}
