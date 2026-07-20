"use client";

import React from 'react';
import Link from 'next/link';
import { Shield, Moon, Globe } from 'lucide-react';
import { MicroLabel } from './MicroLabel';
import { useLanguage } from '@/components/LanguageContext';

const FOOTER_LINKS = [
  {
    title: "Product",
    links: [
      { label: "Dashboard", href: "#" },
      { label: "Digital Twin", href: "#" },
      { label: "AI Copilot", href: "#" },
      { label: "Alerts API", href: "#" }
    ]
  },
  {
    title: "Solutions",
    links: [
      { label: "City Police", href: "#" },
      { label: "Traffic Control", href: "#" },
      { label: "Cyber Cell", href: "#" },
      { label: "Intelligence", href: "#" }
    ]
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "Case Studies", href: "#" },
      { label: "API Reference", href: "#" },
      { label: "Status Page", href: "#" }
    ]
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Security & Compliance", href: "#" },
      { label: "Data Residency", href: "#" }
    ]
  }
];

export function Footer() {
  const { lang, setLang } = useLanguage();

  return (
    <footer className="bg-bg-elevated pt-20 pb-10 border-t border-surface-border">
      <div className="container max-w-[1200px] mx-auto px-4">
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
          
          {/* Brand Col */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20">
                <Shield className="h-5 w-5 text-accent" />
              </div>
              <span className="font-cursive font-bold text-xl text-accent">CrimeRakshak</span>
            </Link>
            <p className="text-sm text-text-muted leading-relaxed">
              Predictive policing and intelligence platform designed for modern law enforcement.
            </p>
            
            <div className="flex gap-4 mt-auto">
              <button 
                onClick={() => setLang(lang === 'EN' ? 'KA' : 'EN')}
                className="flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors bg-surface-glass px-3 py-1.5 rounded-full border border-surface-border"
              >
                <Globe className="w-3 h-3" />
                {lang === 'EN' ? 'ಕನ್ನಡ' : 'English'}
              </button>
              <button className="flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors bg-surface-glass px-3 py-1.5 rounded-full border border-surface-border">
                <Moon className="w-3 h-3" />
                Dark Theme
              </button>
            </div>
          </div>

          {/* Links Cols */}
          {FOOTER_LINKS.map(group => (
            <div key={group.title} className="flex flex-col gap-4">
              <MicroLabel className="text-text-primary">{group.title}</MicroLabel>
              <ul className="flex flex-col gap-3">
                {group.links.map(link => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-text-muted hover:text-accent transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-surface-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-faint">
            &copy; {new Date().getFullYear()} CrimeRakshak AI. All rights reserved. Not for commercial use.
          </p>
          <p className="text-xs text-text-faint flex gap-4">
            <span>ISO 27001 Aligned</span>
            <span>Data Residency: India</span>
          </p>
        </div>

      </div>
    </footer>
  );
}
