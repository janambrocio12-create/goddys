'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePageTransition } from '@/components/storefront/transition-provider';

export function ShopNowButton({ className }: { className?: string }) {
  const router = useRouter();
  const { goTo } = usePageTransition();

  // Warm the route ahead of the click so the sweep has as little as
  // possible left to wait on once it covers the screen.
  useEffect(() => {
    router.prefetch('/shop');
  }, [router]);

  return (
    <button
      type="button"
      onClick={() => goTo('/shop')}
      className={
        className ??
        'bg-bone px-10 py-4 font-mono text-sm uppercase tracking-widest text-ink transition-transform hover:scale-105'
      }
    >
      Shop now
    </button>
  );
}
