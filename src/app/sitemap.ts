import type { MetadataRoute } from 'next';
import { getPublicTools } from '@/lib/arsenal';
import { SITE } from '@/lib/site';

export const dynamic = 'force-static';

/**
 * Only what this site still serves.
 *
 * The writeup, detection, matrix and search URLs moved to
 * writeups.zephryx.in, which publishes its own sitemap for them. They are
 * deliberately not listed here as external URLs: a sitemap is a claim about
 * one host's own content, and the Worker already 301s the old paths, which is
 * what actually carries the ranking across.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE.url}/whoami/`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE.url}/arsenal/`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE.url}/security/`, lastModified: now, changeFrequency: 'yearly', priority: 0.7 },
    { url: `${SITE.url}/handshake/`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];

  const tools: MetadataRoute.Sitemap = getPublicTools().map((t) => ({
    url: `${SITE.url}/arsenal/${t.id}/`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...routes, ...tools];
}
