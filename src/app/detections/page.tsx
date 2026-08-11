import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import DetectionsIndex from '@/components/DetectionsIndex';
import { getAllDetections } from '@/lib/detections';
import { getCoverage } from '@/lib/attack';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'detections',
  description:
    "Detection rules I wrote after finding my own way past something. Sigma and KQL, with the tuning notes and known blind spots left in, not polished out.",
  alternates: { canonical: `${SITE.url}/detections/` },
};

export default function DetectionsPage() {
  const detections = getAllDetections();
  const coverage = getCoverage();

  const linked = detections.filter((d) => d.writeup).length;

  const STATS: ReadonlyArray<[string, string]> = [
    [String(detections.length), 'rules published'],
    [String(coverage.detected), 'techniques covered'],
    [`${linked}/${detections.length}`, 'answer a writeup'],
    [`${coverage.detectionRate}%`, 'of tracked matrix'],
  ];

  return (
    <>
      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden px-5 pt-32 pb-12 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="mb-5 font-mono text-sm text-ink-dim">
              <span className="text-red-blood">$</span> ls /opt/detections/*.yml
            </p>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="font-mono text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              <span className="text-red-blood text-glow">detections</span>
              <span className="text-ink-faint"> — closing the loop</span>
            </h1>
          </Reveal>

          <Reveal delay={140}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-dim">
              I got tired of finding a way past something on an engagement and then never
              going back to write the rule that would've caught it. So now I try to. Sigma
              because it travels between tools, KQL because that's what I actually run day
              to day, and I try to be upfront in the notes about where each rule still misses.
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

          <Reveal delay={260}>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/matrix/"
                className="clip-tab border border-red-deep bg-red-core px-6 py-3 font-mono text-sm text-void transition-all hover:shadow-[0_0_30px_-4px_rgba(255,45,75,0.8)]"
              >
                ./matrix --coverage
              </Link>
              <Link
                href="/writeups/"
                className="group flex items-center gap-2 px-2 py-3 font-mono text-sm text-ink-dim transition-colors hover:text-red-blood"
              >
                see the attacks these answer
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================ LIST ============================ */}
      <section className="relative mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <DetectionsIndex detections={detections} />
      </section>

      {/* =========================== CAVEAT =========================== */}
      <section className="relative mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <Reveal>
          <div className="panel clip-corner p-8">
            <h2 className="font-mono text-sm font-semibold tracking-[0.2em] text-red-blood/80">
              // BEFORE YOU ACTUALLY DEPLOY THESE
            </h2>
            <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-dim">
              Quick honesty check: I wrote these against the telemetry I happen to have
              access to. Your Sysmon schema, EDR vendor, or SIEM's field names probably
              don't match mine exactly, and every threshold in here is tuned to a noise
              floor from logs that aren't yours. Run them in audit mode first. And
              seriously look hard at the exclusion lists before you trust them — that's
              usually the first place someone who knows what they're doing will hide.
            </p>
          </div>
        </Reveal>
      </section>
    </>
  );
}
