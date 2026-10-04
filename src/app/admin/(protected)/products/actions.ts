'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils/slugify';
import type { Database, InventoryMovementType, ProductStatus } from '@/lib/types/database.types';

type ActionResult = { error: string } | { success: true };

export type NewVariantInput = {
  size: string;
  color: string;
  sku: string;
  price_override: number | null;
  initial_stock: number;
};

type ProductFieldsFromForm = Database['public']['Tables']['products']['Insert'];

function readProductFields(formData: FormData): ProductFieldsFromForm {
  const name = String(formData.get('name') ?? '').trim();
  const slugInput = String(formData.get('slug') ?? '').trim();
  const priceRaw = String(formData.get('price') ?? '');
  const salePriceRaw = String(formData.get('sale_price') ?? '').trim();
  const categoryId = String(formData.get('category_id') ?? '').trim();

  return {
    name,
    slug: slugify(slugInput || name),
    description: String(formData.get('description') ?? '').trim() || null,
    price: Number(priceRaw),
    sale_price: salePriceRaw ? Number(salePriceRaw) : null,
    category_id: categoryId || null,
    sku: String(formData.get('sku') ?? '').trim(),
    status: (String(formData.get('status') ?? 'draft') as ProductStatus),
    is_featured: formData.get('is_featured') === 'on',
    is_new_arrival: formData.get('is_new_arrival') === 'on',
  };
}

/**
 * Creates a product, its initial variants, and (optionally) one hero
 * image, then redirects to the product list. Initial stock is written
 * as `restock` movements through the inventory ledger rather than a
 * direct column write, same as the seed data does.
 */
