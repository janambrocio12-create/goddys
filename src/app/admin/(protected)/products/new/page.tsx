import { createClient } from '@/lib/supabase/server';
import { NewProductForm } from '@/components/admin/products/new-product-form';

export default async function NewProductPage() {
  const supabase = createClient();
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('display_order');

  return (
    <div>
      <h1 className="font-display text-2xl tracking-tightest">New product</h1>
      <p className="mt-1 text-sm text-concrete">
        Set the product details, then add its size/color variants below.
      </p>

      <div className="mt-8 max-w-2xl">
        <NewProductForm categories={categories ?? []} />
      </div>
    </div>
  );
}
