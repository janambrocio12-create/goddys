'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart/cart-context';
import { formatMoney } from '@/lib/format';
import { placeOrder, type CheckoutAddressInput } from '@/app/(storefront)/checkout/actions';

const EMPTY_ADDRESS: CheckoutAddressInput = {
  full_name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  province: '',
  postal_code: '',
  country: 'Philippines',
};

export function CheckoutForm({
  initialFullName,
  initialPhone,
}: {
  initialFullName?: string;
  initialPhone?: string;
}) {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const [address, setAddress] = useState<CheckoutAddressInput>({
    ...EMPTY_ADDRESS,
    full_name: initialFullName ?? '',
    phone: initialPhone ?? '',
  });
  const [discountCode, setDiscountCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (items.length === 0) {
    return (
      <p className="mt-10 text-sm text-concrete">
        Your cart is empty — add something from the shop before checking out.
      </p>
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await placeOrder(
        items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        address,
        discountCode,
      );

      if (!result.success) {
        setError(result.error);
        return;
      }

      clear();
      router.push(`/order-confirmation/${result.orderNumber}`);
    });
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="font-mono text-xs uppercase tracking-widest text-concrete">
          Shipping address
        </p>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-wide text-concrete">
              Full name
            </span>
            <input
              required
              value={address.full_name}
              onChange={(e) => setAddress((a) => ({ ...a, full_name: e.target.value }))}
              className="border border-concrete/40 bg-panel px-3 py-2 text-sm text-bone outline-none focus-visible:border-hazard"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-wide text-concrete">
              Phone number
            </span>
            <input
              type="tel"
              required
              value={address.phone}
              onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value }))}
              placeholder="09XX XXX XXXX"
              className="border border-concrete/40 bg-panel px-3 py-2 text-sm text-bone outline-none focus-visible:border-hazard"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase tracking-wide text-concrete">
            Address line 1
          </span>
          <input
            required
            value={address.line1}
            onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
            className="border border-concrete/40 bg-panel px-3 py-2 text-sm text-bone outline-none focus-visible:border-hazard"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase tracking-wide text-concrete">
            Address line 2 (optional)
          </span>
          <input
            value={address.line2}
            onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))}
            className="border border-concrete/40 bg-panel px-3 py-2 text-sm text-bone outline-none focus-visible:border-hazard"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-wide text-concrete">City</span>
            <input
              required
              value={address.city}
              onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
              className="border border-concrete/40 bg-panel px-3 py-2 text-sm text-bone outline-none focus-visible:border-hazard"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-wide text-concrete">
              Province
            </span>
            <input
              required
              value={address.province}
              onChange={(e) => setAddress((a) => ({ ...a, province: e.target.value }))}
              className="border border-concrete/40 bg-panel px-3 py-2 text-sm text-bone outline-none focus-visible:border-hazard"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-wide text-concrete">
              Postal code
            </span>
            <input
              required
              value={address.postal_code}
              onChange={(e) => setAddress((a) => ({ ...a, postal_code: e.target.value }))}
              className="border border-concrete/40 bg-panel px-3 py-2 text-sm text-bone outline-none focus-visible:border-hazard"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-wide text-concrete">
              Country
            </span>
            <input
              required
              value={address.country}
              onChange={(e) => setAddress((a) => ({ ...a, country: e.target.value }))}
              className="border border-concrete/40 bg-panel px-3 py-2 text-sm text-bone outline-none focus-visible:border-hazard"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase tracking-wide text-concrete">
            Discount code (optional)
          </span>
          <input
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            className="border border-concrete/40 bg-panel px-3 py-2 text-sm text-bone outline-none focus-visible:border-hazard"
          />
        </label>

        {error && (
          <p role="alert" className="font-mono text-xs text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 bg-bone py-3 font-mono text-xs uppercase tracking-widest text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? 'Placing order…' : 'Place order'}
        </button>

        <p className="font-mono text-[10px] uppercase tracking-wide text-concrete">
          Payment is not collected online yet — we will follow up to arrange payment
          after you order.
        </p>
      </form>

      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-concrete">
          Order summary
        </p>
        <div className="mt-4 flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.variantId} className="flex justify-between text-sm">
              <span>
                {item.productName}{' '}
                <span className="font-mono text-xs text-concrete">
                  ({item.size}/{item.color}) × {item.quantity}
                </span>
              </span>
              <span className="font-mono">{formatMoney(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between border-t border-concrete/20 pt-4 font-mono">
          <span className="text-xs uppercase tracking-widest text-concrete">Subtotal</span>
          <span>{formatMoney(subtotal)}</span>
        </div>
        <p className="mt-2 font-mono text-[10px] text-concrete">
          Discounts and shipping are applied when the order is placed.
        </p>
      </div>
    </div>
  );
}
