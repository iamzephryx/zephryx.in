'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { formatDate, formatBytes } from '@/lib/format';
import { CHEATSHEET_CATEGORIES, type Cheatsheet } from '@/lib/cheatsheetTypes';

const CATEGORIES = ['All', ...CHEATSHEET_CATEGORIES] as const;

/**
 * Client-side filtering only. The list is a compile-time array of first-party
 * metadata; the search box compares against it in memory and renders plain text
 * nodes, so there is no injection surface here. Each card links to its own
 * /cheatsheets/[slug]/ page (crawlable HTML, own metadata) — the raw PDF stays
 * one click away from there instead of being the primary indexed URL.
 */
export default function CheatsheetsIndex({ cheatsheets }: { cheatsheets: Cheatsheet[] }) {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().slice(0, 64);
    return cheatsheets.filter((c) => {
      if (category !== 'All' && c.category !== category) return false;
      if (!q) return true;
      const haystack = `${c.title} ${c.excerpt} ${c.tags.join(' ')}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [cheatsheets, category, query]);

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
            placeholder="grep cheatsheets…"
            aria-label="Search cheatsheets"
            spellCheck={false}
            autoComplete="off"
            className="w-full border border-line bg-abyss/60 py-2 pl-6 pr-3 font-mono text-[13px] text-ink placeholder:text-ink-faint focus:border-red-deep/70 focus:outline-none"
          />
        </label>
      </div>

      {/* result count */}
      <p className="mb-6 font-mono text-[11px] text-ink-faint">
        <span className="text-red-blood/70"># </span>
        {filtered.length} {filtered.length === 1 ? 'sheet' : 'sheets'}
        {category !== 'All' ? ` in ${category}` : ''}
        {query ? ` matching "${query}"` : ''}
      </p>

      {/* grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <div
              key={c.slug}
              className="panel clip-corner group flex h-full flex-col p-6 transition-all duration-400 hover:-translate-y-1.5 hover:border-red-deep/70 hover:box-glow"
            >
              <Link href={`/cheatsheets/${c.slug}/`} className="flex flex-1 flex-col">
                <div className="mb-4 flex flex-wrap items-center gap-2 font-mono text-[10px]">
                  <span className="border border-red-deep/40 bg-red-ash/20 px-2 py-0.5 text-red-blood">
                    {c.category}
                  </span>
                  <span className="ml-auto text-ink-faint">PDF · {formatBytes(c.sizeBytes)}</span>
                </div>
                <h2 className="font-mono text-base font-semibold leading-snug text-ink transition-colors group-hover:text-red-blood">
                  {c.title}
                </h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-dim line-clamp-3">
                  {c.excerpt}
                </p>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {c.tags.slice(0, 3).map((t) => (
                    <span key={t} className="font-mono text-[10px] text-ink-faint">
                      #{t}
                    </span>
                  ))}
                </div>
              </Link>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-4 font-mono text-[11px] text-ink-faint">
                <span>{formatDate(c.date)}</span>
                <a
                  href={`/cheatsheets/${c.file}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-blood transition-transform duration-300 hover:translate-x-1"
                >
                  open pdf →
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="panel clip-corner p-12 text-center">
          <p className="font-mono text-red-blood">grep: no matches</p>
          <p className="mt-2 font-mono text-sm text-ink-faint">
            No cheatsheets match that filter. Try a broader term.
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