export async function createProduct(_prevState: ActionResult | null, formData: FormData) {
  const supabase = createClient();
  const fields = readProductFields(formData);

  if (!fields.name || !fields.sku || !Number.isFinite(fields.price)) {
    return { error: 'Name, SKU, and a valid price are required.' };
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .insert(fields)
    .select()
    .single();

  if (productError || !product) {
    return { error: productError?.message ?? 'Could not create the product.' };
  }

  const variantsRaw = String(formData.get('variants_json') ?? '[]');
  let variants: NewVariantInput[] = [];
  try {
    variants = JSON.parse(variantsRaw);
  } catch {
    variants = [];
  }
  variants = variants.filter((v) => v.size.trim() && v.color.trim() && v.sku.trim());

  if (variants.length > 0) {
    const { data: insertedVariants, error: variantError } = await supabase
      .from('product_variants')
      .insert(
        variants.map((v) => ({
          product_id: product.id,
          size: v.size.trim(),
          color: v.color.trim(),
          sku: v.sku.trim(),
          price_override: v.price_override,
        })),
      )
      .select();

    if (variantError) {
      return { error: `Product created, but variants failed: ${variantError.message}` };
    }

    const movements = (insertedVariants ?? [])
      .map((variant, idx) => ({
        variant_id: variant.id,
        movement_type: 'restock' as InventoryMovementType,
        quantity_change: variants[idx]?.initial_stock ?? 0,
        reason: 'Initial stock on product creation',
      }))
      .filter((m) => m.quantity_change > 0);

    if (movements.length > 0) {
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert(movements);
      if (movementError) {
        return { error: `Product created, but stock seeding failed: ${movementError.message}` };
      }
    }
  }

  const imageUrl = String(formData.get('image_url') ?? '').trim();
  if (imageUrl) {
    await supabase
      .from('product_images')
      .insert({ product_id: product.id, url: imageUrl, is_primary: true, display_order: 0 });
  }

  revalidatePath('/admin/products');
  redirect(`/admin/products/${product.id}`);
}

/** Updates a product's own fields (not variants/images). Bind productId
 * first (`updateProduct.bind(null, productId)`) before passing to
 * useFormState, which supplies prevState/formData itself. */
export async function updateProduct(
  productId: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = createClient();
  const fields = readProductFields(formData);

  if (!fields.name || !fields.sku || !Number.isFinite(fields.price)) {
    return { error: 'Name, SKU, and a valid price are required.' };
  }

  const { error } = await supabase.from('products').update(fields).eq('id', productId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

/** Deletes a product. Variants/images cascade; order_items keep their snapshot. */
export async function deleteProduct(productId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('products').delete().eq('id', productId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/products');
  redirect('/admin/products');
}

/** Adds one new size/color variant to an existing product. */
export async function addVariant(
  productId: string,
  input: NewVariantInput,
): Promise<ActionResult> {
  const supabase = createClient();

  if (!input.size.trim() || !input.color.trim() || !input.sku.trim()) {
    return { error: 'Size, color, and SKU are required for a variant.' };
  }

  const { data: variant, error } = await supabase
    .from('product_variants')
    .insert({
      product_id: productId,
      size: input.size.trim(),
      color: input.color.trim(),
      sku: input.sku.trim(),
      price_override: input.price_override,
    })
    .select()
    .single();

  if (error || !variant) {
    return { error: error?.message ?? 'Could not add the variant.' };
  }

  if (input.initial_stock > 0) {
    const { error: movementError } = await supabase.from('inventory_movements').insert({
      variant_id: variant.id,
      movement_type: 'restock',
      quantity_change: input.initial_stock,
      reason: 'Initial stock on variant creation',
    });
    if (movementError) {
      return { error: `Variant added, but stock seeding failed: ${movementError.message}` };
    }
  }

  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

/** Edits an existing variant's size/color/SKU/price override (not its stock). */
export async function updateVariant(
  productId: string,
  variantId: string,
  fields: { size: string; color: string; sku: string; price_override: number | null },
): Promise<ActionResult> {
  const supabase = createClient();

  const { error } = await supabase
    .from('product_variants')
    .update({
      size: fields.size.trim(),
      color: fields.color.trim(),
      sku: fields.sku.trim(),
      price_override: fields.price_override,
    })
    .eq('id', variantId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

export async function deleteVariant(productId: string, variantId: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from('product_variants').delete().eq('id', variantId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

/**
 * Records a stock change through the inventory ledger. This is the only
 * supported way to change stock_quantity — the DB trigger
 * (apply_inventory_movement) applies it, and the stock_quantity >= 0
 * check constraint rejects anything that would go negative.
 */
export async function adjustStock(
  productId: string,
  variantId: string,
  movementType: InventoryMovementType,
  quantityChange: number,
  reason: string,
): Promise<ActionResult> {
  const supabase = createClient();

  if (!Number.isFinite(quantityChange) || quantityChange === 0) {
    return { error: 'Enter a non-zero quantity.' };
  }

  if ((movementType === 'restock' || movementType === 'return') && quantityChange < 0) {
    return { error: 'Restock and return quantities must be positive. Use Adjustment for a decrease.' };
  }

  const { error } = await supabase.from('inventory_movements').insert({
    variant_id: variantId,
    movement_type: movementType,
    quantity_change: quantityChange,
    reason: reason.trim() || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

export async function addProductImage(
  productId: string,
  url: string,
  altText: string,
): Promise<ActionResult> {
  const supabase = createClient();

  if (!url.trim()) {
    return { error: 'Enter an image URL.' };
  }

  const { error } = await supabase.from('product_images').insert({
    product_id: productId,
    url: url.trim(),
    alt_text: altText.trim() || null,
    display_order: 0,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

/** Makes one image the product's primary (listing/thumbnail) image and
 * demotes any other image that was previously marked primary. */
export async function setPrimaryImage(productId: string, imageId: string): Promise<ActionResult> {
  const supabase = createClient();

  const { error: demoteError } = await supabase
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId)
    .eq('is_primary', true);

  if (demoteError) {
    return { error: demoteError.message };
  }

  const { error: promoteError } = await supabase
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId);

  if (promoteError) {
    return { error: promoteError.message };
  }

  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

export async function deleteProductImage(
  productId: string,
  imageId: string,
): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from('product_images').delete().eq('id', imageId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}
