'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addProductImage, deleteProductImage } from '@/app/admin/(protected)/products/actions';
import { uploadImageToCloudinary } from '@/lib/cloudinary/upload-image';
import { ghostButtonClass, inputClass, primaryButtonClass } from '@/components/admin/form-styles';

type ProductImage = { id: string; url: string; alt_text: string | null; is_primary: boolean };

export function ImageManager({
  productId,
  images,
}: {
  productId: string;
  images: ProductImage[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [url, setUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);
    try {
      const { secure_url } = await uploadImageToCloudinary(file);
      const result = await addProductImage(productId, secure_url, file.name);
      if (result && 'error' in result) {
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function submitUrl() {
    setError(null);
    startTransition(async () => {
      const result = await addProductImage(productId, url, altText);
      if (result && 'error' in result) {
        setError(result.error);
        return;
      }
      setUrl('');
      setAltText('');
      router.refresh();
    });
  }

  function remove(imageId: string) {
    startTransition(async () => {
      const result = await deleteProductImage(productId, imageId);
      if (result && 'error' in result) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      {images.length === 0 ? (
        <p className="border border-dashed border-concrete/40 p-6 text-center text-sm text-concrete">
          No images yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image) => (
            <div key={image.id} className="border border-concrete/20 bg-panel p-2">
              {/* eslint-disable-next-line @next/next/no-img-element --
                  Cloudinary (or any pasted) URL, before next/image
                  remotePatterns are locked to a single storage provider. */}
              <img
                src={image.url}
                alt={image.alt_text ?? ''}
                className="aspect-square w-full object-cover"
              />
              <div className="mt-2 flex items-center justify-between">
                {image.is_primary && (
                  <span className="font-mono text-[10px] uppercase tracking-wide text-hazard">
                    Primary
                  </span>
                )}
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => remove(image.id)}
                  className={`${ghostButtonClass} text-danger`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 border border-concrete/20 bg-panel p-4">
        <p className="font-mono text-xs uppercase tracking-widest text-concrete">
          Upload from computer
        </p>
        <div className="mt-2 flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            disabled={isUploading}
            onChange={handleFileSelected}
            className="text-sm text-concrete file:mr-3 file:border-0 file:bg-bone file:px-3 file:py-1.5 file:font-mono file:text-xs file:uppercase file:tracking-widest file:text-ink file:hover:opacity-90"
          />
          {isUploading && (
            <span className="font-mono text-xs uppercase tracking-wide text-hazard">
              Uploading…
            </span>
          )}
        </div>
      </div>

      <details className="mt-3">
        <summary className={`${ghostButtonClass} cursor-pointer`}>
          Or add an image by URL instead
        </summary>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            placeholder="Image URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={`${inputClass} flex-1`}
          />
          <input
            placeholder="Alt text (optional)"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            className={`${inputClass} w-48`}
          />
          <button
            type="button"
            disabled={isPending}
            onClick={submitUrl}
            className={primaryButtonClass}
          >
            Add image
          </button>
        </div>
      </details>

      {error && <p className="mt-2 font-mono text-xs text-danger">{error}</p>}
    </div>
  );
}
