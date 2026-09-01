import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE, getZone } from '@/lib/site';
import { buildMetadata } from '@/lib/metadata';
import { getCheatsheetCount } from '@/lib/cheatsheets';

export const metadata: Metadata = buildMetadata({
  title: 'Academy',
  description:
    'Free offensive security and pentesting education — Active Directory attack paths, adversary emulation and detection engineering, taught by a working penetration tester. Cheatsheets, glossary and a learning roadmap, no paywall.',
  path: '/learn/',
  zone: getZone('learn'),
});

/**
 * Carried over from the academy site's /about/ page, which is gone: the rest of
 * that page argued the training teaches reasoning over tools and pairs every
 * attack with its detection — both already said better by PRINCIPLES below, and
 * a third copy of "run by the same person behind zephryx.in" reads as padding
 * on a site that is now one site.
 *
 * These three questions are what actually did not survive anywhere else, and
 * the first one is load-bearing: the free, no-paywall posture is a deliberate
 * commitment, and stating it plainly where a reader looks for the catch is how
 * it stays honest. Do not soften it into "currently free" or add a plan tier
 * without that being a real decision.
 */
const FAQ = [
  {
    q: 'What does this cost?',
    a: "Nothing, right now. The cheatsheets here are free — no signup, no paywall, no email required. Whether anything paid gets added later is a separate decision for another time, and it won't take anything away from what's already free.",
  },
  {
    q: 'Who is this for?',
    a: 'People who already have the fundamentals and want to get properly good at internal network and Active Directory work. Not a first-ever-intro-to-Linux course — that ground is well covered elsewhere.',
  },
  {
    q: 'Do I need my own lab?',
    a: 'Yes — the roadmap is written around a lab you build yourself, and the build is part of the material. Hosted labs are being considered, not promised.',
  },
];

const PRINCIPLES = [
  {
    cmd: '01',
    title: 'Attacks you will actually see',
    body: "Everything taught here comes out of real engagements — the AD path that keeps working, the misconfiguration that keeps showing up. Not a tour of tools you'll never run again.",
  },
  {
    cmd: '02',
    title: 'The reasoning, not the checklist',
    body: "A command you can't explain is a command you can't adapt. Every technique is taught from why it works, so it survives a target that doesn't match the lab.",
  },
  {
    cmd: '03',
    title: 'Both sides of the loop',
    body: 'Every attack path has a detection counterpart. You learn what you would leave behind, and what would have caught you doing it.',
  },
  {
    cmd: '04',
    title: 'Dead ends included',
    body: "Polished walkthroughs hide the part where it doesn't work. The labs keep the failed attempts in, because recognising a dead end early is most of the skill.",
  },
];

export default function Home() {
  const cheatsheetCount = getCheatsheetCount();

  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative mx-auto flex min-h-[92vh] max-w-6xl flex-col justify-center px-5 pt-24 pb-16 sm:px-8">
        <div className="reveal">
          <p className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.3em] text-ink-faint">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-signal" />
            FREE OFFENSIVE SECURITY EDUCATION
          </p>

          <h1 className="mt-7 max-w-4xl font-mono text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-6xl">
            Learn to break in
            <span className="text-red-blood">.</span>
            <br />
            Then learn what catches you
            <span className="text-red-blood">.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-ink-dim">
            {SITE.name} is free, hands-on offensive security and pentesting education, built by a
            working penetration tester. Active Directory attack paths, adversary emulation, and the
            detection engineering that closes the loop — taught the way the work actually happens.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/learn/cheatsheets/"
              className="clip-tab inline-flex items-center gap-2 border border-red-deep bg-red-core px-7 py-3.5 font-mono text-sm font-medium text-void transition-all duration-300 hover:shadow-[0_0_30px_-4px_rgba(255,45,75,0.8)]"
            >
              Browse free cheatsheets
            </Link>
            <Link
              href="/learn/roadmap/"
              className="inline-flex items-center gap-2 border border-line px-7 py-3.5 font-mono text-sm text-ink-dim transition-colors duration-300 hover:border-red-deep/60 hover:text-red-blood"
            >
              see the roadmap
              <span aria-hidden>→</span>
            </Link>
          </div>

          <p className="mt-8 text-[13px] text-ink-faint">
            No signup, no paywall, no email required. Paid material may exist someday — that&apos;s a
            decision for later, and it won&apos;t change what&apos;s already free here.
          </p>
        </div>
      </section>

      {/* -------------------------------------------------------- cheatsheets */}
      <section className="mx-auto max-w-6xl px-5 pb-4 sm:px-8">
        <div className="panel clip-corner flex flex-col items-start justify-between gap-6 p-7 sm:flex-row sm:items-center">
          <div>
            <p className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.3em] text-signal">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-signal" />
              AVAILABLE NOW — FREE
            </p>
            <h2 className="mt-3 font-mono text-xl font-semibold text-ink sm:text-2xl">
              {cheatsheetCount} quick-reference cheatsheets, free right now
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-dim">
              The learning paths below are still being written, but the reference PDFs already
              exist — Active Directory enumeration, web app testing, network recon and more. No
              login, no paywall, no catch.
            </p>
          </div>
          <Link
            href="/learn/cheatsheets/"
            className="clip-tab inline-flex shrink-0 items-center gap-2 border border-red-deep bg-red-core px-6 py-3 font-mono text-sm font-medium text-void transition-all duration-300 hover:shadow-[0_0_30px_-4px_rgba(255,45,75,0.8)]"
          >
            browse cheatsheets
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* ---------------------------------------------------------- principles */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <SectionHeading kicker="APPROACH" title="How this is taught" />

        <div className="mt-12 grid gap-px border border-line bg-line sm:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <div key={p.cmd} className="bg-surface p-7 transition-colors duration-300 hover:bg-elevated">
              <span className="font-mono text-[11px] tracking-[0.3em] text-red-blood/70">{p.cmd}</span>
              <h3 className="mt-3 font-mono text-lg font-semibold text-ink">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-dim">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- faq */}
      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <SectionHeading kicker="QUESTIONS" title="Before you start" />

        <dl className="mt-12 space-y-px border border-line bg-line">
          {FAQ.map((item) => (
            <div key={item.q} className="bg-surface p-6">
              <dt className="font-mono text-[15px] font-semibold text-ink">{item.q}</dt>
              <dd className="mt-2.5 text-sm leading-relaxed text-ink-dim">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <p className="font-mono text-[11px] tracking-[0.3em] text-red-blood/70">{kicker}</p>
      <h2 className="mt-3 font-mono text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h2>
    </div>
  );
}
