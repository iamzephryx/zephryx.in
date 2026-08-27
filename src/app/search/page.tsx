import type { Metadata } from 'next';
import Reveal from '@/components/Reveal';
import SearchExplorer from '@/components/SearchExplorer';
import { getCrossCuttingTerms, getIndexSummary, getSearchIndex } from '@/lib/search';
import { KIND_LABEL } from '@/lib/searchTypes';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'search',
  description:
    'One search across every writeup and detection rule on the site — the attack and the rule that catches it come back together.',
  alternates: { canonical: `${SITE.url}/search/` },
};

export default function SearchPage() {
  const docs = getSearchIndex();
  const suggestions = getCrossCuttingTerms();
  const summary = getIndexSummary();

  return (
    <>
      <section className="relative overflow-hidden px-5 pt-32 pb-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="mb-5 font-mono text-sm text-ink-dim">
              <span className="text-red-blood">$</span> grep -ri --include='*' /var/www/zephryx/
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="font-mono text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              <span className="text-red-blood text-glow">search</span>
              <span className="text-ink-faint"> // everything at once</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-dim">
              One box across{' '}
              {summary.map((entry, i) => (
                <span key={entry.kind}>
                  {i > 0 ? (i === summary.length - 1 ? ' and ' : ', ') : ''}
                  <span className="text-ink">
                    {entry.count} {entry.count === 1 ? KIND_LABEL[entry.kind].one : KIND_LABEL[entry.kind].many}
                  </span>
                </span>
              ))}
              . Search &ldquo;password spray&rdquo; once and you get the attack, the rule written to
              catch it and the reference sheet — instead of running the same query in three places
              and never noticing they were about the same thing.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <SearchExplorer docs={docs} suggestions={suggestions} />
      </section>
    </>
  );
}
