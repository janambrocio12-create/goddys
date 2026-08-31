import type { Metadata } from 'next';
import { Archivo_Black, Inter, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

// Display face used with restraint (wordmark, hero numerals) - a
// condensed, heavyweight grotesk for editorial impact.
const displayFont = Archivo_Black({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
});

// Body face - a plain, high-legibility grotesk that stays out of the way.
const bodyFont = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

// Utility face for captions, SKUs, and admin data tables.
const monoFont = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: {
    default: 'GODDYS',
    template: '%s - GODDYS',
  },
  description: 'GODDYS - premium streetwear,underground.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
      <body className="bg-ink font-body text-bone antialiased">{children}</body>
    </html>
  );
}
