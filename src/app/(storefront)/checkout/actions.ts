'use server';

import { createClient } from '@/lib/supabase/server';
import type { PaymentMethod } from '@/lib/types/database.types';

export type CheckoutItemInput = { variantId: string; quantity: number };

export type CheckoutAddressInput = {
  full_name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
};

type PlaceOrderResult =
  | { success: true; orderNumber: string }
  | { success: false; error: string };

export async function placeOrder(
  items: CheckoutItemInput[],
  shippingAddress: CheckoutAddressInput,
  discountCode: string,
  paymentMethod: PaymentMethod,
  paymentReference: string,
): Promise<PlaceOrderResult> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be signed in to place an order.' };
  }

  if (items.length === 0) {
    return { success: false, error: 'Your cart is empty.' };
  }

  // Cash on delivery is no longer offered at checkout - client's call. The
  // form itself never sends 'cod' anymore, but this catches a direct call
  // (API abuse, a stale client, etc) instead of trusting the input.
  if (paymentMethod === 'cod') {
    return { success: false, error: 'Cash on delivery is not available - choose GCash, PayMaya, or BDO.' };
  }

  if (paymentReference.trim().length === 0) {
    return { success: false, error: 'Enter your reference number to continue.' };
  }

  const effectiveReference = paymentReference.trim();

  const { data, error } = await supabase.rpc('create_order', {
    p_shipping_address: shippingAddress,
    p_billing_address: null,
    p_discount_code: discountCode.trim() || null,
    p_items: items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
    p_payment_method: paymentMethod,
    p_payment_reference: effectiveReference,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const order = data?.[0];
  if (!order) {
    return { success: false, error: 'Something went wrong placing your order.' };
  }

  return { success: true, orderNumber: order.order_number };
}
