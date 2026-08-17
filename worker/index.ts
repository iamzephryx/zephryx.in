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
 *  - same-origin only (Origin/Referer checked against the deployment host)
 *  - strict body-size cap + per-field length caps + type checks
 *  - honeypot field + submission time-trap (bots fill hidden fields, submit fast,
 *    or — the case this used to miss — omit the timing field altogether)
 *  - optional Cloudflare Turnstile verification when TURNSTILE_SECRET is set
 *  - per-IP rate limit, always enforced: KV-backed when the CONTACT_RL namespace
 *    is bound, otherwise a weaker per-isolate counter. It runs before the DNS
 *    lookup, Turnstile and delivery, so no unauthenticated caller can drive an
 *    unbounded number of outbound subrequests
 *  - all user content HTML-escaped before it ever reaches the email body
 *  - never reflects secrets; generic errors to the client, details to console
 *
 * Required environment (Worker → Settings → Variables and Secrets):
 *  - RESEND_API_KEY   (secret)  Resend API key
 *  - CONTACT_TO       inbox that receives messages   e.g. contact@zephryx.in
 *  - CONTACT_FROM     verified Resend sender          e.g. "Zephryx <noreply@zephryx.in>"
 * Optional:
 *  - TURNSTILE_SECRET Cloudflare Turnstile secret key
 *  - CONTACT_RL       KV namespace binding. Strongly recommended: without it the
 *                     rate limit falls back to a per-isolate counter that resets
 *                     on cold start and is not shared across colos.
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
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });

const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  );

