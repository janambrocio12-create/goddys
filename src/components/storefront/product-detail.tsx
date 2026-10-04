'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCart } from '@/lib/cart/cart-context';
import { formatMoney } from '@/lib/format';
import type { Database } from '@/lib/types/database.types';

type Product = Database['public']['Tables']['products']['Row'];
type Variant = {
  id: string;
  size: string;
  color: string;
  sku: string;
  price_override: number | null;
  stock_quantity: number;
};
type ProductImage = {
  id: string;
  url: string;
  alt_text: string | null;
  variant_id: string | null;
  is_primary: boolean;
};

function uniqueInOrder(values: string[]) {
  return Array.from(new Set(values));
}

export function ProductDetail({
  product,
  variants,
  images,
}: {
  product: Product;
  variants: Variant[];
  images: ProductImage[];
}) {
  const { addItem } = useCart();

  const sizes = useMemo(() => uniqueInOrder(variants.map((v) => v.size)), [variants]);
  const [selectedSize, setSelectedSize] = useState(sizes[0] ?? '');

  const colorsForSize = useMemo(
    () => uniqueInOrder(variants.filter((v) => v.size === selectedSize).map((v) => v.color)),
    [variants, selectedSize],
  );
  const [selectedColor, setSelectedColor] = useState(colorsForSize[0] ?? '');

  const selectedVariant = variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor,
  );

  const effectivePrice = selectedVariant?.price_override ?? product.sale_price ?? product.price;
  const stock = selectedVariant?.stock_quantity ?? 0;

  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const galleryImages = useMemo(
    () => images.filter((img) => !img.variant_id || img.variant_id === selectedVariant?.id),
    [images, selectedVariant],
  );
  const activeImage = galleryImages[activeImageIndex] ?? galleryImages[0];

  useEffect(() => {
    if (!isZoomOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsZoomOpen(false);
      if (event.key === 'ArrowRight') {
        setActiveImageIndex((i) => (i + 1) % Math.max(galleryImages.length, 1));
      }
      if (event.key === 'ArrowLeft') {
        setActiveImageIndex(
          (i) => (i - 1 + Math.max(galleryImages.length, 1)) % Math.max(galleryImages.length, 1),
        );
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomOpen, galleryImages.length]);

  function handleSizeChange(size: string) {
    setSelectedSize(size);
    const nextColors = uniqueInOrder(
      variants.filter((v) => v.size === size).map((v) => v.color),
    );
    setSelectedColor(nextColors[0] ?? '');
    setQuantity(1);
    setActiveImageIndex(0);
    setFeedback(null);
  }

  function handleColorChange(color: string) {
    setSelectedColor(color);
    setQuantity(1);
    setActiveImageIndex(0);
    setFeedback(null);
  }

  function handleAddToCart() {
    if (!selectedVariant || stock === 0) return;

    addItem(
      {
        variantId: selectedVariant.id,
        productSlug: product.slug,
        productName: product.name,
        size: selectedVariant.size,
        color: selectedVariant.color,
        sku: selectedVariant.sku,
        unitPrice: effectivePrice,
        imageUrl: activeImage?.url ?? null,
        maxStock: selectedVariant.stock_quantity,
      },
      quantity,
    );
    setFeedback('In the bag.');
  }

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-10 md:grid-cols-2 md:px-10">
      <div>
        <div className="relative aspect-square w-full overflow-hidden bg-panel">
          {activeImage ? (
            <button
              type="button"
              onClick={() => setIsZoomOpen(true)}
              className="block h-full w-full cursor-zoom-in"
              aria-label="Zoom in on this image"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary
              external URLs (Cloudinary or pasted) at this stage. */}
              <img
                src={activeImage.url}
                alt={activeImage.alt_text ?? product.name}
                className="h-full w-full object-cover"
              />
              <span
                data-theme="dark"
                className="absolute bottom-3 right-3 bg-ink/70 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-bone"
              >
                Zoom
              </span>
            </button>
          ) : (
            <div className="flex h-full w-full items-center justify-center font-mono text-[10px] uppercase tracking-widest text-concrete">
              No image
            </div>
          )}
        </div>
        {galleryImages.length > 1 && (
          <div className="mt-3 flex gap-2">
            {galleryImages.map((img, index) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveImageIndex(index)}
                className={`h-16 w-16 overflow-hidden border ${
                  index === activeImageIndex ? 'border-hazard' : 'border-concrete/30'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h1 className="font-display text-3xl tracking-tightest">{product.name}</h1>
        <p className="mt-2 font-mono text-lg">
          {product.sale_price ? (
            <>
              <span className="text-concrete line-through">{formatMoney(product.price)}</span>{' '}
              <span className="text-hazard">{formatMoney(effectivePrice)}</span>
            </>
          ) : (
            formatMoney(effectivePrice)
          )}
        </p>

        {product.description && (
          <p className="mt-6 text-sm text-concrete">{product.description}</p>
        )}

        {sizes.length > 0 && (
          <div className="mt-8">
            <p className="font-mono text-xs uppercase tracking-wide text-concrete">Size</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleSizeChange(size)}
                  className={`border px-3 py-1.5 font-mono text-xs uppercase ${
                    size === selectedSize
                      ? 'border-bone bg-bone text-ink'
                      : 'border-concrete/40 text-bone hover:border-bone'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {colorsForSize.length > 0 && (
          <div className="mt-6">
            <p className="font-mono text-xs uppercase tracking-wide text-concrete">Color</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {colorsForSize.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorChange(color)}
                  className={`border px-3 py-1.5 font-mono text-xs uppercase ${
                    color === selectedColor
                      ? 'border-bone bg-bone text-ink'
                      : 'border-concrete/40 text-bone hover:border-bone'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <p className="font-mono text-xs uppercase tracking-wide text-concrete">Qty</p>
          <div className="flex items-center border border-concrete/40">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-1.5 text-bone hover:bg-panel"
            >
              −
            </button>
            <span className="w-10 text-center font-mono text-sm">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
              disabled={quantity >= stock}
              className="px-3 py-1.5 text-bone hover:bg-panel disabled:opacity-40"
            >
              +
            </button>
          </div>
          <span className="font-mono text-xs text-concrete">
            {stock > 0 ? `${stock} in stock` : 'Out of stock'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!selectedVariant || stock === 0}
          className="mt-6 w-full bg-bone py-3 font-mono text-xs uppercase tracking-widest text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {stock === 0 ? 'Out of stock' : 'Add to cart'}
        </button>

        {feedback && <p className="mt-3 font-mono text-xs text-hazard">{feedback}</p>}
      </div>

      {isZoomOpen && activeImage && (
        <div
          data-theme="dark"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/95 p-4"
          onClick={() => setIsZoomOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsZoomOpen(false)}
            className="absolute right-4 top-4 font-mono text-xs uppercase tracking-widest text-bone hover:text-hazard"
          >
            Close ✕
          </button>

          {galleryImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 px-3 py-4 font-display text-3xl text-bone hover:text-hazard md:left-6"
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((i) => (i + 1) % galleryImages.length);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-4 font-display text-3xl text-bone hover:text-hazard md:right-6"
                aria-label="Next image"
              >
                ›
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeImage.url}
            alt={activeImage.alt_text ?? product.name}
            className="max-h-[90vh] max-w-full cursor-zoom-out object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
