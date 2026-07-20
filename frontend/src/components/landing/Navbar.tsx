"use client";

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useMotionValueEvent } from 'motion/react';
import { Shield, Menu, X, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { PillButton } from './PillButton';
import { MicroLabel } from './MicroLabel';
import { GlassPanel } from './GlassPanel';
import { useLanguage } from '@/components/LanguageContext';
import { useMotionTokens } from '@/lib/motion-tokens';
import { ConnectingPill } from './ConnectingPill';

const NAV_LINKS = [
  {
    name: 'Products',
    items: [
      { label: 'Dashboard', href: '/overview' },
      { label: 'Digital Twin Simulator', href: '/simulator' },
      { label: 'AI Copilot', href: '/ai-assistant' },
      { label: 'Alert System', href: '/alerts' }
    ]
  },
  {
    name: 'Solutions',
    items: [
      { label: 'City Police', href: '/overview' },
      { label: 'Traffic Police', href: '/overview' },
      { label: 'Cyber Cell', href: '/overview' }
    ]
  },
  {
    name: 'Resources',
    items: [
      { label: 'Case Studies', href: '#' },
      { label: 'Documentation', href: '#' },
      { label: 'API Guide', href: '#' }
    ]
  }
];

export function Navbar() {
  const { scrollY } = useScroll();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolledPast, setIsScrolledPast] = useState(false);
  const [isHoveringTop, setIsHoveringTop] = useState(false);
  
  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolledPast(latest > 50);
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setIsHoveringTop(e.clientY < 80);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const hidden = isScrolledPast && !isHoveringTop && !mobileMenuOpen;
  const { lang, setLang } = useLanguage();
  const { exit, shouldReduceMotion } = useMotionTokens();

  const backgroundColor = useTransform(
    scrollY,
    [0, 24],
    ['rgba(247, 249, 252, 0)', 'rgba(247, 249, 252, 0.85)']
  );
  
  const borderColor = useTransform(
    scrollY,
    [0, 24],
    ['rgba(226, 232, 240, 0)', 'rgba(226, 232, 240, 0.8)']
  );
  
  const backdropFilter = useTransform(
    scrollY,
    [0, 24],
    ['blur(0px)', 'blur(16px)']
  );

  return (
    <>
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: hidden ? -100 : 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
        className="fixed top-0 left-0 right-0 h-16 z-50 transition-colors"
        style={{ 
          backgroundColor, 
          borderBottomWidth: '1px',
          borderBottomStyle: 'solid',
          borderColor,
          backdropFilter,
          WebkitBackdropFilter: backdropFilter
        }}
      >
        <div className="max-w-[1440px] mx-auto px-4 h-full flex items-center justify-between">
          
          {/* Logo & Wordmark */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20 group-hover:bg-accent/20 transition-colors">
              <Shield className="h-5 w-5 text-accent" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="brand-logo font-bold text-3xl text-accent">CrimeRakshak</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <div 
                key={link.name}
                className="relative"
                onMouseEnter={() => setActiveDropdown(link.name)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="relative flex items-center gap-1 px-4 py-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors rounded-md z-10">
                  {activeDropdown === link.name && (
                    <ConnectingPill layoutId="navHover" className="bg-surface-border/50" />
                  )}
                  {link.name}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </button>
                
                <AnimatePresence>
                  {activeDropdown === link.name && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={exit.exit}
                      transition={exit.transition}
                      className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-48"
                    >
                      <GlassPanel className="p-2 flex flex-col gap-1 bg-white shadow-lg border-slate-200">
                        {link.items.map(item => (
                          <Link 
                            key={item.label} 
                            href={item.href} 
                            className="px-3 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-white/5 rounded-md transition-colors"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </GlassPanel>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <motion.button 
              whileHover={{ scale: 1.05, backgroundColor: "rgba(248, 250, 252, 1)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/signup'}
              className="px-6 py-2.5 rounded-full border border-slate-200 bg-white text-slate-800 text-sm font-medium shadow-sm transition-colors"
            >
              Sign up
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05, filter: "brightness(1.1)" }} 
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/login'}
              className="px-6 py-2.5 rounded-full bg-[#5B6EE1] text-white text-sm font-medium shadow-sm hover:shadow-md transition-all"
            >
              Log in
            </motion.button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-text-muted hover:text-text-primary"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={exit.exit}
            transition={exit.transition}
            className="fixed inset-0 z-[60] bg-bg-base/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col h-full p-6">
              <div className="flex justify-between items-center mb-8">
                <span className="brand-logo font-bold text-3xl text-accent">CrimeRakshak</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-text-muted hover:text-text-primary bg-white/5 rounded-full">
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="flex flex-col gap-6 overflow-y-auto pb-20">
                {NAV_LINKS.map((link, i) => (
                  <motion.div 
                    key={link.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex flex-col gap-3"
                  >
                    <MicroLabel>{link.name}</MicroLabel>
                    <div className="flex flex-col gap-2 border-l border-surface-border pl-4">
                      {link.items.map(item => (
                        <Link 
                          key={item.label} 
                          href={item.href} 
                          onClick={() => setMobileMenuOpen(false)}
                          className="text-lg font-medium text-text-primary hover:text-accent"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-auto pt-6 flex flex-col gap-4 border-t border-surface-border">
                <button 
                  onClick={() => setLang(lang === 'EN' ? 'KA' : 'EN')}
                  className="flex items-center justify-between text-sm font-bold bg-surface-glass border border-surface-border px-4 py-3 rounded-xl text-text-primary"
                >
                  Language <span>{lang === 'EN' ? 'ಕನ್ನಡ' : 'English'}</span>
                </button>
                <PillButton className="w-full" onClick={() => window.location.href = '/overview'}>
                  Request Access
                </PillButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
