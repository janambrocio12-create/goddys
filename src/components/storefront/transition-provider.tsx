'use client';

import { createContext, useContext, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Phase = 'idle' | 'covering' | 'revealing';

type TransitionContextValue = {
  goTo: (href: string) => void;
};

const TransitionContext = createContext<TransitionContextValue | null>(null);

/**
 * Wraps the storefront so a "sweep" panel can persist across a route
 * change. It only works because this provider (and the overlay it
 * renders) lives in the shared (storefront) layout, not inside any one
 * page — the layout stays mounted while `children` swaps underneath it.
 */
export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('idle');
  const pendingHref = useRef<string | null>(null);

  function goTo(href: string) {
    if (phase !== 'idle') return;
    pendingHref.current = href;
    setPhase('covering');
  }

  function handleAnimationEnd() {
    if (phase === 'covering') {
      if (pendingHref.current) router.push(pendingHref.current);
      // Give the new route a beat to paint underneath before wiping away.
      window.setTimeout(() => setPhase('revealing'), 150);
    } else if (phase === 'revealing') {
      setPhase('idle');
      pendingHref.current = null;
    }
  }

  return (
    <TransitionContext.Provider value={{ goTo }}>
      {children}
      {phase !== 'idle' && (
        <div
          onAnimationEnd={handleAnimationEnd}
          className={`fixed inset-0 z-[100] overflow-hidden bg-ink ${
            phase === 'covering' ? 'animate-sweep-in' : 'animate-sweep-out'
          }`}
        >
          <div className="absolute left-[-10%] top-1/2 h-16 w-[140%] -translate-y-1/2 -rotate-6 bg-hazard" />
          <div className="relative flex h-full items-center justify-center">
            <p className="font-display text-[14vw] tracking-tightest text-bone md:text-[8vw]">
              GODDYS
            </p>
          </div>
        </div>
      )}
    </TransitionContext.Provider>
  );
}

export function usePageTransition() {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error('usePageTransition must be used within a TransitionProvider');
  }
  return context;
}
