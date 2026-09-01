import type { Metadata } from 'next';
import { getZone } from '@/lib/site';
import { buildMetadata } from '@/lib/metadata';
import GlossaryIndex from '@/components/GlossaryIndex';
import { GLOSSARY } from '@/lib/glossary';

export const metadata: Metadata = buildMetadata({
  title: 'Glossary',
  description:
    'Plain-language definitions for offensive security and Active Directory terms — Kerberoasting, ACLs, ADCS, Sigma, and more. Free reference, no login.',
  path: '/learn/glossary/',
  zone: getZone('learn'),
});

export default function GlossaryPage() {
  return (
    <>
      <div className="mx-auto max-w-6xl px-5 pt-32 pb-10 sm:px-8">
        <p className="font-mono text-[11px] tracking-[0.3em] text-red-blood/70">FREE RESOURCES</p>
        <h1 className="mt-3 font-mono text-4xl font-bold tracking-tight text-ink sm:text-5xl">Glossary</h1>
        <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-ink-dim">
          Terms explained in plain language, not textbook definitions copied from somewhere else.
          If a cheatsheet or a learning path uses a word you don&apos;t recognise, it&apos;s probably
          here.
        </p>
      </div>

      <div className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <GlossaryIndex terms={GLOSSARY} />
      </div>
    </>
  );
}
