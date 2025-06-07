/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [], // Add any image domains you need to use
  },
  async rewrites() {
    return [
      {
        source: '/data/:path*',
        destination: '/api/data/:path*', // This will handle your data fetching
      },
    ];
  },
};

module.exports = nextConfig; 