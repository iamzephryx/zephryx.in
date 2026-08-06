import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import SectionHeading from '@/components/SectionHeading';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'whoami',
  description:
    'Zephryx — 23-year-old offensive security specialist. SOC analyst and threat hunter by day, red team operator the rest of the time. Origin story, focus areas, capability matrix and rules of engagement.',
  alternates: { canonical: `${SITE.url}/whoami/` },
};

/* -------------------------------------------------------------- */

const TIMELINE = [
  {
    year: '8th std',
    title: 'The first foothold',
    body: 'A school lab machine, a guessed shared password, and a long night reading about what I had just done. Curiosity became the first exploit.',
  },
  {
    year: 'Teens',
    title: 'CTFs & home lab',
    body: 'Wargames, boot2root VMs and a rack of second-hand hardware. Learned to enumerate before I learned to sleep. Rooted my way through hundreds of boxes.',
  },
  {
    year: 'Now',
    title: 'SOC by day',
    body: 'Threat hunting and detection engineering inside a live SOC. Watching real adversaries taught me what actually trips a sensor — and what quietly does not.',
  },
  {
    year: 'Always',
    title: 'Red team the rest',
    body: 'Adversary emulation, initial access development and Active Directory attack paths. Every finding becomes a detection. The loop never closes for long.',
  },
];

const FOCUS = [
  {
    tag: 'ATK',
    title: 'Adversary Emulation',
    body: 'Replaying real threat-actor TTPs end to end — initial access to objective, mapped to MITRE ATT&CK. C2 infrastructure, OPSEC and payload development.',
  },
  {
    tag: 'AD',
    title: 'Active Directory',
    body: 'Kerberos abuse, ACL attack paths, delegation flaws and certificate services (ESC1–8). Identity is the perimeter; I live in the graph.',
  },
  {
    tag: 'ACC',
    title: 'Initial Access',
    body: 'Phishing pretext design, payload development and AV/EDR evasion. The quietest way in is rarely the loudest exploit.',
  },
  {
    tag: 'DEF',
    title: 'Detection Engineering',
    body: 'Sigma rules, KQL hunts and ATT&CK-mapped coverage. Offence that never becomes a detection is just a party trick.',
  },
];

const SKILLS: ReadonlyArray<[string, string, number]> = [
  ['Adversary Emulation', 'C2 infra · OPSEC · TTP replay', 92],
  ['Threat Hunting', 'Hypothesis-driven · Sigma · KQL', 94],
  ['Active Directory', 'Kerberos · ACLs · delegation · ADCS', 90],
  ['Initial Access', 'Phishing · payload dev · EDR evasion', 88],
  ['Web / API Exploitation', 'Authz flaws · SSRF · deserialisation', 89],
  ['Detection Engineering', 'ATT&CK mapping · rule tuning', 86],
  ['Cloud Attack Paths', 'Identity pivots · metadata · misconfig', 82],
  ['Malware Analysis', 'Static triage · sandboxing · unpacking', 78],
];

const STACK: ReadonlyArray<[string, string]> = [
  ['C2 / Post-Ex', 'Cobalt Strike · Sliver · Mythic · Havoc'],
  ['Recon', 'Amass · nuclei · httpx · BloodHound · Kerbrute'],
  ['Exploitation', 'Burp Suite Pro · Metasploit · impacket · ffuf'],
  ['Defence', 'Splunk · Elastic · Sentinel · Velociraptor · Zeek'],
  ['Rules & Intel', 'Sigma · YARA · Suricata · MISP · ATT&CK Navigator'],
  ['Code', 'Python · Go · PowerShell · C# · Rust · Bash'],
];

const ROE = [
  'Scope is sacred. Out of scope is out of bounds.',
  'Authorisation in writing, or it does not happen.',
  'Prove impact, never cause it.',
  'Data touched is data reported, minimised and destroyed.',
  'The report is the deliverable. The shell is just evidence.',
];

