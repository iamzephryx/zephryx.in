/**
 * zephryx.in — Cloudflare Worker entrypoint.
 *
 * This project deploys as a static Next.js export (`next build` -> ./out) served
 * by Workers Static Assets, with this single script handling the things static
 * assets can't: the /api/contact endpoint, redirects for retired routes, and
 * (optional) maintenance mode.
 *
 * wrangler.jsonc sets run_worker_first: true, so every request reaches fetch()
 * below. Anything that isn't /api/*, a redirect or a maintenance response falls
 * straight through to env.ASSETS.fetch(), which serves the static build
 * (including the automatic out/404.html for unmatched routes, and applies
 * out/_headers).
 *
 * Security posture for /api/contact (mirrors the previous Pages Function):
 *  - same-origin only (Origin/Referer checked against the deployment host).
 *    This stops a browser being used as the attacker's client; it is not an
 *    authentication check, because a header is trivially forged by anything
 *    that is not a browser. The rate limit below is what actually bounds abuse.
 *  - strict body-size cap + per-field length caps + type checks
 *  - honeypot field + submission time-trap (bots fill hidden fields, submit fast)
 *  - IP rate limit: KV-backed when the CONTACT_RL namespace is bound, falling
 *    back to a per-isolate limiter so the endpoint is never wide open
 *  - optional Cloudflare Turnstile verification when TURNSTILE_SECRET is set
 *  - all user content HTML-escaped before it ever reaches the email body
 *  - never reflects secrets; generic errors to the client, details to console
 *
 * Required environment (Worker → Settings → Variables and Secrets):
 *  - RESEND_API_KEY   (secret)  Resend API key
 *  - CONTACT_TO       inbox that receives messages   e.g. contact@zephryx.in
 *  - CONTACT_FROM     verified Resend sender          e.g. "Zephryx <noreply@zephryx.in>"
 * Optional:
 *  - TURNSTILE_SECRET Cloudflare Turnstile secret key
 *  - CONTACT_RL       KV namespace binding for rate limiting
 *  - MAINTENANCE      set to "on" to serve /503/ for every non-API request
 */

interface KVLike {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string, opts?: { expirationTtl?: number }) => Promise<void>;
}

interface AssetsFetcher {
  fetch: (input: Request | URL | string) => Promise<Response>;
}

interface Env {
  ASSETS: AssetsFetcher;
  RESEND_API_KEY?: string;
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
  TURNSTILE_SECRET?: string;
  CONTACT_RL?: KVLike;
  MAINTENANCE?: string;
}

type Body = {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
  company?: unknown; // honeypot
  elapsedMs?: unknown;
  turnstileToken?: unknown;
};

const LIMITS = {
  name: 80,
  email: 120,
  subject: 120,
  message: 4000,
  bodyBytes: 16 * 1024,
  minElapsedMs: 2500,
  rlWindowSec: 3600,
  rlMax: 5,
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Baseline headers for responses this Worker generates itself — the JSON API
 * results, the retired-route redirects. Static assets get the full policy from
 * out/_headers, but that file never applies to a response the Worker builds,
 * which left every /api/* reply without so much as HSTS.
 */
const BASE_SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
};

const withSecurityHeaders = (headers: Headers): Headers => {
  for (const [key, value] of Object.entries(BASE_SECURITY_HEADERS)) headers.set(key, value);
  return headers;
};

/**
 * Retired routes, mapped to whatever replaced them. A static export has no
 * server to answer for a path that no longer builds, so old links would hit
 * the 404 page instead; the Worker runs first, which makes this the only
 * place a permanent redirect can live.
 *
 * /connect merged into /handshake — one contact page, not two.
 */
const REDIRECTS: ReadonlyMap<string, string> = new Map([
  ['/connect', '/handshake/'],
  ['/connect/', '/handshake/'],
]);

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: withSecurityHeaders(
      new Headers({
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      }),
    ),
  });

const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  );

const str = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

/**
 * A single-line field on its way into a mail header. Resend takes JSON rather
 * than raw SMTP, so a newline here is not a header-injection primitive today —
 * but `subject` was reaching the Subject header with its control characters
 * intact, which is a dependency's escaping decision away from being one.
 * Collapse them at the boundary instead.
 */
