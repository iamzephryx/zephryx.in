import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import SectionHeading from '@/components/SectionHeading';
import { MAILBOXES, SITE, SOCIALS } from '@/lib/site';

export const metadata: Metadata = {
  title: 'connect',
  description:
    'Find Zephryx across the network — GitHub, X, LinkedIn, YouTube, Instagram — plus direct and disclosure email channels.',
  alternates: { canonical: `${SITE.url}/connect/` },
};

export default function ConnectPage() {
  return (
    <>
      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden px-5 pt-32 pb-12 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="mb-5 font-mono text-sm text-ink-dim">
              <span className="text-red-blood">$</span> netstat --outbound --established
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="font-mono text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              <span className="text-red-blood text-glow">connect</span>
              <span className="text-ink-faint"> // open channels</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-dim">
              Live threat intel, box takedowns, tooling and the occasional human moment. Every
              channel is a different frequency — pick the one that fits.
            </p>
          </Reveal>
        </div>
      </section>

      {/* =========================== SOCIALS =========================== */}
      <section className="relative mx-auto max-w-5xl px-5 py-14 sm:px-8">
        <Reveal>
          <SectionHeading index="01 / SOCIAL" title="the network" />
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
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-ink-dim transition-colors duration-300 group-hover:fill-ink">
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

      {/* =========================== MAIL =========================== */}
      <section className="relative mx-auto max-w-5xl px-5 py-14 sm:px-8">
        <Reveal>
          <SectionHeading
            index="02 / MAIL"
            title="direct channels"
            sub="Prefer email? Pick the mailbox that matches the intent. Sensitive findings should be encrypted."
          />
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {MAILBOXES.map((m, i) => (
            <Reveal key={m.address} delay={i * 80}>
              <div className="panel clip-corner flex h-full flex-col p-6">
                <div className="flex items-center justify-between">
                  <span className="border border-red-deep/40 bg-red-ash/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-red-blood">
                    {m.purpose}
                  </span>
                  {m.pgp ? (
                    <span className="font-mono text-[10px] tracking-wider text-signal">PGP</span>
                  ) : null}
                </div>
                <a
                  href={`mailto:${m.address}`}
                  className="mt-4 break-all font-mono text-sm text-ink transition-colors hover:text-red-blood"
                >
                  {m.address}
                </a>
                <p className="mt-3 flex-1 text-[13px] leading-relaxed text-ink-dim">{m.detail}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="mt-6 font-mono text-[12px] text-ink-faint">
            <span className="text-red-blood/70">#</span> PGP fingerprint for{' '}
            <span className="text-red-blood/80">security@{SITE.domain}</span> available on request.
            Encrypt anything that would matter in the wrong inbox.
          </p>
        </Reveal>
      </section>

      {/* ============================ CTA ============================ */}
      <section className="relative mx-auto max-w-5xl px-5 py-16 sm:px-8">
        <Reveal>
          <div className="panel clip-corner scanlines relative overflow-hidden p-8 text-center sm:p-12">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background: 'radial-gradient(circle at 50% 0%, rgba(255,45,75,0.18), transparent 60%)',
              }}
            />
            <p className="relative font-mono text-sm text-red-blood/80">
              <span className="animate-blink">▌</span> prefer a vetted channel?
            </p>
            <h2 className="relative mt-3 font-mono text-2xl font-bold text-ink sm:text-4xl">
              Run the <span className="text-red-blood text-glow">handshake</span>.
            </h2>
            <p className="relative mx-auto mt-4 max-w-md text-sm text-ink-dim">
              Structured, rate-limited and straight to my inbox — no third-party form middleman.
            </p>
            <div className="relative mt-7">
              <Link
                href="/handshake/"
                className="clip-tab inline-block border border-red-deep bg-red-core px-7 py-3.5 font-mono text-sm text-void transition-all hover:shadow-[0_0_30px_-4px_rgba(255,45,75,0.8)]"
              >
                ./handshake --init
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
