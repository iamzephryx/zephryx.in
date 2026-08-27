'use client';

import Link from 'next/link';
import { formatDate } from '@/lib/format';
import { KIND_LABEL, segment, type SearchHit, type SearchKind } from '@/lib/searchTypes';

/**
 * One card per hit, in one ranked list regardless of content type — a writeup
 * and the rule that answers it sit next to each other, which is the whole point
 * of searching across shelves instead of within one.
 *
 * The kind chip is colour-coded to the loop: red for the attack, green for the
 * detection.
 */
const KIND_CHIP: Record<SearchKind, string> = {
  writeup: 'border-red-deep/50 bg-red-ash/25 text-red-blood',
  detection: 'border-signal/40 bg-signal/10 text-signal',
};

/** Renders matched runs as <mark>. Segments are text nodes — never markup. */
function Marked({ text, terms }: { text: string; terms: readonly string[] }) {
  return (
    <>
      {segment(text, terms).map((part, i) =>
        part.hit ? (
          <mark key={i} className="bg-red-ash/70 text-ink">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}

function HitCard({ hit, terms }: { hit: SearchHit; terms: readonly string[] }) {
  const { doc } = hit;
  const chips = [...doc.techniques, ...doc.tags].slice(0, 4);

  return (
    <article className="panel clip-corner group flex h-full flex-col p-6 transition-all duration-400 hover:border-red-deep/70 hover:box-glow">
      <div className="mb-4 flex flex-wrap items-center gap-2 font-mono text-[10px]">
        <span className={`border px-2 py-0.5 uppercase ${KIND_CHIP[doc.kind]}`}>
          {KIND_LABEL[doc.kind].chip}
        </span>
        <span className="border border-line px-2 py-0.5 text-ink-faint">{doc.label}</span>
        <span className="ml-auto text-ink-faint">{doc.meta}</span>
      </div>

      <h3 className="font-mono text-base font-semibold leading-snug text-ink">
        {doc.external ? (
          <a
            href={doc.href}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-red-blood focus-visible:text-red-blood"
          >
            <Marked text={doc.title} terms={terms} />
          </a>
        ) : (
          <Link
            href={doc.href}
            className="transition-colors hover:text-red-blood focus-visible:text-red-blood"
          >
            <Marked text={doc.title} terms={terms} />
          </Link>
        )}
      </h3>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-dim line-clamp-3">
        <Marked text={doc.excerpt} terms={terms} />
      </p>

      {chips.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-1.5 font-mono text-[10px] text-ink-faint">
          {chips.map((chip) => (
            <span key={chip} className="border border-line px-1.5 py-0.5">
              <Marked text={chip} terms={terms} />
            </span>
          ))}
        </div>
      ) : null}

      {/* The loop, made walkable from the result itself. */}
      {doc.loop.length > 0 ? (
        <ul className="mt-4 space-y-1 border-t border-line/70 pt-3 font-mono text-[11px]">
          {doc.loop.map((link) => (
            <li key={link.href} className="flex gap-2">
              <span className="shrink-0 text-ink-faint" aria-hidden>
                ↳
              </span>
              <span className="text-ink-faint">
                {doc.kind === 'writeup' ? 'caught by' : 'answers'}{' '}
                <Link href={link.href} className="text-ink-dim underline-offset-2 hover:text-red-blood hover:underline">
                  {link.title}
                </Link>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex items-center justify-between border-t border-line pt-4 font-mono text-[11px] text-ink-faint">
        <span>{formatDate(doc.date)}</span>
        <span className="text-red-blood" aria-hidden>
          {doc.external ? 'open ↗' : 'read →'}
        </span>
      </div>
    </article>
  );
}

export default function SearchResults({
  hits,
  terms,
}: {
  hits: readonly SearchHit[];
  terms: readonly string[];
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {hits.map((hit) => (
        <HitCard key={hit.doc.id} hit={hit} terms={terms} />
      ))}
    </div>
  );
}
