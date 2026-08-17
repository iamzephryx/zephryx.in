/**
 * URL allowlist for the markdown pipelines.
 *
 * `marked` stopped filtering URL schemes in v5, so `[x](javascript:alert(1))`
 * renders straight into an href. Both pipelines disable raw HTML — which is the
 * defence the docs cite for stored XSS — but that says nothing about URLs
 * inside ordinary markdown, and `script-src 'unsafe-inline'` in public/_headers
 * means the CSP would not block a `javascript:` URI either.
 *
 * Content here is first-party, so this closes an authoring hazard rather than a
 * live hole. It is one typo away from being real, and cheap to remove entirely.
 */

/** Schemes a link or image is allowed to name. Everything else degrades to text. */
const ALLOWED_SCHEMES = new Set(['http:', 'https:', 'mailto:']);

/** Any scheme-ish prefix: letter, then letters/digits/+/-/. up to a colon. */
const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;

/**
 * Characters that must not survive into an href before the scheme is read.
 * HTML's URL parser strips C0 controls and spaces, so `java&#9;script:` reaches
 * the navigation layer as `javascript:` — a scheme this function would never
 * see if it compared the raw string. Zero-width and BOM characters are included
 * for the same reason: they are invisible in source and ignored downstream.
 */
const IGNORED_CHARS = /[\u0000-\u0020\u007f\u00a0\u200b-\u200f\u2028\u2029\u202a-\u202e\ufeff]/g;

/** Bound on the decode loop below — deep nesting is hostile input, not content. */
const MAX_DECODE_PASSES = 5;

/**
 * Decodes the entity forms an authored URL can carry. marked resolves entities
 * in link destinations inconsistently across token types, so normalise here
 * rather than assume: `&#106;avascript:` and `&#x6a;avascript:` must be read as
 * the scheme they are. Runs to a fixed point so a double-encoded `&amp;#106;`
 * cannot hide a scheme behind a single round of decoding.
 */
function decodeEntities(value: string): string {
  let current = value;
  for (let pass = 0; pass < MAX_DECODE_PASSES; pass += 1) {
    const next = current
      .replace(/&#x([0-9a-f]+);?/gi, (_, hex: string) => codePoint(parseInt(hex, 16)))
      .replace(/&#(\d+);?/g, (_, dec: string) => codePoint(parseInt(dec, 10)))
      .replace(/&colon;?/gi, ':')
      .replace(/&tab;?/gi, '\t')
      .replace(/&newline;?/gi, '\n')
      .replace(/&amp;?/gi, '&');
    if (next === current) return current;
    current = next;
  }
  return current;
}

function codePoint(value: number): string {
  if (!Number.isFinite(value) || value < 0 || value > 0x10ffff) return '';
  try {
    return String.fromCodePoint(value);
  } catch {
    return '';
  }
}

/**
 * Percent-encoding is decoded separately and only for the scheme check: a real
 * URL keeps its escapes, but `%6a%61%76%61...` must not smuggle one past the
 * allowlist.
 */
function decodePercent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Returns the URL when it is safe to emit, or null when the document should
 * fall back to plain text.
 *
 * Relative URLs, fragments and query-only references are kept as authored —
 * they cannot carry a scheme, so they cannot carry a dangerous one. Anything
 * that names a scheme must name an allowed one. Protocol-relative `//host/path`
 * is rejected: it inherits the page scheme and reads like a path, which is
 * exactly the confusion worth keeping out of a document about tradecraft.
 *
 * The return value is the URL as authored, not the normalised form, so
 * legitimate links keep their exact spelling; only the safety decision is made
 * on the normalised copy.
 */
export function safeUrl(href: string | null | undefined): string | null {
  if (typeof href !== 'string') return null;

  const raw = href.trim();
  if (!raw) return null;

  const normalised = decodeEntities(raw).replace(IGNORED_CHARS, '');
  if (!normalised) return null;

  if (normalised.startsWith('//')) return null;

  for (const candidate of [normalised, decodePercent(normalised).replace(IGNORED_CHARS, '')]) {
    const scheme = SCHEME_RE.exec(candidate);
    if (scheme && !ALLOWED_SCHEMES.has(scheme[0].toLowerCase())) return null;
  }

  // No scheme on either reading: a relative path, an anchor or a query, safe by
  // construction. Otherwise the scheme was checked and allowed above.
  return raw;
}
