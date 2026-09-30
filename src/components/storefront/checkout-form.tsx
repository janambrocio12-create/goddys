'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart/cart-context';
import { formatMoney } from '@/lib/format';
import { placeOrder, type CheckoutAddressInput } from '@/app/(storefront)/checkout/actions';
import type { PaymentMethod } from '@/lib/types/database.types';

// No payment gateway account yet, so this is the interim setup: cash on
// delivery, or a manual GCash transfer the client verifies by eye.
// Replace these with the real GCash number and account name before launch.
const GCASH_NUMBER = '09XX XXX XXXX';
const GCASH_ACCOUNT_NAME = 'GODDYS PH (placeholder - swap in the real name)';

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [paymentReference, setPaymentReference] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (items.length === 0) {
    return (
      <p className="mt-10 text-sm text-concrete">
        Your cart is empty - go grab something from the shop before you check out.
      </p>
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (paymentMethod === 'gcash_manual' && paymentReference.trim().length === 0) {
      setError('Enter your GCash reference number to continue.');
      return;
    }

    startTransition(async () => {
      const result = await placeOrder(
        items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        address,
        discountCode,
        paymentMethod,
        paymentReference,
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

        <div className="mt-2 flex flex-col gap-3 border-t border-concrete/20 pt-4">
          <p className="font-mono text-xs uppercase tracking-widest text-concrete">Payment</p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('cod')}
              className={`border px-3 py-3 text-left font-mono text-xs uppercase tracking-wide ${
                paymentMethod === 'cod'
                  ? 'border-bone bg-bone text-ink'
                  : 'border-concrete/40 text-bone hover:border-bone'
              }`}
            >
              Cash on delivery
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('gcash_manual')}
              className={`border px-3 py-3 text-left font-mono text-xs uppercase tracking-wide ${
                paymentMethod === 'gcash_manual'
                  ? 'border-bone bg-bone text-ink'
                  : 'border-concrete/40 text-bone hover:border-bone'
              }`}
            >
              GCash
            </button>
          </div>

          {paymentMethod === 'gcash_manual' && (
            <div className="flex flex-col gap-3 border border-hazard/40 bg-panel p-4">
              <p className="text-sm text-bone">
                Send the total below to GCash, then drop the reference number here so we
                can confirm it and get your order moving.
              </p>
              <p className="font-mono text-xs text-concrete">
                GCash number: <span className="text-hazard">{GCASH_NUMBER}</span>
                <br />
                Account name: <span className="text-hazard">{GCASH_ACCOUNT_NAME}</span>
              </p>
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-xs uppercase tracking-wide text-concrete">
                  GCash reference number
                </span>
                <input
                  required
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. 0123456789012"
                  className="border border-concrete/40 bg-ink px-3 py-2 text-sm text-bone outline-none focus-visible:border-hazard"
                />
              </label>
            </div>
          )}
        </div>

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
          {isPending ? 'Placing order...' : 'Place order'}
        </button>

        <p className="font-mono text-[10px] uppercase tracking-wide text-concrete">
          {paymentMethod === 'gcash_manual'
            ? 'We will check your GCash reference and confirm before your order ships.'
            : 'Cash on delivery - have exact change ready when it lands.'}
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
