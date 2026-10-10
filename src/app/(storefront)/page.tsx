import { ShopNowButton } from '@/components/storefront/shop-now-button';
import { HeroVideo } from '@/components/storefront/hero-video';
import { HeroLogo } from '@/components/storefront/hero-logo';

export default function HomePage() {
  return (
    // Always dark: the background is a video, so the logo and button need
    // the dark palette in both themes to stay readable over it.
    <section
      data-theme="dark"
      className="relative flex min-h-[calc(100svh-4.5rem)] flex-col items-center justify-center overflow-hidden bg-ink px-6"
    >
      <HeroVideo />

      <h1 className="sr-only">GODDYS</h1>

      {/* Sits in the dark sky above the models rather than dead center, so
          it never covers their faces or the shirts. */}
      <div className="absolute inset-x-0 top-[7%] flex md:top-[4%] justify-center px-6">
        <HeroLogo />
      </div>

      <div className="absolute inset-x-0 bottom-[9%] flex justify-center">
        <ShopNowButton />
      </div>
    </section>
  );
}
