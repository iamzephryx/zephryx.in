import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

// Re-exported so server components can keep importing everything from here, while
// client components import the pure helpers/types directly from '@/lib/format' and
// '@/lib/cheatsheetTypes'.
export { formatDate } from './format';
export { CHEATSHEET_CATEGORIES, type CheatsheetCategory, type Cheatsheet } from './cheatsheetTypes';
import { CHEATSHEET_CATEGORIES, type Cheatsheet } from './cheatsheetTypes';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'cheatsheets');
const PDF_DIR = path.join(process.cwd(), 'public', 'cheatsheets');

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Plain filename only — no path separators, no traversal. */
const fileNamePattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*\.pdf$/;

const oneOf = <T extends readonly string[]>(
  allowed: T,
  value: unknown,
  fallback: T[number],
): T[number] => {
  const v = String(value ?? '');
  return (allowed as readonly string[]).includes(v) ? (v as T[number]) : fallback;
};

function readAll(): Cheatsheet[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  return fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const slug = file.replace(/\.md$/, '');
      if (!slugPattern.test(slug)) {
        throw new Error(`Invalid cheatsheet slug "${slug}" — use lowercase-kebab-case.`);
      }

      const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
      const { data } = matter(raw);

      const pdfName = String(data.file ?? '');
      if (!fileNamePattern.test(pdfName)) {
        throw new Error(
          `Cheatsheet "${slug}" has a missing or malformed "file" field — expected a plain ` +
            `*.pdf filename with no path separators.`,
        );
      }

      const pdfPath = path.join(PDF_DIR, pdfName);
      if (!fs.existsSync(pdfPath)) {
        // Fail the build rather than shipping a card that 404s on click.
        throw new Error(
          `Cheatsheet "${slug}" references "${pdfName}", which does not exist in public/cheatsheets/.`,
        );
      }

      return {
        slug,
        title: String(data.title ?? slug),
        date: String(data.date ?? '1970-01-01'),
        category: oneOf(CHEATSHEET_CATEGORIES, data.category, 'General'),
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        excerpt: String(data.excerpt ?? ''),
        featured: Boolean(data.featured),
        file: pdfName,
        sizeBytes: fs.statSync(pdfPath).size,
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getAllCheatsheets(): Cheatsheet[] {
  return readAll();
}

export function getFeaturedCheatsheets(limit = 3): Cheatsheet[] {
  const all = readAll();
  const featured = all.filter((c) => c.featured);
  return (featured.length ? featured : all).slice(0, limit);
}

export function getAllCheatsheetTags(): string[] {
  return [...new Set(readAll().flatMap((c) => c.tags))].sort();
}

export function getCheatsheetCount(): number {
  return readAll().length;
}
