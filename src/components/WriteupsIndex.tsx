'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import CrossContentHint from './CrossContentHint';
import { formatDate } from '@/lib/format';
import { partitionByKind, search, type SearchDoc } from '@/lib/searchTypes';
import type { WriteupMeta } from '@/lib/writeups';

const CATEGORIES = ['All', 'CTF', 'Research', 'Detection', 'Tradecraft'] as const;

/**
 * Client-side filtering only. The list is a compile-time array of first-party
 * metadata; matching happens in memory and every match renders as a plain text
 * node, so there is no injection surface here.
 *
 * Scoped view of the site-wide search rather than a private substring filter:
 * this box ranks writeups with the shared matcher, so a query behaves exactly
 * as it would on /search, and `index` also carries the other shelves so the
 * hint below can report the rules and sheets the same query hits.
 */
export default function WriteupsIndex({
  writeups,
  index,
}: {
  writeups: WriteupMeta[];
  index: SearchDoc[];
}) {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All');
  const [query, setQuery] = useState('');

  const { own, elsewhere } = useMemo(() => partitionByKind(index, 'writeup'), [index]);

  const filtered = useMemo(() => {
    const bySlug = new Map(writeups.map((w) => [w.slug, w]));
    return search(own, query)
      .map((hit) => bySlug.get(hit.doc.slug))
      .filter((w): w is WriteupMeta => w !== undefined)
      .filter((w) => category === 'All' || w.category === category);
  }, [writeups, own, category, query]);

  return (
    <div>
      {/* controls */}
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
            placeholder="grep writeups…"
            aria-label="Search writeups"
            spellCheck={false}
            autoComplete="off"
            className="w-full border border-line bg-abyss/60 py-2 pl-6 pr-3 font-mono text-[13px] text-ink placeholder:text-ink-faint focus:border-red-deep/70"
          />
        </label>
      </div>

      <CrossContentHint query={query} docs={elsewhere} kind="writeup" />

      {/* result count */}
      <p className="mb-6 font-mono text-[11px] text-ink-faint">
        <span className="text-red-blood/70"># </span>
        {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
        {category !== 'All' ? ` in ${category}` : ''}
        {query ? ` matching "${query}"` : ''}
      </p>

      {/* grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((w) => (
            <Link
              key={w.slug}
              href={`/writeups/${w.slug}/`}
              className="panel clip-corner group flex h-full flex-col p-6 transition-all duration-400 hover:-translate-y-1.5 hover:border-red-deep/70 hover:box-glow"
            >
              <div className="mb-4 flex flex-wrap items-center gap-2 font-mono text-[10px]">
                <span className="border border-red-deep/40 bg-red-ash/20 px-2 py-0.5 text-red-blood">
                  {w.category}
                </span>
                <span className="text-ink-faint">{w.difficulty}</span>
                <span className="ml-auto text-ink-faint">{w.readingMinutes} min</span>
              </div>
              <h2 className="font-mono text-base font-semibold leading-snug text-ink transition-colors group-hover:text-red-blood">
                {w.title}
              </h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-dim line-clamp-3">
                {w.excerpt}
              </p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {w.tags.slice(0, 3).map((t) => (
                  <span key={t} className="font-mono text-[10px] text-ink-faint">
                    #{t}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-4 font-mono text-[11px] text-ink-faint">
                <span>{formatDate(w.date)}</span>
                <span className="text-red-blood transition-transform duration-300 group-hover:translate-x-1">
                  read →
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="panel clip-corner p-12 text-center">
          <p className="font-mono text-red-blood">grep: no matches</p>
          <p className="mt-2 font-mono text-sm text-ink-faint">
            No writeups match that filter. Try a broader term.
          </p>
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
