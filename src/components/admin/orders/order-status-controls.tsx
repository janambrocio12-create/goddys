'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateOrderStatus, updatePaymentStatus } from '@/app/admin/(protected)/orders/actions';
import { inputClass, primaryButtonClass } from '@/components/admin/form-styles';
import type { OrderStatus, PaymentStatus } from '@/lib/types/database.types';

const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

const PAYMENT_STATUSES: PaymentStatus[] = [
  'unpaid',
  'paid',
  'failed',
  'refunded',
  'partially_refunded',
];

export function OrderStatusControls({
  orderId,
  currentStatus,
  currentPaymentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  currentPaymentStatus: PaymentStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(currentPaymentStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function saveStatus() {
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, status);
      if ('error' in result) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function savePaymentStatus() {
    setError(null);
    startTransition(async () => {
      const result = await updatePaymentStatus(orderId, paymentStatus);
      if ('error' in result) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-2">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase tracking-wide text-concrete">
            Order status
          </span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            className={`${inputClass} w-48`}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={isPending || status === currentStatus}
          onClick={saveStatus}
          className={primaryButtonClass}
        >
          Update
        </button>
      </div>

      <div className="flex items-end gap-2">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase tracking-wide text-concrete">
            Payment status
          </span>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
            className={`${inputClass} w-48`}
          >
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={isPending || paymentStatus === currentPaymentStatus}
          onClick={savePaymentStatus}
          className={primaryButtonClass}
        >
          Update
        </button>
      </div>

      {status === 'cancelled' && currentStatus !== 'cancelled' && (
        <p className="font-mono text-[10px] uppercase tracking-wide text-hazard">
          Cancelling restores stock for every item on this order.
        </p>
      )}

      {error && <p className="font-mono text-xs text-danger">{error}</p>}
    </div>
  );
}
