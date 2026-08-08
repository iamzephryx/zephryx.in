import Link from 'next/link';
import Terminal from '@/components/Terminal';
import TypeCycle from '@/components/TypeCycle';
import Reveal from '@/components/Reveal';
import SectionHeading from '@/components/SectionHeading';
import { getFeaturedWriteups, formatDate } from '@/lib/writeups';
import { getDetectionCount } from '@/lib/detections';
import { getCoverage } from '@/lib/attack';
import { creditedCount } from '@/lib/arsenal';
import { SITE } from '@/lib/site';

const ROLES = [
  'red_team_operator',
  'adversary_emulation',
  'threat_hunter',
  'initial_access_dev',
  'detection_engineer',
] as const;

/**
 * The CVE figure is derived from the advisory list rather than typed here, so
 * the front page can never claim a number the arsenal cannot show.
 */
const STATS: ReadonlyArray<{ value: string; label: string; href?: string }> = [
  { value: '150+', label: 'boxes rooted' },
  { value: '40+', label: 'engagements' },
  { value: String(creditedCount()), label: 'CVEs credited', href: '/arsenal/' },
  { value: '∞', label: 'assume breach' },
];

const CAPABILITIES = [
  {
    tag: 'ATK',
    title: 'Adversary Emulation',
    body: 'Full-scope red team operations that replay real threat-actor TTPs end to end — from initial access through to objective, mapped to MITRE ATT&CK.',
    items: ['C2 infrastructure & OPSEC', 'Payload development', 'AV / EDR evasion'],
  },
  {
    tag: 'AD',
    title: 'Active Directory',
    body: 'Identity is the modern perimeter. Kerberos abuse, ACL attack paths, delegation flaws and certificate services — I live in the graph.',
    items: ['Kerberoasting & delegation', 'ADCS escalation (ESC1-8)', 'BloodHound path analysis'],
  },
  {
    tag: 'DEF',
    title: 'Purple Loop',
    body: 'Every offensive finding becomes a detection. SOC by day means I close the loop — Sigma rules, KQL hunts and ATT&CK-mapped coverage.',
    items: ['Detection engineering', 'Hypothesis-driven hunting', 'Rule tuning & validation'],
  },
];

