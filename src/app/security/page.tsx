import type { Metadata } from 'next';
import Link from 'next/link';
import CopyValue from '@/components/CopyValue';
import Reveal from '@/components/Reveal';
import SectionHeading from '@/components/SectionHeading';
import { SITE } from '@/lib/site';
import { buildMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'security',
  description:
    "If you found a bug in my site or my tools, here's exactly how to tell me, what I'll do about it, and why you won't get a legal letter for trying to help.",
  path: '/security/',
});

const IN_SCOPE = [
  `${SITE.domain} and any subdomain serving this site`,
  'The /api/contact endpoint and its rate limiting',
  'Published tooling in the arsenal, at the latest released commit',
  'Detection rules that fail open in a way that is not documented',
];

const OUT_OF_SCOPE = [
  'Denial of service, volumetric testing, or anything that degrades availability',
  'Social engineering of me, my employer, or anyone hosting infrastructure for me',
  'Physical attacks, or access to accounts you do not own',
  'Missing security headers with no demonstrated impact',
  'Reports generated wholesale by a scanner with no validation',
  'Third-party services I merely link to — report those to their owners',
];

const PROCESS: ReadonlyArray<[string, string, string]> = [
  [
    '01',
    'Report',
    'Mail security@zephryx.in with reproduction steps, affected URL or version, and the impact you can demonstrate. A proof of concept beats a paragraph of theory.',
  ],
  [
    '02',
    'Acknowledgement',
    'I reply within 72 hours, usually sooner. If you do not hear back, assume the mail was lost and use the contact form rather than assuming you were ignored.',
  ],
  [
    '03',
    'Triage',
    'Within 7 days you get a severity assessment, whether it is in scope, and a rough remediation timeline. If I disagree with your severity I will say why rather than quietly downgrading it.',
  ],
  [
    '04',
    'Fix and disclose',
    'Site issues are typically fixed within 30 days. You are credited by whatever name or handle you choose, or not at all if you prefer. Coordinated publication after the fix ships is welcome.',
  ],
];

const SAFE_HARBOUR = [
  'Stay within the scope above and stop at the point where you have demonstrated impact.',
  'Access only data that is yours or clearly synthetic. If you encounter someone else’s data, stop and tell me.',
  'Do not degrade the service for anyone else, and do not run automated tooling at volume.',
  'Give me reasonable time to fix the issue before disclosing it publicly.',
];

