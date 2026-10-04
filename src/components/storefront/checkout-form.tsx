'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart/cart-context';
import { formatMoney } from '@/lib/format';
import { placeOrder, type CheckoutAddressInput } from '@/app/(storefront)/checkout/actions';

// No payment gateway account yet, so this is the interim setup: a manual
// e-wallet transfer (GCash or PayMaya) the client verifies by eye. Both
// wallets land in the same account, just different apps - so same number
// and name, different QR per app. Cash on delivery used to be a third
// option here but the client dropped it - orders placed with it before
// still display fine (see order-confirmation and admin), it's just gone
// from checkout going forward.
const WALLET_ACCOUNT_NUMBER = '0995 528 6273';
const WALLET_ACCOUNT_NAME = 'Miguel Armildez';

type WalletMethod = 'gcash_manual' | 'paymaya_manual';

const WALLET_CONFIG: Record<WalletMethod, { label: string; qrImage: string; qrAlt: string }> = {
  gcash_manual: {
    label: 'GCash',
    qrImage: '/images/gcash-qr.jpg',
    qrAlt: 'GODDYS GCash QR code',
  },
  paymaya_manual: {
    label: 'PayMaya',
    qrImage: '/images/paymaya-qr.jpg',
    qrAlt: 'GODDYS PayMaya QR code',
  },
};

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
  const [paymentMethod, setPaymentMethod] = useState<WalletMethod>('gcash_manual');
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

    if (paymentReference.trim().length === 0) {
      setError(`Enter your ${WALLET_CONFIG[paymentMethod].label} reference number to continue.`);
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              onClick={() => setPaymentMethod('gcash_manual')}
              className={`border px-3 py-3 text-left font-mono text-xs uppercase tracking-wide ${
                paymentMethod === 'gcash_manual'
                  ? 'border-bone bg-bone text-ink'
                  : 'border-concrete/40 text-bone hover:border-bone'
              }`}
            >
              GCash
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('paymaya_manual')}
              className={`border px-3 py-3 text-left font-mono text-xs uppercase tracking-wide ${
                paymentMethod === 'paymaya_manual'
                  ? 'border-bone bg-bone text-ink'
                  : 'border-concrete/40 text-bone hover:border-bone'
              }`}
            >
              PayMaya
            </button>
          </div>

          <div className="flex flex-col gap-3 border border-hazard/40 bg-panel p-4">
            <p className="text-sm text-bone">
              Scan the QR or send straight to the number below, then drop the reference
              number here so we can confirm it and get your order moving.
            </p>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <div className="w-32 shrink-0 overflow-hidden border border-concrete/30 bg-bone">
                <Image
                  src={WALLET_CONFIG[paymentMethod].qrImage}
                  alt={WALLET_CONFIG[paymentMethod].qrAlt}
                  width={300}
                  height={333}
                  className="h-auto w-full"
                />
              </div>
              <p className="font-mono text-xs text-concrete">
                {WALLET_CONFIG[paymentMethod].label} number:{' '}
                <span className="text-hazard">{WALLET_ACCOUNT_NUMBER}</span>
                <br />
                Account name: <span className="text-hazard">{WALLET_ACCOUNT_NAME}</span>
              </p>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-xs uppercase tracking-wide text-concrete">
                {WALLET_CONFIG[paymentMethod].label} reference number
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
          We will check your {WALLET_CONFIG[paymentMethod].label} reference and confirm before
          your order ships.
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
