import type { Metadata } from 'next';
import { SITE, type Zone, zoneIsExternal } from './site';

/**
 * Next.js metadata merges `openGraph`/`twitter` shallowly: a page that sets
 * either object replaces the root layout's wholesale, rather than layering
 * page-specific fields onto the site defaults. A page that only overrides
 * `title`/`description` inherits the root's openGraph.title too, since the
 * `title.template` string interpolation only applies to the plain `title`
 * field — so it still previews as the homepage. This helper builds a
 * complete, self-sufficient openGraph + twitter pair for every page, so a
 * shared link always previews with that page's own title, description and
 * image rather than the generic root defaults.
 */
export function buildMetadata({
  title,
  description,
  path,
  type = 'website',
  publishedTime,
  tags,
  zone,
}: {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
  /** Article pages only — writeups and detections carry a publish date. */
  publishedTime?: string;
  /** Article pages only — surfaces the content's own tags to crawlers. */
  tags?: readonly string[];
  /**
   * The zone this page belongs to, for pages migrated in from a sibling site.
   *
   * While that zone's content is still served from its own hostname, the same
   * page exists at two addresses with a self-referential canonical on each —
   * textbook duplicate content. Passing the zone marks this copy `noindex`
   * until the zone's `migrated` flag flips, at which point the redirect makes
   * this the only copy and the directive disappears on its own. One flag drives
   * both, so there is no second thing to remember at cutover.
   */
  zone?: Zone;
}): Metadata {
  const url = `${SITE.url}${path}`;
  // `title` goes through the root layout's `title.template` for the <title>
  // tag automatically, but openGraph.title/twitter.title are not templated —
  // they need the fully expanded string to match what the tab actually shows.
  const fullTitle = `${title} — ${SITE.name}`;
  // Setting openGraph/twitter here replaces the root's wholesale, which also
  // drops the root's auto-wired opengraph-image/twitter-image file-convention
  // images — so every page needs to point back at them explicitly.
  // A zone still answering on its own hostname has a live twin of this page.
  const awaitingCutover = zone ? zoneIsExternal(zone) : false;

  return {
    title,
    description,
    alternates: { canonical: url },
    ...(awaitingCutover ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type,
      locale: SITE.locale,
      url,
      siteName: SITE.name,
      title: fullTitle,
      description,
      images: [{ url: `${SITE.url}/opengraph-image`, width: 1200, height: 630, alt: fullTitle }],
      ...(type === 'article' && publishedTime ? { publishedTime } : {}),
      ...(tags ? { tags: [...tags] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      site: '@0xZephryx',
      creator: '@0xZephryx',
      title: fullTitle,
      description,
      images: [`${SITE.url}/twitter-image`],
    },
  };
}
