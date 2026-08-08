'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { CoverageState, CoverageSummary, TechniqueCoverage } from '@/lib/attack';

/**
 * Coverage semantics, deliberately chosen so the colours argue the site's
 * thesis rather than just decorating it:
 *
 *   closed  — emulated AND detected. The loop closed. This is the goal state.
 *   open    — emulated, no rule published yet. An honest gap, and the most
 *             useful cell on the board.
 *   guarded — a rule exists with no published offensive work behind it.
 *   none    — not covered. Shown on purpose; a matrix with no grey is a lie.
 */
const STATE_META: Record<
  CoverageState,
  { label: string; cell: string; dot: string; order: number }
> = {
  both: {
    label: 'closed loop',
    cell: 'border-signal/50 bg-signal/10 text-ink hover:border-signal',
    dot: 'bg-signal',
    order: 0,
  },
  emulated: {
    label: 'emulated · no rule yet',
    cell: 'border-red-deep/60 bg-red-ash/20 text-ink hover:border-red-blood',
    dot: 'bg-red-blood',
    order: 1,
  },
  detected: {
    label: 'detection only',
    cell: 'border-warn/40 bg-warn/10 text-ink hover:border-warn',
    dot: 'bg-warn',
    order: 2,
  },
  none: {
    label: 'not covered',
    cell: 'border-line bg-abyss/50 text-ink-faint hover:border-ink-faint/50',
    dot: 'bg-line',
    order: 3,
  },
};

const FILTERS = [
  { id: 'all', label: 'everything' },
  { id: 'covered', label: 'covered only' },
  { id: 'gaps', label: 'open gaps' },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];

export default function AttackMatrix({ coverage }: { coverage: CoverageSummary }) {
  const [selected, setSelected] = useState<TechniqueCoverage | null>(null);
  const [filter, setFilter] = useState<FilterId>('all');

  const columns = useMemo(() => {
    if (filter === 'all') return coverage.columns;
    return coverage.columns.map((col) => ({
      ...col,
      techniques: col.techniques.filter((t) =>
        filter === 'covered' ? t.state !== 'none' : t.state === 'emulated' || t.state === 'none',
      ),
    }));
  }, [coverage.columns, filter]);

  return (
    <div>
      {/* legend + filter */}
      <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {(Object.keys(STATE_META) as CoverageState[])
            .sort((a, b) => STATE_META[a].order - STATE_META[b].order)
            .map((state) => (
              <li key={state} className="flex items-center gap-2 font-mono text-[11px] text-ink-dim">
                <span className={`h-2.5 w-2.5 ${STATE_META[state].dot}`} />
                {STATE_META[state].label}
              </li>
            ))}
        </ul>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter coverage">
          {FILTERS.map((f) => {
            const active = f.id === filter;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.id)}
                className={`border px-3 py-1.5 font-mono text-[12px] transition-all duration-200 ${
                  active
                    ? 'border-red-deep bg-red-ash/25 text-red-blood'
                    : 'border-line text-ink-faint hover:border-red-deep/50 hover:text-ink-dim'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* the board — scrolls horizontally, never the page */}
      <div className="-mx-5 overflow-x-auto px-5 pb-3 sm:-mx-8 sm:px-8">
        <div className="flex min-w-max gap-px bg-line">
          {columns.map((col) => (
            <div key={col.id} className="flex w-[172px] shrink-0 flex-col bg-void">
              <div className="border-b border-line bg-abyss/80 px-2.5 py-3">
                <p className="font-mono text-[11px] font-semibold leading-tight text-ink">
                  {col.short}
                </p>
                <p className="mt-1 font-mono text-[9px] tracking-wider text-ink-faint">{col.id}</p>
              </div>

              <div className="flex flex-1 flex-col gap-px p-px">
                {col.techniques.map((t) => {
                  const meta = STATE_META[t.state];
                  const isSelected = selected?.id === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelected(isSelected ? null : t)}
                      aria-pressed={isSelected}
                      title={`${t.id} — ${t.name} (${meta.label})`}
                      className={`group flex min-h-[62px] flex-col justify-between border px-2 py-2 text-left transition-all duration-200 ${meta.cell} ${
                        isSelected ? 'ring-1 ring-red-blood ring-offset-1 ring-offset-void' : ''
                      }`}
                    >
                      <span className="font-mono text-[10.5px] leading-tight line-clamp-2">
                        {t.name}
                      </span>
                      <span className="mt-1.5 flex items-center justify-between font-mono text-[9px] text-ink-faint">
                        {t.id}
                        <span className={`h-1.5 w-1.5 ${meta.dot}`} />
                      </span>
                    </button>
                  );
                })}

                {col.techniques.length === 0 ? (
                  <p className="px-2 py-4 font-mono text-[10px] text-ink-faint">—</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 font-mono text-[11px] text-ink-faint lg:hidden">
        <span className="text-red-blood/70">↔ </span>
        scroll the board sideways · tap a technique for detail
      </p>

      {/* detail drawer */}
      <div className="mt-8">
        {selected ? (
          <div className="panel clip-corner p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] tracking-[0.2em] text-red-blood/80">
                  {selected.id}
                </p>
                <h3 className="mt-2 font-mono text-xl font-semibold text-ink">{selected.name}</h3>
                <p className="mt-2 flex items-center gap-2 font-mono text-[12px] text-ink-dim">
                  <span className={`h-2 w-2 ${STATE_META[selected.state].dot}`} />
                  {STATE_META[selected.state].label}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="border border-line px-3 py-1.5 font-mono text-[11px] text-ink-faint transition-colors hover:border-red-deep/60 hover:text-red-blood"
              >
                close
              </button>
            </div>

            <div className="mt-7 grid gap-7 sm:grid-cols-2">
              <div>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                  emulation
                </p>
                {selected.writeups.length ? (
                  <ul className="space-y-2">
                    {selected.writeups.map((w) => (
                      <li key={w.slug}>
                        <Link
                          href={`/writeups/${w.slug}/`}
                          className="group flex items-start gap-2 font-mono text-[13px] text-ink-dim transition-colors hover:text-red-blood"
                        >
                          <span className="text-red-blood">▸</span>
                          <span className="group-hover:underline">{w.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-mono text-[13px] text-ink-faint">
                    No published writeup for this technique.
                  </p>
                )}
              </div>

              <div>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                  detection
                </p>
                {selected.detections.length ? (
                  <ul className="space-y-2">
                    {selected.detections.map((d) => (
                      <li key={d.slug}>
                        <Link
                          href={`/detections/${d.slug}/`}
                          className="group flex items-start gap-2 font-mono text-[13px] text-ink-dim transition-colors hover:text-signal"
                        >
                          <span className="text-signal">▸</span>
                          <span className="group-hover:underline">
                            {d.ruleId} · {d.title}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-mono text-[13px] text-ink-faint">
                    No rule published yet. This is a gap, not an omission.
                  </p>
                )}
              </div>
            </div>

            <a
              href={`https://attack.mitre.org/techniques/${selected.id.replace('.', '/')}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2 border border-line px-4 py-2 font-mono text-[12px] text-ink-dim transition-all hover:border-red-deep/70 hover:text-red-blood"
            >
              attack.mitre.org/{selected.id} <span>↗</span>
            </a>
          </div>
        ) : (
          <div className="border border-dashed border-line p-6 text-center sm:p-8">
            <p className="font-mono text-[13px] text-ink-faint">
              <span className="text-red-blood/70">$ </span>
              select a technique to see the emulation and the rule that answers it
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