export default function WhoamiPage() {
  return (
    <>
      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden px-5 pt-32 pb-16 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="mb-5 font-mono text-sm text-ink-dim">
              <span className="text-red-blood">$</span> cat /etc/operator/identity
            </p>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="font-mono text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              <span className="text-red-blood text-glow">whoami</span>
              <span className="text-ink-faint"> — the human behind the shell</span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <div className="mt-8 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
              {/* id card */}
              <div className="panel clip-corner w-full max-w-xs p-5 font-mono text-[12.5px] leading-relaxed sm:w-64">
                <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
                  <span className="text-ink-faint">// id_card</span>
                  <span className="flex h-2 w-2">
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
                  </span>
                </div>
                <dl className="space-y-2">
                  {[
                    ['handle', SITE.name],
                    ['role', 'Red Team Operator'],
                    ['day_job', 'SOC / Threat Hunter'],
                    ['age', '23'],
                    ['since', '8th standard'],
                    ['based', 'India · remote'],
                    ['posture', 'assume breach'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="text-ink-faint">{k}</dt>
                      <dd className="text-right text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* narrative */}
              <div className="space-y-5 text-lg leading-relaxed text-ink-dim">
                <p>
                  I&apos;m {SITE.name} — a 23-year-old offensive security specialist. I started
                  breaking things in 8th standard, and I never really stopped. What began as
                  curiosity turned into a discipline: understand a system deeply enough, and its
                  weaknesses stop being secrets.
                </p>
                <p>
                  By day I work the <span className="text-ink">SOC as a threat hunter</span> —
                  hypothesis-driven hunts, detection engineering and chasing the faint signal of an
                  adversary already inside. The rest of the time I think like that adversary:{' '}
                  <span className="text-red-blood">red team is not the hobby, it&apos;s the lens</span>.
                </p>
                <p>
                  I emulate the attacks that matter, prove the impact without causing it, and hand
                  back the detection that would have caught me. Offence and defence aren&apos;t two
                  jobs — they&apos;re one loop.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ========================== TIMELINE ========================== */}
      <section className="relative mx-auto max-w-5xl px-5 py-20 sm:px-8">
        <Reveal>
          <SectionHeading
            index="01 / ORIGIN"
            title="how it happened"
            sub="No shortcut, no bootcamp. Just years of enumeration, failure and the occasional root shell at 4am."
          />
        </Reveal>

        <div className="relative border-l border-line pl-8 sm:pl-10">
          {TIMELINE.map((t, i) => (
            <Reveal key={t.title} delay={i * 90}>
              <div className="relative pb-10 last:pb-0">
                <span className="absolute -left-[41px] flex h-4 w-4 items-center justify-center sm:-left-[49px]">
                  <span className="absolute inline-flex h-4 w-4 rounded-full bg-red-blood/20" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-blood" />
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-red-blood/80">
                  {t.year}
                </span>
                <h3 className="mt-1 font-mono text-lg font-semibold text-ink">{t.title}</h3>
                <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-dim">{t.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* =========================== FOCUS =========================== */}
      <section className="relative mx-auto max-w-5xl px-5 py-20 sm:px-8">
        <Reveal>
          <SectionHeading
            index="02 / FOCUS"
            title="where I operate"
            sub="Four surfaces I keep sharp. Everything else bends toward them."
          />
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2">
          {FOCUS.map((f, i) => (
            <Reveal key={f.title} delay={i * 80}>
              <article className="panel clip-corner group h-full p-6 transition-all duration-400 hover:-translate-y-1.5 hover:border-red-deep/70 hover:box-glow">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center border border-red-deep/50 bg-red-ash/20 font-mono text-xs font-bold tracking-wider text-red-blood">
                    {f.tag}
                  </span>
                  <h3 className="font-mono text-lg font-semibold text-ink">{f.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-ink-dim">{f.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ========================= SKILL MATRIX ========================= */}
      <section className="relative mx-auto max-w-5xl px-5 py-20 sm:px-8">
        <Reveal>
          <SectionHeading index="03 / CAPABILITY" title="skill matrix" />
        </Reveal>

        <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
          {SKILLS.map(([label, detail, level], i) => (
            <Reveal key={label} delay={i * 50}>
              <div>
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-sm text-ink">{label}</span>
                  <span className="text-[12px] text-red-blood">{level}%</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden bg-line">
                  <div
                    className="h-full bg-gradient-to-r from-red-deep to-red-blood"
                    style={{ width: `${level}%` }}
                  />
                </div>
                <p className="mt-1.5 font-mono text-[11px] text-ink-faint">{detail}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* =========================== STACK =========================== */}
      <section className="relative mx-auto max-w-5xl px-5 py-20 sm:px-8">
        <Reveal>
          <SectionHeading index="04 / TOOLING" title="operating stack" />
        </Reveal>

        <div className="grid gap-px border border-line bg-line sm:grid-cols-2">
          {STACK.map(([k, v]) => (
            <div key={k} className="bg-abyss/80 p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-red-blood/80">{k}</p>
              <p className="mt-2 font-mono text-sm text-ink-dim">{v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================ ROE ============================ */}
      <section className="relative mx-auto max-w-5xl px-5 py-20 sm:px-8">
        <Reveal>
          <SectionHeading
            index="05 / ETHICS"
            title="rules of engagement"
            sub="Offensive work without discipline is just crime with extra steps. These are non-negotiable."
          />
        </Reveal>

        <ol className="space-y-3">
          {ROE.map((rule, i) => (
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
      </section>

      {/* ============================ CTA ============================ */}
      <section className="relative mx-auto max-w-5xl px-5 py-20 sm:px-8">
        <Reveal>
          <div className="panel clip-corner flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-mono text-xl font-semibold text-ink">Read the research →</h2>
              <p className="mt-2 text-sm text-ink-dim">
                Field notes from both sides of the wire, or open a channel to scope an engagement.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/writeups/"
                className="clip-tab border border-red-deep bg-red-core px-6 py-3 font-mono text-sm text-void transition-all hover:shadow-[0_0_30px_-4px_rgba(255,45,75,0.8)]"
              >
                ./writeups
              </Link>
              <Link
                href="/handshake/"
                className="border border-line px-6 py-3 font-mono text-sm text-ink-dim transition-all hover:border-red-deep/70 hover:text-red-blood"
              >
                ./handshake
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
