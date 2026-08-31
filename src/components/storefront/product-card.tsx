import Link from 'next/link';
import { formatMoney } from '@/lib/format';

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  product_images: { url: string; is_primary: boolean }[] | null;
  product_variants?: { size: string }[] | null;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const images = product.product_images ?? [];
  const heroImage = images.find((img) => img.is_primary) ?? images[0];
  const sizes = Array.from(new Set((product.product_variants ?? []).map((v) => v.size)));

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="aspect-[3/4] w-full overflow-hidden bg-panel">
        {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImage.url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-mono text-[10px] uppercase tracking-widest text-concrete">
            No image
          </div>
        )}
      </div>
      <p className="mt-3 text-sm">{product.name}</p>
      <p className="mt-1 font-mono text-xs text-concrete">
        {product.sale_price ? (
          <>
            <span className="line-through">{formatMoney(product.price)}</span>{' '}
            <span className="text-hazard">{formatMoney(product.sale_price)}</span>
          </>
        ) : (
          formatMoney(product.price)
        )}
      </p>
      {sizes.length > 0 && (
        <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-concrete">
          {sizes.join(' · ')}
        </p>
      )}
    </Link>
  );
}
