import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatMoney } from '@/lib/format';
import type { Address } from '@/lib/types/database.types';

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (!customer) {
    notFound();
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, total_amount, created_at')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false });

  const addresses = customer.addresses as Address[];

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-concrete">Customer</p>
        <h1 className="mt-1 font-display text-2xl tracking-tightest">
          {customer.full_name ?? 'Unnamed customer'}
        </h1>
        <p className="mt-1 font-mono text-sm text-concrete">{customer.email}</p>
      </div>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <div className="border border-concrete/20 bg-panel p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-concrete">Phone</p>
          <p className="mt-1 text-sm">{customer.phone ?? '—'}</p>
        </div>
        <div className="border border-concrete/20 bg-panel p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-concrete">
            Marketing
          </p>
          <p className="mt-1 text-sm">{customer.marketing_opt_in ? 'Opted in' : 'Opted out'}</p>
        </div>
        <div className="border border-concrete/20 bg-panel p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-concrete">Joined</p>
          <p className="mt-1 text-sm">
            {new Date(customer.created_at).toLocaleDateString('en-PH', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="border border-concrete/20 bg-panel p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-concrete">Orders</p>
          <p className="mt-1 text-sm">{orders?.length ?? 0}</p>
        </div>
      </div>

      {addresses.length > 0 && (
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-concrete">
            Saved addresses
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {addresses.map((address, index) => (
              <div key={index} className="border border-concrete/20 p-4 text-sm">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ''}
                <br />
                {address.city}, {address.province} {address.postal_code}
                <br />
                {address.country}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-concrete">Order history</p>

        {(!orders || orders.length === 0) && (
          <p className="mt-3 text-sm text-concrete">No orders yet.</p>
        )}

        {orders && orders.length > 0 && (
          <div className="mt-4 overflow-x-auto border border-concrete/20">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-concrete/20 bg-panel font-mono text-[10px] uppercase tracking-widest text-concrete">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-concrete/10 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{order.order_number}</td>
                    <td className="px-4 py-3 text-concrete">
                      {new Date(order.created_at).toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs uppercase text-concrete">
                      {order.status}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
