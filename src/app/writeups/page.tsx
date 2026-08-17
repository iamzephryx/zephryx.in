import type { Metadata } from 'next';
import Reveal from '@/components/Reveal';
import WriteupsIndex from '@/components/WriteupsIndex';
import { getAllWriteups } from '@/lib/writeups';
import { getSearchIndex } from '@/lib/search';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'writeups',
  description:
    "CTF boxes, real engagements written up with the boring parts still in, and whatever detection work came out of them afterward.",
  alternates: { canonical: `${SITE.url}/writeups/` },
};

export default function WriteupsPage() {
  const writeups = getAllWriteups();
  const index = getSearchIndex();

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
              These are the writeups I actually bothered to finish — attack chains, CTF boxes,
              the odd bug bounty. I try to include the dead ends too, not just the clean version
              that makes it look like I knew where I was going the whole time.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <Reveal>
          <WriteupsIndex writeups={writeups} index={index} />
        </Reveal>
      </section>
    </>
  );
}
