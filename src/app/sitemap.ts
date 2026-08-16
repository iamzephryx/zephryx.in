import type { MetadataRoute } from 'next';
import { getAllWriteups } from '@/lib/writeups';
import { getAllDetections } from '@/lib/detections';
import { SITE } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE.url}/whoami/`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE.url}/writeups/`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE.url}/cheatsheets/`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE.url}/detections/`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE.url}/matrix/`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE.url}/arsenal/`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE.url}/security/`, lastModified: now, changeFrequency: 'yearly', priority: 0.7 },
    { url: `${SITE.url}/handshake/`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];

  const posts: MetadataRoute.Sitemap = getAllWriteups().map((w) => ({
    url: `${SITE.url}/writeups/${w.slug}/`,
    lastModified: new Date(w.date),
    changeFrequency: 'yearly',
    priority: 0.6,
  }));

  const rules: MetadataRoute.Sitemap = getAllDetections().map((d) => ({
    url: `${SITE.url}/detections/${d.slug}/`,
    lastModified: new Date(d.date),
    changeFrequency: 'yearly',
    priority: 0.6,
  }));

  return [...routes, ...posts, ...rules];
}
