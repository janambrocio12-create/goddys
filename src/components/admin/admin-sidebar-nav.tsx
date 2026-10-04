'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type AdminNavItem = { label: string; href: string };

/** Desktop sidebar nav - highlights whichever section the admin is
 * currently inside (not just an exact path match, so /admin/products/123
 * still highlights "Products"). */
export function AdminSidebarNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="mt-10 flex flex-col gap-1">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-sm px-3 py-2 font-mono text-xs uppercase tracking-wide ${
              isActive ? 'bg-ink text-bone' : 'text-concrete hover:bg-ink hover:text-bone'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
