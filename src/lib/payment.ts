import type { PaymentMethod } from '@/lib/types/database.types';

// Flat fee added to every order. Display only - the real amount is set by
// create_order() in supabase/migrations/0014_bdo_and_shipping_fee.sql, so
// keep the two in sync.
export const SHIPPING_FEE = 100;

// Short name of where the customer sent the money. null for cash on
// delivery, which has no reference number to check.
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string | null> = {
  cod: null,
  gcash_manual: 'GCash',
  paymaya_manual: 'PayMaya',
  bdo_manual: 'BDO',
};

export function paymentMethodLabel(method: PaymentMethod): string {
  return PAYMENT_METHOD_LABELS[method] ?? 'Cash on delivery';
}
