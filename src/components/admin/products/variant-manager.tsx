'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  addVariant,
  adjustStock,
  deleteVariant,
  updateVariant,
  type NewVariantInput,
} from '@/app/admin/(protected)/products/actions';
import {
  ghostButtonClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/components/admin/form-styles';
import type { InventoryMovementType } from '@/lib/types/database.types';

type Variant = {
  id: string;
  size: string;
  color: string;
  sku: string;
  price_override: number | null;
  stock_quantity: number;
};

const EMPTY_VARIANT: NewVariantInput = {
  size: '',
  color: '',
  sku: '',
  price_override: null,
  initial_stock: 0,
};

function StockAdjustRow({ productId, variantId }: { productId: string; variantId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<InventoryMovementType>('restock');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={ghostButtonClass}>
        Adjust stock
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={type}
        onChange={(e) => setType(e.target.value as InventoryMovementType)}
        className={`${inputClass} w-auto`}
      >
        <option value="restock">Restock (+)</option>
        <option value="adjustment">Adjustment (+/-)</option>
        <option value="return">Return (+)</option>
      </select>
      <input
        placeholder="Qty"
        type="number"
        min={type === 'adjustment' ? undefined : 0}
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        className={`${inputClass} w-24`}
      />
      <input
        placeholder="Reason (optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className={`${inputClass} w-40`}
      />
      <button
        type="button"
        disabled={isPending}
        className={secondaryButtonClass}
        onClick={() => {
          setError(null);
          const qty = Number(quantity);
          if ((type === 'restock' || type === 'return') && qty < 0) {
            setError('Restock and return quantities must be positive. Use Adjustment for a decrease.');
            return;
          }
          startTransition(async () => {
            const result = await adjustStock(
              productId,
              variantId,
              type,
              Number(quantity),
              reason,
            );
            if (result && 'error' in result) {
              setError(result.error);
              return;
            }
            setOpen(false);
            setQuantity('');
            setReason('');
            router.refresh();
          });
        }}
      >
        Apply
      </button>
      <button type="button" onClick={() => setOpen(false)} className={ghostButtonClass}>
        Cancel
      </button>
      {error && <p className="w-full font-mono text-xs text-danger">{error}</p>}
    </div>
  );
}

function VariantRow({ productId, variant }: { productId: string; variant: Variant }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({
    size: variant.size,
    color: variant.color,
    sku: variant.sku,
    price_override: variant.price_override,
  });
  const [error, setError] = useState<string | null>(null);

  function saveEdit() {
    setError(null);
    startTransition(async () => {
      const result = await updateVariant(productId, variant.id, draft);
      if (result && 'error' in result) {
        setError(result.error);
        return;
      }
      setIsEditing(false);
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm(`Delete the ${variant.size} / ${variant.color} variant?`)) return;
    startTransition(async () => {
      const result = await deleteVariant(productId, variant.id);
      if (result && 'error' in result) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (isEditing) {
    return (
      <tr className="border-b border-concrete/10">
        <td className="px-3 py-2" colSpan={4}>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={draft.size}
              onChange={(e) => setDraft((d) => ({ ...d, size: e.target.value }))}
              placeholder="Size"
              className={`${inputClass} w-20`}
            />
            <input
              value={draft.color}
              onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))}
              placeholder="Color"
              className={`${inputClass} w-28`}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Different price (optional)"
              value={draft.price_override ?? ''}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  price_override: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className={`${inputClass} w-32`}
            />
            <button
              type="button"
              disabled={isPending}
              onClick={saveEdit}
              className={secondaryButtonClass}
            >
              Save
            </button>
            <button type="button" onClick={() => setIsEditing(false)} className={ghostButtonClass}>
              Cancel
            </button>
          </div>
          {error && <p className="mt-1 font-mono text-xs text-danger">{error}</p>}
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-concrete/10 align-top">
      <td className="px-3 py-2">{variant.size}</td>
      <td className="px-3 py-2">{variant.color}</td>
      <td className="px-3 py-2 font-mono">{variant.stock_quantity}</td>
      <td className="px-3 py-2">
        <div className="flex flex-col items-start gap-2">
          <div className="flex gap-3">
            <button type="button" onClick={() => setIsEditing(true)} className={ghostButtonClass}>
              Edit
            </button>
            <button type="button" onClick={remove} className={`${ghostButtonClass} text-danger`}>
              Delete
            </button>
          </div>
          <StockAdjustRow productId={productId} variantId={variant.id} />
          {error && <p className="font-mono text-xs text-danger">{error}</p>}
        </div>
      </td>
    </tr>
  );
}

export function VariantManager({
  productId,
  variants,
}: {
  productId: string;
  variants: Variant[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newVariant, setNewVariant] = useState<NewVariantInput>({ ...EMPTY_VARIANT });
  const [error, setError] = useState<string | null>(null);

  function submitNewVariant() {
    setError(null);
    startTransition(async () => {
      const result = await addVariant(productId, newVariant);
      if (result && 'error' in result) {
        setError(result.error);
        return;
      }
      setNewVariant({ ...EMPTY_VARIANT });
      router.refresh();
    });
  }

  return (
    <div>
      {variants.length === 0 ? (
        <p className="border border-dashed border-concrete/40 p-6 text-center text-sm text-concrete">
          No size/color variants yet - add one below.
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-concrete/20 font-mono text-[10px] uppercase tracking-widest text-concrete">
              <th className="px-3 py-2">Size</th>
              <th className="px-3 py-2">Color</th>
              <th className="px-3 py-2">Stock</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((variant) => (
              <VariantRow key={variant.id} productId={productId} variant={variant} />
            ))}
          </tbody>
        </table>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] border border-concrete/20 bg-panel p-3">
        <input
          placeholder="Size"
          value={newVariant.size}
          onChange={(e) => setNewVariant((v) => ({ ...v, size: e.target.value }))}
          className={inputClass}
        />
        <input
          placeholder="Color"
          value={newVariant.color}
          onChange={(e) => setNewVariant((v) => ({ ...v, color: e.target.value }))}
          className={inputClass}
        />
        <input
          placeholder="Stock"
          type="number"
          min="0"
          value={newVariant.initial_stock}
          onChange={(e) =>
            setNewVariant((v) => ({ ...v, initial_stock: Number(e.target.value) || 0 }))
          }
          className={inputClass}
        />
        <input
          placeholder="Different price (optional)"
          type="number"
          step="0.01"
          value={newVariant.price_override ?? ''}
          onChange={(e) =>
            setNewVariant((v) => ({
              ...v,
              price_override: e.target.value ? Number(e.target.value) : null,
            }))
          }
          className={inputClass}
        />
        <button
          type="button"
          disabled={isPending}
          onClick={submitNewVariant}
          className={primaryButtonClass}
        >
          Add
        </button>
      </div>
      {error && <p className="mt-2 font-mono text-xs text-danger">{error}</p>}
    </div>
  );
}
