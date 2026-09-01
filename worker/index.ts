/**
 * zephryx.in — Cloudflare Worker entrypoint.
 *
 * This project deploys as a static Next.js export (`next build` -> ./out) served
 * by Workers Static Assets, with this single script handling the things static
 * assets can't: the /api/contact and /api/quote endpoints, plus an optional
 * switch that stops them accepting submissions.
 *
 * wrangler.jsonc sets run_worker_first: ["/api/*"], so this script runs for the
 * two form endpoints and nothing else. Every content route is served by the
 * asset layer without executing a line of this file — which means a parse error
 * or a module-scope throw here cannot take the site down. That is a failure the
 * try/catch in fetch() cannot catch, because the module never finishes
 * evaluating, and it is the reason the scope is worth narrowing.
 *
 * Two things used to live here and had to move before that was possible:
 *
 *   REDIRECTS    /connect and /contact -> /handshake/. Now in public/_redirects,
 *                applied by the asset layer. Query strings survive.
 *   MAINTENANCE  used to serve /503/ for every non-API path. It cannot see a
 *                content request any more, so it now gates the input endpoints
 *                instead — see the check at the top of route().
 *
 * The try/catch still matters for everything inside a request: an unexpected
 * throw serves the static asset rather than failing, so a bug in the quote
 * handler cannot 500 a page that only needed a file.
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
 *  - MAINTENANCE      set to "on" to 503 the /api/* endpoints (submissions
 *                     off; the static site stays up)
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
  // --- commercial zone: /services/request/ posts to /api/quote ---
  LEAD_TO?: string;
  LEAD_FROM?: string;
  /** Durable record of a lead. Written BEFORE the notification email is sent. */
  LEADS?: KVLike;
  LEADS_RL?: KVLike;
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

/** POST body for /api/quote — the commercial zone's scoped-engagement form. */
type QuoteBody = {
  name?: unknown;
  email?: unknown;
  company?: unknown;
  companySize?: unknown;
  services?: unknown;
  message?: unknown;
  hp?: unknown; // honeypot
  elapsedMs?: unknown;
};

/**
 * Shared caps for both input endpoints.
 *
 * /api/contact and /api/quote were separate Workers carrying separate copies of
 * this table, with identical values for every field they had in common. One
 * table means a cap can no longer drift between them. Mirror any change in
 * ContactForm.tsx and QuoteForm.tsx so the client fails fast and identically.
 */
const LIMITS = {
  name: 80,
  email: 120,
  message: 4000,
  bodyBytes: 16 * 1024,
  minElapsedMs: 2500,
  rlWindowSec: 3600,
  rlMax: 5,
  /** contact only */
  subject: 120,
  /** quote only */
  company: 100,
  companySize: 20,
  maxServices: 8,
  serviceIdLen: 60,
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;



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

/** Loose id shape check — the real allow-list lives in src/lib/site.ts SERVICES;
 * this only guards against garbage/oversized values reaching storage or email. */
const SERVICE_ID_RE = /^[a-z0-9-]{1,60}$/;

const services = (v: unknown): string[] => {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const item of v) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim().slice(0, LIMITS.serviceIdLen);
    if (SERVICE_ID_RE.test(trimmed)) out.push(trimmed);
    if (out.length >= LIMITS.maxServices) break;
  }
  return out;
};


export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await route(request, env);
    } catch (err) {
      // Every request currently passes through this script (run_worker_first:
      // true), so an unhandled throw anywhere above would otherwise take down
      // pages that need no worker logic at all. Serving the static asset is
      // strictly better than a 500 on a page that was only ever going to be a
      // static file. The API paths are excluded because a silent fall-through
      // there would render the SPA shell in response to a POST, which reads as
      // success to a form handler.
      console.error('worker: unhandled error, falling through to assets', err);
      const { pathname } = new URL(request.url);
      if (pathname.startsWith('/api/')) {
        return json({ ok: false, error: 'Something went wrong. Please try again.' }, 500);
      }
      return env.ASSETS.fetch(request);
    }
  },
};

