import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CartProvider } from '@/lib/cart/cart-context';
import { CartBadge } from '@/components/storefront/cart-badge';
import { LogoutButton } from '@/components/storefront/logout-button';
import { TransitionProvider } from '@/components/storefront/transition-provider';
import { ThemeProvider } from '@/components/storefront/theme-provider';
import { ThemeToggle } from '@/components/storefront/theme-toggle';

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <TransitionProvider>
      <CartProvider userId={user?.id ?? null}>
        <ThemeProvider>
          <header className="flex items-center justify-between border-b border-concrete/20 px-6 py-5 md:px-10">
          <Link href="/" className="font-display text-xl tracking-tightest">
            GODDYS
          </Link>
          <nav className="flex items-center gap-6 font-mono text-xs uppercase tracking-wide text-concrete">
            <Link href="/shop" className="hover:text-bone">
              Shop
            </Link>
            <Link href="/cart" className="hover:text-bone">
              <CartBadge />
            </Link>
            {user ? (
              <>
                <Link href="/account/orders" className="hover:text-bone">
                  Orders
                </Link>
                <LogoutButton className="hover:text-bone" />
              </>
            ) : (
              <Link href="/account/login" className="hover:text-bone">
                Account
              </Link>
            )}
            <ThemeToggle />
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-concrete/20 px-6 py-14 md:px-10">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <p className="font-display text-lg tracking-tightest">GODDYS</p>
              <p className="mt-2 font-mono text-xs text-concrete">
                Premium streetwear, built underground.
              </p>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-concrete">Shop</p>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                <li>
                  <Link href="/shop" className="hover:text-hazard">
                    All tees
                  </Link>
                </li>
                <li>
                  <Link href="/shop?category=tops" className="hover:text-hazard">
                    Tops
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-concrete">Help</p>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                <li>
                  <Link href="/size-guide" className="hover:text-hazard">
                    Size guide
                  </Link>
                </li>
                <li>
                  <Link href="/shipping-returns" className="hover:text-hazard">
                    Shipping &amp; returns
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-hazard">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-concrete">Brand</p>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                <li>
                  <Link href="/about" className="hover:text-hazard">
                    About
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <p className="mx-auto mt-10 max-w-7xl font-mono text-xs uppercase tracking-wide text-concrete">
            © {new Date().getFullYear()} GODDYS. All rights reserved.
          </p>
        </footer>
        </ThemeProvider>
      </CartProvider>
    </TransitionProvider>
  );
}
