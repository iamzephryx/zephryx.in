'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  KIND_LABEL,
  countByKind,
  describeCounts,
  search,
  type SearchDoc,
  type SearchKind,
} from '@/lib/searchTypes';

/**
 * The bridge out of a section's own filter box.
 *
 * Each index page still filters its own shelf — that is what you want when you
 * are already on it — but the same query is run here against everything *else*
 * using the shared matcher, so a visitor grepping "kerberos" in writeups is told
 * that two detection rules match it too, and can carry the query straight over
 * to /search without retyping it.
 *
 * `docs` must exclude the host page's own kind; the page passes
 * getSearchIndexExcluding(kind).
 */
export default function CrossContentHint({
  query,
  docs,
  kind,
}: {
  query: string;
  docs: SearchDoc[];
  kind: SearchKind;
}) {
  const trimmed = query.trim();

  const hits = useMemo(() => (trimmed ? search(docs, trimmed) : []), [docs, trimmed]);
  const elsewhere = useMemo(() => describeCounts(countByKind(hits)), [hits]);

  const href = trimmed ? `/search/?q=${encodeURIComponent(trimmed)}` : '/search/';
  const here = KIND_LABEL[kind].many;

  const matched = hits.length > 0;

  return (
    <div
      className={`mb-6 flex flex-col gap-2 border-l-2 px-4 py-3 font-mono text-[11px] sm:flex-row sm:items-center sm:justify-between ${
        matched ? 'border-red-deep bg-red-ash/15' : 'border-line bg-abyss/40'
      }`}
    >
      <p className={matched ? 'text-ink-dim' : 'text-ink-faint'}>
        <span className="text-red-blood/70"># </span>
        {matched ? (
          <>
            &ldquo;{trimmed}&rdquo; also matches{' '}
            <span className="text-ink">{elsewhere.join(' · ')}</span> outside {here}
          </>
        ) : trimmed ? (
          <>nothing outside {here} matches &ldquo;{trimmed}&rdquo;</>
        ) : (
          <>this box searches {here} only</>
        )}
      </p>

      <Link
        href={href}
        className="group shrink-0 text-ink-dim transition-colors hover:text-red-blood"
      >
        search everything
        <span className="ml-1.5 inline-block transition-transform duration-300 group-hover:translate-x-1">
          →
        </span>
      </Link>
    </div>
  );
}
