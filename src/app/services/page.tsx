import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import SectionHeading from '@/components/SectionHeading';
import { SITE, getZone } from '@/lib/site';
import { buildMetadata } from '@/lib/metadata';
import { FAQ, PROCESS, SERVICES } from '@/lib/services';

// This was Zephryx-Security's root page, so its metadata came from that repo's
// root layout. Here it is one zone landing page among several and needs its
// own, or it silently inherits the portfolio's title and description.
export const metadata: Metadata = buildMetadata({
  title: 'Penetration Testing Services',
  description:
    'Boutique offensive security — web, network, cloud, Active Directory and API penetration testing for startups and growing businesses. Every engagement is tested, reported and retested by the same person you scoped it with.',
  path: '/services/',
  zone: getZone('services'),
});

const DIFFERENTIATORS = [
  {
    cmd: '01',
    title: 'Manual testing, not a scanner report',
    body: "A scanner finds known signatures. It cannot tell you that role B can read role A's invoices, or that your invite flow lets someone skip payment. Every finding here was found by a person reading your system the way an attacker would.",
  },
  {
    cmd: '02',
    title: 'One operator, start to finish',
    body: "The person who scopes the engagement is the person who tests it and writes the report — not whoever is on the bench that week. You get direct access throughout, not a project manager relaying findings from someone you've never spoken to.",
  },
  {
    cmd: '03',
    title: 'Findings become detections',
    body: 'Every technique run during testing can be handed back as a Sigma detection rule for your SOC — the same detection-engineering work published openly on zephryx.in, applied to your environment instead of a lab.',
  },
  {
    cmd: '04',
    title: 'A report you can actually use',
    body: 'Reproducible steps, a specific fix, and a live debrief with your team — plus one free retest once fixes ship, so the paper trail reflects what is actually true today.',
  },
];

