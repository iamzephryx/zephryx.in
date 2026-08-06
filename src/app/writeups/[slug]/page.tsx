import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllSlugs, getWriteup, formatDate } from '@/lib/writeups';
import { SITE } from '@/lib/site';

type Params = { slug: string };

/** Statically enumerate every writeup for the export build. */
export function generateStaticParams(): Params[] {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const w = getWriteup(slug);
  if (!w) return { title: 'Not found' };
  return {
    title: w.title,
    description: w.excerpt,
    alternates: { canonical: `${SITE.url}/writeups/${w.slug}/` },
    openGraph: {
      type: 'article',
      title: w.title,
      description: w.excerpt,
      publishedTime: w.date,
      tags: w.tags,
    },
  };
}

export default async function WriteupPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const w = getWriteup(slug);
  if (!w) notFound();

  return (
    <article className="relative px-5 pt-32 pb-16 sm:px-8">
      <div className="mx-auto max-w-3xl">
        {/* back */}
        <Link
          href="/writeups/"
          className="group inline-flex items-center gap-2 font-mono text-[13px] text-ink-faint transition-colors hover:text-red-blood"
        >
          <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
          cd ../writeups
        </Link>

        {/* header */}
        <header className="mt-8 border-b border-line pb-8">
          <div className="mb-5 flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <span className="border border-red-deep/40 bg-red-ash/20 px-2 py-0.5 text-red-blood">
              {w.category}
            </span>
            <span className="text-ink-faint">{w.difficulty}</span>
            <span className="text-ink-faint">· {w.readingMinutes} min read</span>
            <span className="ml-auto text-ink-faint">{formatDate(w.date)}</span>
          </div>

          <h1 className="font-mono text-3xl font-bold leading-[1.1] tracking-tight text-ink sm:text-4xl">
            {w.title}
          </h1>

          {w.excerpt ? (
            <p className="mt-5 text-lg leading-relaxed text-ink-dim">{w.excerpt}</p>
          ) : null}

          {w.tags.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {w.tags.map((t) => (
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

        {/*
          Body HTML is produced by the markdown pipeline in lib/writeups.ts,
          which disables raw-HTML passthrough (html: () => ''). The content is
          first-party and cannot emit author-controlled markup, so injecting it
          here carries no stored-XSS surface.
        */}
        <div
          className="prose-terminal mt-10"
          dangerouslySetInnerHTML={{ __html: w.html }}
        />

        {/* footer */}
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
                href="/writeups/"
                className="border border-line px-5 py-2.5 font-mono text-[13px] text-ink-dim transition-all hover:border-red-deep/70 hover:text-red-blood"
              >
                more writeups
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </article>
  );
}
