'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/format';
import type { DetectionMeta } from '@/lib/detections';
import { SEVERITY_STYLE } from '@/lib/severity';

const FILTERS = ['All', 'critical', 'high', 'medium'] as const;

/**
 * Client-side filtering only. The list is a compile-time array of first-party
 * metadata; the search box compares against it in memory and renders plain text
 * nodes, so there is no injection surface here.
 */
export default function DetectionsIndex({ detections }: { detections: DetectionMeta[] }) {
  const [severity, setSeverity] = useState<(typeof FILTERS)[number]>('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().slice(0, 64);
    return detections.filter((d) => {
      if (severity !== 'All' && d.severity !== severity) return false;
      if (!q) return true;
      const haystack =
        `${d.title} ${d.excerpt} ${d.ruleId} ${d.logsource} ${d.techniques.join(' ')} ${d.tags.join(' ')}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [detections, severity, query]);

  return (
    <div>
      {/* controls */}
      <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by severity">
          {FILTERS.map((f) => {
            const active = f === severity;
            return (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSeverity(f)}
                className={`border px-3.5 py-1.5 font-mono text-[12px] transition-all duration-200 ${
                  active
                    ? 'border-red-deep bg-red-ash/25 text-red-blood'
                    : 'border-line text-ink-faint hover:border-red-deep/50 hover:text-ink-dim'
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>

        <label className="relative flex w-full max-w-xs items-center md:w-72">
          <span className="pointer-events-none absolute left-3 font-mono text-[13px] text-red-blood/70">
            /
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value.slice(0, 64))}
            maxLength={64}
            placeholder="grep rules, T-ids, log sources…"
            aria-label="Search detection rules"
            spellCheck={false}
            autoComplete="off"
            className="w-full border border-line bg-abyss/60 py-2 pl-6 pr-3 font-mono text-[13px] text-ink placeholder:text-ink-faint focus:border-red-deep/70 focus:outline-none"
          />
        </label>
      </div>

      <p className="mb-6 font-mono text-[11px] text-ink-faint">
        <span className="text-red-blood/70"># </span>
        {filtered.length} {filtered.length === 1 ? 'rule' : 'rules'}
        {severity !== 'All' ? ` at ${severity}` : ''}
        {query ? ` matching "${query}"` : ''}
      </p>

      {filtered.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {filtered.map((d) => (
            <Link
              key={d.slug}
              href={`/detections/${d.slug}/`}
              className="panel clip-corner group flex h-full flex-col p-6 transition-all duration-400 hover:-translate-y-1.5 hover:border-red-deep/70 hover:box-glow"
            >
              <div className="mb-4 flex flex-wrap items-center gap-2 font-mono text-[10px]">
                <span className={`border px-2 py-0.5 uppercase ${SEVERITY_STYLE[d.severity]}`}>
                  {d.severity}
                </span>
                <span className="border border-line px-2 py-0.5 text-ink-faint">{d.status}</span>
                <span className="ml-auto text-ink-faint">{d.ruleId}</span>
              </div>

              <h2 className="font-mono text-base font-semibold leading-snug text-ink transition-colors group-hover:text-red-blood">
                {d.title}
              </h2>

              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-dim line-clamp-3">
                {d.excerpt}
              </p>

              <div className="mt-5 flex flex-wrap gap-1.5">
                {d.techniques.map((t) => (
                  <span
                    key={t}
                    className="border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink-faint"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-line pt-4 font-mono text-[11px] text-ink-faint">
                <span className="truncate pr-3">{d.logsource}</span>
                <span className="shrink-0 text-red-blood transition-transform duration-300 group-hover:translate-x-1">
                  {formatDate(d.date)} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="panel clip-corner p-12 text-center">
          <p className="font-mono text-red-blood">grep: no matches</p>
          <p className="mt-2 font-mono text-sm text-ink-faint">
            No rules match that filter. Try a broader term.
          </p>
          <button
            type="button"
            onClick={() => {
              setSeverity('All');
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
