import type { RendererObject } from 'marked';

/** A fenced block lifted out of a document so it can be copied or downloaded. */
export type CodeBlock = {
  /** Fence language as authored, lowercased. Empty for an unlabelled fence. */
  lang: string;
  /** File name offered by the download action. */
  filename: string;
  /** Block contents, exactly as authored, newline-terminated. */
  code: string;
  /** Whether this block is offered as a file as well as for copying. */
  downloadable: boolean;
};

export type CodeBlockOptions = {
  /** Stem for generated file names — the document slug. */
  base: string;
  /**
   * Which blocks are offered as a download. `always` suits documents whose
   * blocks are files you deploy (detection rules); `named` only offers the
   * ones whose fence names a file, so pasted output is not dressed up as
   * something worth saving. Copy is offered either way.
   */
  download: 'always' | 'named';
};

/**
 * Fence language → download extension. The site ships no syntax highlighter,
 * so the fence label exists purely to name the language and to pick the
 * extension a reader's editor will recognise. Unmapped languages get `.txt`.
 */
const EXTENSION: Record<string, string> = {
  yaml: 'yml',
  yml: 'yml',
  kql: 'kql',
  sql: 'sql',
  spl: 'spl',
  eql: 'eql',
  json: 'json',
  xml: 'xml',
  powershell: 'ps1',
  ps1: 'ps1',
  bash: 'sh',
  sh: 'sh',
  shell: 'sh',
  python: 'py',
  py: 'py',
};

/** Conservative allowlist — no directories, no leading dot, no traversal. */
const FILENAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function overrideFilename(token: string): string | null {
  const name = token.trim();
  if (!name || name.includes('..') || !FILENAME.test(name)) return null;
  return name;
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Code renderer that wraps every fenced block in a labelled figure carrying a
 * copy control — and a download control where the block is a file worth
 * saving — appending each block to `blocks` in document order so a page can
 * also surface one outside the prose.
 *
 * File names default to the document's base name (`base.yml`, `base-2.kql`, …)
 * and can be named from the fence info string, which is also what opts a block
 * into `download: 'named'`:
 *
 *     ```kql spray-success-check.kql
 *
 * The controls are inert markup: `.prose-terminal` only reveals them once the
 * client component that binds the handlers has mounted, so a reader without
 * JavaScript is never shown a dead button.
 *
 * The returned function is document-scoped (it closes over `blocks` for the
 * numbering), so build one per rendered document.
 */
export function codeBlockActions(
  blocks: CodeBlock[],
  { base, download }: CodeBlockOptions,
): NonNullable<RendererObject['code']> {
  return ({ text, lang }) => {
    const [langToken = '', nameToken = ''] = String(lang ?? '')
      .trim()
      .split(/\s+/);
    const language = langToken.toLowerCase();
    const extension = EXTENSION[language] ?? 'txt';

    const named = overrideFilename(nameToken);
    const position = blocks.length;
    const filename =
      named ?? `${base}${position === 0 ? '' : `-${position + 1}`}.${extension}`;
    const downloadable = download === 'always' || named !== null;

    // Trailing newline so a downloaded file ends the way a rule file should.
    const code = `${text.replace(/\n+$/, '')}\n`;
    blocks.push({ lang: language, filename, code, downloadable });

    const name = escapeHtml(filename);
    const action = (kind: 'copy' | 'download', label: string, description: string) =>
      `<button type="button" class="code-block__action" data-code-action="${kind}" ` +
      `aria-label="${description} ${downloadable ? name : `this ${language || 'code'} block`}">` +
      `<span class="code-block__label" data-code-label>${label}</span>` +
      `</button>`;

    return (
      // The file name only rides on the figure when it names a real download —
      // otherwise the copy handler falls back to a generic announcement.
      `<figure class="code-block"${downloadable ? ` data-filename="${name}"` : ''}>` +
      `<figcaption class="code-block__bar">` +
      `<span class="code-block__meta">` +
      `<span class="code-block__lang">${escapeHtml(language || 'text')}</span>` +
      (downloadable ? `<span class="code-block__file">${name}</span>` : '') +
      `</span>` +
      // Announcement target for the copy/download result — visually hidden.
      `<span class="code-block__status" role="status" data-code-status></span>` +
      `<span class="code-block__actions">` +
      action('copy', 'copy', 'Copy') +
      (downloadable ? action('download', 'download', 'Download') : '') +
      `</span>` +
      `</figcaption>` +
      `<pre><code${language ? ` class="language-${escapeHtml(language)}"` : ''}>` +
      `${escapeHtml(code)}</code></pre>` +
      `</figure>\n`
    );
  };
}

/**
 * The block a reader most likely came for: the rule file itself (Sigma is
 * YAML), falling back to whatever the document leads with.
 */
export function primaryBlock(blocks: CodeBlock[]): CodeBlock | null {
  const offered = blocks.filter((b) => b.downloadable);
  return offered.find((b) => b.filename.endsWith('.yml')) ?? offered[0] ?? null;
}
