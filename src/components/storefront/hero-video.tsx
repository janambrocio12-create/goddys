'use client';

import { useEffect, useRef, useState } from 'react';

const MOBILE_SRC = '/videos/hero-mobile.mp4';
const DESKTOP_SRC = '/videos/hero-desktop.mp4';

/**
 * Looping background video for the home hero. The footage is portrait, so
 * on phones it simply fills the screen, while on wider screens it sits as
 * a centered full-height column over a blurred copy of its own first frame
 * (instead of being zoomed in and cropped to a thin strip of the models).
 *
 * The first frame shows immediately as a still, and the video fades in once
 * it can actually play, so a slow connection never shows an empty frame.
 * Hidden for people who prefer reduced motion (see globals.css), who just
 * keep the still.
 */
export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Smaller file for phones, sharper one for desktop. Chosen here rather
    // than in markup so a phone never downloads the big one.
    const isWide = window.matchMedia('(min-width: 768px)').matches;
    video.src = isWide ? DESKTOP_SRC : MOBILE_SRC;

    // React doesn't render `muted` into the server HTML, and browsers only
    // allow autoplay for muted video - so set it and start playback here.
    video.muted = true;
    video.play().catch(() => {});
  }, []);

  return (
    <>
      <div className="hero-still absolute inset-0 bg-cover bg-center md:scale-110 md:opacity-60 md:blur-2xl" />
      <video
        ref={videoRef}
        className={`hero-video hero-video-column absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
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
