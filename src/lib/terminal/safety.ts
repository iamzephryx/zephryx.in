/**
 * Input hardening for the interactive terminal.
 *
 * Threat model: the terminal is a client-side toy, but it accepts free-form
 * attacker-controlled text and renders it straight back. Everything below
 * exists to keep that loop boring:
 *
 *  - no eval / new Function / setTimeout(string) anywhere in the command layer
 *  - no dangerouslySetInnerHTML — every cell is a React text node, so React
 *    escapes it
 *  - commands resolve through a Map, never object property lookup, so
 *    __proto__ / constructor / toString cannot reach a prototype member
 *  - hard caps on line length, token count and history depth bound memory
 *  - control characters (incl. ANSI escapes and bidi overrides) are stripped so
 *    a pasted payload cannot spoof output or visually reorder rendered text
 *  - outbound links are checked against an origin allowlist before render
 */

export const LIMITS = {
  /** Max characters accepted in the prompt. */
  INPUT: 220,
  /** Max characters accepted from a single paste event. */
  PASTE: 512,
  /** Max whitespace-delimited tokens parsed from one line. */
  TOKENS: 12,
  /** Max characters kept per token. */
  TOKEN_LEN: 64,
  /** Max scrollback lines retained. */
  SCROLLBACK: 400,
  /** Max commands retained in history. */
  HISTORY: 60,
  /** Sliding-window rate limit. */
  RATE_WINDOW_MS: 3000,
  RATE_MAX: 18,
} as const;

/*
 * These patterns are assembled from char codes rather than written as literals,
 * so this source file stays free of the very control bytes it filters.
 */
const ch = (code: number) => String.fromCharCode(code);
const span = (from: number, to: number) => `${ch(from)}-${ch(to)}`;

const ESC = ch(0x1b);
const BEL = ch(0x07);

/** ESC [ ... final-byte — CSI: colour, cursor movement, erase. */
const ANSI_CSI = new RegExp(`${ESC}\\[[0-?]*[ -/]*[@-~]`, 'g');
/** ESC ] ... (BEL | ESC \) — OSC: window title, embedded hyperlinks. */
const ANSI_OSC = new RegExp(`${ESC}\\][\\s\\S]*?(?:${BEL}|${ESC}\\\\)`, 'g');
/** Any surviving escape introducer. */
const ANSI_LOOSE = new RegExp(ESC, 'g');
/** C0 controls + DEL + C1 controls. */
const CONTROL = new RegExp(`[${span(0x00, 0x1f)}${span(0x7f, 0x9f)}]`, 'g');
/**
 * Zero-width chars, line/paragraph separators, bidi embeddings, overrides and
 * isolates, and the BOM — all of which can visually reorder or hide text.
 */
const INVISIBLE = new RegExp(
  `[${span(0x200b, 0x200f)}${span(0x2028, 0x202e)}${span(0x2060, 0x2064)}${span(0x2066, 0x2069)}${ch(0xfeff)}]`,
  'g',
);

/**
 * Strip control characters, ANSI escapes, bidi overrides and zero-width
 * characters, then hard-truncate. Ordinary printable text — including
 * non-Latin scripts and emoji — passes through unchanged.
 */
export function sanitize(raw: string): string {
  return raw
    .normalize('NFKC')
    .replace(ANSI_CSI, '')
    .replace(ANSI_OSC, '')
    .replace(ANSI_LOOSE, '')
    .replace(CONTROL, '')
    .replace(INVISIBLE, '')
    .slice(0, LIMITS.INPUT);
}

export type ParsedCommand = {
  name: string;
  args: string[];
  /** The sanitized line as typed, for echoing back into the scrollback. */
  raw: string;
};

/**
 * Split a sanitized line into a command name and bounded arguments.
 * Supports single/double quoted groups. There is no shell here, so `;`, `|`,
 * `&&`, `$()` and backticks are inert literal text — never interpreted, only
 * echoed.
 */
export function parse(input: string): ParsedCommand | null {
  const raw = sanitize(input).trim();
  if (!raw) return null;

  const tokens: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(raw)) !== null && tokens.length < LIMITS.TOKENS) {
    const value = m[1] ?? m[2] ?? m[3] ?? '';
    tokens.push(value.slice(0, LIMITS.TOKEN_LEN));
  }

  if (tokens.length === 0) return null;

  const name = tokens[0].toLowerCase().slice(0, 32);
  return { name, args: tokens.slice(1), raw };
}

/** Origins the terminal is permitted to link out to. */
const ALLOWED_ORIGINS = new Set([
  'https://github.com',
  'https://x.com',
  'https://www.linkedin.com',
  'https://www.youtube.com',
  'https://www.instagram.com',
  'https://zephryx.in',
  'https://attack.mitre.org',
]);

/** Internal routes the terminal is permitted to navigate to. */
export const ALLOWED_ROUTES = new Set([
  '/',
  '/whoami/',
  '/writeups/',
  '/cheatsheets/',
  '/detections/',
  '/matrix/',
  '/arsenal/',
  '/security/',
  '/connect/',
  '/handshake/',
]);

/**
 * Returns a safe href, or null. Rejects anything that is not https on an
 * allowlisted origin, or an allowlisted same-site route. This is what keeps
 * `javascript:`, `data:` and open-redirect style values out of the DOM.
 */
export function safeHref(value: string): string | null {
  if (value.startsWith('/')) {
    return ALLOWED_ROUTES.has(value) ? value : null;
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  if (!ALLOWED_ORIGINS.has(url.origin)) return null;
  return url.toString();
}

/** mailto: targets are restricted to our own domain. */
export function safeMailto(address: string): string | null {
  return /^[a-z0-9._-]+@zephryx\.in$/i.test(address) ? `mailto:${address}` : null;
}

/** Sliding-window limiter guarding against held-key and paste floods. */
export class RateLimiter {
  private hits: number[] = [];

  constructor(
    private readonly max: number = LIMITS.RATE_MAX,
    private readonly windowMs: number = LIMITS.RATE_WINDOW_MS,
  ) {}

  /** @returns true when the action is permitted. */
  allow(now = Date.now()): boolean {
    this.hits = this.hits.filter((t) => now - t < this.windowMs);
    if (this.hits.length >= this.max) return false;
    this.hits.push(now);
    return true;
  }
}
