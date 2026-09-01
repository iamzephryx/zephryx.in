'use client';

import { useEffect, useMemo, useState } from 'react';
import type { TocEntry } from '@/lib/toc';

/** Distance from the viewport top at which a heading counts as "current". */
const ACTIVE_LINE = 120;

/**
 * Tracks which section the reader is in by measuring heading positions on
 * scroll. A rAF-gated scroll listener beats an IntersectionObserver here: the
 * observer's notion of "visible" gets ambiguous with several short sections on
 * screen at once, whereas the last heading above the line is unambiguous.
 */
function useActiveHeading(toc: TocEntry[]): string {
  const ids = useMemo(() => toc.map((t) => t.id), [toc]);
  const [active, setActive] = useState(ids[0] ?? '');

  useEffect(() => {
    if (!ids.length) return;
    let frame = 0;

    const compute = () => {
      frame = 0;
      let current = ids[0];

      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top > ACTIVE_LINE) break;
        current = id;
      }

      // At the very bottom the final heading may never cross the line — a short
      // last section would otherwise leave the previous entry highlighted.
      const doc = document.documentElement;
      if (window.scrollY + window.innerHeight >= doc.scrollHeight - 2) {
        current = ids[ids.length - 1];
      }

      setActive(current);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ids]);

  return active;
}

function TocLink({
  entry,
  active,
  onNavigate,
}: {
  entry: TocEntry;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <a
      href={`#${entry.id}`}
      onClick={onNavigate}
      aria-current={active ? 'location' : undefined}
      className={`-ml-px block border-l-2 py-1.5 font-mono text-[12px] leading-snug transition-colors duration-200 ${
        entry.depth === 3 ? 'pl-7' : 'pl-4'
      } ${
        active
          ? 'border-red-blood text-red-blood'
          : 'border-transparent text-ink-faint hover:border-red-deep/60 hover:text-ink-dim'
      }`}
    >
      {entry.text}
    </a>
  );
}

/**
 * In-page navigation for a long-form article — writeups and detection rules
 * alike. Renders two views from one scroll listener: a sticky rail in the right
 * margin on wide screens, and a collapsible panel in the flow everywhere else.
 * Returns a fragment so the rail lands as a direct child of the article's
 * positioned container and can stick for its full height.
 */
export default function ContentToc({ toc }: { toc: TocEntry[] }) {
  const active = useActiveHeading(toc);
  const [open, setOpen] = useState(false);

  if (toc.length < 2) return null;

  return (
    <>
      {/* wide screens: sticky rail parked in the right margin */}
      <aside
        aria-label="On this page"
        className="pointer-events-none absolute inset-y-0 left-full hidden w-56 pl-8 xl:block 2xl:w-64"
      >
        <div className="pointer-events-auto sticky top-28 max-h-[calc(100vh-9rem)] overflow-y-auto">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            <span className="text-red-blood">//</span> on this page
          </p>
          <nav className="mt-4 border-l border-line">
            {toc.map((entry) => (
              <TocLink key={entry.id} entry={entry} active={entry.id === active} />
            ))}
          </nav>
        </div>
      </aside>

      {/* narrow screens: collapsed by default so it never buries the intro */}
      <nav aria-label="On this page" className="panel clip-corner mt-8 xl:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-4 px-5 py-3.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint transition-colors hover:text-ink-dim"
        >
          <span>
            <span className="text-red-blood">//</span> on this page
            <span className="ml-2 normal-case tracking-normal text-ink-faint/70">
              {toc.length} sections
            </span>
          </span>
          <span aria-hidden="true" className="text-red-blood">
            {open ? '−' : '+'}
          </span>
        </button>

        {open ? (
          <div className="border-t border-line px-5 py-3">
            {toc.map((entry) => (
              <TocLink
                key={entry.id}
                entry={entry}
                active={entry.id === active}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </div>
        ) : null}
      </nav>
    </>
  );
}
