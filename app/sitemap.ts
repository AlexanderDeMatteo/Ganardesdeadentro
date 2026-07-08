import type { MetadataRoute } from 'next';
import { DEFAULT_SITE_URL } from '@/lib/landing/brand-logo';

const BASE_URL = DEFAULT_SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  const publicRoutes = ['', '/login', '/register'] as const;

  return publicRoutes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.6,
  }));
}
