import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function AdminDashboardPage() {
  const supabase = createClient();

  const [{ count: productCount }, { count: orderCount }, { count: customerCount }] =
    await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
    ]);

  const stats = [
    { label: 'Products', value: productCount ?? 0, href: '/admin/products' },
    { label: 'Orders', value: orderCount ?? 0, href: '/admin/orders' },
    { label: 'Customers', value: customerCount ?? 0, href: '/admin/customers' },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl tracking-tightest">Dashboard</h1>
      <p className="mt-1 text-sm text-concrete">
        Live counts, updated in real time.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="border border-concrete/20 bg-panel p-5 transition-colors hover:border-hazard"
          >
            <p className="font-mono text-xs uppercase tracking-widest text-concrete">
              {stat.label}
            </p>
            <p className="mt-2 font-display text-3xl">{stat.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
