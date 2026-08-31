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
            Orders are packed within 1–2 business days. We will confirm
            shipping details and delivery timing directly with you after you
            place an order, since payment is currently arranged by hand
            rather than collected at checkout.
          </p>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-bone">Returns</p>
          <p className="mt-2">
            Unworn items in original condition can be exchanged for a
            different size within 7 days of delivery. Reach out on the
            Contact page with your order number to start an exchange.
          </p>
        </div>
      </div>
    </div>
  );
}
