import type { RendererObject } from 'marked';

/** A fenced block lifted out of a document so it can be copied or downloaded. */
export type CodeBlock = {
  /** Fence language as authored, lowercased. Empty for an unlabelled fence. */
  lang: string;
  /** File name offered by the download action. */
  filename: string;
  /** Block contents, exactly as authored, newline-terminated. */
  code: string;
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
 * Code renderer that wraps every fenced block in a labelled figure carrying
 * copy and download controls, and appends the block to `blocks` in document
 * order so the page can also surface the rule itself outside the prose.
 *
 * File names default to the document's base name (`base.yml`, `base-2.kql`, …)
 * and can be overridden from the fence info string:
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
  base: string,
): NonNullable<RendererObject['code']> {
  return ({ text, lang }) => {
    const [langToken = '', nameToken = ''] = String(lang ?? '').trim().split(/\s+/);
    const language = langToken.toLowerCase();
    const extension = EXTENSION[language] ?? 'txt';

    const position = blocks.length;
    const filename =
      overrideFilename(nameToken) ??
      `${base}${position === 0 ? '' : `-${position + 1}`}.${extension}`;

    // Trailing newline so a downloaded file ends the way a rule file should.
    const code = `${text.replace(/\n+$/, '')}\n`;
    blocks.push({ lang: language, filename, code });

    const name = escapeHtml(filename);
    const action = (kind: 'copy' | 'download', label: string, description: string) =>
      `<button type="button" class="code-block__action" data-code-action="${kind}" ` +
      `aria-label="${description} ${name}">` +
      `<span class="code-block__label" data-code-label>${label}</span>` +
      `</button>`;

    return (
      `<figure class="code-block" data-filename="${name}">` +
      `<figcaption class="code-block__bar">` +
      `<span class="code-block__meta">` +
      `<span class="code-block__lang">${escapeHtml(language || 'text')}</span>` +
      `<span class="code-block__file">${name}</span>` +
      `</span>` +
      // Announcement target for the copy/download result — visually hidden.
      `<span class="code-block__status" role="status" data-code-status></span>` +
      `<span class="code-block__actions">` +
      `${action('copy', 'copy', 'Copy')}${action('download', 'download', 'Download')}` +
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
  return blocks.find((b) => b.filename.endsWith('.yml')) ?? blocks[0] ?? null;
}
