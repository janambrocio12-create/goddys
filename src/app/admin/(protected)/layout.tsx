import { requireAdmin } from '@/lib/auth/get-admin';
import { AdminSidebarNav } from '@/components/admin/admin-sidebar-nav';
import { AdminMobileNav } from '@/components/admin/admin-mobile-nav';
import { AdminLogoutButton } from '@/components/admin/admin-logout-button';

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
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar is hidden below md, so mobile gets this header + hamburger
          instead (relative so the dropdown's absolute panel anchors here). */}
      <header className="relative flex items-center justify-between border-b border-concrete/20 bg-panel px-6 py-4 md:hidden">
        <div>
          <p className="font-display text-lg tracking-tightest">GODDYS</p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-concrete">
            Admin
          </p>
        </div>
        <AdminMobileNav items={NAV_ITEMS} />
      </header>

      <aside className="hidden w-56 shrink-0 border-r border-concrete/20 bg-panel p-6 md:block">
        <p className="font-display text-lg tracking-tightest">GODDYS</p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-concrete">
          Admin
        </p>

        <AdminSidebarNav items={NAV_ITEMS} />

        <div className="mt-10 border-t border-concrete/20 pt-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-concrete">
            Signed in as
          </p>
          <p className="mt-1 text-sm">{admin.full_name ?? 'Admin'}</p>
          <p className="font-mono text-[10px] uppercase tracking-wide text-hazard">
            {admin.role.replace('_', ' ')}
          </p>
          <AdminLogoutButton className="mt-3 font-mono text-xs uppercase tracking-wide text-concrete hover:text-bone" />
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10">{children}</main>
    </div>
  );
}
