import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllDetectionSlugs, getDetection, primaryBlock } from '@/lib/detections';
import { formatDate } from '@/lib/format';
import { getWriteup } from '@/lib/writeups';
import { attackUrl, techniqueName } from '@/lib/attack';
import { SEVERITY_STYLE, STATUS_STYLE } from '@/lib/severity';
import { SITE, getZone } from '@/lib/site';
import { buildMetadata } from '@/lib/metadata';
import ContentToc from '@/components/ContentToc';
import ProseBody from '@/components/ProseBody';
import RuleActions from '@/components/RuleActions';

type Params = { slug: string };

/** Statically enumerate every rule for the export build. */
export function generateStaticParams(): Params[] {
  return getAllDetectionSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const d = getDetection(slug);
  if (!d) return { title: 'Not found' };
  return buildMetadata({
    title: d.title,
    description: d.excerpt,
    path: `/detections/${d.slug}/`,
    type: 'article',
    publishedTime: d.date,
    tags: [...d.techniques, ...d.tags],
  zone: getZone('research'),
});
}

export default async function DetectionPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const d = getDetection(slug);
  if (!d) notFound();

  const source = d.writeup ? getWriteup(d.writeup) : null;
  const rule = primaryBlock(d.codeBlocks);

  const META: ReadonlyArray<[string, string]> = [
    ['rule_id', d.ruleId],
    ['platform', d.platform],
    ['log_source', d.logsource],
    ['published', formatDate(d.date)],
  ];

  return (
    <article className="relative px-5 pt-32 pb-16 sm:px-8">
      <div className="relative mx-auto max-w-3xl">
        <Link
          href="/detections/"
          className="group inline-flex items-center gap-2 font-mono text-[13px] text-ink-faint transition-colors hover:text-red-blood"
        >
          <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
          cd ../detections
        </Link>

        {/* header */}
        <header className="mt-8 border-b border-line pb-8">
          <div className="mb-5 flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <span className={`border px-2 py-0.5 uppercase ${SEVERITY_STYLE[d.severity]}`}>
              {d.severity}
            </span>
            <span className={`border px-2 py-0.5 ${STATUS_STYLE[d.status]}`}>{d.status}</span>
            <span className="ml-auto text-ink-faint">{d.readingMinutes} min read</span>
          </div>

          <h1 className="font-mono text-3xl font-bold leading-[1.1] tracking-tight text-ink sm:text-4xl">
            {d.title}
          </h1>

          {d.excerpt ? (
            <p className="mt-5 text-lg leading-relaxed text-ink-dim">{d.excerpt}</p>
          ) : null}

          {/* rule metadata card */}
          <dl className="mt-7 grid gap-px border border-line bg-line sm:grid-cols-2">
            {META.map(([k, v]) => (
              <div key={k} className="bg-abyss/80 px-4 py-3">
                <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                  {k}
                </dt>
                <dd className="mt-1 font-mono text-[13px] text-ink">{v}</dd>
              </div>
            ))}
          </dl>

          {/* take the rule with you — the point of publishing it */}
          {rule ? <RuleActions block={rule} blockCount={d.codeBlocks.length} /> : null}

          {/* ATT&CK mapping */}
          {d.techniques.length ? (
            <div className="mt-6">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                att&amp;ck coverage
              </p>
              <div className="flex flex-wrap gap-2">
                {d.techniques.map((t) => (
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
        </header>

        {/* the writeup this answers */}
        {source ? (
          <Link
            href={`/writeups/${source.slug}/`}
            className="panel clip-corner group mt-10 flex items-start gap-4 p-5 transition-all hover:border-red-deep/70"
          >
            <span className="mt-0.5 shrink-0 border border-red-deep/50 bg-red-ash/20 px-2 py-1 font-mono text-[10px] tracking-wider text-red-blood">
              ATK
            </span>
            <span>
              <span className="block font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
                written in response to
              </span>
              <span className="mt-1 block font-mono text-sm text-ink transition-colors group-hover:text-red-blood">
                {source.title}
              </span>
            </span>
            <span className="ml-auto self-center font-mono text-red-blood transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        ) : null}

        {/* in-page nav — sticky rail on wide screens, collapsible panel below xl */}
        <ContentToc toc={d.toc} />

        <ProseBody html={d.html} />

        {/* footer */}
        <footer className="mt-16 border-t border-line pt-8">
          <div className="panel clip-corner flex flex-col items-start justify-between gap-5 p-6 sm:flex-row sm:items-center">
            <div>
              <p className="font-mono text-sm text-ink">
                <span className="text-red-blood">$</span> found a bypass?
              </p>
              <p className="mt-1 text-sm text-ink-dim">
                Every rule here has a blind spot. Tell me where this one breaks.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/handshake/"
                className="clip-tab border border-red-deep bg-red-core px-5 py-2.5 font-mono text-[13px] text-void transition-all hover:shadow-[0_0_28px_-4px_rgba(255,45,75,0.8)]"
              >
                Contact
              </Link>
              <Link
                href="/matrix/"
                className="border border-line px-5 py-2.5 font-mono text-[13px] text-ink-dim transition-all hover:border-red-deep/70 hover:text-red-blood"
              >
                coverage matrix
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </article>
  );
}
