/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Stops the "X-Powered-By: Next.js" response header, so the
  // framework isn't fingerprinted by anyone checking network requests.
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        // Supabase Storage public bucket URLs. Adjust to your project's
        // <project-ref> once created, e.g. abcd1234.supabase.co
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        // Cloudinary-hosted product images.
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

module.exports = nextConfig;
