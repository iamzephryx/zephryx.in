import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPublicTools, getTool } from '@/lib/arsenal';
import { attackUrl, techniqueName } from '@/lib/attack';
import { SITE } from '@/lib/site';

type Params = { slug: string };

const STATUS_STYLE: Record<string, string> = {
  active: 'border-signal/40 bg-signal/10 text-signal',
  maintained: 'border-line text-ink-dim',
  archived: 'border-line text-ink-faint',
  private: 'border-warn/40 bg-warn/10 text-warn',
};

/** Statically enumerate every released tool for the export build. */
export function generateStaticParams(): Params[] {
  return getPublicTools().map((t) => ({ slug: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return { title: 'Not found' };
  const description = `${tool.tagline}. ${tool.description}`;
  return {
    title: tool.name,
    description,
    keywords: [tool.name, ...tool.tags],
    alternates: { canonical: `${SITE.url}/arsenal/${tool.id}/` },
    openGraph: {
      type: 'website',
      title: tool.name,
      description,
    },
  };
}

export default async function ToolPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  /**
   * SoftwareSourceCode structured data — ties the tool's name to its repo and
   * language so Google can resolve a search for the tool name to this page
   * rather than only the bare GitHub link.
   */
  const toolLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: tool.name,
    description: `${tool.tagline}. ${tool.description}`,
    codeRepository: tool.repo,
    programmingLanguage: tool.language,
    keywords: tool.tags.join(', '),
    author: { '@type': 'Person', name: SITE.name, url: SITE.url },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE.url}/arsenal/${tool.id}/` },
  };

  return (
    <article className="relative px-5 pt-32 pb-16 sm:px-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolLd).replace(/</g, '\\u003c') }}
      />

      <div className="relative mx-auto max-w-3xl">
        <Link
          href="/arsenal/"
          className="group inline-flex items-center gap-2 font-mono text-[13px] text-ink-faint transition-colors hover:text-red-blood"
        >
          <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
          cd ../arsenal
        </Link>

        <header className="mt-8 border-b border-line pb-8">
          <div className="mb-5 flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <span className={`border px-2 py-0.5 uppercase ${STATUS_STYLE[tool.status]}`}>
              {tool.status}
            </span>
            <span className="border border-line px-2 py-0.5 text-ink-faint">{tool.language}</span>
          </div>

          <h1 className="font-mono text-3xl font-bold leading-[1.1] tracking-tight text-ink sm:text-4xl">
            <span className="text-red-blood/70">./</span>
            {tool.name}
          </h1>

          <p className="mt-3 font-mono text-sm text-ink-faint">{tool.tagline}</p>

          <p className="mt-5 text-lg leading-relaxed text-ink-dim">{tool.description}</p>

          {tool.tags.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {tool.tags.map((t) => (
                <span
                  key={t}
                  className="border border-line px-2.5 py-1 font-mono text-[11px] text-ink-faint"
                >
                  #{t}
                </span>
              ))}
            </div>
          ) : null}

          {tool.techniques.length ? (
            <div className="mt-6">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                att&amp;ck techniques
              </p>
              <div className="flex flex-wrap gap-2">
                {tool.techniques.map((t) => (
                  <a
                    key={t}
                    href={attackUrl(t)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group border border-line px-2.5 py-1.5 font-mono text-[11px] text-ink-dim transition-colors hover:border-red-deep/70 hover:text-red-blood"
                  >
                    <span className="text-red-blood/80">{t}</span>
                    <span className="ml-2 text-ink-faint group-hover:text-ink-dim">
                      {techniqueName(t)}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {tool.repo ? (
            <a
              href={tool.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-8 inline-flex items-center gap-2 font-mono text-sm text-red-blood transition-colors hover:text-red-core"
            >
              git clone
              <span className="text-ink-dim group-hover:text-ink">
                {tool.repo.replace('https://', '')}
              </span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">↗</span>
            </a>
          ) : null}
        </header>

        <footer className="mt-16 border-t border-line pt-8">
          <div className="panel clip-corner flex flex-col items-start justify-between gap-5 p-6 sm:flex-row sm:items-center">
            <div>
              <p className="font-mono text-sm text-ink">
                <span className="text-red-blood">$</span> found something in this one?
              </p>
              <p className="mt-1 text-sm text-ink-dim">
                Disclosure policy, PGP key and the security contact are on the security page.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/security/"
                className="clip-tab border border-red-deep bg-red-core px-5 py-2.5 font-mono text-[13px] text-void transition-all hover:shadow-[0_0_28px_-4px_rgba(255,45,75,0.8)]"
              >
                ./security --policy
              </Link>
              <Link
                href="/arsenal/"
                className="border border-line px-5 py-2.5 font-mono text-[13px] text-ink-dim transition-all hover:border-red-deep/70 hover:text-red-blood"
              >
                more tools
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </article>
  );
}
