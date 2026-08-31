'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { OrderStatus, PaymentStatus } from '@/lib/types/database.types';

type ActionResult = { error: string } | { success: true };

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<ActionResult> {
  const supabase = createClient();

  // Cancelling has a side effect (restoring stock), so it always goes
  // through the dedicated RPC instead of a plain column update — see
  // 0008_cancel_order.sql for why.
  if (status === 'cancelled') {
    const { error } = await supabase.rpc('cancel_order', { p_order_id: orderId });
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) return { error: error.message };
  }

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}

export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus,
): Promise<ActionResult> {
  const supabase = createClient();

  const { error } = await supabase
    .from('orders')
    .update({ payment_status: paymentStatus })
    .eq('id', orderId);

  if (error) return { error: error.message };

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}
