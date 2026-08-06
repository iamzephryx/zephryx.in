import type { Metadata } from 'next';
import Reveal from '@/components/Reveal';
import WriteupsIndex from '@/components/WriteupsIndex';
import { getAllWriteups } from '@/lib/writeups';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'writeups',
  description:
    'Security research, CTF writeups and detection engineering notes from Zephryx — offensive tradecraft and the detections that answer it.',
  alternates: { canonical: `${SITE.url}/writeups/` },
};

export default function WriteupsPage() {
  const writeups = getAllWriteups();

  return (
    <>
      <section className="relative overflow-hidden px-5 pt-32 pb-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="mb-5 font-mono text-sm text-ink-dim">
              <span className="text-red-blood">$</span> ls -la /var/log/research/
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="font-mono text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              <span className="text-red-blood text-glow">writeups</span>
              <span className="text-ink-faint"> // field notes</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-dim">
              Notes from both sides of the wire. Attack chains, CTF takedowns and the detection
              engineering that turns each finding into coverage. No filler, no fluff — just the path
              and the proof.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <Reveal>
          <WriteupsIndex writeups={writeups} />
        </Reveal>
      </section>
    </>
  );
}
