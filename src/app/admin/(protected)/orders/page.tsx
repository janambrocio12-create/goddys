import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatMoney } from '@/lib/format';
import type { OrderStatus } from '@/lib/types/database.types';

const STATUS_OPTIONS: (OrderStatus | 'all')[] = [
  'all',
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

const STATUS_STYLES: Record<string, string> = {
  pending: 'text-concrete border-concrete',
  processing: 'text-hazard border-hazard',
  shipped: 'text-hazard border-hazard',
  delivered: 'text-bone border-bone',
  cancelled: 'text-danger border-danger',
  refunded: 'text-danger border-danger',
};

export default async function OrdersListPage({
  searchParams,
}: {
  searchParams: { status?: string; customer?: string };
}) {
  const supabase = createClient();
  const statusFilter = searchParams.status as OrderStatus | undefined;
  const customerFilter = searchParams.customer;

  let query = supabase
    .from('orders')
    .select('id, order_number, status, payment_status, total_amount, created_at, customers ( id, full_name, email )')
    .order('created_at', { ascending: false });

  if (statusFilter) query = query.eq('status', statusFilter);
  if (customerFilter) query = query.eq('customer_id', customerFilter);

  const { data: orders, error } = await query;

  return (
    <div>
      <h1 className="font-display text-2xl tracking-tightest">Orders</h1>
      <p className="mt-1 text-sm text-concrete">
        {orders?.length ?? 0} order{orders?.length === 1 ? '' : 's'}
        {customerFilter ? ' for this customer' : ''}.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((option) => {
          const href = option === 'all' ? '/admin/orders' : `/admin/orders?status=${option}`;
          const isActive = option === 'all' ? !statusFilter : statusFilter === option;
          return (
            <Link
              key={option}
              href={href}
              className={`border px-3 py-1.5 font-mono text-xs uppercase tracking-wide ${
                isActive
                  ? 'border-bone bg-bone text-ink'
                  : 'border-concrete/40 text-concrete hover:border-bone hover:text-bone'
              }`}
            >
              {option}
            </Link>
          );
        })}
      </div>

      {error && (
        <p className="mt-6 border border-danger px-4 py-3 font-mono text-xs text-danger">
          Could not load orders: {error.message}
        </p>
      )}

      {!error && (orders?.length ?? 0) === 0 && (
        <div className="mt-10 border border-dashed border-concrete/40 p-10 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-concrete">
            No orders here yet
          </p>
        </div>
      )}

      {!error && (orders?.length ?? 0) > 0 && (
        <div className="mt-8 overflow-x-auto border border-concrete/20">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-concrete/20 bg-panel font-mono text-[10px] uppercase tracking-widest text-concrete">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders!.map((order) => {
                const customer = order.customers as {
                  id: string;
                  full_name: string | null;
                  email: string | null;
                } | null;
                return (
                  <tr key={order.id} className="border-b border-concrete/10 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{order.order_number}</td>
                    <td className="px-4 py-3">
                      {customer ? (
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="hover:text-hazard hover:underline"
                        >
                          {customer.full_name ?? customer.email ?? 'Customer'}
                        </Link>
                      ) : (
                        <span className="text-concrete">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-concrete">
                      {new Date(order.created_at).toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
                          STATUS_STYLES[order.status] ?? 'text-concrete border-concrete'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs uppercase text-concrete">
                      {order.payment_status.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 font-mono">{formatMoney(order.total_amount)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-xs uppercase tracking-wide underline underline-offset-4 hover:text-hazard"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
