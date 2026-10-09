import Link from 'next/link';

export default function ShippingReturnsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 md:px-10">
      <p className="font-mono text-xs uppercase tracking-widest text-hazard">Help</p>
      <h1 className="mt-2 font-display text-3xl tracking-tightest md:text-4xl">
        Shipping &amp; returns
      </h1>

      <div className="mt-8 flex flex-col gap-8 text-sm text-concrete">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-bone">Shipping</p>
          <p className="mt-2">
            Packed in 1-2 business days after payment. We message you directly
            to confirm payment, shipping fee, and ETA. Delivery time varies by
            courier.
          </p>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-bone">Returns</p>
          <p className="mt-2">
            Size exchange only. 7 days after delivery. Item must be unworn with
            tags. Message us on the{' '}
            <Link href="/contact" className="text-bone underline hover:text-hazard">
              Contact page
            </Link>{' '}
            with order number + new size.
          </p>
          <p className="mt-3">
            Exchanges depend on stock. No worn/washed/damaged items. Return
            shipping is on you unless we messed up.
          </p>
        </div>

        <div className="border border-hazard/40 p-5">
          <p className="font-display text-lg tracking-tightest text-bone">
            FINAL SALE. NO SHORTCUTS.
          </p>
          <p className="mt-2">
            Limited runs. Check your{' '}
            <Link href="/size-guide" className="text-bone underline hover:text-hazard">
              size
            </Link>{' '}
            before you order.
          </p>
        </div>
      </div>
    </div>
  );
}
