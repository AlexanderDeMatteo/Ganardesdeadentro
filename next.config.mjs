/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: '/dashboard-2', destination: '/dashboard', permanent: true },
      { source: '/dashboard-3', destination: '/dashboard', permanent: true },
    ];
  },
};

export default nextConfig
