import type { MetadataRoute } from 'next';
import { getPublicTools } from '@/lib/arsenal';
import { getAllWriteups } from '@/lib/writeups';
import { getAllDetections } from '@/lib/detections';
import { SERVICES } from '@/lib/services';
import { SITE, getZone, zoneIsExternal } from '@/lib/site';

export const dynamic = 'force-static';

/**
 * Everything this site serves, now that all four zones are served from here.
 *
 * Each zone's URLs are gated on its own `migrated` flag, the same switch that
 * drives its links and its indexability. A zone still answering on its own
 * hostname has a live twin of every page, so claiming those URLs here would
 * contradict the `noindex` that buildMetadata puts on them — one flag keeps the
 * sitemap, the canonicals and the robots directives telling the same story.
 *
 * A sitemap is a claim about one host's own content, so nothing here is ever an
 * external URL: the sibling hostnames carry permanent redirects, and that is
 * what actually moves the ranking across.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const url = (path: string) => `${SITE.url}${path}`;
  const live = (zoneId: string) => !zoneIsExternal(getZone(zoneId));

  // Pages that belong to this site itself rather than to a migrated zone.
  const core: MetadataRoute.Sitemap = [
    { url: url('/'), lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: url('/whoami/'), lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: url('/security/'), lastModified: now, changeFrequency: 'yearly', priority: 0.7 },
    { url: url('/handshake/'), lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];

  const arsenal: MetadataRoute.Sitemap = live('arsenal')
    ? [
        { url: url('/arsenal/'), lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
        ...getPublicTools().map((t) => ({
          url: url(`/arsenal/${t.id}/`),
          lastModified: now,
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        })),
      ]
    : [];

  const research: MetadataRoute.Sitemap = live('research')
    ? [
        { url: url('/writeups/'), lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
        { url: url('/detections/'), lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
        { url: url('/matrix/'), lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
        { url: url('/search/'), lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
        ...getAllWriteups().map((w) => ({
          url: url(`/writeups/${w.slug}/`),
          lastModified: new Date(w.date),
          changeFrequency: 'yearly' as const,
          priority: 0.7,
        })),
        ...getAllDetections().map((d) => ({
          url: url(`/detections/${d.slug}/`),
          lastModified: new Date(d.date),
          changeFrequency: 'yearly' as const,
          priority: 0.7,
        })),
      ]
    : [];

  const learn: MetadataRoute.Sitemap = live('learn')
    ? [
        { url: url('/learn/'), lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
        { url: url('/learn/roadmap/'), lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
        { url: url('/learn/cheatsheets/'), lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
        { url: url('/learn/glossary/'), lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
      ]
    : [];

  const services: MetadataRoute.Sitemap = live('services')
    ? [
        { url: url('/services/'), lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
        { url: url('/services/process/'), lastModified: now, changeFrequency: 'yearly', priority: 0.7 },
        { url: url('/services/request/'), lastModified: now, changeFrequency: 'yearly', priority: 0.8 },
        { url: url('/privacy/'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
        ...SERVICES.map((s) => ({
          url: url(`/services/${s.id}/`),
          lastModified: now,
          changeFrequency: 'monthly' as const,
          priority: 0.8,
        })),
      ]
    : [];

  return [...core, ...arsenal, ...research, ...learn, ...services];
}