const CONTROL_CHARS = new RegExp(
  `[${String.fromCharCode(0)}-${String.fromCharCode(0x1f)}${String.fromCharCode(0x7f)}]+`,
  'g',
);

const headerSafe = (v: string): string =>
  v.replace(CONTROL_CHARS, ' ').replace(/\s{2,}/g, ' ').trim();

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact' || url.pathname === '/api/contact/') {
      if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed.' }, 405);
      return handleContact(request, env);
    }

    if (url.pathname.startsWith('/api/')) {
      return json({ ok: false, error: 'Not found.' }, 404);
    }

    const moved = REDIRECTS.get(url.pathname);
    if (moved) {
      // Keep the query string: campaign tags and the like should survive the move.
      const target = new URL(moved, url.origin);
      target.search = url.search;
      return new Response(null, {
        status: 301,
        headers: withSecurityHeaders(
          new Headers({ location: target.toString(), 'cache-control': 'public, max-age=3600' }),
        ),
      });
    }

    if (env.MAINTENANCE === 'on') {
      // Reuse the statically-built /503/ page — including whatever out/_headers
      // applies to it — so the styling and headers stay in one place.
      const page = await env.ASSETS.fetch(new URL('/503/', url.origin));
      const headers = new Headers(page.headers);
      headers.set('retry-after', '3600');
      headers.set('cache-control', 'no-store');
      return new Response(page.body, { status: 503, headers });
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleContact(request: Request, env: Env): Promise<Response> {
  // --- origin check -------------------------------------------------------
  const host = request.headers.get('host') ?? '';
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const sameSite = (val: string | null): boolean => {
    if (!val) return false;
    try {
      return new URL(val).host === host;
    } catch {
      return false;
    }
  };
  if (!(sameSite(origin) || sameSite(referer))) {
    return json({ ok: false, error: 'Bad origin.' }, 403);
  }

  // --- size guard ---------------------------------------------------------
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > LIMITS.bodyBytes) {
    return json({ ok: false, error: 'Payload too large.' }, 413);
  }

  // --- parse --------------------------------------------------------------
  let body: Body;
  try {
    const raw = await request.text();
    // Measured in bytes, not UTF-16 code units: a body of multi-byte
    // characters is several times its `.length` on the wire, and a request
    // that omits content-length reaches this check as its only cap.
    if (new TextEncoder().encode(raw).length > LIMITS.bodyBytes) {
      return json({ ok: false, error: 'Payload too large.' }, 413);
    }
    body = JSON.parse(raw) as Body;
  } catch {
    return json({ ok: false, error: 'Malformed request.' }, 400);
  }

  // name and subject end up in mail headers; message is a body and keeps its
  // line breaks.
  const name = headerSafe(str(body.name, LIMITS.name));
  const email = str(body.email, LIMITS.email);
  const subject = headerSafe(str(body.subject, LIMITS.subject));
  const message = str(body.message, LIMITS.message);
  const honeypot = str(body.company, 100);

  /*
   * The time-trap only means anything if a missing or nonsensical value counts
   * against the sender. Previously the check was `elapsedMs > 0 && elapsedMs <
   * min`, so omitting the field, or sending 0, a negative number or a string,
   * skipped the trap entirely — which is precisely what a script does and a
   * real form never does, since ContactForm always sends a positive integer.
   */
  const elapsedMs =
    typeof body.elapsedMs === 'number' && Number.isFinite(body.elapsedMs) ? body.elapsedMs : -1;
  const tooFast = elapsedMs < LIMITS.minElapsedMs;

  // --- silent bot rejection ----------------------------------------------
  if (honeypot.length > 0 || tooFast) {
    return json({ ok: true });
  }

  /*
   * Rate limit before anything that costs money or makes a subrequest. It used
   * to sit after the DNS check and Turnstile, so an unauthenticated caller
   * could drive unbounded outbound lookups regardless of the cap.
   */
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  if (!(await allowRequest(env, ip))) {
    return json({ ok: false, error: 'Too many messages. Try again later.' }, 429);
  }

  // --- validation ---------------------------------------------------------
  if (name.length < 2) return json({ ok: false, error: 'Name is required.' }, 422);
  if (!EMAIL_RE.test(email)) return json({ ok: false, error: 'A valid email is required.' }, 422);
  if (message.length < 20) return json({ ok: false, error: 'Message is too short.' }, 422);

  if (!(await domainAcceptsMail(email))) {
    return json(
      { ok: false, error: "That email domain doesn't appear to accept mail — check for a typo." },
      422,
    );
  }

  // --- Turnstile (optional) ----------------------------------------------
  if (env.TURNSTILE_SECRET) {
    const token = str(body.turnstileToken, 2048);
    const ok = await verifyTurnstile(env.TURNSTILE_SECRET, token, request.headers.get('cf-connecting-ip'));
    if (!ok) return json({ ok: false, error: 'Human verification failed.' }, 403);
  }

  // --- config guard --------------------------------------------------------
  if (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM) {
    console.error('contact: missing RESEND_API_KEY / CONTACT_TO / CONTACT_FROM');
    return json(
      { ok: false, error: 'Mail channel not configured. Email contact@zephryx.in directly.' },
      503,
    );
  }

  // --- deliver --------------------------------------------------------------
  const safeSubject = subject || `New message from ${name}`;
  const html = renderEmail({ name, email, subject: safeSubject, message, ip });
  const text = `From: ${name} <${email}>\nSubject: ${safeSubject}\nIP: ${ip}\n\n${message}`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM,
        to: [env.CONTACT_TO],
        reply_to: email,
        subject: `[zephryx.in] ${safeSubject}`,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('resend error', res.status, detail);
      return json({ ok: false, error: 'Delivery failed. Please email contact@zephryx.in.' }, 502);
    }
  } catch (e) {
    console.error('resend fetch failed', e);
    return json({ ok: false, error: 'Delivery failed. Please email contact@zephryx.in.' }, 502);
  }

  return json({ ok: true });
}

