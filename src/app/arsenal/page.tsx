import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import SectionHeading from '@/components/SectionHeading';
import { TOOLS, publicToolCount } from '@/lib/arsenal';
import { attackUrl } from '@/lib/attack';
import { buildMetadata } from '@/lib/metadata';

export const metadata: Metadata = {
  ...buildMetadata({
    title: 'arsenal',
    description: `Tools I've actually released: ${TOOLS.map((t) => t.name).join(', ')}. The stuff you can go check for yourself.`,
    path: '/arsenal/',
  }),
  keywords: TOOLS.map((t) => t.name),
};

const STATUS_STYLE: Record<string, string> = {
  active: 'border-signal/40 bg-signal/10 text-signal',
  maintained: 'border-line text-ink-dim',
  archived: 'border-line text-ink-faint',
  private: 'border-warn/40 bg-warn/10 text-warn',
};

export default function ArsenalPage() {
  const publicTools = publicToolCount();

  const STATS: ReadonlyArray<[string, string]> = [
    [String(TOOLS.length), 'tools built'],
    [String(publicTools), 'open source'],
  ];

  return (
    <>
      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden px-5 pt-32 pb-12 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="mb-5 font-mono text-sm text-ink-dim">
              <span className="text-red-blood">$</span> ls -la ~/ops/arsenal
            </p>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="font-mono text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              <span className="text-red-blood text-glow">arsenal</span>
              <span className="text-ink-faint"> — the receipts</span>
            </h1>
          </Reveal>

          <Reveal delay={140}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-dim">
              Anyone can write "expert" on a portfolio page. This is the part you don't
              have to take my word for — tools I've actually shipped, that you can go
              clone and run yourself.
            </p>
          </Reveal>

          <Reveal delay={200}>
            <dl className="mt-10 grid max-w-sm grid-cols-2 gap-px border border-line bg-line">
              {STATS.map(([value, label]) => (
                <div key={label} className="bg-abyss/80 px-3 py-4 text-center">
                  <dt className="font-mono text-2xl font-bold text-red-blood text-glow">{value}</dt>
                  <dd className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* ============================ TOOLS ============================ */}
      <section className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <Reveal>
          <SectionHeading
            index="01 / TOOLING"
            title="stuff I've shipped"
            sub="Most of these started as a script I hacked together mid-engagement and cleaned up later, once doing the same thing by hand a third time got old."
          />
        </Reveal>

        <div className="grid gap-5 md:grid-cols-2">
          {TOOLS.map((tool, i) => (
            <Reveal key={tool.id} delay={i * 70}>
              <article className="panel clip-corner flex h-full flex-col p-6 transition-all duration-400 hover:border-red-deep/70 hover:box-glow">
                <div className="mb-4 flex flex-wrap items-center gap-2 font-mono text-[10px]">
                  <span className={`border px-2 py-0.5 uppercase ${STATUS_STYLE[tool.status]}`}>
                    {tool.status}
                  </span>
                  <span className="border border-line px-2 py-0.5 text-ink-faint">
                    {tool.language}
                  </span>
                </div>

                <h3 className="font-mono text-lg font-semibold text-ink">
                  {tool.repo ? (
                    <Link
                      href={`/arsenal/${tool.id}/`}
                      className="transition-colors hover:text-red-blood"
                    >
                      <span className="text-red-blood/70">./</span>
                      {tool.name}
                    </Link>
                  ) : (
                    <>
                      <span className="text-red-blood/70">./</span>
                      {tool.name}
                    </>
                  )}
                </h3>
                <p className="mt-1.5 font-mono text-[12.5px] text-ink-faint">{tool.tagline}</p>

                <p className="mt-4 flex-1 text-sm leading-relaxed text-ink-dim">
                  {tool.description}
                </p>

                <div className="mt-5 flex flex-wrap gap-1.5">
                  {tool.techniques.map((t) => (
                    <a
                      key={t}
                      href={attackUrl(t)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink-faint transition-colors hover:border-red-deep/60 hover:text-red-blood"
                    >
                      {t}
                    </a>
                  ))}
                </div>

                <div className="mt-5 border-t border-line pt-4">
                  {tool.repo ? (
                    <a
                      href={tool.repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 font-mono text-[12px] text-red-blood transition-colors hover:text-red-core"
                    >
                      git clone
                      <span className="text-ink-dim group-hover:text-ink">
                        {tool.repo.replace('https://', '')}
                      </span>
                      <span className="transition-transform duration-300 group-hover:translate-x-1">
                        ↗
                      </span>
                    </a>
                  ) : (
                    <p className="font-mono text-[12px] text-ink-faint">
                      Not released — engagement tooling, available on request under NDA.
                    </p>
                  )}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============================= CTA ============================= */}
      <section className="relative mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <Reveal>
          <div className="panel clip-corner flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-mono text-xl font-semibold text-ink">
                Found something in one of these?
              </h2>
              <p className="mt-2 max-w-xl text-sm text-ink-dim">
                Disclosure policy, PGP key and the security contact are on the security
                page. I answer every report, including the ones that turn out to be
                nothing.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/security/"
                className="clip-tab border border-red-deep bg-red-core px-6 py-3 font-mono text-sm text-void transition-all hover:shadow-[0_0_30px_-4px_rgba(255,45,75,0.8)]"
              >
                ./security --policy
              </Link>
              <Link
                href="/detections/"
                className="border border-line px-6 py-3 font-mono text-sm text-ink-dim transition-all hover:border-red-deep/70 hover:text-red-blood"
              >
                ./detections
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
