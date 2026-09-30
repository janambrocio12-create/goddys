import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatMoney } from '@/lib/format';
import type { OrderStatus } from '@/lib/types/database.types';

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'text-concrete border-concrete',
  processing: 'text-hazard border-hazard',
  shipped: 'text-hazard border-hazard',
  delivered: 'text-bone border-bone',
  cancelled: 'text-danger border-danger',
  refunded: 'text-danger border-danger',
};

export default async function CustomerOrdersPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/account/login?redirect=/account/orders');
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, payment_status, payment_method, total_amount, created_at')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:px-10">
      <p className="font-mono text-xs uppercase tracking-widest text-hazard">Order history</p>
      <h1 className="mt-2 font-display text-3xl tracking-tightest md:text-4xl">Your orders</h1>

      {(!orders || orders.length === 0) && (
        <div className="mt-10 border border-dashed border-concrete/40 p-10 text-center">
          <p className="text-sm text-concrete">
            No orders yet - your first drop is one click away.
          </p>
          <Link
            href="/shop"
            className="mt-4 inline-block font-mono text-xs uppercase tracking-widest text-hazard hover:underline"
          >
            Go to shop
          </Link>
        </div>
      )}

      {orders && orders.length > 0 && (
        <div className="mt-8 flex flex-col gap-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/order-confirmation/${order.order_number}`}
              className="flex flex-col gap-2 border border-concrete/20 p-4 hover:border-bone sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-mono text-sm">{order.order_number}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-concrete">
                  {new Date(order.created_at).toLocaleDateString('en-PH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {' · '}
                  {order.payment_method === 'gcash_manual' ? 'GCash' : 'Cash on delivery'}
                  {' · '}
                  {order.payment_status.replace('_', ' ')}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
                    STATUS_STYLES[order.status] ?? 'text-concrete border-concrete'
                  }`}
                >
                  {order.status}
                </span>
                <span className="font-mono text-sm">{formatMoney(order.total_amount)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
