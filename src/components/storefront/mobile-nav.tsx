'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';
import { LogoutButton } from './logout-button';

/**
 * The desktop header fits Shop/Cart/Orders/Account/Logout/Theme in one
 * row (nav.tsx in the storefront layout, hidden on mobile via md:flex).
 * That overflows badly under ~500px, so mobile gets a hamburger instead:
 * cart stays one tap away in the header itself (most-used link), and
 * everything else collapses into this dropdown.
 */
export function MobileNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        className="border border-concrete/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-bone"
      >
        {isOpen ? 'Close' : 'Menu'}
      </button>

      {isOpen && (
        <div className="absolute inset-x-0 top-full z-40 flex flex-col border-b border-concrete/20 bg-ink px-6 py-4 font-mono text-xs uppercase tracking-wide text-concrete">
          <Link href="/shop" onClick={() => setIsOpen(false)} className="border-b border-concrete/10 py-3 hover:text-bone">
            Shop
          </Link>
          {isLoggedIn ? (
            <>
              <Link
                href="/account/orders"
                onClick={() => setIsOpen(false)}
                className="border-b border-concrete/10 py-3 hover:text-bone"
              >
                Orders
              </Link>
              <div className="border-b border-concrete/10 py-3">
                <LogoutButton className="hover:text-bone" />
              </div>
            </>
          ) : (
            <Link
              href="/account/login"
              onClick={() => setIsOpen(false)}
              className="border-b border-concrete/10 py-3 hover:text-bone"
            >
              Account
            </Link>
          )}
          <div className="py-3">
            <ThemeToggle />
          </div>
        </div>
      )}
    </div>
  );
}
