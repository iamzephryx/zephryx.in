import type { Metadata } from 'next';
import { getZone } from '@/lib/site';
import { buildMetadata } from '@/lib/metadata';
import Link from 'next/link';
import { getAllCheatsheets } from '@/lib/cheatsheets';
import RoadmapPath from '@/components/RoadmapPath';

export const metadata: Metadata = buildMetadata({
  title: 'Roadmap',
  description:
    'The order to actually learn offensive security in — foundations, recon, web, Active Directory, detection, then proving it. Free, self-paced, no login.',
  path: '/learn/roadmap/',
  zone: getZone('learn'),
});

type Stage = {
  n: string;
  title: string;
  summary: string;
  learn: string[];
  cheatsheetSlugs?: string[];
  practice?: string;
};

const STAGES: Stage[] = [
  {
    n: '00',
    title: 'Foundations',
    summary:
      "Before any of this is interesting, it has to stop being frustrating. Get comfortable enough in a Linux terminal that you're not fighting the shell while trying to think about the target.",
    learn: ['Filesystem navigation & permissions', 'Package management', 'Basic networking (IP, DNS, ports)', 'A text editor you don\'t hate'],
    cheatsheetSlugs: ['linux-100-beginners-cheatsheet'],
  },
  {
    n: '01',
    title: 'Recon & Enumeration',
    summary:
      'Every engagement starts here. What is actually running, on what port, with what version — and what that tells you about where to look next.',
    learn: ['Host discovery', 'Port & service scanning', 'Service/version fingerprinting', 'Reading scan output, not just running the scan'],
    cheatsheetSlugs: ['nmap-network-recon-quick-reference'],
  },
  {
    n: '02',
    title: 'Web Application Testing',
    summary:
      'The most common thing exposed to the internet, and the most common way in. Learn the methodology, then the tool, in that order — Burp finds what you already know to look for.',
    learn: ['Auth & session handling', 'Access control / IDOR', 'Injection classes', 'Intercepting & replaying requests'],
    cheatsheetSlugs: ['web-app-pentest-checklist', 'burp-suite-field-guide-quick-reference'],
  },
  {
    n: '03',
    title: 'Active Directory Attack Paths',
    summary:
      'Where most internal engagements are actually won. This is the deepest stage on purpose — Kerberos, ACLs and delegation reward the time you put in more than anything else here.',
    learn: ['Unauthenticated & authenticated AD enumeration', 'Kerberoasting & AS-REP Roasting', 'ACL & delegation abuse', 'Credential dumping & lateral movement'],
    cheatsheetSlugs: ['windows-active-directory-enumeration'],
  },
  {
    n: '04',
    title: 'Detection Engineering',
    summary:
      "The half almost nobody teaches. For everything above, ask what it would have left behind — then write the rule that catches it. An operator who can answer that is worth more than one who can't.",
    learn: ['Log sources per technique', 'Writing a Sigma rule', 'Mapping to MITRE ATT&CK', 'Tuning against false positives'],
  },
  {
    n: '05',
    title: 'Prove It',
    summary:
      "Knowledge that hasn't been tested against something that fights back isn't worth much yet. Run the full loop end to end, then write it up like it's for someone else to read.",
    learn: ['Guided, objective-based boxes', 'Chaining techniques instead of running them in isolation', 'Writing a report someone would act on'],
    practice:
      "For what a finished writeup looks like, read the real ones under /writeups/. Hosted, guided labs are still only planned — not live yet, so for now this stage means building the lab yourself and running the loop end to end.",
  },
];

export default function RoadmapPage() {
  const cheatsheets = getAllCheatsheets();
  const cheatsheetBySlug = new Map(cheatsheets.map((c) => [c.slug, c]));

  const stages = STAGES.map((s) => ({
    n: s.n,
    title: s.title,
    summary: s.summary,
    learn: s.learn,
    practice: s.practice,
    cheatsheets: (s.cheatsheetSlugs ?? []).map((slug) => {
      const c = cheatsheetBySlug.get(slug);
      if (!c) throw new Error(`Roadmap references unknown cheatsheet slug "${slug}"`);
      return { title: c.title, file: c.file };
    }),
  }));

  return (
    <div className="mx-auto max-w-6xl px-5 pt-32 pb-16 sm:px-8">
      <p className="font-mono text-[11px] tracking-[0.3em] text-red-blood/70">GUIDE</p>
      <h1 className="mt-3 font-mono text-4xl font-bold tracking-tight text-ink sm:text-5xl">Roadmap</h1>
      <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-ink-dim">
        The order I&apos;d actually learn this in, not a syllabus. Each stage names what to learn
        and the free resources here that cover it today. Skip ahead if you already have a stage;
        come back to it if a later one stops making sense.
      </p>

      <div className="mt-7 flex w-fit flex-wrap gap-x-6 gap-y-2 border border-line bg-abyss px-4 py-3 font-mono text-[11px] text-ink-faint">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-sm bg-signal" />
          free cheatsheet live for this stage
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-sm border border-ink-faint" />
          no free resource here yet
        </span>
      </div>

      <div className="mt-6">
        <RoadmapPath stages={stages} />
      </div>

      <section className="panel clip-corner mx-auto mt-8 max-w-xl p-7">
        <h2 className="font-mono text-lg font-semibold text-ink">Not sure what a term means?</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-dim">
          The glossary has plain-language definitions for anything above that reads as jargon —
          Kerberoasting, ACLs, Sigma, all of it.
        </p>
        <Link
          href="/learn/glossary/"
          className="clip-tab mt-6 inline-flex items-center gap-2 border border-red-deep bg-red-core px-6 py-3 font-mono text-sm font-medium text-void transition-all duration-300 hover:shadow-[0_0_30px_-4px_rgba(255,45,75,0.8)]"
        >
          Open the glossary
        </Link>
      </section>
    </div>
  );
}
