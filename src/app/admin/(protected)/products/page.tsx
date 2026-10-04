import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AdminPagination } from '@/components/admin/admin-pagination';

const PAGE_SIZE = 20;

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
}

const STATUS_STYLES: Record<string, string> = {
  active: 'text-hazard border-hazard',
  draft: 'text-concrete border-concrete',
  archived: 'text-danger border-danger',
};

export default async function ProductsListPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const supabase = createClient();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: products, error, count } = await supabase
    .from('products')
    .select(
      `id, name, sku, price, sale_price, status, is_featured, is_new_arrival,
       categories ( name ),
       product_variants ( stock_quantity )`,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-tightest">Products</h1>
          <p className="mt-1 text-sm text-concrete">
            {count ?? 0} product{count === 1 ? '' : 's'} in the catalog.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="bg-bone px-4 py-2 font-mono text-xs uppercase tracking-widest text-ink hover:opacity-90"
        >
          + New product
        </Link>
      </div>

      {error && (
        <p className="mt-6 border border-danger px-4 py-3 font-mono text-xs text-danger">
          Could not load products: {error.message}
        </p>
      )}

      {!error && (products?.length ?? 0) === 0 && (
        <div className="mt-10 border border-dashed border-concrete/40 p-10 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-concrete">
            No products yet
          </p>
          <p className="mt-2 text-sm text-concrete">
            Add your first product to start building the catalog.
          </p>
        </div>
      )}

      {!error && (products?.length ?? 0) > 0 && (
        <div className="mt-8 overflow-x-auto border border-concrete/20">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-concrete/20 bg-panel font-mono text-[10px] uppercase tracking-widest text-concrete">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {products!.map((product) => {
                const totalStock = (product.product_variants ?? []).reduce(
                  (sum: number, v: { stock_quantity: number }) => sum + v.stock_quantity,
                  0,
                );
                return (
                  <tr key={product.id} className="border-b border-concrete/10 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{product.name}</p>
                      <p className="font-mono text-xs text-concrete">{product.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-concrete">
                      {(product.categories as { name: string } | null)?.name ?? '-'}
                    </td>
                    <td className="px-4 py-3">
                      {product.sale_price ? (
                        <>
                          <span className="text-concrete line-through">
                            {formatMoney(product.price)}
                          </span>{' '}
                          <span>{formatMoney(product.sale_price)}</span>
                        </>
                      ) : (
                        formatMoney(product.price)
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono">{totalStock}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
                          STATUS_STYLES[product.status] ?? 'text-concrete border-concrete'
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="font-mono text-xs uppercase tracking-wide text-bone underline underline-offset-4 hover:text-hazard"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AdminPagination
        page={page}
        pageSize={PAGE_SIZE}
        totalCount={count ?? 0}
        basePath="/admin/products"
      />
    </div>
  );
}
