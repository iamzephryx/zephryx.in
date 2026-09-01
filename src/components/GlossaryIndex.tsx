'use client';

import { useMemo, useState } from 'react';
import { GLOSSARY_CATEGORIES, type GlossaryTerm } from '@/lib/glossary';

const CATEGORIES = ['All', ...GLOSSARY_CATEGORIES] as const;

/**
 * Client-side filtering only, same shape as CheatsheetsIndex — the list is a
 * compile-time array of first-party data, matching happens in memory, and
 * every match renders as a plain text node.
 */
export default function GlossaryIndex({ terms }: { terms: GlossaryTerm[] }) {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return terms
      .filter((t) => {
        if (category !== 'All' && t.category !== category) return false;
        if (!q) return true;
        return t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q);
      })
      .sort((a, b) => a.term.localeCompare(b.term));
  }, [terms, category, query]);

  return (
    <div>
      <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by category">
          {CATEGORIES.map((c) => {
            const active = c === category;
            return (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCategory(c)}
                className={`border px-3.5 py-1.5 font-mono text-[12px] transition-all duration-200 ${
                  active
                    ? 'border-red-deep bg-red-ash/25 text-red-blood'
                    : 'border-line text-ink-faint hover:border-red-deep/50 hover:text-ink-dim'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        <label className="relative flex w-full max-w-xs items-center md:w-64">
          <span className="pointer-events-none absolute left-3 font-mono text-[13px] text-red-blood/70">
            /
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value.slice(0, 64))}
            maxLength={64}
            placeholder="search terms…"
            aria-label="Search glossary"
            spellCheck={false}
            autoComplete="off"
            className="w-full border border-line bg-void/60 py-2 pl-6 pr-3 font-mono text-[13px] text-ink placeholder:text-ink-faint focus:border-red-deep/70 focus:outline-none"
          />
        </label>
      </div>

      <p className="mb-6 font-mono text-[11px] text-ink-faint">
        <span className="text-red-blood/70"># </span>
        {filtered.length} {filtered.length === 1 ? 'term' : 'terms'}
        {category !== 'All' ? ` in ${category}` : ''}
        {query ? ` matching "${query}"` : ''}
      </p>

      {filtered.length > 0 ? (
        <dl className="space-y-px border border-line bg-line">
          {filtered.map((t) => (
            <div key={t.term} className="bg-surface p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <dt className="font-mono text-base font-semibold text-ink">{t.term}</dt>
                <span className="border border-line bg-void/60 px-2.5 py-1 font-mono text-[10px] text-ink-faint">
                  {t.category}
                </span>
              </div>
              <dd className="mt-2.5 max-w-3xl text-sm leading-relaxed text-ink-dim">{t.definition}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="panel clip-corner p-12 text-center">
          <p className="font-mono text-red-blood">no matches</p>
          <p className="mt-2 font-mono text-sm text-ink-faint">No terms match that filter. Try a broader search.</p>
          <button
            type="button"
            onClick={() => {
              setCategory('All');
              setQuery('');
            }}
            className="mt-5 border border-line px-4 py-2 font-mono text-[12px] text-ink-dim transition-colors hover:border-red-deep/60 hover:text-red-blood"
          >
            reset --all
          </button>
        </div>
      )}
    </div>
  );
}
