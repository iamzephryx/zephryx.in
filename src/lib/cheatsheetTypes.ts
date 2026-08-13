/**
 * Pure types/constants — no Node built-ins, safe to import from client
 * components. Keeping these out of cheatsheets.ts is what prevents node:fs /
 * node:path from being pulled into a client bundle (same split as format.ts).
 */

export const CHEATSHEET_CATEGORIES = [
  'Active Directory',
  'Cloud',
  'Web',
  'Network',
  'Forensics',
  'Malware',
  'Tools',
  'General',
] as const;

export type CheatsheetCategory = (typeof CHEATSHEET_CATEGORIES)[number];

export type Cheatsheet = {
  slug: string;
  title: string;
  date: string;
  category: CheatsheetCategory;
  tags: string[];
  excerpt: string;
  featured: boolean;
  /** Filename under public/cheatsheets/, e.g. 'active-directory-quick-ref.pdf'. */
  file: string;
  /** Byte size read off disk at build time — never trusted from frontmatter. */
  sizeBytes: number;
};
