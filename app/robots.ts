import type { MetadataRoute } from 'next';
import { DEFAULT_SITE_URL } from '@/lib/landing/brand-logo';

const BASE_URL = DEFAULT_SITE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/register'],
      disallow: ['/admin', '/admin-v2', '/trainer', '/trainer-v2', '/dashboard', '/api/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
