/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'images.unsplash.com' }
    ]
  },
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://cineclue.com'
  }
};

export default nextConfig;