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
    'Sigma rules, KQL hunts and tuning notes written in response to offensive work — the detection half of the purple loop, mapped to MITRE ATT&CK.',
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
              Offence that never becomes a detection is a party trick. Every rule below
              exists because something got through first — most of them link straight
              back to the writeup that motivated them. Sigma for portability, KQL for the
              estates I actually work in, and honest tuning notes for the parts that
              generate noise.
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
                the offensive half
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
              // BEFORE YOU DEPLOY ANY OF THESE
            </h2>
            <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-dim">
              These rules are written against the telemetry I have, in the estates I
              work in. Field names differ between Sysmon schemas, EDR vendors and SIEM
              normalisations, and every threshold here assumes a baseline I built from
              someone else&apos;s logs. Run them in audit first, tune against your own
              noise floor, and treat the exclusions as an attack surface — an allowlist
              is where a competent operator will go and hide.
            </p>
          </div>
        </Reveal>
      </section>
    </>
  );
}
