import type { RendererObject } from 'marked';

/**
 * URL guard for the markdown pipelines.
 *
 * Both pipelines disable raw HTML (`html: () => ''`), which stops a document
 * from emitting markup — but that says nothing about the URLs inside ordinary
 * markdown syntax. `marked` stopped filtering URL schemes in v5: `[x](javascript:…)`
 * and `[x](data:text/html,…)` are passed through to `href` verbatim, and the
 * site's CSP carries `script-src 'unsafe-inline'`, so a `javascript:` URI would
 * not be blocked at the edge either. Content is first-party, so this is a
 * latent authoring hazard rather than a live hole — which is exactly the kind
 * of thing worth closing before it becomes one.
 *
 * The allowlist is the set of schemes a research writeup legitimately needs.
 * Everything else — `javascript:`, `data:`, `vbscript:`, `file:`, custom app
 * schemes — degrades to plain text rather than rendering a live link.
 */
const ALLOWED_SCHEMES = new Set(['http:', 'https:', 'mailto:']);

export function safeContentUrl(href: string | null | undefined): string | null {
  if (!href) return null;

  const value = href.trim();
  if (!value) return null;

  // Same-document and site-relative targets carry no scheme to check. A
  // protocol-relative `//host` is treated as absolute so it goes through the
  // scheme check below rather than slipping past as "relative".
  if (!value.startsWith('//') && /^[#/.?]/.test(value)) return value;

  let url: URL;
  try {
    // A base is required for the protocol-relative case; anything with its own
    // scheme ignores it.
    url = new URL(value, 'https://zephryx.in/');
  } catch {
    return null;
  }

  return ALLOWED_SCHEMES.has(url.protocol) ? value : null;
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Link renderer that drops the anchor when the target fails the scheme check,
 * keeping the link text so the sentence still reads. Mirrors how the terminal
 * degrades a blocked target instead of rendering a dead or dangerous control.
 */
export function safeLink(): NonNullable<RendererObject['link']> {
  return function link({ href, title, tokens }) {
    const text = this.parser.parseInline(tokens);
    const target = safeContentUrl(href);
    if (!target) return text;

    const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
    return `<a href="${escapeHtml(target)}"${titleAttr}>${text}</a>`;
  };
}

/**
 * Plain guarded image, for pipelines that do not give images the figure and
 * caption treatment. A blocked src degrades to the alt text.
 */
export function safeImage(): NonNullable<RendererObject['image']> {
  return ({ href, text }) => {
    const alt = escapeHtml(text ?? '');
    const src = safeContentUrl(href);
    return src ? `<img src="${escapeHtml(src)}" alt="${alt}" loading="lazy" />` : alt;
  };
}
