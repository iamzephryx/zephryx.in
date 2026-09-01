import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import SectionHeading from '@/components/SectionHeading';
import AttackMatrix from '@/components/AttackMatrix';
import { getCoverage } from '@/lib/attack';
import { getZone } from '@/lib/site';
import { buildMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'techniques',
  description:
    "Which ATT&CK techniques I've actually run and published an attack for, which of those I went back and wrote a detection for, and where I still owe myself the work.",
  path: '/matrix/',
  zone: getZone('research'),
});

/**
 * Inline swatch for the four board states named in the hero copy, tinted to match
 * the legend on <AttackMatrix />. The state colour lives on the tint and the
 * underline; the word itself stays on an ink token, so it keeps its contrast when
 * the page flips to the light theme (signal/warn text does not).
 */
function Swatch({
  tone,
  children,
}: {
  tone: 'red' | 'green' | 'amber' | 'grey';
  children: React.ReactNode;
}) {
  const TONE = {
    red: 'bg-red-blood/15 border-red-blood/70',
    green: 'bg-signal/15 border-signal/70',
    amber: 'bg-warn/15 border-warn/70',
    grey: 'bg-ink-faint/20 border-ink-faint/70',
  } as const;

  return (
    <span className={`rounded-[2px] border-b-2 px-1.5 font-medium text-ink ${TONE[tone]}`}>
      {children}
    </span>
  );
}

export default function MatrixPage() {
  const coverage = getCoverage();
  const openGaps = coverage.emulated - coverage.both;

  const STATS: ReadonlyArray<[string, string]> = [
    [String(coverage.emulated), 'techniques run'],
    [String(coverage.both), 'loops closed'],
    [String(coverage.detected), 'with a rule'],
    [String(coverage.total), 'tracked'],
  ];

  return (
    <>
      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden px-5 pt-32 pb-12 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <p className="mb-5 font-mono text-sm text-ink-dim">
              <span className="text-red-blood">$</span> ./attack-navigator --layer techniques.json
            </p>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="font-mono text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              <span className="text-red-blood text-glow">techniques</span>
              <span className="text-ink-faint"> — what I&apos;ve actually run</span>
            </h1>
          </Reveal>

          <Reveal delay={140}>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-ink-dim">
              My own scorecard, made public. <Swatch tone="red">Red</Swatch> is a technique
              I've run and published an attack for. <Swatch tone="green">Green</Swatch> means
              I went back afterwards and wrote the detection too.{' '}
              <Swatch tone="amber">Amber</Swatch> is a rule that exists without a writeup
              behind it yet, and <Swatch tone="grey">grey</Swatch> just means I'm tracking the
              technique and haven't got to either side of it.
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
            title="what this board isn't claiming"
            sub="This tracks what I have personally run and written up. It is not a claim about anyone's defensive coverage, and I have seen enough ATT&CK boards used that way to want it said plainly."
          />
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          <Reveal>
            <article className="panel clip-corner h-full p-6">
              <h3 className="font-mono text-base font-semibold text-ink">
                This is a slice, not the whole matrix
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-dim">
                ATT&amp;CK Enterprise has hundreds of techniques in it. I'm tracking{' '}
                {coverage.total} here — basically what I actually run into, plus a few
                neighbours I left visible on purpose so the gaps mean something. If this
                board were all green, that'd be a sign I curated it, not that I'm done.
              </p>
            </article>
          </Reveal>

          <Reveal delay={90}>
            <article className="panel clip-corner h-full p-6">
              <h3 className="font-mono text-base font-semibold text-ink">
                I can't just hand-color a cell green
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-dim">
                Every cell on this board gets computed from the technique IDs I actually
                declared on a writeup or a detection rule when I published it — I built
                it that way on purpose, so I can't just fudge one green out of laziness.
                If I reference a technique I forgot to register, the site fails to build.
              </p>
            </article>
          </Reveal>

          <Reveal delay={180}>
            <article className="panel clip-corner h-full p-6">
              <h3 className="font-mono text-base font-semibold text-ink">
                A green cell isn't a promise
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-dim">
                Green just means I wrote a rule and actually tested it against my own
                attack. It doesn't mean nobody's getting past it — every rule here says
                where it's weak, and a patient attacker will find that spot. I think of
                detection as slowing someone down, not stopping them outright.
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
                  ? `${openGaps} thing${openGaps === 1 ? '' : 's'} I still owe this board a rule for`
                  : "Everything I've emulated has a rule behind it right now"}
              </h2>
              <p className="mt-2 max-w-xl text-sm text-ink-dim">
                {openGaps > 0
                  ? "These are attacks I've already published without going back to write the detection. They're on the list — this number is basically my to-do pile, publicly."
                  : "Which just means I need to go find something new to break, not new rules to write. Tell me if you've got a technique worth trying."}
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
