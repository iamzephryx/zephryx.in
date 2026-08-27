/**
 * Cross-content search — the shared model and the matcher.
 *
 * Pure module: no Node built-ins, no JSX. The index is assembled on the server
 * (see search.ts, which reads the content directories) and the *same* matcher
 * runs in the browser against that pre-built array, so every surface — the
 * /search page, the per-section indexes, the terminal — ranks results
 * identically instead of each rolling its own `includes()`.
 */

export const SEARCH_KINDS = ['writeup', 'detection'] as const;

export type SearchKind = (typeof SEARCH_KINDS)[number];

/** Nouns used in counts and headings, so "1 rule" never reads "1 detections". */
export const KIND_LABEL: Record<SearchKind, { one: string; many: string; chip: string }> = {
  writeup: { one: 'writeup', many: 'writeups', chip: 'writeup' },
  detection: { one: 'rule', many: 'rules', chip: 'detection' },
};

/** The other half of the purple loop: the attack a rule answers, or vice versa. */
export type LoopLink = {
  kind: SearchKind;
  title: string;
  href: string;
};

export type SearchDoc = {
  /** Stable across kinds — slugs alone can collide between content types. */
  id: string;
  kind: SearchKind;
  slug: string;
  title: string;
  excerpt: string;
  href: string;
  external: boolean;
  date: string;
  /** Lead chip on the card: category, or severity for a rule. */
  label: string;
  /** Trailing meta on the card: reading time, rule id, file size. */
  meta: string;
  tags: string[];
  techniques: string[];
  /**
   * Searchable but not rendered as chips — rule ids, log sources, platform,
   * difficulty, plus the kind's own vocabulary so "sigma" or "pdf" find the
   * right shelf.
   */
  facets: string[];
  loop: LoopLink[];
};

/** Matches the cap the section search boxes already enforce on their inputs. */
export const QUERY_LIMIT = 64;

const MAX_TERMS = 6;

/**
 * Split a raw query into lowercase terms. Whitespace-separated, deduped and
 * bounded — a query is a handful of words, and everything downstream is O(terms
 * × docs × fields).
 */
export function parseTerms(query: string): string[] {
  const terms = query.toLowerCase().slice(0, QUERY_LIMIT).split(/\s+/).filter(Boolean);
  return [...new Set(terms)].slice(0, MAX_TERMS);
}

/**
 * Field weights. A title hit is worth more than an excerpt hit, and a tag or
 * technique id — both deliberate, curated metadata — sits close to the title.
 */
type Field = { text: string; weight: number };

function fieldsOf(doc: SearchDoc): Field[] {
  return [
    { text: doc.title, weight: 10 },
    { text: doc.tags.join(' '), weight: 7 },
    { text: doc.techniques.join(' '), weight: 7 },
    { text: doc.label, weight: 6 },
    { text: doc.facets.join(' '), weight: 4 },
    { text: doc.excerpt, weight: 2 },
    // A rule is findable by the attack it answers, and an attack by its rule.
    { text: doc.loop.map((l) => l.title).join(' '), weight: 1 },
  ].map((f) => ({ ...f, text: f.text.toLowerCase() }));
}

const isWordChar = (c: string | undefined) => c !== undefined && /[a-z0-9]/.test(c);

/**
 * Score one document. Every term must land somewhere (AND semantics) — with a
 * corpus this size, OR would return the whole site for any two-word query.
 * Each term contributes its single best field hit, so a word repeated across
 * tags and excerpt cannot outrank a genuine title match.
 */
function scoreDoc(doc: SearchDoc, terms: string[]): number | null {
  const fields = fieldsOf(doc);
  let total = 0;

  for (const term of terms) {
    let best = 0;
    for (const field of fields) {
      const at = field.text.indexOf(term);
      if (at < 0) continue;
      // Word-start hits ("kerberos" in "kerberoasting") beat hits buried
      // mid-token, which are usually coincidence.
      const boundary = !isWordChar(field.text[at - 1]);
      const score = boundary ? field.weight * 1.5 : field.weight;
      if (score > best) best = score;
    }
    if (best === 0) return null;
    total += best;
  }

  return total;
}

export type SearchHit = {
  doc: SearchDoc;
  score: number;
};

/**
 * Rank documents against a query. An empty query is a browse, not a search:
 * everything comes back, newest first.
 */
export function search(docs: readonly SearchDoc[], query: string): SearchHit[] {
  const terms = parseTerms(query.trim());

  if (terms.length === 0) {
    return [...docs]
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .map((doc) => ({ doc, score: 0 }));
  }

  const hits: SearchHit[] = [];
  for (const doc of docs) {
    const score = scoreDoc(doc, terms);
    if (score !== null) hits.push({ doc, score });
  }

  // Relevance first, then recency, then id — a stable order across renders.
  return hits.sort(
    (a, b) =>
      b.score - a.score ||
      (a.doc.date < b.doc.date ? 1 : a.doc.date > b.doc.date ? -1 : 0) ||
      a.doc.id.localeCompare(b.doc.id),
  );
}

/**
 * Split the index into "this shelf" and "everywhere else" — a section page
 * ranks its own kind with the same matcher and uses the remainder to say what
 * the query hits outside the page you are on.
 */
export function partitionByKind(
  docs: readonly SearchDoc[],
  kind: SearchKind,
): { own: SearchDoc[]; elsewhere: SearchDoc[] } {
  const own: SearchDoc[] = [];
  const elsewhere: SearchDoc[] = [];
  for (const doc of docs) (doc.kind === kind ? own : elsewhere).push(doc);
  return { own, elsewhere };
}

export type KindCounts = Record<SearchKind, number>;

export function countByKind(hits: readonly SearchHit[]): KindCounts {
  const counts: KindCounts = { writeup: 0, detection: 0 };
  for (const hit of hits) counts[hit.doc.kind] += 1;
  return counts;
}

/**
 * "2 rules · 1 sheet" — the phrase that tells a visitor their query means
 * something on a shelf they are not currently looking at.
 */
export function describeCounts(counts: KindCounts, kinds: readonly SearchKind[] = SEARCH_KINDS) {
  return kinds
    .filter((kind) => counts[kind] > 0)
    .map((kind) => {
      const n = counts[kind];
      return `${n} ${n === 1 ? KIND_LABEL[kind].one : KIND_LABEL[kind].many}`;
    });
}

export type Segment = { text: string; hit: boolean };

/**
 * Split text into matched / unmatched runs for highlighting. Returns segments
 * rather than markup so the caller renders React text nodes — nothing here ever
 * becomes HTML.
 */
export function segment(text: string, terms: readonly string[]): Segment[] {
  if (terms.length === 0) return [{ text, hit: false }];

  const haystack = text.toLowerCase();
  const segments: Segment[] = [];
  let cursor = 0;
  let plain = 0;

  while (cursor < text.length) {
    // Longest match wins, so "kerb" never chops a "kerberoasting" highlight.
    let matchLength = 0;
    for (const term of terms) {
      if (term.length > matchLength && haystack.startsWith(term, cursor)) matchLength = term.length;
    }

    if (matchLength === 0) {
      cursor += 1;
      continue;
    }

    if (cursor > plain) segments.push({ text: text.slice(plain, cursor), hit: false });
    segments.push({ text: text.slice(cursor, cursor + matchLength), hit: true });
    cursor += matchLength;
    plain = cursor;
  }

  if (plain < text.length) segments.push({ text: text.slice(plain), hit: false });
  return segments;
}
