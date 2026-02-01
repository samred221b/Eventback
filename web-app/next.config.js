/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Proxy /api/* from this web app to the existing backend to avoid CORS issues.
    return [
      {
        source: '/api/:path*',
        destination: 'https://eventoback-1.onrender.com/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