/**
 * Per-isolate fallback counters, used when no KV namespace is bound.
 *
 * This is deliberately not a substitute for the KV limiter: Cloudflare runs
 * many isolates, so a determined flood spread across colos still gets more than
 * `rlMax` through. It exists because the alternative — what shipped before —
 * was no limit at all whenever CONTACT_RL was unset, which is the default state
 * of the deployment (wrangler.jsonc binds no namespace, and DEPLOY.md lists the
 * binding as optional). An unauthenticated caller could therefore send
 * unlimited mail through the Resend account, bounded only by a forgeable Origin
 * header. A best-effort cap turns that into work; KV turns it into a real one.
 */
const memoryHits = new Map<string, number[]>();
let warnedNoKv = false;

function allowInMemory(ip: string, now = Date.now()): boolean {
  const windowMs = LIMITS.rlWindowSec * 1000;
  const recent = (memoryHits.get(ip) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= LIMITS.rlMax) {
    memoryHits.set(ip, recent);
    return false;
  }

  recent.push(now);
  memoryHits.set(ip, recent);

  // Bound the map: an isolate is short-lived, but not so short that a spray
  // across many source IPs cannot grow this without a sweep.
  if (memoryHits.size > 2048) {
    for (const [key, hits] of memoryHits) {
      if (hits.every((t) => now - t >= windowMs)) memoryHits.delete(key);
    }
  }

  return true;
}

/** @returns true when the sender is under the cap. */
async function allowRequest(env: Env, ip: string): Promise<boolean> {
  if (!env.CONTACT_RL) {
    if (!warnedNoKv) {
      warnedNoKv = true;
      console.warn(
        'contact: CONTACT_RL is not bound — falling back to a per-isolate rate limit. ' +
          'Bind a KV namespace (see DEPLOY.md) for a durable cap.',
      );
    }
    return allowInMemory(ip);
  }

  const key = `rl:${ip}`;
  try {
    const stored = Number(await env.CONTACT_RL.get(key));
    // A missing key reads as null -> NaN; treat anything unparseable as zero
    // rather than letting NaN comparisons silently pass the cap.
    const count = Number.isFinite(stored) && stored > 0 ? stored : 0;
    if (count >= LIMITS.rlMax) return false;
    await env.CONTACT_RL.put(key, String(count + 1), { expirationTtl: LIMITS.rlWindowSec });
  } catch (e) {
    // KV unavailable: fall back rather than either dropping the cap or
    // rejecting a genuine message outright.
    console.error('contact: rate-limit store failed', e);
    return allowInMemory(ip);
  }

  // KV is eventually consistent and read-then-write is not atomic, so a burst
  // of concurrent requests can share a stale count. The isolate-local counter
  // closes that window for the common case of a single flooding connection.
  return allowInMemory(ip);
}

