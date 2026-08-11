import type { Metadata } from 'next';
import Reveal from '@/components/Reveal';
import ContactForm from '@/components/ContactForm';
import { MAILBOXES, SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'handshake',
  description:
    "The actual contact form. For engagements, detection reviews, a talk, or a disclosure — write a bit about what you need and I'll get back to you.",
  alternates: { canonical: `${SITE.url}/handshake/` },
};

export default function HandshakePage() {
  return (
    <section className="relative overflow-hidden px-5 pt-32 pb-20 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <p className="mb-5 font-mono text-sm text-ink-dim">
            <span className="text-red-blood">$</span> tcp --syn --dst zephryx.in:443
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="font-mono text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            <span className="text-red-blood text-glow">handshake</span>
            <span className="text-ink-faint"> // let&apos;s talk</span>
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-dim">
            Assessment, a full emulation, a second pair of eyes on your detection coverage, a talk,
            or you found something in my own stuff — whatever it is, this goes straight to my
            actual inbox, not a shared team queue somewhere.
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
                <ul className="mt-4 space-y-4">
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
                      <a
                        href={`mailto:${m.address}`}
                        className="mt-2 block break-all font-mono text-[13px] text-ink transition-colors hover:text-red-blood"
                      >
                        {m.address}
                      </a>
                    </li>
                  ))}
                </ul>
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
                  If you found something wrong with my actual site or infra, I'd genuinely rather
                  know — email{' '}
                  <span className="font-mono text-red-blood/80">security@{SITE.domain}</span> and
                  I'll deal with it, no legal threats, I promise.
                </p>
              </div>
            </aside>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