const str = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

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
        headers: { location: target.toString(), 'cache-control': 'public, max-age=3600' },
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
    if (raw.length > LIMITS.bodyBytes) return json({ ok: false, error: 'Payload too large.' }, 413);
    body = JSON.parse(raw) as Body;
  } catch {
    return json({ ok: false, error: 'Malformed request.' }, 400);
  }

  const name = str(body.name, LIMITS.name);
  const email = str(body.email, LIMITS.email);
  const subject = str(body.subject, LIMITS.subject);
  const message = str(body.message, LIMITS.message);
  const honeypot = str(body.company, 100);

  // --- silent bot rejection ----------------------------------------------
  // The form always sends elapsedMs, so a submission without a usable one did
  // not come from the form. Absent, non-numeric, NaN/Infinity and negative
  // values are all treated as signals rather than waved through: reading this
  // as `elapsedMs > 0 && elapsedMs < min` let a caller skip the trap entirely
  // by omitting the field.
  const elapsedMs =
    typeof body.elapsedMs === 'number' && Number.isFinite(body.elapsedMs) ? body.elapsedMs : null;
  if (honeypot.length > 0 || elapsedMs === null || elapsedMs < LIMITS.minElapsedMs) {
    return json({ ok: true });
  }

  // --- validation ---------------------------------------------------------
  if (name.length < 2) return json({ ok: false, error: 'Name is required.' }, 422);
  if (!EMAIL_RE.test(email)) return json({ ok: false, error: 'A valid email is required.' }, 422);
  if (message.length < 20) return json({ ok: false, error: 'Message is too short.' }, 422);

  // --- rate limit ---------------------------------------------------------
  // Ahead of the DNS lookup, Turnstile and delivery: everything below this
  // point spends an outbound subrequest, and the caller is not authenticated
  // (the Origin check stops a browser being used as someone else's client, but
  // any direct client sets that header freely). Nothing past here should be
  // reachable an unbounded number of times.
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  if (!(await underRateLimit(env, ip))) {
    return json({ ok: false, error: 'Too many messages. Try again later.' }, 429);
  }

  // --- Turnstile (optional) ----------------------------------------------
  if (env.TURNSTILE_SECRET) {
    const token = str(body.turnstileToken, 2048);
    const ok = await verifyTurnstile(env.TURNSTILE_SECRET, token, request.headers.get('cf-connecting-ip'));
    if (!ok) return json({ ok: false, error: 'Human verification failed.' }, 403);
  }

  if (!(await domainAcceptsMail(email))) {
    return json(
      { ok: false, error: "That email domain doesn't appear to accept mail — check for a typo." },
      422,
    );
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
 * Per-IP submission counter, held in the isolate rather than KV.
 *
 * A Worker isolate is per-colo and can be evicted at any time, so this is
 * strictly weaker than the KV limiter: a caller who lands on a fresh isolate
 * starts from zero. It exists because the alternative — the deployed default
 * before this — was no limit at all, and an unlimited path into the mail
 * sender is worse than a limit that occasionally resets.
 */
const isolateHits = new Map<string, { count: number; resetAt: number }>();
/** Bound on isolate memory. Well past a real visitor population for this site. */
const ISOLATE_HITS_MAX = 10_000;
let warnedNoKv = false;

/**
 * Returns false when this IP has spent its allowance for the window. Counts the
 * request when it is allowed, so the caller must only invoke this once, and
 * only for a request it is about to spend subrequests on.
 *
 * Fails open on a KV error: a storage blip should not take the contact form
 * down, and the isolate counter below is not a safe fallback to promote to
 * primary (a KV outage would otherwise become a lockout).
 */
async function underRateLimit(env: Env, ip: string): Promise<boolean> {
  if (env.CONTACT_RL) {
    const key = `rl:${ip}`;
    try {
      const stored = await env.CONTACT_RL.get(key);
      // A missing key is a first request; anything unparseable is treated the
      // same way rather than left to become NaN, which compares false against
      // the cap and would sail past the limit indefinitely.
      const parsed = stored === null ? 0 : Number(stored);
      const count = Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
      if (count >= LIMITS.rlMax) return false;
      await env.CONTACT_RL.put(key, String(count + 1), { expirationTtl: LIMITS.rlWindowSec });
      return true;
    } catch (e) {
      console.error('contact: KV rate limit unavailable, allowing request', e);
      return true;
    }
  }

  if (!warnedNoKv) {
    warnedNoKv = true;
    console.warn(
      'contact: CONTACT_RL is not bound — falling back to a per-isolate counter, which ' +
        'resets on cold start and is not shared across colos. Bind the KV namespace ' +
        '(see DEPLOY.md) for a real limit.',
    );
  }

  const now = Date.now();
  const windowMs = LIMITS.rlWindowSec * 1000;
  const entry = isolateHits.get(ip);

  if (!entry || entry.resetAt <= now) {
    if (isolateHits.size >= ISOLATE_HITS_MAX) {
      for (const [key, value] of isolateHits) {
        if (value.resetAt <= now) isolateHits.delete(key);
      }
      // Still full of live windows — drop the oldest insertion to stay bounded.
      if (isolateHits.size >= ISOLATE_HITS_MAX) {
        const oldest = isolateHits.keys().next();
        if (!oldest.done) isolateHits.delete(oldest.value);
      }
    }
    isolateHits.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= LIMITS.rlMax) return false;
  entry.count += 1;
  return true;
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

/** DoH RCODE 3 — the name definitively does not exist. A real answer, not a failure. */
const DNS_NXDOMAIN = 3;
/**
 * Per-lookup budget, applied to each call rather than shared across all three —
 * one 3s AbortController spanning three sequential lookups meant a slow MX
 * query left nothing for the A/AAAA fallback. DNS_TOTAL_MS still bounds the
 * whole check so a visitor never waits three full timeouts.
 */
const DNS_TIMEOUT_MS = 3000;
const DNS_TOTAL_MS = 5000;

/** What one lookup established: the domain has records, has none, or we couldn't tell. */
type LookupResult = 'records' | 'none' | 'unavailable';

/**
 * One DoH query. The distinction that matters is between "the resolver
 * answered and there is nothing there" and "the resolver did not answer" —
 * collapsing those into a boolean is what made a resolver 429 or 5xx look
 * identical to a made-up domain.
 */
async function lookup(
  domain: string,
  type: 'MX' | 'A' | 'AAAA',
  budgetMs: number,
): Promise<LookupResult> {
  if (budgetMs <= 0) return 'unavailable';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.min(DNS_TIMEOUT_MS, budgetMs));
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`,
      { headers: { accept: 'application/dns-json' }, signal: controller.signal },
    );
    if (!res.ok) {
      console.warn(`contact: DoH ${type} lookup for ${domain} returned ${res.status}`);
      return 'unavailable';
    }
    const data = (await res.json()) as { Status?: unknown; Answer?: unknown[] };
    if (data.Status === DNS_NXDOMAIN) return 'none';
    if (typeof data.Status === 'number' && data.Status !== 0) return 'unavailable';
    return Array.isArray(data.Answer) && data.Answer.length > 0 ? 'records' : 'none';
  } catch (e) {
    console.warn(`contact: DoH ${type} lookup for ${domain} failed`, e);
    return 'unavailable';
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Confirms the email's domain can plausibly receive mail at all, catching
 * typos and made-up domains without claiming to verify the specific mailbox
 * or that the visitor owns it. Checks MX first, then falls back to A/AAAA
 * per RFC 5321 (a domain with no MX can still receive mail at its host
 * record).
 *
 * Fails open, and now actually does: the address is only rejected when the
 * resolver gave a real answer for every record type and every one of them was
 * empty. Previously any non-2xx — a DoH throttle, a 5xx — read as "no records"
 * and rejected every submission with a message blaming the visitor's address.
 * Workers egress shares IP space with a lot of traffic, so that is not a
 * hypothetical failure mode.
 *
 * Exported for testing against a stubbed resolver; the runtime only ever calls
 * the default export.
 */
export async function domainAcceptsMail(email: string): Promise<boolean> {
  const domain = email.split('@')[1];
  if (!domain) return false;

  const deadline = Date.now() + DNS_TOTAL_MS;
  let answered = true;
  for (const type of ['MX', 'A', 'AAAA'] as const) {
    const result = await lookup(domain, type, deadline - Date.now());
    if (result === 'records') return true;
    if (result === 'unavailable') answered = false;
  }

  // Every type answered, every one of them empty: a genuine dead domain.
  // Otherwise the check is degraded and must not stand in the way.
  if (!answered) {
    console.warn(`contact: DNS check degraded for ${domain}, accepting the address`);
  }
  return !answered;
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
