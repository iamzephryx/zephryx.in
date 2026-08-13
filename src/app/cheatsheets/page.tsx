import type { Metadata } from 'next';
import Reveal from '@/components/Reveal';
import CheatsheetsIndex from '@/components/CheatsheetsIndex';
import { getAllCheatsheets } from '@/lib/cheatsheets';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'cheatsheets',
  description:
    'Quick-reference notes and PDF cheatsheets — commands, syntax and one-liners I keep going back to, instead of re-Googling them mid-engagement.',
  alternates: { canonical: `${SITE.url}/cheatsheets/` },
};

export default function CheatsheetsPage() {
  const cheatsheets = getAllCheatsheets();

  return (
    <>
      <section className="relative overflow-hidden px-5 pt-32 pb-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="mb-5 font-mono text-sm text-ink-dim">
              <span className="text-red-blood">$</span> find /notes -name '*.pdf'
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="font-mono text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              <span className="text-red-blood text-glow">cheatsheets</span>
              <span className="text-ink-faint"> // quick reference</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-dim">
              The stuff I don't want to re-derive mid-engagement — command syntax, enumeration
              one-liners, checklists. Plain PDFs, no login, no tracker. Click a card to open it.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <Reveal>
          <CheatsheetsIndex cheatsheets={cheatsheets} />
        </Reveal>
      </section>
    </>
  );
}
