/** One entry in a document's in-page navigation. */
export type TocEntry = {
  /** Anchor id, matching the `id` attribute on the rendered heading. */
  id: string;
  /** Heading text with inline markup stripped. */
  text: string;
  depth: 2 | 3;
};

/**
 * Per-document slug generator. Ids are derived from the heading text so they
 * stay stable (and shareable) across rebuilds; repeats get a numeric suffix so
 * two headings with the same wording never collide.
 */
export function createSlugger(): (text: string) => string {
  const seen = new Map<string, number>();

  return (text) => {
    const base =
      text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '') || 'section';

    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  };
}

/** Reduce rendered inline HTML (code spans, emphasis, links) back to plain text. */
export function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&(amp|lt|gt|quot|#39);/g, (_, e: string) =>
      e === 'amp' ? '&' : e === 'lt' ? '<' : e === 'gt' ? '>' : e === 'quot' ? '"' : "'",
    )
    .trim();
}
