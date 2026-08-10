# zephryx.in

This is my personal site — portfolio, research log, and a bit of a playground. I'm
Zephryx: red team operator by day, SOC analyst and threat hunter the rest of the time,
and this is where I write up the offensive research, CTF boxes, and detection rules
I've built along the way.

I wanted it to actually feel like it belongs to someone who breaks into things for a
living, so it's dark, terminal-flavored, and the homepage has a real (sandboxed)
shell you can type into instead of a hero banner nobody reads. Try `help` when you
land on it.

## Why it's built the way it is

I didn't want a CMS or a hosted blog platform — I wanted to write Markdown, commit it,
and have the site rebuild itself. So it's a static-exported Next.js app that lives on
Cloudflare Workers. No server to babysit, no database, and the only "backend" is a
single Worker script that handles the contact form and can flip the whole site into
maintenance mode if I need it to.

- **Next.js 15**, App Router, `output: 'export'` — everything compiles down to plain
  HTML in `./out`
- **Tailwind v4** for styling, tokens defined in `src/app/globals.css`
- **TypeScript** throughout, fonts self-hosted via `next/font` (JetBrains Mono + Inter)
- **Cloudflare Workers + Static Assets** for hosting — `wrangler.jsonc` +
  `worker/index.ts` serve the build and handle `/api/contact` (via Resend)
- Writeups and detections are just Markdown (`gray-matter` for frontmatter, `marked`
  to render), with raw HTML stripped on the way out so nothing I paste in by accident
  becomes a stored XSS bug

## What's actually on it

- **`/`** — the homepage terminal. Type commands, get real output.
- **`/whoami`** — the origin story / skills page.
- **`/writeups`** — CTF and research writeups, filterable, each with its own page.
- **`/detections`** — Sigma/KQL rules I've written, same deal.
- **`/matrix`** — an ATT&CK coverage board that cross-references writeups (what I
  emulated) against detections (what I wrote to catch it).
- **`/arsenal`** — tools I've released and disclosures I've been credited for.
- **`/security`** — my vulnerability disclosure policy, with a proper RFC 9116
  `security.txt`.
- **`/connect`** and **`/handshake`** — social links and a working contact form.
- **`/feed.xml`** — RSS for writeups + detections combined.
- Themed 404 / 403 / 503 pages, because generic error pages are a wasted opportunity.

## How the content model works

Two Markdown folders: `content/writeups/` and `content/detections/`. Every writeup
declares which ATT&CK techniques it emulates in frontmatter (`techniques:
['T1558.003']`), and every detection declares which techniques it covers and which
writeup it answers back to. `src/lib/attack.ts` stitches the two together into the
matrix page.

The one rule I enforce on myself: if I reference a technique ID in frontmatter that
isn't in the catalogue inside `attack.ts`, **the build fails**. I'd rather find out at
build time than have the matrix quietly under-report coverage.

One thing to remember before pushing this live for real: `src/lib/arsenal.ts` still
has a couple of placeholder entries (`CVE-20XX-NNNNN` style) in it from when I was
laying out the page. Swap those for real disclosures or pull them — the "CVEs
credited" stat on the homepage just counts whatever's in that file.

## Things I was deliberate about, security-wise

Since the whole point of the site is "I do this professionally," it felt wrong to ship
it sloppy:

- The terminal never touches `eval` or `new Function`. Commands live in a `Map`
  registry, input gets stripped of ANSI/control/bidi/zero-width characters, there are
  length and rate caps, and outbound links are checked against an allowlist before
  they're followed. Output only ever renders as plain React text nodes — I tested
  `echo <img onerror=...>` and it just prints, inert.
- `worker/index.ts` (the contact API) checks same-origin, caps body size and field
  lengths, has a honeypot field plus a time-trap for bots, supports optional
  Turnstile, supports an optional KV-backed rate limit, and HTML-escapes anything
  before it touches an email. No secret ever gets echoed back to the client.
- `public/_headers` sets a real CSP, HSTS preload, `X-Frame-Options: DENY`, `nosniff`,
  a locked-down `Permissions-Policy`, and COOP/CORP. There's a note in that file about
  the one `unsafe-inline` trade-off the static export forces on me.
- Markdown writeups can't emit raw HTML, so there's no stored-XSS path through
  content I write.

## Running it locally

```bash
npm run dev       # local dev, http://localhost:3000
npm run build     # static export -> ./out
npm run preview   # build + wrangler dev, closest thing to prod locally
npm run deploy    # build + wrangler deploy
```

## Adding content

New writeup or detection = new Markdown file in `content/writeups/` or
`content/detections/`, commit, push. Cloudflare rebuilds it automatically. Full deploy
steps, DNS, Resend setup, and the Turnstile/KV hardening options are all in
**[DEPLOY.md](DEPLOY.md)**.

One maintenance chore worth remembering: `public/.well-known/security.txt` has an
`Expires:` field (currently 2027-08-09) that consumers treat as invalid once it's
passed, so I need to roll that forward at least once a year.
