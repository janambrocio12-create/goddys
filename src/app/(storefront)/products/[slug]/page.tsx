import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProductDetail } from '@/components/storefront/product-detail';

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'active')
    .maybeSingle();

  if (!product) {
    notFound();
  }

  const [{ data: variants }, { data: images }] = await Promise.all([
    supabase
      .from('product_variants')
      .select('id, size, color, sku, price_override, stock_quantity')
      .eq('product_id', product.id),
    supabase
      .from('product_images')
      .select('id, url, alt_text, variant_id, is_primary')
      .eq('product_id', product.id)
      .order('display_order'),
  ]);

  return (
    <ProductDetail
      product={product}
      variants={variants ?? []}
      images={images ?? []}
    />
  );
}
