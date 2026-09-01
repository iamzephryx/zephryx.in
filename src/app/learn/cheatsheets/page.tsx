import type { Metadata } from 'next';
import { getZone } from '@/lib/site';
import { buildMetadata } from '@/lib/metadata';
import CheatsheetsIndex from '@/components/CheatsheetsIndex';
import { getAllCheatsheets } from '@/lib/cheatsheets';

export const metadata: Metadata = buildMetadata({
  title: 'Cheatsheets',
  description:
    'Free quick-reference PDF cheatsheets — commands, syntax and one-liners for Active Directory, web app testing, network recon and more. No login, no paywall.',
  path: '/learn/cheatsheets/',
  zone: getZone('learn'),
});

export default function CheatsheetsPage() {
  const cheatsheets = getAllCheatsheets();

  return (
    <>
      <div className="mx-auto max-w-6xl px-5 pt-32 pb-10 sm:px-8">
        <p className="font-mono text-[11px] tracking-[0.3em] text-red-blood/70">FREE RESOURCES</p>
        <h1 className="mt-3 font-mono text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Cheatsheets
        </h1>
        <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-ink-dim">
          Quick-reference PDFs — command syntax, enumeration one-liners, checklists. Free, no
          login, no tracker. Click a card to open it. The tracks above build on these; the
          cheatsheets themselves cost nothing and always will.
        </p>
      </div>

      <div className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <CheatsheetsIndex cheatsheets={cheatsheets} />
      </div>
    </>
  );
}
