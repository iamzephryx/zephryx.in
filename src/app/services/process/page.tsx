import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { PROCESS } from '@/lib/services';
import { getZone } from '@/lib/site';
import { buildMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Process',
  description:
    'How a Zephryx Security engagement runs, from scoping call to retest — rules of engagement, testing windows, reporting, and what happens if something critical turns up mid-engagement.',
  path: '/services/process/',
  zone: getZone('services'),
});

const RULES = [
  'Nothing is tested outside the written scope — no exceptions, no "while I was in there".',
  'A critical, exploitable-right-now finding gets reported immediately, not held for the final report.',
  'Destructive testing (anything that could cause an outage) is opt-in and named explicitly in scope, never assumed.',
  'An NDA is standard before scoping details are shared, and confirmed again in the rules of engagement.',
];

export default function Process() {
  return (
    <div className="mx-auto max-w-4xl px-5 pt-32 pb-16 sm:px-8">
      <Reveal>
        <p className="font-mono text-[11px] tracking-[0.3em] text-red-blood/70">PROCESS</p>
        <h1 className="mt-3 font-mono text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          How an engagement runs
        </h1>
        <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-ink-dim">
          The same five steps every time, regardless of which service you're scoping. Nothing
          here is negotiable in the sense of being skipped — the scope of what's tested is what
          gets discussed on the call.
        </p>
      </Reveal>

      <div className="mt-14 space-y-px border border-line bg-line">
        {PROCESS.map((step, i) => (
          <Reveal key={step.n} delay={i * 60}>
            <article className="bg-surface p-7">
              <div className="flex items-baseline gap-4">
                <span className="font-mono text-2xl font-bold text-red-blood">{step.n}</span>
                <h2 className="font-mono text-xl font-semibold text-ink">{step.title}</h2>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-dim">{step.body}</p>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <section className="mt-16">
          <h2 className="font-mono text-2xl font-bold tracking-tight text-ink">Rules I hold myself to</h2>
          <ol className="mt-8 space-y-3">
            {RULES.map((rule, i) => (
              <li key={rule} className="panel flex items-start gap-4 p-4">
                <span className="font-mono text-lg font-bold text-red-blood">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="pt-0.5 text-[15px] leading-relaxed text-ink-dim">{rule}</span>
              </li>
            ))}
          </ol>
        </section>
      </Reveal>

      <Reveal>
        <section className="panel clip-corner mt-14 p-7">
          <h2 className="font-mono text-lg font-semibold text-ink">Have a deadline driving this?</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-dim">
            An audit date, a funding round, a customer's security questionnaire — say so on the
            request form and the scoping call starts from your timeline, not a generic one.
          </p>
          <Link
            href="/services/request/"
            className="clip-tab mt-6 inline-flex items-center gap-2 border border-red-deep bg-red-core px-6 py-3 font-mono text-sm font-medium text-void transition-all duration-300 hover:shadow-[0_0_30px_-4px_rgba(255,45,75,0.8)]"
          >
            ./request-assessment
          </Link>
        </section>
      </Reveal>
    </div>
  );
}
