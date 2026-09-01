'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SearchResults from './SearchResults';
import {
  KIND_LABEL,
  QUERY_LIMIT,
  SEARCH_KINDS,
  countByKind,
  parseTerms,
  search,
  type SearchDoc,
  type SearchKind,
} from '@/lib/searchTypes';

type Filter = 'all' | SearchKind;

/**
 * The one search box on the site. Everything below runs against the pre-built
 * index handed down as props — no fetch, no backend, and identical ranking to
 * the hint shown on each section index.
 *
 * The query lives in the URL (?q=), which makes a result set linkable and lets
 * the section indexes, the terminal and the nav hand a query over instead of
 * making the visitor retype it. It is read from location rather than
 * useSearchParams because the site is a static export: reading it on mount
 * avoids forcing this whole page behind a Suspense bailout.
 *
 * As with the section filters, the corpus is first-party build-time metadata and
 * every match renders as a React text node, so there is no injection surface.
 */
export default function SearchExplorer({
  docs,
  suggestions,
}: {
  docs: SearchDoc[];
  suggestions: string[];
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Seed from ?q= on arrival, then take the caret without yanking the page down.
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get('q') ?? '';
    if (initial) setQuery(initial.slice(0, QUERY_LIMIT));
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  // Mirror the query back into the URL, debounced — browsers throttle
  // replaceState, and a keystroke-per-call would trip that limit while typing.
  useEffect(() => {
    const timer = setTimeout(() => {
      const url = new URL(window.location.href);
      const trimmed = query.trim();
      if (trimmed) url.searchParams.set('q', trimmed);
      else url.searchParams.delete('q');
      if (url.href !== window.location.href) window.history.replaceState(null, '', url);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const hits = useMemo(() => search(docs, query), [docs, query]);
  const counts = useMemo(() => countByKind(hits), [hits]);
  const terms = useMemo(() => parseTerms(query.trim()), [query]);

  const visible = useMemo(
    () => (filter === 'all' ? hits : hits.filter((hit) => hit.doc.kind === filter)),
    [hits, filter],
  );

  const apply = useCallback((term: string) => {
    setQuery(term);
    setFilter('all');
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const searching = query.trim().length > 0;

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'everything', count: hits.length },
    ...SEARCH_KINDS.map((kind) => ({
      key: kind as Filter,
      label: KIND_LABEL[kind].many,
      count: counts[kind],
    })),
  ];

  return (
    <div>
      {/* ------------------------------ input ------------------------------ */}
      <label className="panel clip-corner relative flex items-center gap-3 px-5 py-4">
        <span className="shrink-0 whitespace-nowrap font-mono text-sm text-red-blood" aria-hidden>
          $ grep -ri
        </span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value.slice(0, QUERY_LIMIT))}
          maxLength={QUERY_LIMIT}
          placeholder="kerberos, T1558.003, cobalt strike, adcs…"
          aria-label="Search writeups and detections"
          spellCheck={false}
          autoComplete="off"
          className="w-full border-0 bg-transparent font-mono text-base text-ink placeholder:text-ink-faint"
        />
        {searching ? (
          <button
            type="button"
            onClick={() => apply('')}
            className="shrink-0 font-mono text-[11px] text-ink-faint transition-colors hover:text-red-blood"
          >
            clear
          </button>
        ) : null}
      </label>

      {/* ------------------------------ tabs ------------------------------- */}
      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Filter results by type">
        {tabs.map((tab) => {
          const active = tab.key === filter;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(tab.key)}
              disabled={tab.count === 0 && tab.key !== 'all'}
              className={`border px-3.5 py-1.5 font-mono text-[12px] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
                active
                  ? 'border-red-deep bg-red-ash/25 text-red-blood'
                  : 'border-line text-ink-faint hover:border-red-deep/50 hover:text-ink-dim'
              }`}
            >
              {tab.label}
              <span className="ml-2 text-ink-faint">{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* --------------------------- suggestions --------------------------- */}
      {suggestions.length > 0 ? (
        <div className="mt-5 flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className="text-ink-faint">
            <span className="text-red-blood/70"># </span>
            {searching ? 'try also' : 'terms that hit more than one shelf'}
          </span>
          {suggestions.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => apply(term)}
              className="border border-line px-2 py-0.5 text-ink-dim transition-colors hover:border-red-deep/60 hover:text-red-blood"
            >
              {term}
            </button>
          ))}
        </div>
      ) : null}

      {/* ----------------------------- summary ----------------------------- */}
      <p className="mt-8 mb-6 font-mono text-[11px] text-ink-faint">
        <span className="text-red-blood/70"># </span>
        {visible.length} {visible.length === 1 ? 'result' : 'results'}
        {searching ? ` matching "${query.trim()}"` : ' across all content'}
        {filter === 'all' && hits.length > 0
          ? ` — ${SEARCH_KINDS.filter((kind) => counts[kind] > 0)
              .map((kind) => `${counts[kind]} ${counts[kind] === 1 ? KIND_LABEL[kind].one : KIND_LABEL[kind].many}`)
              .join(' · ')}`
          : ''}
        {filter !== 'all' ? ` in ${KIND_LABEL[filter].many}` : ''}
      </p>

      {/* ----------------------------- results ----------------------------- */}
      {visible.length > 0 ? (
        <SearchResults hits={visible} terms={terms} />
      ) : (
        <div className="panel clip-corner p-12 text-center">
          <p className="font-mono text-red-blood">grep: no matches</p>
          <p className="mt-2 font-mono text-sm text-ink-faint">
            {hits.length > 0
              ? `Nothing in ${KIND_LABEL[filter as SearchKind].many}, but ${hits.length} ${
                  hits.length === 1 ? 'result' : 'results'
                } elsewhere.`
              : 'Nothing matches that across writeups or detections.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setFilter('all');
              if (hits.length === 0) setQuery('');
              inputRef.current?.focus({ preventScroll: true });
            }}
            className="mt-5 border border-line px-4 py-2 font-mono text-[12px] text-ink-dim transition-colors hover:border-red-deep/60 hover:text-red-blood"
          >
            {hits.length > 0 ? 'search everything' : 'reset --all'}
          </button>
        </div>
      )}
    </div>
  );
}
