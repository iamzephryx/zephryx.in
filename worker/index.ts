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
 *  - honeypot field + submission time-trap (bots fill hidden fields, submit fast)
 *  - optional Cloudflare Turnstile verification when TURNSTILE_SECRET is set
 *  - optional KV-backed IP rate limit when the CONTACT_RL namespace is bound
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
 * Retired routes, mapped to whatever replaced them. A static export has no
 * server to answer for a path that no longer builds, so old links would hit
 * the 404 page instead; the Worker runs first, which makes this the only
 * place a permanent redirect can live.
 *
 * /connect and /contact merged into /handshake — one contact page, not two.
 */
const REDIRECTS: ReadonlyMap<string, string> = new Map([
  ['/connect', '/handshake/'],
  ['/connect/', '/handshake/'],
  ['/contact', '/handshake/'],
  ['/contact/', '/handshake/'],
]);

/**
 * Whole route trees that moved to a sibling domain.
 *
 * The research corpus — writeups, the detection library, the ATT&CK board and
 * the search that spans them — now lives on writeups.zephryx.in. The exact
 * match map above cannot express that: every writeup and detection slug would
 * have to be enumerated by hand, and a slug published tomorrow would 404 until
 * somebody remembered to add it. Matching on the prefix covers the index, every
 * current slug and every future one.
 *
 * Paths are preserved verbatim across the move (/writeups/foo/ is
 * /writeups/foo/ on the new host), which is what makes this a host swap rather
 * than a URL migration — every inbound link and search result keeps working.
 *
 * /feed.xml goes too: it only ever carried writeups and detections, and the
 * subscribers polling it should follow the content rather than watch it go
 * quiet.
 */
const MOVED_PREFIXES: ReadonlyArray<{ prefix: string; host: string }> = [
  { prefix: '/writeups', host: 'https://writeups.zephryx.in' },
  { prefix: '/detections', host: 'https://writeups.zephryx.in' },
  { prefix: '/matrix', host: 'https://writeups.zephryx.in' },
  { prefix: '/search', host: 'https://writeups.zephryx.in' },
  { prefix: '/feed.xml', host: 'https://writeups.zephryx.in' },
];

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

    // Checked after the exact-match table so a specific rename always wins over
    // a broad tree move, and before ASSETS so these paths never reach the 404.
    const movedTree = MOVED_PREFIXES.find(
      (m) => url.pathname === m.prefix || url.pathname.startsWith(`${m.prefix}/`),
    );
    if (movedTree) {
      const target = new URL(url.pathname, movedTree.host);
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
  const elapsedMs = typeof body.elapsedMs === 'number' ? body.elapsedMs : 0;

  // --- silent bot rejection ----------------------------------------------
  if (honeypot.length > 0 || (elapsedMs > 0 && elapsedMs < LIMITS.minElapsedMs)) {
    return json({ ok: true });
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

  // --- rate limit (optional, KV-backed) ----------------------------------
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  if (env.CONTACT_RL) {
    const key = `rl:${ip}`;
    const count = Number((await env.CONTACT_RL.get(key)) ?? '0');
    if (count >= LIMITS.rlMax) {
      return json({ ok: false, error: 'Too many messages. Try again later.' }, 429);
    }
    await env.CONTACT_RL.put(key, String(count + 1), { expirationTtl: LIMITS.rlWindowSec });
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  const hasRecords = async (type: 'MX' | 'A' | 'AAAA'): Promise<boolean> => {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`,
      { headers: { accept: 'application/dns-json' }, signal: controller.signal },
    );
    if (!res.ok) return false;
    const data = (await res.json()) as { Answer?: unknown[] };
    return Array.isArray(data.Answer) && data.Answer.length > 0;
  };

  try {
    if (await hasRecords('MX')) return true;
    if (await hasRecords('A')) return true;
    if (await hasRecords('AAAA')) return true;
    return false;
  } catch {
    return true;
  } finally {
    clearTimeout(timeout);
  }
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
