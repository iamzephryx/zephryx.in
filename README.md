# zephryx.in

Offensive-security portfolio for **Zephryx** — Red Team operator, SOC analyst &
threat hunter. Dark, oxidised-red, terminal-grade. Static-exported Next.js on
Cloudflare Pages with a hardened interactive shell and a serverless contact form.

## Stack

- **Next.js 15** (App Router) — `output: 'export'` → fully static `./out`
- **Tailwind CSS v4** — design tokens in `src/app/globals.css` (`@theme`)
- **TypeScript**, self-hosted fonts (JetBrains Mono + Inter via `next/font`)
- **Cloudflare Workers + Static Assets** (`wrangler.jsonc` + `worker/index.ts`) —
  serves the static build and handles the contact API (Resend) + maintenance mode
- Markdown writeups (`gray-matter` + `marked`, raw-HTML stripped)

## Pages

| Route          | What it is                                             |
|----------------|--------------------------------------------------------|
| `/`            | Hero + **interactive, sandboxed terminal** (try `help`)|
| `/whoami`      | About — origin story, focus, skill matrix, ethics      |
| `/writeups`    | Filterable research & CTF writeups (+ `/writeups/[slug]`)|
| `/connect`     | Social hub + direct mail channels                      |
| `/handshake`   | Validated, rate-limited contact form                   |
| `404 / 403 / 503` | Themed error pages (Endpoint Missing / Access Denied / Server Offline) |

## Security highlights

- **Terminal**: no `eval`/`new Function`, command registry is a `Map` (no prototype
  reach), input sanitised (ANSI/control/bidi/zero-width stripped), length + token +
  rate caps, outbound links checked against an origin allowlist. All output renders as
  React text nodes — verified: `echo <img onerror=...>` is inert.
- **Contact API** (`worker/index.ts`): same-origin check, body-size + field caps,
  honeypot + time-trap (silent bot drop), optional Turnstile, optional KV rate-limit,
  HTML-escaped email, no secret ever reflected to the client.
- **Edge headers** (`public/_headers`): strict CSP, HSTS preload, `X-Frame-Options:
  DENY`, `nosniff`, locked-down `Permissions-Policy`, COOP/CORP. See notes in that
  file on the static-export `script-src 'unsafe-inline'` trade-off.
- **Writeups**: markdown pipeline cannot emit author HTML → no stored-XSS surface.

## Commands

```bash
npm run dev       # local dev  (http://localhost:3000)
npm run build     # static export -> ./out
npm run preview   # build + wrangler dev (Worker + _headers, like prod)
npm run deploy    # build + wrangler deploy
```

## Deploy & configure

See **[DEPLOY.md](DEPLOY.md)** — Cloudflare Pages setup, Resend + DNS, the
`zephryx.in` custom domain, wiring the 403/503 pages, and optional Turnstile / KV
hardening. Add writeups by dropping Markdown into `content/writeups/`.
