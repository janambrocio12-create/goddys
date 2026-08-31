'use client';

import { useCart } from '@/lib/cart/cart-context';

export function CartBadge() {
  const { itemCount } = useCart();
  if (itemCount === 0) return <span>Cart</span>;
  return (
    <span>
      Cart <span className="text-hazard">({itemCount})</span>
    </span>
  );
}
