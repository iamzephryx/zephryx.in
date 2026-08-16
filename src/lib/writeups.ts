import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { Marked } from 'marked';
import { anchoredHeadings, type TocEntry } from './toc';
import { localImageSize } from './imageSize';

// Re-exported so server components can keep importing it from here, while client
// components import the pure helper directly from '@/lib/format'.
export { formatDate } from './format';
export type { TocEntry } from './toc';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'writeups');

export type Writeup = {
  slug: string;
  title: string;
  date: string;
  category: 'CTF' | 'Research' | 'Detection' | 'Tradecraft';
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Insane';
  /** ATT&CK technique IDs emulated in this writeup — drives the coverage matrix. */
  techniques: string[];
  tags: string[];
  excerpt: string;
  readingMinutes: number;
  featured: boolean;
  /** Rendered HTML. Authored locally; raw HTML in source is discarded. */
  html: string;
  /** Section headings of the rendered body, in document order. */
  toc: TocEntry[];
};

export type WriteupMeta = Omit<Writeup, 'html' | 'toc'>;

/**
 * Markdown renderer with raw HTML disabled. Content is first-party, but a
 * markdown pipeline that cannot emit author-controlled HTML removes an entire
 * class of stored-XSS mistakes from the blog surface.
 */
const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  );

/**
 * Renders one document. The instance is per-call because the heading renderer
 * carries document-scoped state (the slugger and the collected table of
 * contents), which a shared instance could leak between files.
 */
function render(content: string): { html: string; toc: TocEntry[] } {
  const toc: TocEntry[] = [];

  const marked = new Marked({ gfm: true, breaks: false });
  marked.use({
    renderer: {
      html: () => '',
      // Wrap images in a figure + caption (alt text doubles as the caption) —
      // evidence screenshots read better captioned than bare. Intrinsic
      // dimensions are stamped on so a lazy image reserves its box up front,
      // which keeps anchored sections from sliding out from under a jump.
      image({ href, text }) {
        const safeText = escapeHtml(text ?? '');
        const caption = safeText ? `<figcaption>${safeText}</figcaption>` : '';
        const size = localImageSize(href);
        const dims = size ? ` width="${size.width}" height="${size.height}"` : '';
        return `<figure><img src="${escapeHtml(href)}" alt="${safeText}"${dims} loading="lazy" />${caption}</figure>`;
      },
      heading: anchoredHeadings(toc),
    },
  });

  return { html: marked.parse(content) as string, toc };
}

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** ATT&CK technique or sub-technique, e.g. T1558 or T1558.003. */
const techniquePattern = /^T\d{4}(?:\.\d{3})?$/;

function readAll(): Writeup[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  return fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const slug = file.replace(/\.md$/, '');
      if (!slugPattern.test(slug)) {
        throw new Error(`Invalid writeup slug "${slug}" — use lowercase-kebab-case.`);
      }

      const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
      const { data, content } = matter(raw);

      const techniques = (Array.isArray(data.techniques) ? data.techniques.map(String) : []).filter(
        (t) => {
          if (techniquePattern.test(t)) return true;
          // Fail the build rather than silently dropping coverage from the matrix.
          throw new Error(`Writeup "${slug}" declares malformed technique id "${t}".`);
        },
      );

      const words = content.trim().split(/\s+/).length;
      const { html, toc } = render(content);

      return {
        slug,
        title: String(data.title ?? slug),
        date: String(data.date ?? '1970-01-01'),
        category: (data.category ?? 'Research') as Writeup['category'],
        difficulty: (data.difficulty ?? 'Medium') as Writeup['difficulty'],
        techniques,
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        excerpt: String(data.excerpt ?? ''),
        featured: Boolean(data.featured),
        readingMinutes: Math.max(1, Math.round(words / 220)),
        html,
        toc,
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

const strip = ({ html: _html, toc: _toc, ...meta }: Writeup): WriteupMeta => meta;

export function getAllWriteups(): WriteupMeta[] {
  return readAll().map(strip);
}

export function getFeaturedWriteups(limit = 3): WriteupMeta[] {
  const all = readAll().map(strip);
  const featured = all.filter((w) => w.featured);
  return (featured.length ? featured : all).slice(0, limit);
}

export function getWriteup(slug: string): Writeup | null {
  return readAll().find((w) => w.slug === slug) ?? null;
}

export function getAllSlugs(): string[] {
  return readAll().map((w) => w.slug);
}

export function getAllTags(): string[] {
  return [...new Set(readAll().flatMap((w) => w.tags))].sort();
}
