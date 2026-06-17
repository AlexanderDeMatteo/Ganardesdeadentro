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
      { source: '/admin', destination: '/admin-v2', permanent: true },
      { source: '/admin/athletes', destination: '/admin-v2/athletes', permanent: true },
      { source: '/admin/trainers', destination: '/admin-v2/trainers', permanent: true },
      { source: '/admin/routines', destination: '/admin-v2/routines', permanent: true },
      { source: '/admin/assignments', destination: '/admin-v2/assignments', permanent: true },
      { source: '/admin/memberships', destination: '/admin-v2/memberships', permanent: true },
      {
        source: '/admin/athletes/:athleteId/nutrition',
        destination: '/admin-v2/athletes/:athleteId/nutrition',
        permanent: true,
      },
      { source: '/trainer', destination: '/trainer-v2', permanent: true },
      { source: '/trainer/athletes', destination: '/trainer-v2/athletes', permanent: true },
      { source: '/trainer/routines', destination: '/trainer-v2/routines', permanent: true },
      { source: '/trainer/exercises', destination: '/trainer-v2/exercises', permanent: true },
      { source: '/trainer/assignments', destination: '/trainer-v2/assignments', permanent: true },
      { source: '/trainer/progress', destination: '/trainer-v2/progress', permanent: true },
      { source: '/trainer/profile', destination: '/trainer-v2/profile', permanent: true },
      {
        source: '/trainer/athletes/:athleteId/nutrition',
        destination: '/trainer-v2/athletes/:athleteId/nutrition',
        permanent: true,
      },
    ];
  },
};

export default nextConfig
