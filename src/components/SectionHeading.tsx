import type { ReactNode } from 'react';

export default function SectionHeading({
  index,
  title,
  sub,
  children,
}: {
  index: string;
  title: string;
  sub?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-12">
      <div className="mb-3 flex items-center gap-3">
        <span className="font-mono text-[11px] tracking-[0.35em] text-red-blood/80">{index}</span>
        <span className="h-px flex-1 bg-gradient-to-r from-red-deep/60 via-line to-transparent" />
      </div>
      <h2 className="font-mono text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        <span className="text-red-blood">$</span> {title}
      </h2>
      {sub ? <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-dim">{sub}</p> : null}
      {children}
    </div>
  );
}
