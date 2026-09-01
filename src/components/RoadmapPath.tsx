'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type RoadmapStage = {
  n: string;
  title: string;
  summary: string;
  learn: string[];
  cheatsheets: { title: string; file: string }[];
  practice?: string;
};

/**
 * Winding "path" layout for the roadmap: a spine drawn through each stage
 * badge's actual rendered position, alternating cards left/right. The path
 * is measured client-side (badge centers vary with card height, which varies
 * with content and viewport), so this has to be a client component — the
 * stage data itself is still resolved server-side in the parent page.
 */
export default function RoadmapPath({ stages }: { stages: RoadmapStage[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const badgeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [path, setPath] = useState({ d: '', w: 0, h: 0 });

  const draw = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const badges = badgeRefs.current.filter((b): b is HTMLDivElement => b !== null);
    if (badges.length < 2) return;

    const wrapRect = wrap.getBoundingClientRect();
    const pts = badges.map((b) => {
      const r = b.getBoundingClientRect();
      return [r.left - wrapRect.left + r.width / 2, r.top - wrapRect.top + r.height / 2] as const;
    });

    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [px, py] = pts[i - 1];
      const [x, y] = pts[i];
      const midY = (py + y) / 2;
      d += ` C ${px} ${midY}, ${x} ${midY}, ${x} ${y}`;
    }
    setPath({ d, w: wrapRect.width, h: wrapRect.height });
  }, []);

  useEffect(() => {
    draw();
    window.addEventListener('resize', draw);

    let cancelled = false;
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) draw();
      });
    }

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => draw()) : null;
    if (ro && wrapRef.current) ro.observe(wrapRef.current);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', draw);
      ro?.disconnect();
    };
  }, [draw]);

  return (
    <div ref={wrapRef} className="relative">
      <svg
        className="pointer-events-none absolute inset-0 z-0"
        width={path.w}
        height={path.h}
        viewBox={`0 0 ${path.w} ${path.h}`}
        aria-hidden="true"
      >
        <path d={path.d} fill="none" stroke="var(--color-red-blood)" strokeWidth={14} strokeLinecap="round" opacity={0.1} />
        <path d={path.d} fill="none" stroke="var(--color-red-blood)" strokeWidth={2} strokeLinecap="round" strokeDasharray="1 9" opacity={0.55} />
      </svg>

      <div className="relative z-10 grid grid-cols-[56px_1fr] pb-5 sm:grid-cols-[1fr_64px_1fr]">
        <span className="clip-tab col-start-1 justify-self-start bg-red-blood px-3 py-1.5 font-mono text-[10px] tracking-[0.22em] text-void sm:col-start-2 sm:justify-self-center">
          START HERE
        </span>
      </div>

      <ol className="relative z-10 flex flex-col">
        {stages.map((stage, i) => {
          const isLeft = i % 2 === 0;
          const hasResource = stage.cheatsheets.length > 0;

          return (
            <li
              key={stage.n}
              className="grid grid-cols-[56px_1fr] items-start gap-x-5 gap-y-4 py-8 sm:grid-cols-[1fr_64px_1fr] sm:gap-x-7 sm:py-10"
            >
              <div
                ref={(el) => {
                  badgeRefs.current[i] = el;
                }}
                className={`clip-corner relative col-start-1 row-start-1 flex h-14 w-14 flex-none flex-col items-center justify-center border-2 bg-surface font-mono font-bold sm:col-start-2 sm:h-16 sm:w-16 sm:justify-self-center ${
                  hasResource ? 'border-signal text-signal' : 'border-dashed border-line text-ink-faint'
                }`}
              >
                {hasResource ? (
                  <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-signal" />
                  </span>
                ) : null}
                <span className="text-sm sm:text-base">{stage.n}</span>
              </div>

              <article
                className={`panel clip-corner relative col-start-2 row-start-1 max-w-[29rem] p-6 before:absolute before:top-8 before:hidden before:h-0.5 before:w-6 before:bg-line sm:before:block ${
                  isLeft
                    ? 'sm:col-start-1 sm:justify-self-end sm:before:right-[-1.5rem]'
                    : 'sm:col-start-3 sm:justify-self-start sm:before:left-[-1.5rem]'
                } ${hasResource ? 'before:bg-signal/50' : ''}`}
              >
                <p className="font-mono text-[10.5px] tracking-[0.24em] text-red-blood/70">STAGE {stage.n}</p>
                <h2 className="mt-2 font-mono text-xl font-semibold text-ink">{stage.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-dim">{stage.summary}</p>

                <h3 className="mt-5 font-mono text-[10.5px] tracking-[0.22em] text-ink-faint">
                  WHAT YOU&apos;LL LEARN
                </h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {stage.learn.map((topic) => (
                    <li
                      key={topic}
                      className="border border-line bg-void/60 px-2.5 py-1 font-mono text-[11px] text-ink-faint"
                    >
                      {topic}
                    </li>
                  ))}
                </ul>

                {stage.cheatsheets.length > 0 ? (
                  <div className="mt-5">
                    <h3 className="font-mono text-[10.5px] tracking-[0.22em] text-ink-faint">FREE RIGHT NOW</h3>
                    <ul className="mt-3 space-y-2">
                      {stage.cheatsheets.map((c) => (
                        <li key={c.file}>
                          <a
                            href={`/cheatsheets/${c.file}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-sm text-red-blood hover:underline"
                          >
                            {c.title} ↗
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {stage.practice ? (
                  <p className="mt-5 border border-line bg-void/40 p-3 text-[12.5px] leading-relaxed text-ink-faint">
                    {stage.practice}
                  </p>
                ) : null}
              </article>
            </li>
          );
        })}
      </ol>

      <div className="relative z-10 grid grid-cols-[56px_1fr] pt-3 sm:grid-cols-[1fr_64px_1fr]">
        <span className="col-start-1 justify-self-start border border-line bg-surface px-3 py-1.5 font-mono text-[10px] tracking-[0.22em] text-ink-faint sm:col-start-2 sm:justify-self-center">
          PATH CONTINUES BELOW
        </span>
      </div>
    </div>
  );
}
