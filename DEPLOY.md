# Deploying zephryx.in to Cloudflare Pages

This is a **static Next.js export** (`output: 'export'` → `./out`) plus **Cloudflare
Pages Functions** (`./functions`) for the contact API and optional maintenance mode.
Your domain and DNS are already on Cloudflare, so the whole thing lives in one place.

```
Build command:      npm run build
Build output dir:   out
Functions dir:      functions      (auto-detected, no config needed)
Node version:       20 or newer
```

---

## 1. Get the code into a repo (recommended)

Cloudflare Pages deploys best from Git. From the project folder:

```bash
git init
git add .
git commit -m "Zephryx portfolio"
git branch -M main
git remote add origin https://github.com/zephryxsec/zephryx.in.git
git push -u origin main
```

> Prefer no Git? You can also run `npm run deploy` locally — it builds and pushes
> `out/` straight to Pages via Wrangler (`wrangler pages deploy out`). You'll be
> asked to log in the first time (`npx wrangler login`).

---

## 2. Create the Pages project

1. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Pick the repo. Set:
   - **Framework preset:** `Next.js (Static HTML Export)`
   - **Build command:** `npm run build`
   - **Build output directory:** `out`
3. **Save and Deploy.** First build takes ~1–2 min. You'll get a
   `*.pages.dev` preview URL — open it and click through every page + the terminal.

Cloudflare automatically:
- serves `out/404.html` for unknown routes (the **404 "Endpoint Missing"** page), and
- applies `public/_headers` (CSP, HSTS, etc.) and picks up `functions/` for the API.

---

## 3. Wire up the contact form (Resend)

The form posts to `/api/contact`, a Pages Function that emails you via
[Resend](https://resend.com). Until this is configured the form fails **gracefully**
with a 503 and tells visitors to email you directly — nothing breaks.

### 3a. Verify your domain in Resend
1. Create a Resend account → **Domains → Add Domain** → `zephryx.in`.
2. Resend shows a set of **DNS records** (SPF/`TXT`, DKIM `CNAME`s, and an optional
   `MX` for the return path). Add them in **Cloudflare → DNS** for `zephryx.in`.
   - Set those DKIM/SPF records to **DNS-only** (grey cloud), not proxied.
3. Wait for Resend to show the domain as **Verified**.
4. **API Keys → Create API Key** (send-only is fine). Copy it once.

### 3b. Add environment variables to Pages
Dashboard → your Pages project → **Settings → Environment variables → Production**
(add the same to **Preview** if you want the form live on preview URLs):

| Name              | Value                                   | Type   |
|-------------------|-----------------------------------------|--------|
| `RESEND_API_KEY`  | `re_...` (from 3a)                      | Secret |
| `CONTACT_TO`      | `contact@zephryx.in`                    | Text   |
| `CONTACT_FROM`    | `Zephryx <noreply@zephryx.in>`          | Text   |

> `CONTACT_FROM` **must** be an address on the domain you verified in Resend.
> `reply_to` is set to the visitor's address automatically, so hitting *Reply*
> in your inbox goes straight back to them.

Redeploy (Deployments → Retry deployment, or push a commit) so the new vars load.

---

## 4. Point zephryx.in at the site

1. Pages project → **Custom domains → Set up a custom domain** → `zephryx.in`.
2. Because the zone is already on Cloudflare, Pages creates the `CNAME` for you —
   just confirm. Add `www.zephryx.in` too if you want it.
3. To make `www` redirect to the apex (or vice-versa), add a **Redirect Rule**
   (Rules → Redirect Rules): `www.zephryx.in/*` → `https://zephryx.in/$1` (301).

HTTPS, HTTP→HTTPS redirect and the edge cert are automatic. The site already sends
`Strict-Transport-Security: ... preload`; once you're happy it's stable you can
submit the domain to <https://hstspreload.org>.

---

## 5. Custom error pages (403 / 503)

- **404 — "Endpoint Missing":** already automatic (Cloudflare serves `404.html`).
- **503 — "Server Offline":** ships as a real mechanism. Set a Pages env var
  `MAINTENANCE = on` and every page returns the themed **/503/** page with HTTP 503
  (see `functions/_middleware.ts`). Delete the var / set it to anything else to go
  back live. The API is exempt so you can still debug it during maintenance.
- **403 — "Access Denied":** the styled page lives at **/403/**. 403s on a static
  site come from the WAF, so wire it there: **Security → WAF → Custom rules**, and on
  your *Block* action choose **Custom response** with the HTML from `out/403/index.html`
  (or redirect to `/403/`). Rate-limiting rules can point at the same page.

All three pages share one component (`src/components/ErrorScreen.tsx`) so they stay
visually identical — edit copy there.

---

## 6. Optional hardening

### Cloudflare Turnstile on the form (recommended for spam)
1. Dashboard → **Turnstile → Add site** → domain `zephryx.in`. Copy the **site key**
   and **secret key**.
2. Add env var `TURNSTILE_SECRET` (Secret) to Pages. The Function auto-enforces it
   once present.
3. Render the widget in `src/components/ContactForm.tsx` and send its token as
   `turnstileToken` in the POST body. Then extend the CSP in `public/_headers`:
   ```
   script-src  ... https://challenges.cloudflare.com
   frame-src   https://challenges.cloudflare.com
   connect-src 'self' https://challenges.cloudflare.com
   ```

### KV-backed rate limit (5 messages / IP / hour)
1. **Workers & Pages → KV → Create namespace**, e.g. `zephryx-contact-rl`.
2. Pages project → **Settings → Functions → KV namespace bindings** → bind it as
   `CONTACT_RL`. The Function starts enforcing the limit automatically.

---

## 7. Local development

```bash
npm run dev        # Next dev server at http://localhost:3000
npm run build      # static export into ./out
npm run preview    # build + serve out/ via Wrangler (Functions + _headers active)
```

`npm run preview` is the closest thing to production — it runs the Pages Functions
and applies `_headers`, so test the contact API and security headers there. To test
mail delivery locally, create a `.dev.vars` file (git-ignored) with
`RESEND_API_KEY=...`, `CONTACT_TO=...`, `CONTACT_FROM=...`.

---

## 8. Adding a writeup

Drop a Markdown file in `content/writeups/<lowercase-kebab-slug>.md`:

```markdown
---
title: 'Your Title'
date: '2026-08-07'
category: 'Research'      # CTF | Research | Detection | Tradecraft
difficulty: 'Medium'      # Easy | Medium | Hard | Insane
featured: true            # surfaces on the home page
tags: ['active-directory', 'kerberos']
excerpt: 'One or two sentences shown on cards and used as the meta description.'
---

## Your content in Markdown
```

Raw HTML inside Markdown is intentionally stripped at render time (XSS-safe), so
stick to Markdown. Commit, push, and Cloudflare rebuilds automatically.
