import { getAllWriteups } from '@/lib/writeups';
import { getAllDetections } from '@/lib/detections';
import { SITE } from '@/lib/site';

/**
 * RSS 2.0 feed covering all content collections — writeups and detection
 * rules are published from the same research pipeline, so they share one
 * feed and are distinguished by <category>.
 *
 * Statically rendered at build time; `output: 'export'` writes the result to
 * out/feed.xml and it is served as an immutable asset thereafter.
 */
export const dynamic = 'force-static';

type FeedItem = {
  title: string;
  link: string;
  description: string;
  date: string;
  categories: string[];
};

/**
 * Escape the five XML predefined entities. Every field below is first-party
 * markdown frontmatter, but a stray ampersand in a title is enough to make a
 * feed unparseable, and feed readers are unforgiving.
 */
const xml = (value: string): string =>
  value.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&apos;',
  );

const rfc822 = (date: string): string => new Date(`${date}T09:00:00Z`).toUTCString();

export async function GET(): Promise<Response> {
  const writeups: FeedItem[] = getAllWriteups().map((w) => ({
    title: w.title,
    link: `${SITE.url}/writeups/${w.slug}/`,
    description: w.excerpt,
    date: w.date,
    categories: ['Writeup', w.category, ...w.tags],
  }));

  const detections: FeedItem[] = getAllDetections().map((d) => ({
    title: `${d.ruleId} — ${d.title}`,
    link: `${SITE.url}/detections/${d.slug}/`,
    description: d.excerpt,
    date: d.date,
    categories: ['Detection', ...d.techniques, ...d.tags],
  }));

  const items = [...writeups, ...detections].sort((a, b) => (a.date < b.date ? 1 : -1));

  const lastBuild = items[0] ? rfc822(items[0].date) : new Date().toUTCString();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xml(SITE.name)} — offensive security research</title>
    <link>${SITE.url}/</link>
    <description>${xml(SITE.description)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <generator>zephryx.in static build</generator>
    <atom:link href="${SITE.url}/feed.xml" rel="self" type="application/rss+xml" />
${items
  .map(
    (item) => `    <item>
      <title>${xml(item.title)}</title>
      <link>${xml(item.link)}</link>
      <guid isPermaLink="true">${xml(item.link)}</guid>
      <pubDate>${rfc822(item.date)}</pubDate>
      <description>${xml(item.description)}</description>
${item.categories.map((c) => `      <category>${xml(c)}</category>`).join('\n')}
    </item>`,
  )
  .join('\n')}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
