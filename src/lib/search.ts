/**
 * Builds the cross-content search index at build time.
 *
 * Server-only — this reaches the content directories through the writeups and
 * detections loaders, both of which touch node:fs. Client components import
 * the model and the matcher from './searchTypes' instead and receive the
 * finished array as props, so a fully static export ships one in-memory index
 * and never needs a search backend.
 */

import { getAllWriteups } from './writeups';
import { getAllDetections } from './detections';
import { techniqueName } from './attack';
import { SEARCH_KINDS, type SearchDoc, type SearchKind, type LoopLink } from './searchTypes';

export type { SearchDoc, SearchKind } from './searchTypes';

/**
 * One index over everything a visitor can read. Kinds are normalised into a
 * single shape here so ranking never has to special-case a content type.
 */
export function getSearchIndex(): SearchDoc[] {
  const writeups = getAllWriteups();
  const detections = getAllDetections();

  // Both directions of the loop, resolved once: the rules that answer a given
  // writeup, and the writeup title a rule was written against.
  const writeupById = new Map(writeups.map((w) => [w.slug, w]));
  const rulesByWriteup = new Map<string, LoopLink[]>();

  for (const d of detections) {
    if (!d.writeup) continue;
    if (!writeupById.has(d.writeup)) {
      // A dangling reference would silently break the loop links on both ends.
      throw new Error(
        `Detection "${d.slug}" names writeup "${d.writeup}", which does not exist in content/writeups/.`,
      );
    }
    const link: LoopLink = {
      kind: 'detection',
      title: d.title,
      href: `/detections/${d.slug}/`,
    };
    const bucket = rulesByWriteup.get(d.writeup);
    if (bucket) bucket.push(link);
    else rulesByWriteup.set(d.writeup, [link]);
  }

  const docs: SearchDoc[] = [
    ...writeups.map(
      (w): SearchDoc => ({
        id: `writeup:${w.slug}`,
        kind: 'writeup',
        slug: w.slug,
        title: w.title,
        excerpt: w.excerpt,
        href: `/writeups/${w.slug}/`,
        external: false,
        date: w.date,
        label: w.category,
        meta: `${w.readingMinutes} min`,
        tags: w.tags,
        techniques: w.techniques,
        facets: [
          'writeup',
          'research',
          w.category,
          w.difficulty,
          // Technique names, so "pass the ticket" finds T1550.003 without the id.
          ...w.techniques.map(techniqueName),
        ],
        loop: rulesByWriteup.get(w.slug) ?? [],
      }),
    ),

    ...detections.map((d): SearchDoc => {
      const source = d.writeup ? writeupById.get(d.writeup) : undefined;
      return {
        id: `detection:${d.slug}`,
        kind: 'detection',
        slug: d.slug,
        title: d.title,
        excerpt: d.excerpt,
        href: `/detections/${d.slug}/`,
        external: false,
        date: d.date,
        label: d.severity,
        meta: d.ruleId,
        tags: d.tags,
        techniques: d.techniques,
        facets: [
          'detection',
          'rule',
          'sigma',
          d.ruleId,
          d.logsource,
          d.platform,
          d.status,
          d.severity,
          ...d.techniques.map(techniqueName),
        ],
        loop: source
          ? [{ kind: 'writeup', title: source.title, href: `/writeups/${source.slug}/` }]
          : [],
      };
    }),
  ];

  return docs.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/**
 * Terms that genuinely span content types, ranked by how many shelves they
 * touch. These are the suggestions worth putting in front of a visitor: each
 * one demonstrates the point of the unified box by returning an attack *and*
 * the rule that catches it.
 */
export function getCrossCuttingTerms(limit = 8): string[] {
  const docs = getSearchIndex();

  const tally = (pick: (doc: SearchDoc) => string[]) => {
    const kinds = new Map<string, Set<SearchKind>>();
    const totals = new Map<string, number>();
    for (const doc of docs) {
      for (const term of new Set(pick(doc))) {
        const seen = kinds.get(term) ?? new Set<SearchKind>();
        seen.add(doc.kind);
        kinds.set(term, seen);
        totals.set(term, (totals.get(term) ?? 0) + 1);
      }
    }
    return [...kinds.entries()]
      .filter(([, seen]) => seen.size > 1)
      .sort(
        ([aTerm, aKinds], [bTerm, bKinds]) =>
          bKinds.size - aKinds.size ||
          (totals.get(bTerm) ?? 0) - (totals.get(aTerm) ?? 0) ||
          aTerm.localeCompare(bTerm),
      )
      .map(([term]) => term);
  };

  const tags = tally((doc) => doc.tags);
  const techniques = tally((doc) => doc.techniques);

  // Mostly plain words, with a couple of technique ids to advertise that
  // searching "T1558.003" works too.
  const keep = Math.max(1, limit - 2);
  return [...tags.slice(0, keep), ...techniques.slice(0, limit - Math.min(keep, tags.length))].slice(
    0,
    limit,
  );
}

/** Per-kind totals for the search page's idle state. */
export function getIndexSummary(): { kind: SearchKind; count: number }[] {
  const docs = getSearchIndex();
  return SEARCH_KINDS.map((kind) => ({
    kind,
    count: docs.filter((doc) => doc.kind === kind).length,
  }));
}
