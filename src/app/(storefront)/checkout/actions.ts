'use server';

import { createClient } from '@/lib/supabase/server';

export type CheckoutItemInput = { variantId: string; quantity: number };

export type CheckoutAddressInput = {
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

  const { data, error } = await supabase.rpc('create_order', {
    p_shipping_address: shippingAddress,
    p_billing_address: null,
    p_discount_code: discountCode.trim() || null,
    p_items: items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
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
