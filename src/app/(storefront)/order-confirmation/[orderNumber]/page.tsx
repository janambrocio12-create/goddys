import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatMoney } from '@/lib/format';
import type { Address } from '@/lib/types/database.types';

export default async function OrderConfirmationPage({
  params,
}: {
  params: { orderNumber: string };
}) {
  const supabase = createClient();

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', params.orderNumber)
    .maybeSingle();

  if (!order) {
    notFound();
  }

  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', order.id);

  const shippingAddress = order.shipping_address as Address;

  const walletLabel =
    order.payment_method === 'gcash_manual'
      ? 'GCash'
      : order.payment_method === 'paymaya_manual'
        ? 'PayMaya'
        : null;

  const paymentNote = walletLabel
    ? order.payment_status === 'paid'
      ? `${walletLabel} payment confirmed. We are getting your order ready.`
      : `We are checking your ${walletLabel} reference against the payment. Keep this order number on hand.`
    : 'Cash on delivery - have exact change ready when it lands.';

  return (
    <div className="mx-auto max-w-xl px-6 py-16 md:px-10">
      <p className="font-mono text-xs uppercase tracking-widest text-hazard">Order details</p>
      <h1 className="mt-2 font-display text-3xl tracking-tightest">
        Locked in - {order.order_number}
      </h1>
      <p className="mt-4 text-sm text-concrete">{paymentNote}</p>
      {walletLabel && order.payment_reference && (
        <p className="mt-1 font-mono text-xs text-concrete">
          Reference: <span className="text-bone">{order.payment_reference}</span>
        </p>
      )}

      <div className="mt-8 border-t border-concrete/20 pt-6">
        <p className="font-mono text-xs uppercase tracking-widest text-concrete">Shipping to</p>
        <p className="mt-2 text-sm">
          {shippingAddress.full_name} · {shippingAddress.phone}
          <br />
          {shippingAddress.line1}
          {shippingAddress.line2 ? `, ${shippingAddress.line2}` : ''}
          <br />
          {shippingAddress.city}, {shippingAddress.province} {shippingAddress.postal_code}
          <br />
          {shippingAddress.country}
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-concrete/20 pt-6">
        {(items ?? []).map((item) => {
          const details = item.variant_details as { size: string; color: string };
          return (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.product_name}{' '}
                <span className="font-mono text-xs text-concrete">
                  ({details.size}/{details.color}) × {item.quantity}
                </span>
              </span>
              <span className="font-mono">{formatMoney(item.subtotal)}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex justify-between border-t border-concrete/20 pt-4 font-mono">
        <span className="text-xs uppercase tracking-widest text-concrete">Total</span>
        <span className="text-lg">{formatMoney(order.total_amount)}</span>
      </div>
    </div>
  );
}
