/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  experimental: {
    serverActions: {
      bodySizeLimit: '30mb',
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'cdn.kmrgp.com' },
      // legacy CDN — existing DB image URLs may still reference this host
      { protocol: 'https', hostname: 'cdn-kmrgp.divyanshshukla.com' },
    ],
    unoptimized: true,
  },
}

module.exports = nextConfig