"use client";

import React from 'react';
import { FlowNode } from './FlowNode';
import { Database, FolderOpen, Network, FileSpreadsheet } from 'lucide-react';

export function ProblemDiagram() {
  return (
    <section className="py-24 border-y border-surface-border bg-bg-elevated overflow-hidden">
      <div className="container max-w-[1200px] mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-text-primary mb-6">
              The cost of <span className="text-red-400">fragmented</span> intelligence.
            </h2>
            <p className="text-lg text-text-muted leading-relaxed">
              Reactive responses. Siloed data. Manual analytics. Patterns hidden until it&apos;s too late. When law enforcement relies on disconnected systems, the advantage belongs to the criminals.
            </p>
          </div>

          <div className="relative h-[400px] flex items-center justify-center">
            {/* Background noise/grid */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            
            <div className="relative w-full max-w-[400px] aspect-square">
              <FlowNode 
                icon={Database} 
                title="CCTNS Data" 
                status="error"
                className="absolute top-[10%] left-[10%]"
                animate={{ rotate: [-2, 2, -2], y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              />
              <FlowNode 
                icon={FileSpreadsheet} 
                title="Manual Logs" 
                status="warning"
                className="absolute top-[20%] right-[5%]"
                animate={{ rotate: [3, -1, 3], y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
              />
              <FlowNode 
                icon={FolderOpen} 
                title="Local Files" 
                status="error"
                className="absolute bottom-[15%] left-[5%]"
                animate={{ rotate: [-4, 1, -4], y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.5 }}
              />
              <FlowNode 
                icon={Network} 
                title="IoT Sensors" 
                status="warning"
                className="absolute bottom-[25%] right-[15%]"
                animate={{ rotate: [2, -3, 2], y: [0, -7, 0] }}
                transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut", delay: 1.5 }}
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
