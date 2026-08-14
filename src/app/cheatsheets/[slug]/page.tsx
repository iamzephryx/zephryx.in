import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getAllCheatsheetSlugs,
  getCheatsheet,
  getRelatedCheatsheets,
  formatDate,
} from '@/lib/cheatsheets';
import { formatBytes } from '@/lib/format';
import { SITE } from '@/lib/site';

type Params = { slug: string };

/** Statically enumerate every cheatsheet for the export build. */
export function generateStaticParams(): Params[] {
  return getAllCheatsheetSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = getCheatsheet(slug);
  if (!c) return { title: 'Not found' };
  return {
    title: c.title,
    description: c.excerpt,
    alternates: { canonical: `${SITE.url}/cheatsheets/${c.slug}/` },
    keywords: [c.category, ...c.tags, 'cheat sheet', 'quick reference'],
    openGraph: {
      type: 'article',
      title: c.title,
      description: c.excerpt,
      publishedTime: c.date,
      tags: c.tags,
    },
  };
}

export default async function CheatsheetPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const c = getCheatsheet(slug);
  if (!c) notFound();

  const related = getRelatedCheatsheets(c.slug);
  const pdfHref = `/cheatsheets/${c.file}`;

  /**
   * DigitalDocument, not Article — the actual content is the PDF; this page is
   * a landing/description for it. associatedMedia points crawlers at the file
   * so it can be surfaced (and attributed to this canonical page) independently.
   */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DigitalDocument',
    name: c.title,
    description: c.excerpt,
    url: `${SITE.url}/cheatsheets/${c.slug}/`,
    datePublished: c.date,
    dateModified: c.date,
    author: { '@type': 'Person', name: SITE.name, url: SITE.url },
    keywords: [c.category, ...c.tags].join(', '),
    about: c.category,
    isAccessibleForFree: true,
    associatedMedia: {
      '@type': 'MediaObject',
      contentUrl: `${SITE.url}${pdfHref}`,
      encodingFormat: 'application/pdf',
      contentSize: String(c.sizeBytes),
    },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'cheatsheets', item: `${SITE.url}/cheatsheets/` },
      { '@type': 'ListItem', position: 2, name: c.title, item: `${SITE.url}/cheatsheets/${c.slug}/` },
    ],
  };

  return (
    <article className="relative px-5 pt-32 pb-16 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />

        <Link
          href="/cheatsheets/"
          className="group inline-flex items-center gap-2 font-mono text-[13px] text-ink-faint transition-colors hover:text-red-blood"
        >
          <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
          cd ../cheatsheets
        </Link>

        <header className="mt-8 border-b border-line pb-8">
          <div className="mb-5 flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <span className="border border-red-deep/40 bg-red-ash/20 px-2 py-0.5 text-red-blood">
              {c.category}
            </span>
            <span className="text-ink-faint">
              PDF · {formatBytes(c.sizeBytes)}
            </span>
            <span className="ml-auto text-ink-faint">{formatDate(c.date)}</span>
          </div>

          <h1 className="font-mono text-3xl font-bold leading-[1.1] tracking-tight text-ink sm:text-4xl">
            {c.title}
          </h1>

          {c.excerpt ? (
            <p className="mt-5 text-lg leading-relaxed text-ink-dim">{c.excerpt}</p>
          ) : null}

          {c.tags.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {c.tags.map((t) => (
                <span
                  key={t}
                  className="border border-line px-2.5 py-1 font-mono text-[11px] text-ink-faint"
                >
                  #{t}
                </span>
              ))}
            </div>
          ) : null}
        </header>

        <section className="mt-10">
          <p className="text-sm leading-relaxed text-ink-dim">
            Plain PDF, no login, no tracker — a {c.category.toLowerCase()} quick reference covering{' '}
            {c.tags.length ? c.tags.join(', ') : c.category.toLowerCase()}. Open it inline or grab a
            copy for offline use during an engagement.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={pdfHref}
              target="_blank"
              rel="noopener noreferrer"
              className="clip-tab border border-red-deep bg-red-core px-5 py-2.5 font-mono text-[13px] text-void transition-all hover:shadow-[0_0_28px_-4px_rgba(255,45,75,0.8)]"
            >
              ./open-pdf
            </a>
            <a
              href={pdfHref}
              download
              className="border border-line px-5 py-2.5 font-mono text-[13px] text-ink-dim transition-all hover:border-red-deep/70 hover:text-red-blood"
            >
              download
            </a>
          </div>
        </section>

        {related.length ? (
          <section className="mt-16 border-t border-line pt-8">
            <h2 className="font-mono text-sm font-semibold tracking-[0.2em] text-red-blood/80">
              // MORE {c.category.toUpperCase()}
            </h2>
            <div className="mt-6 space-y-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/cheatsheets/${r.slug}/`}
                  className="panel clip-corner group flex flex-col gap-2 p-5 transition-all hover:border-red-deep/70 sm:flex-row sm:items-center"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-sm text-ink transition-colors group-hover:text-red-blood">
                      {r.title}
                    </span>
                    <span className="mt-1 block font-mono text-[11px] text-ink-faint">
                      {formatDate(r.date)}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-red-blood transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <footer className="mt-16 border-t border-line pt-8">
          <div className="panel clip-corner flex flex-col items-start justify-between gap-5 p-6 sm:flex-row sm:items-center">
            <div>
              <p className="font-mono text-sm text-ink">
                <span className="text-red-blood">$</span> found this useful?
              </p>
              <p className="mt-1 text-sm text-ink-dim">
                Trade notes, report a flaw, or scope an engagement.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/handshake/"
                className="clip-tab border border-red-deep bg-red-core px-5 py-2.5 font-mono text-[13px] text-void transition-all hover:shadow-[0_0_28px_-4px_rgba(255,45,75,0.8)]"
              >
                ./handshake
              </Link>
              <Link
                href="/cheatsheets/"
                className="border border-line px-5 py-2.5 font-mono text-[13px] text-ink-dim transition-all hover:border-red-deep/70 hover:text-red-blood"
              >
                more cheatsheets
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </article>
  );
}
