import { requireAdmin } from '@/lib/auth/get-admin';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin/dashboard' },
  // Add future sections here — each inherits the requireAdmin() guard
  // and this sidebar automatically by living under (protected)/.
  { label: 'Products', href: '/admin/products' },
  { label: 'Orders', href: '/admin/orders' },
  { label: 'Customers', href: '/admin/customers' },
  { label: 'Discounts', href: '/admin/discounts' },
];

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirects to /admin/login if there's no active admin_profiles row.
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r border-concrete/20 bg-panel p-6 md:block">
        <p className="font-display text-lg tracking-tightest">GODDYS</p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-concrete">
          Admin
        </p>

        <nav className="mt-10 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-sm px-3 py-2 font-mono text-xs uppercase tracking-wide text-concrete hover:bg-ink hover:text-bone"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="mt-10 border-t border-concrete/20 pt-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-concrete">
            Signed in as
          </p>
          <p className="mt-1 text-sm">{admin.full_name ?? 'Admin'}</p>
          <p className="font-mono text-[10px] uppercase tracking-wide text-hazard">
            {admin.role.replace('_', ' ')}
          </p>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10">{children}</main>
    </div>
  );
}
