# Deploying zephryx.in to Cloudflare Workers

This project is a **static Next.js export** (`output: 'export'` → `./out`) served by
**Cloudflare Workers Static Assets**, plus a single Worker script
(`worker/index.ts`) that handles the contact API and optional maintenance mode.

Your domain and DNS are already on Cloudflare, so everything lives in one place.

```
Build command:   npm run build
Deploy command:  npx wrangler deploy
Assets dir:      out          (configured in wrangler.jsonc)
Worker entry:    worker/index.ts
Node version:    20 or newer
```

> **Note:** this project does *not* use the OpenNext adapter. Cloudflare's dashboard
> sometimes auto-detects "Next.js" and pre-fills `npx opennextjs-cloudflare build` —
> that is for full SSR Next.js and **will fail here**. See §2.

---

## 1. Push to GitHub

```bash
git add -A
git commit -m "Deploy to Cloudflare Workers"
git push
```

---

## 2. Create / fix the Worker project

In **Cloudflare Dashboard → Workers & Pages**, connect the
`zephryxsec/zephryx.in` repo. Then set the build config **exactly**:

| Field | Value |
|---|---|
| **Build command** | `npm run build` |
| **Deploy command** | `npx wrangler deploy` |

⚠️ If the dashboard pre-filled `npx opennextjs-cloudflare build`, **replace it** with
`npm run build`. That adapter expects a server build (`.next/standalone`) which a
static export never produces — it fails with
`ENOENT: ... .next/standalone/.next/server/pages-manifest.json`.

Everything else (assets directory, 404 handling, the `ASSETS` binding) comes from
`wrangler.jsonc` in the repo — no dashboard config needed.

Deploy → you get a `https://zephryx-in.<subdomain>.workers.dev` URL. Open it and click
through every page and the terminal.

---

## 3. Point zephryx.in at the Worker

Worker → **Settings → Domains & Routes → Add → Custom domain** → `zephryx.in`
(add `www.zephryx.in` too if you want it). Cloudflare creates the DNS record and
issues the certificate automatically since the zone is already on your account.

To redirect `www` → apex, add a **Redirect Rule** (Rules → Redirect Rules):
`www.zephryx.in/*` → `https://zephryx.in/$1` (301).

The site already sends `Strict-Transport-Security: … preload`; once stable you can
submit the domain at <https://hstspreload.org>.

---

## 4. Contact form (Resend)

The form posts to `/api/contact`. Until configured it fails **gracefully** with a 503
telling visitors to email you directly — nothing breaks.

### 4a. Verify your domain in Resend
1. [Resend](https://resend.com) → **Domains → Add Domain** → `zephryx.in`.
2. Add the DNS records it shows (SPF `TXT`, DKIM `CNAME`s, optional `MX`) in
   **Cloudflare → DNS**. Set them to **DNS only (grey cloud)**, not proxied.
3. Wait for **Verified**.
4. **API Keys → Create API Key** (sending access). Copy it once.

### 4b. Add variables to the Worker
Worker → **Settings → Variables and Secrets**:

| Name | Value | Type |
|---|---|---|
| `RESEND_API_KEY` | `re_…` | **Secret** |
| `CONTACT_TO` | `contact@zephryx.in` | Text |
| `CONTACT_FROM` | `Zephryx <noreply@zephryx.in>` | Text |

`CONTACT_FROM` must be on the verified domain. `reply_to` is set to the visitor's
address automatically, so hitting *Reply* goes straight back to them.

Redeploy after adding them.

---

## 5. Custom error pages

- **404 — "Endpoint Missing":** automatic. `wrangler.jsonc` sets
  `not_found_handling: "404-page"`, which serves `out/404.html`.
- **503 — "Server Offline":** set a Worker variable `MAINTENANCE = on` and every
  non-API request returns the themed `/503/` page with a real HTTP 503 and
  `Retry-After`. Remove the variable to go live again. The API stays reachable so you
  can debug during maintenance.
- **403 — "Access Denied":** the styled page is at **/403/**. 403s come from the WAF,
  so wire it there: **Security → WAF → Custom rules**, and on a *Block* action choose
  **Custom response** with the HTML from `out/403/index.html` (or redirect to `/403/`).

All three share `src/components/ErrorScreen.tsx` — edit copy there.

---

## 6. Optional hardening

### Turnstile (spam protection)
1. **Turnstile → Add site** → `zephryx.in`. Copy the site key + secret key.
2. Add `TURNSTILE_SECRET` as a Worker **Secret**. The Worker enforces it automatically
   once present.
3. Render the widget in `src/components/ContactForm.tsx` and send its token as
   `turnstileToken`. Then extend the CSP in `public/_headers`:
   ```
   script-src  … https://challenges.cloudflare.com
   frame-src   https://challenges.cloudflare.com
   connect-src 'self' https://challenges.cloudflare.com
   ```

### KV rate limit (5 messages / IP / hour)
1. **Storage & Databases → KV → Create namespace**, e.g. `zephryx-contact-rl`.
2. Add to `wrangler.jsonc`:
   ```jsonc
   "kv_namespaces": [{ "binding": "CONTACT_RL", "id": "<namespace-id>" }]
   ```
3. Redeploy — the limit enforces itself.

---

## 7. Local development

```bash
npm run dev       # Next dev server at http://localhost:3000
npm run build     # static export into ./out
npm run preview   # build + wrangler dev (Worker + _headers, closest to prod)
```

Test mail locally by creating a git-ignored `.dev.vars`:

```
RESEND_API_KEY=re_...
CONTACT_TO=contact@zephryx.in
CONTACT_FROM=Zephryx <noreply@zephryx.in>
```

Test maintenance mode: `npx wrangler dev --var MAINTENANCE:on`

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

Raw HTML inside Markdown is intentionally stripped at render time (XSS-safe). Commit,
push, and Cloudflare rebuilds automatically.
