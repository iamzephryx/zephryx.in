import type { RendererObject } from 'marked';

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
function createSlugger(): (text: string) => string {
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
function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&(amp|lt|gt|quot|#39);/g, (_, e: string) =>
      e === 'amp' ? '&' : e === 'lt' ? '<' : e === 'gt' ? '>' : e === 'quot' ? '"' : "'",
    )
    .trim();
}

/**
 * Heading renderer that anchors every h2/h3 and appends each one to `toc` in
 * document order, so the in-page nav and shared #links have something to aim
 * at. Deeper and shallower levels render untouched — h1 belongs to the page
 * header, and h4+ is too fine-grained to navigate by.
 *
 * The returned function is document-scoped (it closes over a fresh slugger and
 * the given `toc`), so build one per rendered document.
 */
export function anchoredHeadings(toc: TocEntry[]): NonNullable<RendererObject['heading']> {
  const slugify = createSlugger();

  return function heading({ tokens, depth }) {
    const inner = this.parser.parseInline(tokens);
    if (depth !== 2 && depth !== 3) return `<h${depth}>${inner}</h${depth}>`;

    const text = plainText(inner);
    const id = slugify(text);
    toc.push({ id, text, depth });

    return (
      `<h${depth} id="${id}">${inner}` +
      `<a class="heading-anchor" href="#${id}" aria-label="Link to this section">#</a>` +
      `</h${depth}>`
    );
  };
}
