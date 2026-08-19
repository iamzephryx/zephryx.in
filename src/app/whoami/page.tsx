import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import SectionHeading from '@/components/SectionHeading';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'whoami',
  description:
    "A bit about me — how I got into this, what I actually work on day to day, the tools I reach for, and the rules I don't break even when a client would let me.",
  alternates: { canonical: `${SITE.url}/whoami/` },
};

/* -------------------------------------------------------------- */

const TIMELINE = [
  {
    year: '8th std',
    title: 'The first foothold',
    body: "One of the lab computers at school had a shared login everyone knew, and I got curious about what else I could get into with it. Nothing clever — I just kept poking around and staying up too late reading about what I'd stumbled into.",
  },
  {
    year: 'Teens',
    title: 'CTFs & a home lab',
    body: "Spent most of my free time after that on wargames and boot2root VMs, running a small pile of second-hand hardware I'd cobbled together. Lost count of how many boxes I rooted somewhere in the low hundreds.",
  },
  {
    year: 'Now',
    title: 'SOC by day',
    body: "I do threat hunting and detection work on a live SOC. Watching what real intrusions actually look like — as opposed to what I assumed they'd look like — changed a lot about how I think.",
  },
  {
    year: 'Always',
    title: 'Pentesting the rest of the time',
    body: "Authorised tests, initial access, AD attack paths — this is the part I'd probably do for free if I didn't need the day job. I try to turn most of it into something I can also detect.",
  },
];

const FOCUS = [
  {
    tag: 'ATK',
    title: 'Adversary Emulation',
    body: "Replaying a real intrusion chain end to end in the lab — initial access through to the objective — and mapping it to ATT&CK afterward so it's usable, not just a war story.",
  },
  {
    tag: 'AD',
    title: 'Active Directory',
    body: "Kerberos abuse, ACLs nobody's looked at in years, delegation someone set up for a project that ended in 2021, ADCS templates with ESC1 through ESC8 sitting wide open. I spend a lot of time here.",
  },
  {
    tag: 'ACC',
    title: 'Initial Access',
    body: "Pretext design for phishing, payload dev, getting past AV/EDR. Honestly the quiet, boring path in usually beats whatever clever exploit I had planned.",
  },
  {
    tag: 'DEF',
    title: 'Detection Engineering',
    body: "Sigma, KQL hunts, mapping coverage back to ATT&CK. I got tired of handing over findings that nobody ever built a detection for, so now I try to write the rule myself.",
  },
];

const SKILLS: ReadonlyArray<[string, string, number]> = [
  ['Penetration Testing', 'Scoped engagements · exploitation · reporting', 92],
  ['Threat Hunting', 'Hypothesis-driven · Sigma · KQL', 94],
  ['Active Directory', 'Kerberos · ACLs · delegation · ADCS', 90],
  ['Initial Access', 'Phishing · payload dev · C2 · EDR evasion', 88],
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
  "I stay inside scope, full stop. If something interesting turns up outside it, it goes in the report as a recommendation, not something I actually touch.",
  "No written authorisation, no engagement. I don't care how much of a hurry anyone's in.",
  "I'll prove a finding is real, but I stop short of actually causing the damage it's capable of. Screenshots and a clear explanation do the job.",
  "Anything I access during an engagement gets reported, kept to the minimum I actually needed, and deleted afterward.",
  "The report is what the client's paying for. Getting a shell is just how I back up what I'm telling them.",
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
              {/* portrait + id card */}
              <div className="flex flex-col items-center gap-5 sm:items-start">
                <div className="panel clip-corner scanlines relative w-56 overflow-hidden sm:w-64">
                  <img
                    src="/whoami/operator.png"
                    alt={`Portrait of ${SITE.name}`}
                    width={1000}
                    height={1000}
                    className="block h-auto w-full"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-line bg-void/80 px-3 py-2 font-mono text-[10px] tracking-wider text-ink-faint backdrop-blur">
                    <span>operator.png</span>
                    <span className="text-signal">verified</span>
                  </div>
                </div>

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
                      ['day_job', 'SOC / Threat Hunter'],
                      ['off_hours', 'Offensive Research'],
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
              </div>

              {/* narrative */}
              <div className="space-y-5 text-lg leading-relaxed text-ink-dim">
                <p>
                  I&apos;m {SITE.name}, 23, and I do security for a living. It started
                  in 8th standard with a shared school-lab login and a lot of free time, and
                  somewhere along the way it turned from a thing I did after homework into
                  an actual career, which still feels a little unreal to say out loud.
                </p>
                <p>
                  My actual paycheck comes from{' '}
                  <span className="text-ink">threat hunting on a SOC</span> — chasing down
                  whatever faint signal suggests someone's already inside that shouldn't be.
                  Penetration testing is the part I do the rest of the time, and honestly
                  the part I'd probably keep doing even if it stopped paying.
                </p>
                <p>
                  I try not to just hand a client a PDF and disappear. If I find a way in, I want
                  to also leave behind something that catches the next person who tries it —
                  that's really the whole idea behind this site.
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
            sub="Nothing dramatic — no bootcamp, no single big break. Just a lot of years of failing at things until they worked."
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
            title="where I actually spend my time"
            sub="If you gave me a completely free week, this is probably still what I'd be doing."
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
            title="rules I actually stick to"
            sub="Without these, the offensive half of this is just a different word for the same crime. I don't bend on any of them."
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
              <h2 className="font-mono text-xl font-semibold text-ink">There's more if you want it →</h2>
              <p className="mt-2 text-sm text-ink-dim">
                The writeups go into a lot more detail than this page does, or just reach out if
                you want to talk about actually working together.
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
                Contact
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
