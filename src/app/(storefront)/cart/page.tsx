'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart/cart-context';
import { formatMoney } from '@/lib/format';

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="px-6 py-16 text-center md:px-10">
        <p className="font-mono text-xs uppercase tracking-widest text-concrete">
          Your cart is empty
        </p>
        <Link
          href="/shop"
          className="mt-4 inline-block font-mono text-xs uppercase tracking-widest text-bone underline underline-offset-4"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:px-10">
      <h1 className="font-display text-2xl tracking-tightest">Cart</h1>

      <div className="mt-8 flex flex-col gap-6">
        {items.map((item) => (
          <div
            key={item.variantId}
            className="flex gap-4 border-b border-concrete/20 pb-6"
          >
            <div className="h-24 w-20 shrink-0 overflow-hidden bg-panel">
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary
                // external URLs (Cloudinary or pasted) at this stage.
                <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
              )}
            </div>

            <div className="flex-1">
              <p className="text-sm">{item.productName}</p>
              <p className="mt-1 font-mono text-xs text-concrete">
                {item.size} / {item.color}
              </p>
              <p className="mt-1 font-mono text-sm">{formatMoney(item.unitPrice)}</p>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center border border-concrete/40">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                    className="px-2 py-1 text-bone hover:bg-panel"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-mono text-xs">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                    disabled={item.quantity >= item.maxStock}
                    className="px-2 py-1 text-bone hover:bg-panel disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.variantId)}
                  className="font-mono text-xs uppercase text-danger underline underline-offset-4"
                >
                  Remove
                </button>
              </div>
            </div>

            <p className="font-mono text-sm">{formatMoney(item.unitPrice * item.quantity)}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-concrete/20 pt-6">
        <p className="font-mono text-xs uppercase tracking-widest text-concrete">Subtotal</p>
        <p className="font-display text-2xl">{formatMoney(subtotal)}</p>
      </div>

      <Link
        href="/checkout"
        className="mt-6 block w-full bg-bone py-3 text-center font-mono text-xs uppercase tracking-widest text-ink transition-opacity hover:opacity-90"
      >
        Checkout
      </Link>
    </div>
  );
}
