import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fittrack.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/register'],
      disallow: ['/admin', '/trainer', '/dashboard', '/api/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
