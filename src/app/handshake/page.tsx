import type { Metadata } from 'next';
import Reveal from '@/components/Reveal';
import SectionHeading from '@/components/SectionHeading';
import ContactForm from '@/components/ContactForm';
import CopyValue from '@/components/CopyValue';
import { MAILBOXES, SITE, SOCIALS } from '@/lib/site';

export const metadata: Metadata = {
  title: 'contact',
  description:
    "One place to reach me — a contact form that lands in my own inbox, the mailboxes sorted by what you're writing about, and everywhere else I post.",
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
              Assessment, a full emulation, a second pair of eyes on your detection coverage, a talk,
              or you found something in my own stuff — whatever it is, this goes straight to my
              actual inbox, not a shared team queue somewhere. Prefer email or a DM instead? Those
              are all further down.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_0.9fr] lg:gap-12">
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
                  <h2 className="font-mono text-[11px] tracking-[0.3em] text-ink-faint">
                    DISCLOSURE
                  </h2>
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
        </div>
      </section>

      {/* =========================== SOCIALS =========================== */}
      <section id="channels" className="relative mx-auto max-w-5xl scroll-mt-24 px-5 py-14 sm:px-8">
        <Reveal>
          <SectionHeading
            index="01 / SOCIAL"
            title="find me elsewhere"
            sub="I use these for pretty different things, so pick whichever actually matches what you're after — code on GitHub, quick thoughts on X, the professional stuff on LinkedIn."
          />
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SOCIALS.map((s, i) => (
            <Reveal key={s.id} delay={i * 70}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer external"
                className="panel clip-corner group relative flex h-full flex-col overflow-hidden p-6 transition-all duration-400 hover:-translate-y-1.5 hover:border-red-deep/70 hover:box-glow"
              >
                {/* accent bloom on hover */}
                <span
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
                  style={{ background: s.accent }}
                  aria-hidden
                />
                <div className="flex items-center justify-between">
                  <span
                    className="flex h-12 w-12 items-center justify-center border border-line bg-void/60 transition-colors duration-300 group-hover:border-red-deep/60"
                    aria-hidden
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5 fill-ink-dim transition-colors duration-300 group-hover:fill-ink"
                    >
                      <path d={s.icon} />
                    </svg>
                  </span>
                  <span className="font-mono text-ink-faint transition-all duration-300 group-hover:translate-x-1 group-hover:text-red-blood">
                    ↗
                  </span>
                </div>
                <h3 className="mt-5 font-mono text-base font-semibold text-ink">{s.label}</h3>
                <p className="mt-1 font-mono text-[13px] text-red-blood/80">{s.handle}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-dim">{s.blurb}</p>
              </a>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