async function route(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Maintenance now means "stop accepting submissions", not "take the site
    // down". run_worker_first is scoped to /api/*, so this script never sees a
    // content request and could not serve a 503 for one even if it wanted to —
    // leaving the old whole-site behaviour here would be a switch that silently
    // did nothing. Gating the two input endpoints is what it can still do, and
    // it is the more useful half: a static site has no reason to go dark
    // because Resend or KV is having a bad day, but it should stop taking form
    // submissions it cannot durably record.
    //
    // To take the whole site down, use a Cloudflare rule at the edge — see
    // docs/redirects.md.
    if (env.MAINTENANCE === 'on' && url.pathname.startsWith('/api/')) {
      return json(
        { ok: false, error: 'Temporarily unavailable. Please try again shortly.' },
        503,
      );
    }

    if (url.pathname === '/api/contact' || url.pathname === '/api/contact/') {
      if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed.' }, 405);
      return handleContact(request, env);
    }

    if (url.pathname === '/api/quote' || url.pathname === '/api/quote/') {
      if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed.' }, 405);
      return handleQuote(request, env);
    }

    if (url.pathname.startsWith('/api/')) {
      return json({ ok: false, error: 'Not found.' }, 404);
    }

    // Unreachable while run_worker_first is ["/api/*"] — the check above catches
    // every path this script is invoked for. Kept deliberately: it is the
    // correct behaviour if the scope is ever widened, and a fallthrough that
    // serves the asset is a better failure than one that falls off the end of
    // the function.
    return env.ASSETS.fetch(request);
}

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

async function handleQuote(request: Request, env: Env): Promise<Response> {
  // --- origin check -------------------------------------------------------
  const host = request.headers.get('host') ?? '';
  const sameSite = (val: string | null): boolean => {
    if (!val) return false;
    try {
      return new URL(val).host === host;
    } catch {
      return false;
    }
  };
  if (!(sameSite(request.headers.get('origin')) || sameSite(request.headers.get('referer')))) {
    return json({ ok: false, error: 'Bad origin.' }, 403);
  }

  // --- size guard ---------------------------------------------------------
  if (Number(request.headers.get('content-length') ?? '0') > LIMITS.bodyBytes) {
    return json({ ok: false, error: 'Payload too large.' }, 413);
  }

  // --- parse --------------------------------------------------------------
  let body: QuoteBody;
  try {
    const raw = await request.text();
    if (raw.length > LIMITS.bodyBytes) return json({ ok: false, error: 'Payload too large.' }, 413);
    body = JSON.parse(raw) as QuoteBody;
  } catch {
    return json({ ok: false, error: 'Malformed request.' }, 400);
  }

  const name = str(body.name, LIMITS.name);
  const email = str(body.email, LIMITS.email);
  const company = str(body.company, LIMITS.company);
  const companySize = str(body.companySize, LIMITS.companySize);
  const wantedServices = services(body.services);
  const message = str(body.message, LIMITS.message);
  const honeypot = str(body.hp, 100);
  const elapsedMs = typeof body.elapsedMs === 'number' ? body.elapsedMs : 0;

  // --- silent bot rejection ----------------------------------------------
  if (honeypot.length > 0 || (elapsedMs > 0 && elapsedMs < LIMITS.minElapsedMs)) {
    return json({ ok: true });
  }

  // --- validation ---------------------------------------------------------
  if (name.length < 2) return json({ ok: false, error: 'Name is required.' }, 422);
  if (!EMAIL_RE.test(email)) return json({ ok: false, error: 'A valid work email is required.' }, 422);
  if (message.length < 20) return json({ ok: false, error: 'Give a bit more detail on scope.' }, 422);

  if (!(await domainAcceptsMail(email))) {
    return json(
      { ok: false, error: "That email domain doesn't appear to accept mail — check for a typo." },
      422,
    );
  }

  // --- rate limit (optional, KV-backed) ----------------------------------
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  if (env.LEADS_RL) {
    const key = `rl:${ip}`;
    const count = Number((await env.LEADS_RL.get(key)) ?? '0');
    if (count >= LIMITS.rlMax) {
      return json({ ok: false, error: 'Too many requests. Try again later.' }, 429);
    }
    await env.LEADS_RL.put(key, String(count + 1), { expirationTtl: LIMITS.rlWindowSec });
  }

  // --- persist ------------------------------------------------------------
  // This is the durable record; the email below is only a notification, so a
  // mail failure must not lose a real business inquiry.
  let stored = false;
  if (env.LEADS) {
    try {
      await env.LEADS.put(
        `lead:${Date.now()}:${email.toLowerCase()}`,
        JSON.stringify({ name, email, company, companySize, services: wantedServices, message, ip, at: new Date().toISOString() }),
      );
      stored = true;
    } catch (e) {
      console.error('leads kv put failed', e);
    }
  }

  // --- notify --------------------------------------------------------------
  if (!env.RESEND_API_KEY || !env.LEAD_TO || !env.LEAD_FROM) {
    console.error('quote: missing RESEND_API_KEY / LEAD_TO / LEAD_FROM');
    if (stored) return json({ ok: true });
    return json(
      { ok: false, error: 'Request channel not configured. Email hello@security.zephryx.in directly.' },
      503,
    );
  }

  const html = renderQuoteEmail({ name, email, company, companySize, services: wantedServices, message, ip });
  const text = `New assessment request\n\nName: ${name}\nEmail: ${email}\nCompany: ${company || '(not given)'}\nSize: ${companySize || '(not given)'}\nServices: ${wantedServices.join(', ') || '(none selected)'}\nIP: ${ip}\n\nScope:\n${message}`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: env.LEAD_FROM,
        to: [env.LEAD_TO],
        reply_to: email,
        subject: `[security] assessment request — ${company || name}`,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('resend error', res.status, detail);
      if (stored) return json({ ok: true });
      return json({ ok: false, error: 'Send failed. Please email hello@security.zephryx.in.' }, 502);
    }
  } catch (e) {
    console.error('resend fetch failed', e);
    if (stored) return json({ ok: true });
    return json({ ok: false, error: 'Send failed. Please email hello@security.zephryx.in.' }, 502);
  }

  return json({ ok: true });
}