export default function SecurityPage() {
  return (
    <>
      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden px-5 pt-32 pb-12 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <p className="mb-5 font-mono text-sm text-ink-dim">
              <span className="text-red-blood">$</span> curl -s {SITE.domain}
              /.well-known/security.txt
            </p>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="font-mono text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              <span className="text-red-blood text-glow">disclosure</span>
              <span className="text-ink-faint"> policy</span>
            </h1>
          </Reveal>

          <Reveal delay={140}>
            <p className="mt-6 text-lg leading-relaxed text-ink-dim">
              I spend most of my working hours finding other people's bugs, so it'd be
              pretty rich of me to make it hard for someone to report mine. This page is
              the policy referenced by{' '}
              <a
                href="/.well-known/security.txt"
                className="text-red-blood underline decoration-red-blood/40 underline-offset-4 transition-colors hover:decoration-red-blood"
              >
                /.well-known/security.txt
              </a>
              . No bounty, no legal theatre — just a fast, honest response and public
              credit if you want it.
            </p>
          </Reveal>

          <Reveal delay={200}>
            <div className="panel clip-corner mt-9 p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                security contact
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <a
                  href="mailto:security@zephryx.in"
                  className="font-mono text-xl text-red-blood transition-colors hover:text-red-core"
                >
                  security@{SITE.domain}
                </a>
                {/* mailto: is useless to anyone on webmail — let them take the address */}
                <CopyValue value={`security@${SITE.domain}`} label="the security address" />
              </div>
              <p className="mt-3 font-mono text-[12px] leading-relaxed text-ink-faint">
                Acknowledgement within 72 hours · triage within 7 days · encrypt anything
                sensitive
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================ SCOPE ============================ */}
      <section className="relative mx-auto max-w-4xl px-5 py-16 sm:px-8">
        <Reveal>
          <SectionHeading
            index="01 / SCOPE"
            title="what counts"
            sub="Scope is sacred on my engagements, and it works the same way pointed at me."
          />
        </Reveal>

        <div className="grid gap-5 md:grid-cols-2">
          <Reveal>
            <div className="panel clip-corner h-full p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">
                in scope
              </p>
              <ul className="mt-4 space-y-2.5">
                {IN_SCOPE.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-[14px] leading-relaxed text-ink-dim"
                  >
                    <span className="mt-0.5 font-mono text-signal">+</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <div className="panel clip-corner h-full p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-red-blood">
                out of scope
              </p>
              <ul className="mt-4 space-y-2.5">
                {OUT_OF_SCOPE.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-[14px] leading-relaxed text-ink-dim"
                  >
                    <span className="mt-0.5 font-mono text-red-blood">−</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* =========================== PROCESS =========================== */}
      <section className="relative mx-auto max-w-4xl px-5 py-16 sm:px-8">
        <Reveal>
          <SectionHeading
            index="02 / PROCESS"
            title="what happens next"
            sub="Timelines I hold myself to. If I miss one, chase me — I would rather be nagged than trusted."
          />
        </Reveal>

        <div className="grid gap-px border border-line bg-line sm:grid-cols-2">
          {PROCESS.map(([n, title, body]) => (
            <div key={n} className="bg-abyss/80 p-6">
              <div className="flex items-center gap-3">
                <span className="font-mono text-lg font-bold text-red-blood">{n}</span>
                <h3 className="font-mono text-base font-semibold text-ink">{title}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-dim">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================= SAFE HARBOUR ========================= */}
      <section className="relative mx-auto max-w-4xl px-5 py-16 sm:px-8">
        <Reveal>
          <SectionHeading
            index="03 / SAFE HARBOUR"
            title="you will not hear from a lawyer"
            sub="Research conducted under the terms below is authorised, and I will not pursue or support action against you for it."
          />
        </Reveal>

        <ol className="space-y-3">
          {SAFE_HARBOUR.map((rule, i) => (
            <Reveal key={rule} delay={i * 70}>
              <li className="panel flex items-start gap-4 p-4">
                <span className="font-mono text-lg font-bold text-red-blood">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="pt-0.5 text-[15px] leading-relaxed text-ink-dim">{rule}</span>
              </li>
            </Reveal>
          ))}
        </ol>

        <Reveal>
          <p className="mt-6 font-mono text-[12px] leading-relaxed text-ink-faint">
            This authorisation covers infrastructure I control. It cannot and does not
            extend to my employer, my clients, or any third party — testing those without
            their own written authorisation is on you, and it is the one thing I will not
            defend.
          </p>
        </Reveal>
      </section>

      {/* ============================= CTA ============================= */}
      <section className="relative mx-auto max-w-4xl px-5 pb-24 sm:px-8">
        <Reveal>
          <div className="panel clip-corner flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-mono text-xl font-semibold text-ink">Ready to report?</h2>
              <p className="mt-2 max-w-xl text-sm text-ink-dim">
                Mail is preferred for anything sensitive. The form works for everything
                else, and both reach the same place.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:security@zephryx.in"
                className="clip-tab border border-red-deep bg-red-core px-6 py-3 font-mono text-sm text-void transition-all hover:shadow-[0_0_30px_-4px_rgba(255,45,75,0.8)]"
              >
                security@{SITE.domain}
              </a>
              <Link
                href="/handshake/"
                className="border border-line px-6 py-3 font-mono text-sm text-ink-dim transition-all hover:border-red-deep/70 hover:text-red-blood"
              >
                Contact
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