export default function Home() {
  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative mx-auto flex min-h-[92vh] max-w-6xl flex-col justify-center px-5 pt-24 pb-16 sm:px-8">
        <Reveal>
          <p className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.3em] text-ink-faint">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
            OFFENSIVE SECURITY · AVAILABLE FOR NEW ENGAGEMENTS
          </p>
        </Reveal>

        <Reveal delay={80}>
          <h1 className="mt-7 max-w-4xl font-mono text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-6xl">
            Penetration testing for startups
            <span className="text-red-blood">.</span>
            <br />
            Run by the person who does the work
            <span className="text-red-blood">.</span>
          </h1>
        </Reveal>

        <Reveal delay={140}>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-ink-dim">
            Web, network, cloud, Active Directory and API testing for growing businesses —
            manual-first, scoped in writing, reported the way an engineer actually wants to read
            it. No bench of overworked juniors. No scanner PDF with a logo on it.
          </p>
        </Reveal>

        <Reveal delay={200}>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/services/request/"
              className="clip-tab inline-flex items-center gap-2 border border-red-deep bg-red-core px-7 py-3.5 font-mono text-sm font-medium text-void transition-all duration-300 hover:shadow-[0_0_30px_-4px_rgba(255,45,75,0.8)]"
            >
              ./request-assessment
            </Link>
            <Link
              href="/services/"
              className="inline-flex items-center gap-2 border border-line px-7 py-3.5 font-mono text-sm text-ink-dim transition-colors duration-300 hover:border-red-deep/60 hover:text-red-blood"
            >
              see the services
              <span aria-hidden>→</span>
            </Link>
          </div>
        </Reveal>

        <Reveal delay={260}>
          {/* The evidence is linked rather than asserted — the standard this
              site holds itself to for anything a buyer is asked to believe. */}
          <p className="mt-8 font-mono text-[12px] text-ink-faint">
            <span className="text-red-blood/70">$</span> the{' '}
            <Link href="/writeups/" className="text-red-blood/80 hover:text-red-blood">
              writeups
            </Link>
            ,{' '}
            <Link href="/arsenal/" className="text-red-blood/80 hover:text-red-blood">
              tooling
            </Link>{' '}
            and{' '}
            <Link href="/detections/" className="text-red-blood/80 hover:text-red-blood">
              Sigma rules
            </Link>{' '}
            are public — the work is verifiable before you ever get on a call.
          </p>
        </Reveal>
      </section>

      {/* ---------------------------------------------------------- differentiators */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <Reveal>
          <SectionHeading index="01 / WHY THIS" title="What you're actually paying for" />
        </Reveal>

        <div className="grid gap-px border border-line bg-line sm:grid-cols-2">
          {DIFFERENTIATORS.map((p, i) => (
            <Reveal key={p.cmd} delay={i * 70}>
              <div className="h-full bg-surface p-7 transition-colors duration-300 hover:bg-elevated">
                <span className="font-mono text-[11px] tracking-[0.3em] text-red-blood/70">{p.cmd}</span>
                <h3 className="mt-3 font-mono text-lg font-semibold text-ink">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-dim">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------- services */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <Reveal>
          <SectionHeading
            index="02 / SERVICES"
            title="What gets tested"
            sub="Eight engagement types, each scoped to your environment rather than sold off a fixed package."
          />
        </Reveal>

        {/* Eight services over three columns leaves an orphan cell, and an empty
            cell in a gap-px grid shows the container's bg-line as a solid block
            rather than reading as blank space. The closing cell fills it — and
            spans both columns at sm, where eight cards already tile evenly. */}
        <div className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, i) => (
            <Reveal key={s.id} delay={(i % 3) * 60}>
              <Link
                href={`/services/${s.id}/`}
                className="group flex h-full flex-col bg-surface p-6 transition-colors duration-300 hover:bg-elevated"
              >
                <span className="font-mono text-[10px] tracking-[0.3em] text-red-blood/70">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 font-mono text-[15px] font-semibold text-ink">{s.title}</h3>
                <p className="mt-2.5 flex-1 text-[13px] leading-relaxed text-ink-dim">{s.tagline}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 font-mono text-[11px] text-red-blood/80 transition-transform duration-300 group-hover:translate-x-0.5">
                  details <span aria-hidden>→</span>
                </span>
              </Link>
            </Reveal>
          ))}

          <Reveal className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/services/request/"
              className="group flex h-full flex-col justify-center bg-surface p-6 transition-colors duration-300 hover:bg-elevated"
            >
              <span className="font-mono text-[10px] tracking-[0.3em] text-red-blood/70">?</span>
              <h3 className="mt-3 font-mono text-[15px] font-semibold text-ink">
                Not sure which you need
              </h3>
              <p className="mt-2.5 text-[13px] leading-relaxed text-ink-dim">
                Most engagements end up spanning two or three of these. Describe the environment
                and it gets scoped from scratch.
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 font-mono text-[11px] text-red-blood/80 transition-transform duration-300 group-hover:translate-x-0.5">
                start a conversation <span aria-hidden>→</span>
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* --------------------------------------------------------------- process */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <Reveal>
          <SectionHeading
            index="03 / PROCESS"
            title="How an engagement runs"
            sub="Five steps, every time — from the first call to the retest that confirms the fix held."
          />
        </Reveal>

        <div className="space-y-px border border-line bg-line">
          {PROCESS.map((step, i) => (
            <Reveal key={step.n} delay={i * 50}>
              <div className="flex flex-col gap-2 bg-surface p-6 sm:flex-row sm:items-baseline sm:gap-6">
                <span className="font-mono text-lg font-bold text-red-blood sm:w-10">{step.n}</span>
                <div>
                  <h3 className="font-mono text-base font-semibold text-ink">{step.title}</h3>
                  <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-dim">{step.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="mt-6 font-mono text-[12px] text-ink-faint">
            <span className="text-red-blood/70"># </span>
            full breakdown on the <Link href="/services/process/" className="text-red-blood/80 hover:text-red-blood">process page</Link>.
          </p>
        </Reveal>
      </section>

      {/* -------------------------------------------------------------------- FAQ */}
      <section className="mx-auto max-w-4xl px-5 py-20 sm:px-8">
        <Reveal>
          <SectionHeading index="04 / QUESTIONS" title="Before you reach out" />
        </Reveal>

        <dl className="space-y-px border border-line bg-line">
          {FAQ.map((item, i) => (
            <Reveal key={item.q} delay={i * 40}>
              <div className="bg-surface p-6">
                <dt className="font-mono text-[15px] font-semibold text-ink">{item.q}</dt>
                <dd className="mt-2.5 text-sm leading-relaxed text-ink-dim">{item.a}</dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </section>

      {/* ---------------------------------------------------------------------- CTA */}
      <section className="mx-auto max-w-4xl px-5 pb-24 sm:px-8">
        <Reveal>
          <div className="panel clip-corner flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-mono text-xl font-semibold text-ink">Ready to scope an engagement?</h2>
              <p className="mt-2 max-w-xl text-sm text-ink-dim">
                Tell me what you're building and what needs testing. I reply within one business
                day, usually sooner.
              </p>
            </div>
            <Link
              href="/services/request/"
              className="clip-tab shrink-0 border border-red-deep bg-red-core px-7 py-3.5 font-mono text-sm font-medium text-void transition-all duration-300 hover:shadow-[0_0_30px_-4px_rgba(255,45,75,0.8)]"
            >
              ./request-assessment
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
