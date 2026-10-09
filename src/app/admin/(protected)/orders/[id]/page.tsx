import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatMoney } from '@/lib/format';
import { PAYMENT_METHOD_LABELS } from '@/lib/payment';
import { OrderStatusControls } from '@/components/admin/orders/order-status-controls';
import type { Address } from '@/lib/types/database.types';

function AddressBlock({ address, label }: { address: Address | null; label: string }) {
  if (!address) return null;
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-concrete">{label}</p>
      <p className="mt-2 text-sm">
        {address.full_name}
        {address.phone ? ` · ${address.phone}` : ''}
        <br />
        {address.line1}
        {address.line2 ? `, ${address.line2}` : ''}
        <br />
        {address.city}, {address.province} {address.postal_code}
        <br />
        {address.country}
      </p>
    </div>
  );
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: order } = await supabase
    .from('orders')
    .select('*, customers ( id, full_name, email, phone )')
    .eq('id', params.id)
    .maybeSingle();

  if (!order) {
    notFound();
  }

  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', order.id);

  const customer = order.customers as {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-concrete">Order</p>
        <h1 className="mt-1 font-display text-2xl tracking-tightest">{order.order_number}</h1>
        <p className="mt-1 text-sm text-concrete">
          Placed{' '}
          {new Date(order.created_at).toLocaleString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-concrete">Customer</p>
          {customer ? (
            <Link
              href={`/admin/customers/${customer.id}`}
              className="mt-2 block text-sm hover:text-hazard hover:underline"
            >
              {customer.full_name ?? 'Unnamed'}
              <br />
              <span className="font-mono text-xs text-concrete">{customer.email}</span>
            </Link>
          ) : (
            <p className="mt-2 text-sm text-concrete">Customer no longer exists</p>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <OrderStatusControls
            orderId={order.id}
            currentStatus={order.status}
            currentPaymentStatus={order.payment_status}
          />

          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-concrete">
              Payment method
            </p>
            <p className="mt-2 text-sm">
              {PAYMENT_METHOD_LABELS[order.payment_method]
                ? `${PAYMENT_METHOD_LABELS[order.payment_method]} (manual)`
                : 'Cash on delivery'}
            </p>
            {PAYMENT_METHOD_LABELS[order.payment_method] && (
              <p className="mt-1 font-mono text-xs text-hazard">
                Reference: {order.payment_reference ?? '-'} - check the{' '}
                {order.payment_method === 'bdo_manual'
                  ? 'BDO account'
                  : `${PAYMENT_METHOD_LABELS[order.payment_method]} app`}{' '}
                before marking this paid.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <AddressBlock address={order.shipping_address as Address} label="Shipping address" />
        <AddressBlock address={order.billing_address as Address | null} label="Billing address" />
      </div>

      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-concrete">Items</p>
        <div className="mt-4 overflow-x-auto border border-concrete/20">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-concrete/20 bg-panel font-mono text-[10px] uppercase tracking-widest text-concrete">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Unit price</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(items ?? []).map((item) => {
                const details = item.variant_details as { size: string; color: string };
                return (
                  <tr key={item.id} className="border-b border-concrete/10 last:border-0">
                    <td className="px-4 py-3">
                      {item.product_name}
                      <span className="ml-2 font-mono text-xs text-concrete">
                        ({details.size}/{details.color})
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">{formatMoney(item.unit_price)}</td>
                    <td className="px-4 py-3 font-mono">{item.quantity}</td>
                    <td className="px-4 py-3 font-mono">{formatMoney(item.subtotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 ml-auto flex max-w-xs flex-col gap-1 font-mono text-sm">
          <div className="flex justify-between text-concrete">
            <span>Subtotal</span>
            <span>{formatMoney(order.subtotal)}</span>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-hazard">
              <span>Discount</span>
              <span>−{formatMoney(order.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-concrete">
            <span>Shipping</span>
            <span>{formatMoney(order.shipping_amount)}</span>
          </div>
          <div className="flex justify-between text-concrete">
            <span>Tax</span>
            <span>{formatMoney(order.tax_amount)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-concrete/20 pt-2 text-base">
            <span>Total</span>
            <span>{formatMoney(order.total_amount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
