import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EditProductForm } from '@/components/admin/products/edit-product-form';
import { VariantManager } from '@/components/admin/products/variant-manager';
import { ImageManager } from '@/components/admin/products/image-manager';
import { DeleteProductButton } from '@/components/admin/products/delete-product-button';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [{ data: product }, { data: categories }, { data: variants }, { data: images }] =
    await Promise.all([
      supabase.from('products').select('*').eq('id', params.id).maybeSingle(),
      supabase.from('categories').select('id, name').order('display_order'),
      supabase
        .from('product_variants')
        .select('id, size, color, sku, price_override, stock_quantity')
        .eq('product_id', params.id)
        .order('size'),
      supabase
        .from('product_images')
        .select('id, url, alt_text, is_primary')
        .eq('product_id', params.id)
        .order('display_order'),
    ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-concrete">
            Editing product
          </p>
          <h1 className="mt-1 font-display text-2xl tracking-tightest">{product.name}</h1>
        </div>
        <DeleteProductButton productId={product.id} productName={product.name} />
      </div>

      <section className="max-w-2xl">
        <h2 className="mb-4 font-display text-lg tracking-tightest">Details</h2>
        <EditProductForm product={product} categories={categories ?? []} />
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg tracking-tightest">Sizes &amp; colors</h2>
        <VariantManager productId={product.id} variants={variants ?? []} />
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg tracking-tightest">Images</h2>
        <ImageManager productId={product.id} images={images ?? []} />
      </section>
    </div>
  );
}
