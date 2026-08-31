'use client';

import { useTransition } from 'react';
import { deleteProduct } from '@/app/admin/(protected)/products/actions';
import { dangerButtonClass } from '@/components/admin/form-styles';

export function DeleteProductButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (
      !window.confirm(
        `Delete "${productName}"? This removes its variants and images too. This can't be undone.`,
      )
    ) {
      return;
    }
    startTransition(() => {
      deleteProduct(productId);
    });
  }

  return (
    <button type="button" disabled={isPending} onClick={handleClick} className={dangerButtonClass}>
      {isPending ? 'Deleting…' : 'Delete product'}
    </button>
  );
}
