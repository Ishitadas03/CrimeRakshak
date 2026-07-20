"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMotionTokens } from '@/lib/motion-tokens';

export type SceneIndex = 0 | 1 | 2;
export type CyclePhase = 'idle' | 'exit' | 'blank' | 'enter';

const SCENE_COUNT = 3;

// Timing constants (ms)
const IDLE_DURATION = 4500;
const EXIT_DURATION = 350;
const BLANK_DURATION = 300;
const ENTER_DURATION = 900;

export interface HeroCycleState {
  sceneIndex: SceneIndex;
  phase: CyclePhase;
  isReducedMotion: boolean;
}

export function useHeroCycle(): HeroCycleState {
  const { shouldReduceMotion } = useMotionTokens();
  const [sceneIndex, setSceneIndex] = useState<SceneIndex>(0);
  const [phase, setPhase] = useState<CyclePhase>('enter');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isVisibleRef = useRef(true);

  const clearScheduled = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const scheduleNext = useCallback((fn: () => void, delay: number) => {
    clearScheduled();
    timeoutRef.current = setTimeout(fn, delay);
  }, [clearScheduled]);

  // Main cycle driver
  useEffect(() => {
    if (shouldReduceMotion) {
      clearScheduled();
      setSceneIndex(0);
      setPhase('idle');
      return;
    }

    if (!isVisibleRef.current) return;

    switch (phase) {
      case 'enter':
        scheduleNext(() => setPhase('idle'), ENTER_DURATION);
        break;
      case 'idle':
        scheduleNext(() => setPhase('exit'), IDLE_DURATION);
        break;
      case 'exit':
        scheduleNext(() => setPhase('blank'), EXIT_DURATION);
        break;
      case 'blank':
        scheduleNext(() => {
          setSceneIndex(prev => ((prev + 1) % SCENE_COUNT) as SceneIndex);
          setPhase('enter');
        }, BLANK_DURATION);
        break;
    }

    return clearScheduled;
  }, [phase, shouldReduceMotion, scheduleNext, clearScheduled]);

  // Single unified visibility handler
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        isVisibleRef.current = false;
        clearScheduled();
      } else {
        isVisibleRef.current = true;
        if (!shouldReduceMotion) {
          // Force re-trigger by toggling phase identity
          setPhase(prev => prev);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearScheduled();
    };
  }, [clearScheduled, shouldReduceMotion]);

  return {
    sceneIndex,
    phase,
    isReducedMotion: !!shouldReduceMotion,
  };
}
