'use client';

import { useEffect, useState } from 'react';

/**
 * Spinning 3D logo on a transparent background. Chrome, Firefox, Edge and
 * Android play the small VP9 WebM with its alpha channel. Safari (and every
 * iOS browser, which are all WebKit) can't show WebM transparency - it would
 * paint a black box - so they get the same loop as an animated WebP, which
 * also keeps spinning in iOS Low Power Mode where video autoplay is blocked.
 *
 * Which one to use needs the user agent, so nothing renders until mount;
 * the stage keeps its size meanwhile so the layout doesn't jump.
 */
function isWebKitOnly() {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return /Safari/.test(ua) && !/Chrome|Chromium|CriOS|Edg|Android/.test(ua);
}

export function HeroLogo() {
  const [variant, setVariant] = useState<'video' | 'image' | null>(null);

  useEffect(() => {
    setVariant(isWebKitOnly() ? 'image' : 'video');
  }, []);

  return (
    <div className="hero-logo-stage" aria-hidden="true">
      {variant === 'video' && (
        <video
          src="/videos/hero-logo.webm"
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full"
        />
      )}
      {variant === 'image' && (
        // eslint-disable-next-line @next/next/no-img-element -- animated WebP; next/image would serve a still frame.
        <img src="/images/hero-logo.webp" alt="" className="h-full w-full" />
      )}
    </div>
  );
}
