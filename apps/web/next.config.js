/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for minimal Docker production deploy
  output: 'standalone',

  // Experimental features
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },

  // Images configuration
  images: {
    domains: ['localhost', 'images.unsplash.com'],
    formats: ['image/webp', 'image/avif'],
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/painel',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
