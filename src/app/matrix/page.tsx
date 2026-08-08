import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import SectionHeading from '@/components/SectionHeading';
import AttackMatrix from '@/components/AttackMatrix';
import { getCoverage } from '@/lib/attack';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'matrix',
  description:
    'MITRE ATT&CK coverage board — which techniques I have emulated, which ones have a published detection rule behind them, and where the gaps still are.',
  alternates: { canonical: `${SITE.url}/matrix/` },
};

export default function MatrixPage() {
  const coverage = getCoverage();
  const openGaps = coverage.emulated - coverage.both;

  const STATS: ReadonlyArray<[string, string]> = [
    [String(coverage.total), 'techniques tracked'],
    [String(coverage.emulated), 'emulated'],
    [String(coverage.detected), 'with a rule'],
    [String(coverage.both), 'loops closed'],
  ];

  return (
    <>
      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden px-5 pt-32 pb-12 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <p className="mb-5 font-mono text-sm text-ink-dim">
              <span className="text-red-blood">$</span> ./attack-navigator --layer coverage.json
            </p>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="font-mono text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              <span className="text-red-blood text-glow">coverage</span>
              <span className="text-ink-faint"> — both sides of the wire</span>
            </h1>
          </Reveal>

          <Reveal delay={140}>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-ink-dim">
              One board, two claims. Red cells are techniques I have emulated and
              published on. Green cells are the ones where a detection rule now answers
              that emulation. Amber is a rule with no writeup behind it, and grey is
              honest — I track the technique, I have not published either half yet.
            </p>
          </Reveal>

          <Reveal delay={200}>
            <dl className="mt-10 grid max-w-3xl grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
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

      {/* =========================== THE BOARD =========================== */}
      <section className="relative mx-auto max-w-7xl px-5 pb-20 sm:px-8">
        <Reveal>
          <AttackMatrix coverage={coverage} />
        </Reveal>
      </section>

      {/* ========================== READ THIS ========================== */}
      <section className="relative mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <Reveal>
          <SectionHeading
            index="01 / METHOD"
            title="how to read this honestly"
            sub="Coverage boards are the easiest artefact in security to lie with. Here is exactly what this one does and does not claim."
          />
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          <Reveal>
            <article className="panel clip-corner h-full p-6">
              <h3 className="font-mono text-base font-semibold text-ink">
                It is a slice, not the matrix
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-dim">
                ATT&amp;CK Enterprise carries hundreds of techniques. This board tracks{' '}
                {coverage.total} — the ones in my regular rotation, plus neighbours kept
                visible so the gaps around them are legible. A full green matrix would
                mean the board was curated to look good.
              </p>
            </article>
          </Reveal>

          <Reveal delay={90}>
            <article className="panel clip-corner h-full p-6">
              <h3 className="font-mono text-base font-semibold text-ink">
                Coverage is derived, not asserted
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-dim">
                Every cell state is computed at build time from the technique IDs
                declared on published writeups and detection rules. Nothing here is
                hand-coloured, and a technique referenced by content that is missing from
                the catalogue fails the build rather than silently vanishing.
              </p>
            </article>
          </Reveal>

          <Reveal delay={180}>
            <article className="panel clip-corner h-full p-6">
              <h3 className="font-mono text-base font-semibold text-ink">
                A rule is not a guarantee
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-dim">
                Green means a rule exists and I have tested it against my own emulation.
                It does not mean the technique is stopped — every rule on this site
                documents its own blind spots, and a determined operator gets past most
                of them. Detection is friction, not a wall.
              </p>
            </article>
          </Reveal>
        </div>
      </section>

      {/* ============================= CTA ============================= */}
      <section className="relative mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <Reveal>
          <div className="panel clip-corner flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-mono text-xl font-semibold text-ink">
                {openGaps > 0
                  ? `${openGaps} open ${openGaps === 1 ? 'loop' : 'loops'} left on this board`
                  : 'Every emulated technique has a rule behind it'}
              </h2>
              <p className="mt-2 max-w-xl text-sm text-ink-dim">
                {openGaps > 0
                  ? 'Techniques I have published attacks for and not yet published detections for. They are next in the queue — and they are the honest measure of this site.'
                  : 'Which means the board needs new attacks on it, not new rules. Send me a technique worth breaking.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/detections/"
                className="clip-tab border border-red-deep bg-red-core px-6 py-3 font-mono text-sm text-void transition-all hover:shadow-[0_0_30px_-4px_rgba(255,45,75,0.8)]"
              >
                ./detections
              </Link>
              <Link
                href="/writeups/"
                className="border border-line px-6 py-3 font-mono text-sm text-ink-dim transition-all hover:border-red-deep/70 hover:text-red-blood"
              >
                ./writeups
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
