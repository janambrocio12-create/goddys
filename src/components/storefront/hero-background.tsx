'use client';

import Image from 'next/image';
import { useTheme } from './theme-provider';

/**
 * The home hero sits on a full-bleed photo, so it needs its own themed
 * asset rather than just inheriting the color tokens - a graphic (chains,
 * barbed wire, graffiti) doesn't repaint itself the way bg-ink/text-bone
 * do. hero-bg.jpg is the dark original; hero-bg-light.jpg is the same
 * composition on a light backdrop so the hero actually goes light in
 * light mode instead of staying forced-dark.
 */
export function HeroBackground() {
  const { theme } = useTheme();
  const src = theme === 'light' ? '/images/hero-bg-light.jpg' : '/images/hero-bg.jpg';

  return (
    <>
      <Image src={src} alt="" fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-ink/30" />
    </>
  );
}