export default function HomePage() {
  const featured = getFeaturedWriteups(3);
  const coverage = getCoverage();
  const ruleCount = getDetectionCount();

  return (
    <>
      {/* ============================= HERO ============================= */}
      <section className="relative flex min-h-screen items-center overflow-hidden px-5 pt-24 pb-16 sm:px-8">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          {/* left: the hook */}
          <div className="anim-rise">
            <div className="mb-6 inline-flex items-center gap-2 border border-line bg-abyss/60 px-3 py-1.5 font-mono text-[11px] tracking-wider text-ink-dim backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
              </span>
              AVAILABLE FOR RED TEAM ENGAGEMENTS
            </div>

            <p className="mb-4 font-mono text-sm text-ink-dim">
              <span className="text-red-blood">$</span> ./initialize --operator
            </p>

            <h1 className="font-mono text-5xl font-bold leading-[0.95] tracking-tight text-ink sm:text-7xl">
              <span
                className="glitch text-glow block"
                data-text={SITE.name}
              >
                {SITE.name}
              </span>
            </h1>

            <div className="mt-5 flex min-h-[1.75rem] items-center font-mono text-lg text-ink-dim sm:text-xl">
              <span className="text-ink-faint">role://</span>
              <span className="ml-1">
                <TypeCycle phrases={ROLES} />
              </span>
            </div>

            <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-dim">
              I break things before they do. A 23-year-old offensive security
              specialist working the SOC as a{' '}
              <span className="text-ink">threat hunter</span> — and thinking like the
              adversary the rest of the time. I emulate the attacks that matter, then
              build the detections that catch them.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/whoami/"
                className="clip-tab group relative overflow-hidden border border-red-deep bg-red-core px-6 py-3 font-mono text-sm font-medium text-void transition-all duration-300 hover:shadow-[0_0_30px_-4px_rgba(255,45,75,0.8)]"
              >
                <span className="relative z-10">./whoami</span>
              </Link>
              <Link
                href="/writeups/"
                className="group flex items-center gap-2 px-2 py-3 font-mono text-sm text-ink-dim transition-colors hover:text-red-blood"
              >
                read the research
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </div>

            {/* stats */}
            <dl className="mt-12 grid max-w-lg grid-cols-4 gap-px border border-line bg-line">
              {STATS.map((s) => {
                const body = (
                  <>
                    <dt className="font-mono text-2xl font-bold text-red-blood text-glow">
                      {s.value}
                    </dt>
                    <dd className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                      {s.label}
                    </dd>
                  </>
                );
                return s.href ? (
                  <Link
                    key={s.label}
                    href={s.href}
                    className="bg-abyss/80 px-3 py-4 text-center transition-colors hover:bg-red-ash/20"
                  >
                    {body}
                  </Link>
                ) : (
                  <div key={s.label} className="bg-abyss/80 px-3 py-4 text-center">
                    {body}
                  </div>
                );
              })}
            </dl>
          </div>

          {/* right: interactive terminal */}
          <div className="anim-rise lg:pl-4" style={{ animationDelay: '0.15s' }}>
            <div className="mb-3 flex items-center justify-between font-mono text-[11px] text-ink-faint">
              <span className="tracking-wider">// LIVE SHELL — TRY IT</span>
              <span className="text-red-blood/70">interactive</span>
            </div>
            <Terminal />
            <p className="mt-3 text-center font-mono text-[11px] text-ink-faint">
              input sanitised · rate limited · no eval · no network calls
            </p>
          </div>
        </div>

        {/* scroll cue */}
        <div className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex">
          <span className="font-mono text-[10px] tracking-[0.3em] text-ink-faint">SCROLL</span>
          <span className="h-8 w-px bg-gradient-to-b from-red-blood/60 to-transparent" />
        </div>
      </section>

      {/* ========================= CAPABILITIES ========================= */}
      <section className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <Reveal>
          <SectionHeading
            index="01 / CAPABILITIES"
            title="what I do"
            sub="Offensive operations that close the loop. I don't just find the way in — I document the path, prove the impact, and hand you the detection that would have caught me."
          />
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {CAPABILITIES.map((cap, i) => (
            <Reveal key={cap.title} delay={i * 90}>
              <article className="panel clip-corner group h-full p-6 transition-all duration-400 hover:-translate-y-1.5 hover:border-red-deep/70 hover:box-glow">
                <div className="mb-5 flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center border border-red-deep/50 bg-red-ash/20 font-mono text-xs font-bold tracking-wider text-red-blood">
                    {cap.tag}
                  </span>
                  <span className="font-mono text-[11px] text-ink-faint">0{i + 1}</span>
                </div>
                <h3 className="font-mono text-lg font-semibold text-ink">{cap.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-dim">{cap.body}</p>
                <ul className="mt-5 space-y-2 border-t border-line pt-4">
                  {cap.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 font-mono text-[12px] text-ink-dim">
                      <span className="text-red-blood">▸</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ======================= FEATURED WRITEUPS ======================= */}
      {featured.length > 0 ? (
        <section className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading
                index="02 / RESEARCH"
                title="latest writeups"
                sub="Field notes from both sides of the wire — offensive tradecraft and the detections that answer it."
              />
            </div>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-3">
            {featured.map((w, i) => (
              <Reveal key={w.slug} delay={i * 90}>
                <Link
                  href={`/writeups/${w.slug}/`}
                  className="panel clip-corner group flex h-full flex-col p-6 transition-all duration-400 hover:-translate-y-1.5 hover:border-red-deep/70 hover:box-glow"
                >
                  <div className="mb-4 flex items-center gap-2 font-mono text-[10px]">
                    <span className="border border-red-deep/40 bg-red-ash/20 px-2 py-0.5 text-red-blood">
                      {w.category}
                    </span>
                    <span className="text-ink-faint">{w.difficulty}</span>
                    <span className="ml-auto text-ink-faint">{w.readingMinutes} min</span>
                  </div>
                  <h3 className="font-mono text-base font-semibold leading-snug text-ink transition-colors group-hover:text-red-blood">
                    {w.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-dim line-clamp-3">
                    {w.excerpt}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-line pt-4 font-mono text-[11px] text-ink-faint">
                    <span>{formatDate(w.date)}</span>
                    <span className="text-red-blood transition-transform duration-300 group-hover:translate-x-1">
                      read →
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="mt-10 text-center">
              <Link
                href="/writeups/"
                className="inline-flex items-center gap-2 border border-line px-6 py-3 font-mono text-sm text-ink-dim transition-all hover:border-red-deep/70 hover:text-red-blood"
              >
                cat /writeups/* <span>→</span>
              </Link>
            </div>
          </Reveal>
        </section>
      ) : null}

      {/* ========================= PURPLE LOOP ========================= */}
      <section className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <Reveal>
          <SectionHeading
            index="03 / COVERAGE"
            title="the loop, on a board"
            sub="Anyone can claim they close the loop. This is the artefact: every technique I have published an attack for, next to the rule that answers it — and the gaps where no rule exists yet."
          />
        </Reveal>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <Reveal>
            <Link
              href="/matrix/"
              className="panel clip-corner group flex h-full flex-col justify-between p-8 transition-all duration-400 hover:-translate-y-1.5 hover:border-red-deep/70 hover:box-glow"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] tracking-[0.2em] text-red-blood/80">
                    ATT&amp;CK COVERAGE BOARD
                  </span>
                  <span className="font-mono text-[11px] text-ink-faint">/matrix</span>
                </div>

                <p className="mt-6 font-mono text-5xl font-bold text-ink text-glow">
                  {coverage.both}
                  <span className="text-ink-faint">/{coverage.emulated}</span>
                </p>
                <p className="mt-2 font-mono text-[12px] uppercase tracking-wider text-ink-faint">
                  emulated techniques with a published detection
                </p>

                {/* coverage bar */}
                <div className="mt-6 flex h-2 w-full overflow-hidden bg-line">
                  <div
                    className="h-full bg-signal"
                    style={{ width: `${(coverage.both / coverage.total) * 100}%` }}
                  />
                  <div
                    className="h-full bg-red-blood"
                    style={{
                      width: `${((coverage.emulated - coverage.both) / coverage.total) * 100}%`,
                    }}
                  />
                  <div
                    className="h-full bg-warn"
                    style={{
                      width: `${((coverage.detected - coverage.both) / coverage.total) * 100}%`,
                    }}
                  />
                </div>

                <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                  {[
                    ['bg-signal', 'closed loop'],
                    ['bg-red-blood', 'open gap'],
                    ['bg-warn', 'rule only'],
                    ['bg-line', 'untracked'],
                  ].map(([dot, label]) => (
                    <li
                      key={label}
                      className="flex items-center gap-2 font-mono text-[11px] text-ink-faint"
                    >
                      <span className={`h-2 w-2 ${dot}`} />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>

              <span className="mt-8 inline-flex items-center gap-2 font-mono text-sm text-red-blood">
                open the board
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </span>
            </Link>
          </Reveal>

          <Reveal delay={90}>
            <Link
              href="/detections/"
              className="panel clip-corner group flex h-full flex-col justify-between p-8 transition-all duration-400 hover:-translate-y-1.5 hover:border-red-deep/70 hover:box-glow"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] tracking-[0.2em] text-red-blood/80">
                    DETECTION LIBRARY
                  </span>
                  <span className="font-mono text-[11px] text-ink-faint">/detections</span>
                </div>

                <p className="mt-6 font-mono text-5xl font-bold text-ink text-glow">{ruleCount}</p>
                <p className="mt-2 font-mono text-[12px] uppercase tracking-wider text-ink-faint">
                  published rules
                </p>

                <p className="mt-6 text-sm leading-relaxed text-ink-dim">
                  Sigma sources with KQL translations, real tuning notes, and an honest
                  paragraph on where each rule breaks. Most of them link straight back to
                  the writeup that made them necessary.
                </p>
              </div>

              <span className="mt-8 inline-flex items-center gap-2 font-mono text-sm text-red-blood">
                read the rules
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ============================= CTA ============================= */}
      <section className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <Reveal>
          <div className="panel clip-corner scanlines relative overflow-hidden p-10 text-center sm:p-16">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background:
                  'radial-gradient(circle at 50% 0%, rgba(255,45,75,0.18), transparent 60%)',
              }}
            />
            <p className="relative font-mono text-sm text-red-blood/80">
              <span className="animate-blink">▌</span> connection_request --from you
            </p>
            <h2 className="relative mt-4 font-mono text-3xl font-bold tracking-tight text-ink sm:text-5xl">
              Let&apos;s run the <span className="text-red-blood text-glow">engagement</span>.
            </h2>
            <p className="relative mx-auto mt-5 max-w-xl text-ink-dim">
              Red team assessment, adversary emulation, detection review, or a talk for
              your team — open a channel and let&apos;s scope it.
            </p>
            <div className="relative mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/handshake/"
                className="clip-tab border border-red-deep bg-red-core px-7 py-3.5 font-mono text-sm font-medium text-void transition-all hover:shadow-[0_0_30px_-4px_rgba(255,45,75,0.8)]"
              >
                ./handshake --init
              </Link>
              <Link
                href="/connect/"
                className="border border-line px-7 py-3.5 font-mono text-sm text-ink-dim transition-all hover:border-red-deep/70 hover:text-red-blood"
              >
                find me elsewhere
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
