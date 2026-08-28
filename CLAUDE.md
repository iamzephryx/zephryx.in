# Working notes for this repo

Next.js 15 App Router, static export (`out/`) served by Cloudflare Workers.

This is the **portfolio hub** of a four-site network. It carries identity
(`/whoami/`), the tool and CVE arsenal (`/arsenal/`), the disclosure policy
(`/security/`) and contact (`/handshake/`) — and it introduces the three
sibling sites rather than duplicating them.

## What lives here, and what emphatically does not

| Site | Job |
|---|---|
| **zephryx.in** (this repo) | Portfolio, tooling & CVEs, contact |
| `zephryx-writeups` → writeups.zephryx.in | Writeups, Sigma detections, ATT&CK board, search |
| `zephryx-academy` → academy.zephryx.in | Training & cheatsheets |
| `Zephryx-Security` → security.zephryx.in | Penetration testing services |

Two migrations already happened, and both left the same rule behind: **don't
resurrect the route here.**

- **Cheatsheets** moved to `zephryx-academy`. Add new quick-reference material
  over there.
- **The research corpus** — `/writeups/`, `/detections/`, `/matrix/` and
  `/search/` — moved to `zephryx-writeups`. They travelled as one unit because
  the coverage board reads both collections, search indexes both, and they
  cross-link each other. `MOVED_PREFIXES` in `worker/index.ts` 301s the old
  paths (and `/feed.xml`) to the new host, preserving the path verbatim, so
  every inbound link and search result still resolves. A new writeup goes in
  that repo; adding a `/writeups/` route back here would shadow the redirect.

`src/lib/arsenal.ts` deliberately stayed: it never fed the coverage
calculation or the search index, so it is portfolio proof-of-work rather than
research content. `src/lib/attack.ts` also stayed, but only its lookup half
(`attackUrl`, `techniqueName`) — the arsenal pages use it to name the
techniques a tool exercises. The coverage model went with the content it
reads.

The front page states figures only when it can recount them from this repo's
own files. That is why the writeup and detection counts are gone from `STATS`
rather than hardcoded, and why the research section is a card linking out
instead of a stale copy of an index that lives elsewhere.

## Anything a reader might copy gets a copy control

This is a standing rule, not a per-page decision. If a value on the page exists
so somebody can take it — a rule, a query, a command, an address, a
fingerprint, an identifier — it ships with a way to take it. Select-and-drag out
of a scrolling `<pre>` does not count.

The rule has two implementations, and only one of them still lives here:

- **Single values** — `<CopyValue value={…} label={…} />`, used next to the
  value rather than replacing it. This is what `/handshake/` and `/security/`
  use for mail addresses and the PGP fingerprint.
- **Fenced code blocks** — `codeBlockActions()` plus `<ProseBody />` moved to
  `zephryx-writeups` with the markdown pipeline they belong to. If this site
  ever renders markdown again, port them back rather than writing a third
  implementation; that repo's `CLAUDE.md` documents the `download: 'always'`
  vs `'named'` distinction.

Rules the implementation follows, worth keeping if you extend it:

- Controls are inert markup until the client component mounts (`CopyValue`
  returns `null` before mount). A reader without JavaScript sees the plain
  text, never a dead button.
- Every copy announces its result through a `role="status"` region, and the
  button label reverts after ~2s.
- Clipboard writes go through `copyText()` in `src/lib/browser.ts`, which falls
  back to a hidden textarea outside secure contexts. It is verified against the
  CSP in `public/_headers` — re-check if that policy tightens.
- Accent green and amber (`--color-signal`, `--color-warn`) are tuned for the
  dark backdrop. Outside a `.panel` they lose contrast on the light theme, so
  put result colour on the border and keep the text on an ink token.

## Other things worth knowing

- The interactive terminal (`src/lib/terminal/`) is allowlist-driven:
  `ALLOWED_ROUTES` gates internal navigation, `ALLOWED_ORIGINS` gates outbound
  links. `navigate` is a client-side router push and **cannot cross an
  origin** — that is why `writeups`, `detections`, `matrix` and `search` now
  return a link line to writeups.zephryx.in instead of navigating. Adding a
  command that points at a sibling site means adding the origin, not the route.
- The build is the validator: a malformed ATT&CK id or an unknown technique
  fails `npm run build` rather than shipping a quiet gap.
- `npm run lint` is not usable — there's no ESLint config, so `next lint` drops
  into an interactive setup prompt. Use `npx tsc --noEmit` plus `npm run build`.
