# Working notes for this repo

Next.js 15 App Router, static export (`out/`) served by Cloudflare Workers.

**This is the whole site.** It was four separate repos on four hostnames
— portfolio, research, academy, services — and they were consolidated onto
`zephryx.in`. If you are looking for the writeups, the cheatsheets or the
services pages, they are here, not in a sibling repo.

`zephryx-writeups`, `zephryx-academy` and `Zephryx-Security` are retired.
Their hostnames now carry permanent redirects only (`docs/redirects.md`).
Do not add content to them, and do not treat their `CLAUDE.md` files as
current — several of their rules describe a split that no longer exists.

## The zone model, and why `migrated` still exists

`ZONES` in `src/lib/site.ts` is the single source of truth for the four content
zones and where each one answers. Every zone carries a `migrated` flag:

- `false` — the zone lives on its own hostname. `zoneHref()` resolves to that
  host, links render external, and `buildMetadata()` marks the page `noindex`.
- `true` — the zone is served from here. Links are internal routes and the
  `noindex` lifts.

All four are `true`. The flag is deliberately kept rather than deleted: it is
what made the cutover a one-line change per zone instead of a hunt through the
tree for hardcoded hostnames — and that hunt is exactly what broke two links
when the research corpus first moved out. It also drives `sitemap.ts`, so the
sitemap, the canonicals and the robots directives cannot disagree about where a
page lives.

**Never write a `*.zephryx.in` hostname into a component.** Zone links go
through `zoneHref()` or `<ZoneLink>`. Nav order is `ZONES` order.

## What lives where

| Path | What |
|---|---|
| `/`, `/whoami/`, `/handshake/`, `/security/` | Identity, contact, disclosure policy |
| `/arsenal/` | Tools & CVEs — `src/lib/arsenal.ts` |
| `/writeups/`, `/detections/`, `/matrix/`, `/search/`, `/feed.xml` | Research |
| `/learn/` | Roadmap, cheatsheets, glossary |
| `/services/`, `/privacy/` | Commercial — `src/lib/services.ts` |

`/security/` is the **vulnerability disclosure policy**, not the services zone.
The services pages are `/services/`. These are different things and the naming
collision is a real trap: mapping the old `security.zephryx.in` onto
`/security/` would bury the policy under a sales page.

## The build is the validator

A malformed ATT&CK id, a technique not in the catalogue, a writeup image
pointing at a missing file, a cheatsheet whose PDF is absent, or a detection
naming a writeup that does not exist — each fails `npm run build` rather than
shipping a quiet gap. Keep it that way.

`npm run lint` is not usable (no ESLint config; `next lint` drops into an
interactive setup prompt). Use `npm run typecheck`, which covers **both** the
app and the Worker — `worker/` is in `tsconfig.json`'s `exclude`, so a bare
`tsc --noEmit` silently skips it and a Worker type error only surfaces in
Cloudflare's build.

## `attack.ts` is one module, and it stays one

`src/lib/attack.ts` holds the ATT&CK catalogue, the lookup helpers
(`attackUrl`, `techniqueName`) and the coverage model (`getCoverage`). While
the research lived on its own domain this file existed in two repos with the
74-technique catalogue duplicated **verbatim**, because the coverage half needs
the content and the lookup half is used by the arsenal pages. Nothing checked
the two copies against each other. Do not split it again.

## Search indexes everything

`getSearchIndex()` in `src/lib/search.ts` covers all six collections — writeups,
detections, tools, cheatsheets, glossary terms, services. One box over all of
them is the single clearest thing the consolidation bought; four of those
shelves were unreachable from here while they sat on other origins.

Adding a shelf means extending `SEARCH_KINDS` in `searchTypes.ts` and adding a
mapper. The types make this safe — `KIND_LABEL`, `KIND_CHIP` and `countByKind`
are all keyed off `SEARCH_KINDS`, so a missing kind is a compile error, not a
silent zero. Content with no publish date sorts after dated content,
alphabetically; do not invent a date to make it sort — that reorders the whole
index around a fiction.

## Anything a reader might copy gets a copy control

Standing rule, not a per-page decision. If a value exists so somebody can take
it — a rule, a query, a command, an address, a fingerprint — it ships with a way
to take it. Select-and-drag out of a scrolling `<pre>` does not count.

