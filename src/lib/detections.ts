import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { Marked } from 'marked';
import { anchoredHeadings, type TocEntry } from './toc';
import { codeBlockActions, primaryBlock, type CodeBlock } from './codeblock';
import { safeImage, safeLink } from './safeUrl';

export type { TocEntry } from './toc';
export { primaryBlock, type CodeBlock } from './codeblock';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'detections');

export const SEVERITIES = ['informational', 'low', 'medium', 'high', 'critical'] as const;
export const RULE_STATUSES = ['experimental', 'test', 'stable', 'deprecated'] as const;

export type Severity = (typeof SEVERITIES)[number];
export type RuleStatus = (typeof RULE_STATUSES)[number];

export type Detection = {
  slug: string;
  title: string;
  /** Human-facing rule identifier, e.g. ZPX-D001. */
  ruleId: string;
  date: string;
  /** ATT&CK technique IDs this rule provides coverage for. */
  techniques: string[];
  platform: string;
  logsource: string;
  severity: Severity;
  status: RuleStatus;
  tags: string[];
  excerpt: string;
  /** Slug of the writeup whose offensive work motivated this rule, if any. */
  writeup: string | null;
  readingMinutes: number;
  /** Rendered HTML. Authored locally; raw HTML in source is discarded. */
  html: string;
  /** Section headings of the rendered body, in document order. */
  toc: TocEntry[];
  /** Every fenced block in the body, in document order, ready to hand off. */
  codeBlocks: CodeBlock[];
};

export type DetectionMeta = Omit<Detection, 'html' | 'toc' | 'codeBlocks'>;

/**
 * Same hardened pipeline as the writeups renderer — raw HTML passthrough is
 * disabled so a markdown authoring mistake can never emit live markup, and
 * sections are anchored for the in-page nav. Fenced blocks additionally get a
 * copy/download bar, since the rules are meant to be taken and run. Built per
 * document because the heading and code renderers carry document-scoped state.
 */
function render(
  content: string,
  slug: string,
): { html: string; toc: TocEntry[]; codeBlocks: CodeBlock[] } {
  const toc: TocEntry[] = [];
  const codeBlocks: CodeBlock[] = [];

  const marked = new Marked({ gfm: true, breaks: false });
  marked.use({
    renderer: {
      html: () => '',
      // Disabling raw HTML says nothing about the URLs inside ordinary
      // markdown syntax — `marked` passes any scheme straight through.
      link: safeLink(),
      image: safeImage(),
      heading: anchoredHeadings(toc),
      // Every block here is a rule or a query somebody is meant to deploy, so
      // all of them are offered as files.
      code: codeBlockActions(codeBlocks, { base: slug, download: 'always' }),
    },
  });

  return { html: marked.parse(content) as string, toc, codeBlocks };
}

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** ATT&CK technique or sub-technique, e.g. T1558 or T1558.003. */
const techniquePattern = /^T\d{4}(?:\.\d{3})?$/;

const oneOf = <T extends readonly string[]>(
  allowed: T,
  value: unknown,
  fallback: T[number],
): T[number] => {
  const v = String(value ?? '').toLowerCase();
  return (allowed as readonly string[]).includes(v) ? (v as T[number]) : fallback;
};

function readAll(): Detection[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  return fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const slug = file.replace(/\.md$/, '');
      if (!slugPattern.test(slug)) {
        throw new Error(`Invalid detection slug "${slug}" — use lowercase-kebab-case.`);
      }

      const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
      const { data, content } = matter(raw);

      const techniques = (Array.isArray(data.techniques) ? data.techniques.map(String) : []).filter(
        (t) => {
          if (techniquePattern.test(t)) return true;
          // Fail the build rather than silently dropping coverage from the matrix.
          throw new Error(`Detection "${slug}" declares malformed technique id "${t}".`);
        },
      );

      const words = content.trim().split(/\s+/).length;
      const { html, toc, codeBlocks } = render(content, slug);

      return {
        slug,
        title: String(data.title ?? slug),
        ruleId: String(data.ruleId ?? slug.toUpperCase()),
        date: String(data.date ?? '1970-01-01'),
        techniques,
        platform: String(data.platform ?? 'Windows'),
        logsource: String(data.logsource ?? 'unspecified'),
        severity: oneOf(SEVERITIES, data.severity, 'medium'),
        status: oneOf(RULE_STATUSES, data.status, 'experimental'),
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        excerpt: String(data.excerpt ?? ''),
        writeup: data.writeup ? String(data.writeup) : null,
        readingMinutes: Math.max(1, Math.round(words / 220)),
        html,
        toc,
        codeBlocks,
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

const strip = ({
  html: _html,
  toc: _toc,
  codeBlocks: _codeBlocks,
  ...meta
}: Detection): DetectionMeta => meta;

export function getAllDetections(): DetectionMeta[] {
  return readAll().map(strip);
}

export function getDetection(slug: string): Detection | null {
  return readAll().find((d) => d.slug === slug) ?? null;
}

export function getAllDetectionSlugs(): string[] {
  return readAll().map((d) => d.slug);
}

/** Detections written in response to a given writeup. */
export function getDetectionsForWriteup(writeupSlug: string): DetectionMeta[] {
  return readAll()
    .filter((d) => d.writeup === writeupSlug)
    .map(strip);
}

export function getDetectionCount(): number {
  return readAll().length;
}
