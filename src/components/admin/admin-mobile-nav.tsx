'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminLogoutButton } from './admin-logout-button';
import type { AdminNavItem } from './admin-sidebar-nav';

/** The sidebar is hidden below md (admin-sidebar-nav.tsx's wrapper is
 * `hidden md:block`), so mobile gets this hamburger instead - same nav
 * items, plus the log-out control that otherwise lives in the sidebar's
 * "Signed in as" block. */
export function AdminMobileNav({ items }: { items: AdminNavItem[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

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
          {items.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`border-b border-concrete/10 py-3 ${
                  isActive ? 'text-bone' : 'hover:text-bone'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="py-3">
            <AdminLogoutButton className="hover:text-bone" />
          </div>
        </div>
      )}
    </div>
  );
}
