import type { Metadata } from 'next';
import Reveal from '@/components/Reveal';
import SectionHeading from '@/components/SectionHeading';
import ContactForm from '@/components/ContactForm';
import CopyValue from '@/components/CopyValue';
import { MAILBOXES, SITE, SOCIALS } from '@/lib/site';

export const metadata: Metadata = {
  title: 'contact',
  description:
    "One place to reach me — everywhere else I post, a contact form that lands in my own inbox, and the mailboxes sorted by what you're writing about.",
  alternates: { canonical: `${SITE.url}/handshake/` },
};

export default function ContactPage() {
  return (
    <>
      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden px-5 pt-32 pb-12 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="mb-5 font-mono text-sm text-ink-dim">
              <span className="text-red-blood">$</span> tcp --syn --dst zephryx.in:443
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="font-mono text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              <span className="text-red-blood text-glow">contact</span>
              <span className="text-ink-faint"> // let&apos;s talk</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-dim">
              A penetration test, a second pair of eyes on your detection coverage, a talk,
              or you found something in my own stuff — whatever it is, this goes straight to my
              actual inbox, not a shared team queue somewhere. A DM works too — I&apos;m in all the
              usual places, right below.
            </p>
          </Reveal>

          {/* ---- social strip ---------------------------------------------
              Compact on purpose: five blurb cards here would push the form
              and the mailboxes past a second fold, and this band exists to
              be scanned, not read. The blurbs still live in SOCIALS for
              anywhere that has room for them. */}
          <Reveal delay={220}>
            <nav id="channels" aria-label="Social profiles" className="mt-10 scroll-mt-24">
              <h2 className="font-mono text-[11px] tracking-[0.3em] text-ink-faint">
                FIND ME ELSEWHERE
              </h2>
              <ul className="mt-4 flex flex-wrap gap-3">
                {SOCIALS.map((s) => (
                  /* full-width rows on a phone — five chips wrapping at their
                     natural widths reads as ragged, not as a row */
                  <li key={s.id} className="basis-full sm:basis-auto">
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer external"
                      className="panel clip-corner group relative flex items-center gap-3 overflow-hidden px-4 py-3 transition-all duration-300 hover:-translate-y-1 hover:border-red-deep/70 hover:box-glow"
                    >
                      {/* accent bloom on hover */}
                      <span
                        className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
                        style={{ background: s.accent }}
                        aria-hidden
                      />
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center border border-line bg-void/60 transition-colors duration-300 group-hover:border-red-deep/60"
                        aria-hidden
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4 fill-ink-dim transition-colors duration-300 group-hover:fill-ink"
                        >
                          <path d={s.icon} />
                        </svg>
                      </span>
                      <span className="min-w-0">
                        <span className="block font-mono text-[13px] font-semibold text-ink">
                          {s.label}
                        </span>
                        <span className="block font-mono text-[11px] text-red-blood/80">
                          {s.handle}
                        </span>
                      </span>
                      <span
                        className="ml-auto pl-2 font-mono text-[11px] text-ink-faint transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-red-blood"
                        aria-hidden
                      >
                        ↗
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </Reveal>
        </div>
      </section>

      {/* ======================= FORM + MAILBOXES ======================= */}
      <section className="relative mx-auto max-w-5xl px-5 py-14 sm:px-8">
        <Reveal>
          <SectionHeading
            index="01 / DIRECT"
            title="reach me"
            sub="The form lands in the same inbox the addresses do, so use whichever you'd rather. If it's a disclosure, the mailbox is the faster path — encrypt it and it still reaches me."
          />
        </Reveal>

        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.9fr] lg:gap-12">
          {/* form */}
          <Reveal delay={120}>
            <ContactForm />
          </Reveal>

          {/* side rail */}
          <Reveal delay={220}>
            <aside className="space-y-6">
              <div className="panel clip-corner p-6">
                <h2 className="font-mono text-[11px] tracking-[0.3em] text-ink-faint">
                  DIRECT CHANNELS
                </h2>
                <ul className="mt-4 space-y-5">
                  {MAILBOXES.map((m) => (
                    <li key={m.address}>
                      <div className="flex items-center gap-2">
                        <span className="border border-red-deep/40 bg-red-ash/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-red-blood">
                          {m.purpose}
                        </span>
                        {m.pgp ? (
                          <span className="font-mono text-[10px] tracking-wider text-signal">
                            PGP
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <a
                          href={`mailto:${m.address}`}
                          className="break-all font-mono text-[13px] text-ink transition-colors hover:text-red-blood"
                        >
                          {m.address}
                        </a>
                        {/* mailto: does nothing for anyone on webmail */}
                        <CopyValue value={m.address} label={m.address} />
                      </div>
                      <p className="mt-1.5 text-[12px] leading-relaxed text-ink-dim">{m.detail}</p>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 border-t border-line/60 pt-4 font-mono text-[11px] leading-relaxed text-ink-faint">
                  <span className="text-red-blood/70">#</span> ask and I&apos;ll send my PGP
                  fingerprint for{' '}
                  <span className="text-red-blood/80">security@{SITE.domain}</span>.
                </p>
              </div>

              <div className="panel clip-corner p-6">
                <h2 className="font-mono text-[11px] tracking-[0.3em] text-ink-faint">
                  RESPONSE SLA
                </h2>
                <dl className="mt-4 space-y-3 font-mono text-[13px]">
                  {[
                    ['engagements', '1–2 business days'],
                    ['disclosure', 'within 48 hours'],
                    ['everything else', 'when I surface'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-3">
                      <dt className="text-ink-faint">{k}</dt>
                      <dd className="text-right text-ink-dim">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="panel clip-corner p-6">
                <h2 className="font-mono text-[11px] tracking-[0.3em] text-ink-faint">DISCLOSURE</h2>
                <p className="mt-3 text-[13px] leading-relaxed text-ink-dim">
                  If you found something wrong with my actual site or infra, I&apos;d genuinely
                  rather know — email{' '}
                  <span className="font-mono text-red-blood/80">security@{SITE.domain}</span> and
                  I&apos;ll deal with it, no legal threats, I promise.
                </p>
              </div>
            </aside>
          </Reveal>
        </div>
      </section>
    </>
  );
}