- **Fenced code blocks** — `codeBlockActions()` in `src/lib/codeblock.ts`, a
  `marked` renderer that wraps each block in a labelled figure with controls.
  `download: 'always'` offers every block as a file (detections, where blocks
  are rules you deploy); `download: 'named'` only offers blocks whose fence
  names a file (` ```bash recon.sh `), which stops pasted output being dressed
  up as something worth saving. Bodies render through `<ProseBody />`, which
  binds one delegated listener per page.
- **Single values** — `<CopyValue value={…} label={…} />`, beside the value
  rather than replacing it.

Controls are inert markup until the client component mounts, every copy
announces through a `role="status"` region, and clipboard writes go through
`copyText()` in `src/lib/browser.ts` (which falls back to a hidden textarea
outside secure contexts). Accent green and amber are tuned for the dark
backdrop; outside a `.panel` they lose contrast on the light theme, so put
result colour on the border and keep text on an ink token.

## The two input endpoints

`worker/index.ts` owns `/api/contact` and `/api/quote` and nothing else that
touches user input. Both were separate Workers with separate copies of the same
defence stack; `json()`, `escapeHtml()`, `str()`, `EMAIL_RE`, `LIMITS` and
`domainAcceptsMail()` are now shared, so a cap cannot drift between them.

Keep every layer: same-origin check, body-size cap, per-field caps, honeypot,
submission time-trap, DNS check on the email domain, optional KV rate limit,
and the service-id shape check on `/api/quote`. Mirror any cap change in
`ContactForm.tsx` and `QuoteForm.tsx` so the client fails fast and identically.

Two rules worth stating outright:

- **Store before you notify.** A lead persisted to KV is the durable record; the
  email is a notification. `/api/quote` returns success when the KV write
  succeeded even if the mail failed, because a Resend outage must not lose a
  real business inquiry.
- **Never reflect a secret or an upstream error to the client.** Generic message
  to the visitor, detail to `console.error`.

`fetch()` wraps the router in a try/catch that falls through to
`env.ASSETS.fetch` on an unexpected throw — every request passes through this
script (`run_worker_first: true`), so without it a bug here takes down pages
that need no Worker logic at all. `docs/redirects.md` records what has to move
to the edge before that can be narrowed to `["/api/*"]`, and why narrowing it
today would cost maintenance mode.

## Don't fabricate business credibility

`/services/` sells real work. Never invent client names, testimonials, case
studies, certifications, or specific pricing — none of it exists, and fake
versions on a site selling security services are how a firm's own credibility
gets questioned. The credibility story is the verifiable one: the writeups,
the tooling and the Sigma rules are public and linked directly. Pricing is
deliberately absent — every service says "scoped to your environment" rather
than listing numbers, because real pentest pricing varies enormously with scope.

## `/learn/` is free, and says so

No waitlist, no paid tracks, no lead capture. A structured course catalog
(`/tracks/`, a `COURSES` array) existed briefly and was removed — the courses
were mostly unwritten placeholders, and half-delivering on that promise was
worse than not making it. `/learn/roadmap/` stays and points only at
cheatsheets, never at a course; don't add a course link back onto a stage
without bringing the course content too.

Whether a catalog returns, and whether any of it is ever paid, are two real
unmade decisions. Do not reintroduce a waitlist, a "coming soon, join to hear
first" framing, a `/tracks/` route, or pricing copy speculatively. The FAQ on
`/learn/` states the free posture plainly where a reader looks for the catch —
don't soften it to "currently free".

## Other things worth knowing

- The front page states figures only when it can recount them from this repo's
  own files. The writeup and detection counts were removed when that content
  moved away and restored when it came back — same rule, both directions.
  `boxes rooted` is the one rounded claim no page enumerates; if that becomes
  uncomfortable, drop it rather than inventing a source.
- Both markdown pipelines disable raw HTML (`html: () => ''`). Content is
  first-party, but that keeps stored XSS off the board entirely — don't
  re-enable it to solve a formatting problem.
- The CSP is `default-src 'self'` in `public/_headers`, applied at the edge
  because a static export has no server to set headers. Any external script,
  font or analytics origin needs it widened first, and that should be a
  deliberate decision rather than a fix for a broken embed.
- Visual tone: dark base, red accent, monospace kicker labels. What doesn't
  belong is anything reading as a literal terminal widget — fake shell prompts,
  traffic-light window chrome, blinking cursors. The homepage terminal was
  removed and shouldn't come back; keep the technical identity in typography
  and structure, not cosplay.
