'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { updateProduct } from '@/app/admin/(protected)/products/actions';
import { inputClass, labelClass, primaryButtonClass } from '@/components/admin/form-styles';
import type { Database } from '@/lib/types/database.types';

type Product = Database['public']['Tables']['products']['Row'];
type Category = { id: string; name: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={primaryButtonClass}>
      {pending ? 'Saving…' : 'Save changes'}
    </button>
  );
}

export function EditProductForm({
  product,
  categories,
}: {
  product: Product;
  categories: Category[];
}) {
  const updateProductWithId = updateProduct.bind(null, product.id);
  const [state, formAction] = useFormState(updateProductWithId, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state && 'error' in state && (
        <p role="alert" className="border border-danger px-4 py-3 font-mono text-xs text-danger">
          {state.error}
        </p>
      )}
      {state && 'success' in state && (
        <p className="border border-hazard px-4 py-3 font-mono text-xs text-hazard">
          Saved.
        </p>
      )}

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>Name</span>
        <input name="name" required defaultValue={product.name} className={inputClass} />
      </label>

      {/* Slug and SKU are internal reference codes with no business
          meaning to a shop admin - keep them exactly as they are instead
          of exposing a field that would just confuse, or let a save
          silently change a product's URL/code. */}
      <input type="hidden" name="slug" value={product.slug} />
      <input type="hidden" name="sku" value={product.sku} />

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>Description</span>
        <textarea
          name="description"
          rows={4}
          defaultValue={product.description ?? ''}
          className={inputClass}
        />
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
            defaultValue={product.price}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Sale price</span>
          <input
            name="sale_price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product.sale_price ?? ''}
            className={inputClass}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>Category</span>
        <select
          name="category_id"
          defaultValue={product.category_id ?? ''}
          className={inputClass}
        >
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
        <select name="status" defaultValue={product.status} className={inputClass}>
          <option value="draft">Draft - hidden, not for sale yet</option>
          <option value="active">Active - visible and for sale in the shop</option>
          <option value="archived">Archived - taken down, kept on record</option>
        </select>
      </label>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_featured"
            defaultChecked={product.is_featured}
            className="accent-hazard"
          />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_new_arrival"
            defaultChecked={product.is_new_arrival}
            className="accent-hazard"
          />
          New arrival
        </label>
      </div>

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
