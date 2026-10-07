'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatMoney } from '@/lib/format';

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  product_images: { url: string; is_primary: boolean; display_order: number }[] | null;
  product_variants?: { size: string }[] | null;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  // Primary photo first, then upload order - so the second one (usually
  // the back) is what shows on hover / swipe.
  const images = [...(product.product_images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.display_order - b.display_order,
  );
  const [front, back] = images;
  const sizes = Array.from(new Set((product.product_variants ?? []).map((v) => v.size)));
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      {/* No frame color, and object-contain so uploads are never cropped. */}
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        {!front ? (
          <div className="flex h-full w-full items-center justify-center border border-concrete/20 font-mono text-[10px] uppercase tracking-widest text-concrete">
            No image
          </div>
        ) : (
          <>
            {/* Mouse: fade to the second photo on hover. */}
            <div className="hidden h-full w-full [@media(hover:hover)]:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={front.url}
                alt={product.name}
                loading="lazy"
                className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${
                  back ? 'group-hover:opacity-0' : ''
                }`}
              />
              {back && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={back.url}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-contain opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
              )}
            </div>

            {/* Touch: no hover, so swipe sideways through the photos instead. */}
            <div
              className="flex h-full w-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [@media(hover:hover)]:hidden [&::-webkit-scrollbar]:hidden"
              onScroll={(e) => {
                const el = e.currentTarget;
                setActiveIndex(Math.round(el.scrollLeft / el.clientWidth));
              }}
            >
              {images.map((img, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.url}
                  src={img.url}
                  alt={index === 0 ? product.name : ''}
                  loading="lazy"
                  className="h-full w-full shrink-0 snap-center object-contain"
                />
              ))}
            </div>
            {images.length > 1 && (
              <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5 [@media(hover:hover)]:hidden">
                {images.map((img, index) => (
                  <span
                    key={img.url}
                    className={`h-1.5 w-1.5 rounded-full ${
                      index === activeIndex ? 'bg-bone' : 'bg-concrete/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
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
