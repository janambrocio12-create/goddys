import Image from 'next/image';
import { ShopNowButton } from '@/components/storefront/shop-now-button';

export default function HomePage() {
  return (
    <section className="relative flex min-h-[85vh] flex-col justify-center overflow-hidden px-6 md:px-10">
      <Image
        src="/images/hero-bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-ink/30" />

      <div className="relative mx-auto w-full max-w-7xl">
        <p className="font-mono text-xs uppercase tracking-widest text-hazard">
          EST. 2026 STREETWEAR - Bataan
        </p>

        <h1 className="mt-4 font-display text-[clamp(3rem,14vw,8rem)] leading-[0.85] tracking-tightest drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
          GODDYS
        </h1>

        <p className="mt-6 max-w-md font-body text-sm text-bone md:text-base">
          Goddys is a casual, comfort-driven style of clothing.
        </p>

        <p className="mt-3 font-mono text-xs uppercase tracking-widest text-concrete">
          Loyalty · Discipline · Ambition
        </p>

        <div className="mt-10">
          <ShopNowButton />
        </div>
      </div>
    </section>
  );
}
