'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createProduct, type NewVariantInput } from '@/app/admin/(protected)/products/actions';
import {
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/components/admin/form-styles';

type Category = { id: string; name: string };

const EMPTY_VARIANT: NewVariantInput = {
  size: '',
  color: '',
  sku: '',
  price_override: null,
  initial_stock: 0,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={primaryButtonClass}>
      {pending ? 'Creating…' : 'Create product'}
    </button>
  );
}

export function NewProductForm({ categories }: { categories: Category[] }) {
  const [state, formAction] = useFormState(createProduct, null);
  const [variants, setVariants] = useState<NewVariantInput[]>([{ ...EMPTY_VARIANT }]);

  function updateVariant(index: number, patch: Partial<NewVariantInput>) {
    setVariants((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addVariantRow() {
    setVariants((rows) => [...rows, { ...EMPTY_VARIANT }]);
  }

  function removeVariantRow(index: number) {
    setVariants((rows) => rows.filter((_, i) => i !== index));
  }

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {state && 'error' in state && (
        <p role="alert" className="border border-danger px-4 py-3 font-mono text-xs text-danger">
          {state.error}
        </p>
      )}

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 font-display text-lg tracking-tightest">Details</legend>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Name</span>
          <input name="name" required className={inputClass} placeholder="GODDYS Oversized Tee" />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Description</span>
          <textarea name="description" rows={4} className={inputClass} />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Price (PHP)</span>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Sale price (optional)</span>
            <input name="sale_price" type="number" step="0.01" min="0" className={inputClass} />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Category</span>
          <select name="category_id" className={inputClass} defaultValue="">
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Status</span>
          <select name="status" className={inputClass} defaultValue="draft">
            <option value="draft">Draft - hidden, not for sale yet</option>
            <option value="active">Active - visible and for sale in the shop</option>
            <option value="archived">Archived - taken down, kept on record</option>
          </select>
        </label>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_featured" className="accent-hazard" />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_new_arrival" className="accent-hazard" />
            New arrival
          </label>
        </div>

        <p className="text-sm text-concrete">
          You can upload photos once the product is created - no need to add one now.
        </p>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 font-display text-lg tracking-tightest">
          Sizes &amp; colors
        </legend>
        <p className="-mt-2 text-sm text-concrete">
          Add one row per size/color you&apos;re selling - e.g. a shirt in M and L, each in Black
          and White, is 4 rows.
        </p>

        <div className="flex flex-col gap-3">
          {variants.map((variant, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 border border-concrete/20 bg-panel p-3 sm:grid sm:grid-cols-[1fr_1fr_1fr_1fr_auto] sm:items-end sm:gap-2"
            >
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[10px] uppercase tracking-wide text-concrete">
                  Size
                </span>
                <input
                  placeholder="e.g. M"
                  value={variant.size}
                  onChange={(e) => updateVariant(index, { size: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[10px] uppercase tracking-wide text-concrete">
                  Color
                </span>
                <input
                  placeholder="e.g. Black"
                  value={variant.color}
                  onChange={(e) => updateVariant(index, { color: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[10px] uppercase tracking-wide text-concrete">
                  Stock
                </span>
                <input
                  placeholder="0"
                  type="number"
                  min="0"
                  value={variant.initial_stock}
                  onChange={(e) =>
                    updateVariant(index, { initial_stock: Number(e.target.value) || 0 })
                  }
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[10px] uppercase tracking-wide text-concrete">
                  Different price?
                </span>
                <input
                  placeholder="Same as above"
                  type="number"
                  step="0.01"
                  value={variant.price_override ?? ''}
                  onChange={(e) =>
                    updateVariant(index, {
                      price_override: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className={inputClass}
                />
              </label>
              <button
                type="button"
                onClick={() => removeVariantRow(index)}
                className="font-mono text-xs uppercase text-danger hover:underline sm:pb-2.5"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <button type="button" onClick={addVariantRow} className={secondaryButtonClass}>
          + Add size/color row
        </button>

        <input type="hidden" name="variants_json" value={JSON.stringify(variants)} />
      </fieldset>

      <SubmitButton />
    </form>
  );
}
