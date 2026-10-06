'use client';

import { useEffect, useRef, useState } from 'react';

const MOBILE_SRC = '/videos/hero-mobile.mp4';

/**
 * Home hero background. On phones it is a looping portrait video that fills
 * the screen. On wider screens it is a full-bleed photo instead (no video is
 * downloaded there), framed so the models' faces stay in view.
 *
 * On phones the first frame shows immediately as a still, and the video fades
 * in once it can actually play, so a slow connection never shows an empty
 * frame. Reduced-motion visitors keep the still (see globals.css).
 */
export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Wide screens use the photo, so only phones load the video.
    if (window.matchMedia('(min-width: 768px)').matches) return;
    video.src = MOBILE_SRC;

    // React doesn't render `muted` into the server HTML, and browsers only
    // allow autoplay for muted video - so set it and start playback here.
    video.muted = true;
    video.play().catch(() => {});
  }, []);

  return (
    <>
      <div className="hero-still absolute inset-0 bg-cover bg-center md:hidden" />
      <div className="hero-photo absolute inset-0 hidden md:block" />
      <video
        ref={videoRef}
        className={`hero-video absolute inset-0 h-full w-full object-cover md:hidden transition-opacity duration-700 ${
          ready ? 'opacity-100' : 'opacity-0'
        }`}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        aria-hidden="true"
        onLoadedData={() => setReady(true)}
      />
      <div className="absolute inset-0 bg-black/35" />
    </>
  );
}
