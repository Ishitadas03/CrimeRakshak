"use client";

import { Shield } from "lucide-react";
import * as motion from "motion/react-client";

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="relative h-16 w-16"
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-blue opacity-50 blur-lg animate-pulse" />
          <div className="relative h-full w-full rounded-2xl bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center shadow-xl">
            <Shield className="h-8 w-8 text-white" />
          </div>
        </motion.div>
        
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-1 text-sm font-semibold text-brand-purple">
            <motion.div
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
              className="h-1.5 w-1.5 rounded-full bg-brand-purple"
            />
            <motion.div
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
              className="h-1.5 w-1.5 rounded-full bg-brand-purple"
            />
            <motion.div
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
              className="h-1.5 w-1.5 rounded-full bg-brand-purple"
            />
          </div>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Analyzing Data...
          </p>
        </div>
      </div>
    </div>
  );
}