async function verifyTurnstile(secret: string, token: string, ip: string | null): Promise<boolean> {
  if (!token) return false;
  try {
    const form = new FormData();
    form.append('secret', secret);
    form.append('response', token);
    if (ip) form.append('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

/**
 * Confirms the email's domain can plausibly receive mail at all, catching
 * typos and made-up domains without claiming to verify the specific mailbox
 * or that the visitor owns it. Checks MX first, then falls back to A/AAAA
 * per RFC 5321 (a domain with no MX can still receive mail at its host
 * record). Fails open on lookup errors/timeouts — a degraded DNS check
 * should never block a genuine message.
 */
async function domainAcceptsMail(email: string): Promise<boolean> {
  const domain = email.split('@')[1];
  if (!domain) return false;

  /*
   * Three outcomes, not two. Collapsing "the resolver said no records" and
   * "the resolver did not answer" into a single `false` is what made the
   * fail-open promise above untrue: a 429 or 5xx from the DoH endpoint — which
   * is exactly what a shared Workers egress range attracts — made every lookup
   * return false, and every visitor was told their address had a typo.
   */
  type Lookup = 'records' | 'none' | 'unavailable';

  const lookup = async (type: 'MX' | 'A' | 'AAAA'): Promise<Lookup> => {
    // Per-lookup budget. A single shared 3s deadline across three sequential
    // calls left the later ones with whatever the first had not spent.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      const res = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`,
        { headers: { accept: 'application/dns-json' }, signal: controller.signal },
      );
      if (!res.ok) return 'unavailable';
      const data = (await res.json()) as { Status?: number; Answer?: unknown[] };
      // NXDOMAIN (3) is a real answer: the domain does not exist.
      if (data.Status === 3) return 'none';
      if (typeof data.Status === 'number' && data.Status !== 0) return 'unavailable';
      return Array.isArray(data.Answer) && data.Answer.length > 0 ? 'records' : 'none';
    } catch {
      return 'unavailable';
    } finally {
      clearTimeout(timeout);
    }
  };

  let degraded = false;
  for (const type of ['MX', 'A', 'AAAA'] as const) {
    const result = await lookup(type);
    if (result === 'records') return true;
    if (result === 'unavailable') degraded = true;
  }

  // Only reject when the resolver actually answered for every type and none of
  // them produced a record. A degraded check never blocks a genuine message.
  if (degraded) {
    console.warn('contact: DNS check degraded, accepting without verification');
    return true;
  }
  return false;
}

function renderEmail(v: {
  name: string;
  email: string;
  subject: string;
  message: string;
  ip: string;
}): string {
  const n = escapeHtml(v.name);
  const e = escapeHtml(v.email);
  const s = escapeHtml(v.subject);
  const m = escapeHtml(v.message).replace(/\n/g, '<br>');
  const ip = escapeHtml(v.ip);
  return `<!doctype html>
<html>
  <body style="margin:0;background:#06070a;font-family:ui-monospace,Menlo,monospace;color:#e8ebef;padding:24px">
    <table role="presentation" style="max-width:560px;margin:0 auto;border:1px solid #1c2230;background:#0a0c11">
      <tr><td style="border-bottom:1px solid #1c2230;padding:14px 20px;color:#ff2d4b;font-weight:bold">
        zephryx.in — new handshake
      </td></tr>
      <tr><td style="padding:20px">
        <p style="margin:0 0 6px"><span style="color:#5c6675">from</span> ${n} &lt;${e}&gt;</p>
        <p style="margin:0 0 6px"><span style="color:#5c6675">subject</span> ${s}</p>
        <p style="margin:0 0 16px"><span style="color:#5c6675">ip</span> ${ip}</p>
        <div style="border-top:1px solid #1c2230;padding-top:16px;line-height:1.7;color:#98a1af">${m}</div>
      </td></tr>
      <tr><td style="border-top:1px solid #1c2230;padding:12px 20px;color:#5c6675;font-size:12px">
        Reply directly to this email to reach ${n}.
      </td></tr>
    </table>
  </body>
</html>`;
}
