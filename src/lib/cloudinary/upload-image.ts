/**
 * Uploads a file straight from the browser to Cloudinary using an
 * *unsigned* upload preset — no API secret involved, so this is safe to
 * call from client code. The Cloud name and preset name are meant to be
 * public (that's how unsigned uploads work); what keeps this safe is
 * configuring the preset itself in the Cloudinary dashboard:
 *
 *   - Signing Mode: Unsigned
 *   - Restrict to image formats you actually want (jpg/png/webp)
 *   - Set a reasonable max file size
 *   - Consider setting a fixed folder so uploads don't scatter
 *
 * See README.md "Product image uploads (Cloudinary)" for setup steps.
 */

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
};

export async function uploadImageToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Cloudinary is not configured yet. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and ' +
        'NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to .env.local, then restart the dev server.',
    );
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('That image is larger than 10MB — choose a smaller file.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message ?? 'Upload to Cloudinary failed.');
  }

  return { secure_url: data.secure_url, public_id: data.public_id };
}