/**
 * Confirms the email's domain can plausibly receive mail at all, catching
 * typos and made-up domains without claiming to verify the specific mailbox.
 * Checks MX first, then falls back to A/AAAA per RFC 5321. Fails open on
 * lookup errors — a degraded DNS check should never turn away a real lead.
 */

function renderQuoteEmail(v: {
  name: string;
  email: string;
  company: string;
  companySize: string;
  services: string[];
  message: string;
  ip: string;
}): string {
  const n = escapeHtml(v.name);
  const e = escapeHtml(v.email);
  const c = escapeHtml(v.company || '(not given)');
  const cs = escapeHtml(v.companySize || '(not given)');
  const svc = escapeHtml(v.services.join(', ') || '(none selected)');
  const m = escapeHtml(v.message).replace(/\n/g, '<br>');
  const ip = escapeHtml(v.ip);
  return `<!doctype html>
<html>
  <body style="margin:0;background:#06070a;font-family:ui-monospace,Menlo,monospace;color:#e8ebef;padding:24px">
    <table role="presentation" style="max-width:560px;margin:0 auto;border:1px solid #1c2230;background:#0a0c11">
      <tr><td style="border-bottom:1px solid #1c2230;padding:14px 20px;color:#ff2d4b;font-weight:bold">
        security.zephryx.in — assessment request
      </td></tr>
      <tr><td style="padding:20px">
        <p style="margin:0 0 6px"><span style="color:#5c6675">name</span> ${n}</p>
        <p style="margin:0 0 6px"><span style="color:#5c6675">email</span> ${e}</p>
        <p style="margin:0 0 6px"><span style="color:#5c6675">company</span> ${c}</p>
        <p style="margin:0 0 6px"><span style="color:#5c6675">size</span> ${cs}</p>
        <p style="margin:0 0 16px"><span style="color:#5c6675">ip</span> ${ip}</p>
        <p style="margin:0 0 6px;color:#5c6675">services requested</p>
        <p style="margin:0 0 16px">${svc}</p>
        <div style="border-top:1px solid #1c2230;padding-top:16px;line-height:1.7;color:#98a1af">
          <span style="color:#5c6675">scope</span><br>${m}
        </div>
      </td></tr>
      <tr><td style="border-top:1px solid #1c2230;padding:12px 20px;color:#5c6675;font-size:12px">
        Reply directly to this email to reach ${n}.
      </td></tr>
    </table>
  </body>
</html>`;
}
