import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ProductCard, type ProductCardData } from '@/components/storefront/product-card';

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const supabase = createClient();
  const activeCategory = searchParams.category;
  const productColumns =
    'id, name, slug, price, sale_price, product_images ( url, is_primary ), product_variants ( size )';

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('display_order');

  let query = supabase
    .from('products')
    .select(productColumns)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (activeCategory) {
    const category = categories?.find((c) => c.slug === activeCategory);
    if (category) query = query.eq('category_id', category.id);
  }

  const { data: products } = await query;

  // The New Arrivals highlight only makes sense on the unfiltered "All"
  // view — once someone has picked a specific category tab, showing an
  // unrelated cross-category band above it would just be noise.
  const { data: newArrivals } = activeCategory
    ? { data: null }
    : await supabase
        .from('products')
        .select(productColumns)
        .eq('status', 'active')
        .eq('is_new_arrival', true)
        .order('created_at', { ascending: false })
        .limit(4);

  return (
    <div className="px-6 py-10 md:px-10">
      <div className="mx-auto max-w-7xl">
        <h1 className="font-display text-3xl tracking-tightest">Shop</h1>

        {newArrivals && newArrivals.length > 0 && (
          <section className="mt-10 border-b border-concrete/20 pb-10">
            <p className="font-mono text-xs uppercase tracking-widest text-hazard">Just landed</p>
            <h2 className="mt-1 font-display text-xl tracking-tightest">New arrivals</h2>
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
              {(newArrivals as ProductCardData[]).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {categories && categories.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            <Link
              href="/shop"
              className={`border px-3 py-1.5 font-mono text-xs uppercase tracking-wide ${
                !activeCategory
                  ? 'border-bone bg-bone text-ink'
                  : 'border-concrete/40 text-concrete hover:border-bone hover:text-bone'
              }`}
            >
              All
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/shop?category=${category.slug}`}
                className={`border px-3 py-1.5 font-mono text-xs uppercase tracking-wide ${
                  activeCategory === category.slug
                    ? 'border-bone bg-bone text-ink'
                    : 'border-concrete/40 text-concrete hover:border-bone hover:text-bone'
                }`}
              >
                {category.name}
              </Link>
            ))}
          </div>
        )}

        {(!products || products.length === 0) && (
          <p className="mt-10 text-sm text-concrete">Nothing here yet - check back for the next drop.</p>
        )}

        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {((products as ProductCardData[] | null) ?? []).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
