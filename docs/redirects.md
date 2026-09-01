# Cutover runbook — the edge configuration

Everything in this file is Cloudflare dashboard work. The code side of the
cutover is already merged: all four zones are served from `zephryx.in`,
`MOVED_PREFIXES` is deleted, and the sitemap claims all 41 URLs.

**Until these rules exist, the three sibling hostnames still serve their own
copies of this content.** That is the duplicate-content window, and it is the
reason the order below is not optional.

---

## Order of operations

1. **Deploy this branch first.** The routes have to answer on `zephryx.in`
   before anything redirects to them.
2. **Verify** every target URL returns `200` (see the check script at the end).
3. **Then** create the redirect rules below.
4. **Then** delete the three sibling Workers — but keep their DNS records and
   certificates, or the rules have no hostname to match on.

Adding the rules before step 2 points traffic at routes that are not live yet.
Deleting the Workers before the rules exist takes the old URLs down entirely
rather than redirecting them.

---

## Rules

Cloudflare evaluates redirect rules top-down and stops at the first match, so
**every carve-out must sit above its prefix rule.** All rules are `301` with
"preserve query string" enabled — campaign tags should survive the hop.

### 1. `writeups.zephryx.in` — pure passthrough

Paths are identical on both sides, so this is one rule with no carve-outs.

```
# Expression
http.host eq "writeups.zephryx.in"

# Dynamic redirect
concat("https://zephryx.in", http.request.uri.path)
```

### 2. `academy.zephryx.in` — one carve-out, then the prefix

```
# 2a — MUST be first, or /about/ becomes /learn/about/
http.host eq "academy.zephryx.in"
  and http.request.uri.path in {"/about" "/about/"}
  -> "https://zephryx.in/whoami/"          (static)

# 2b — everything else nests under /learn/
http.host eq "academy.zephryx.in"
  -> concat("https://zephryx.in/learn", http.request.uri.path)     (dynamic)
```

`academy.zephryx.in/` lands on `/learn/` via 2b, which is correct.

### 3. `security.zephryx.in` — four carve-outs, then the prefix

```
# 3a — MUST be first. Note /about and /privacy leave the /services/ tree.
http.host eq "security.zephryx.in" and http.request.uri.path in {"/about" "/about/"}
  -> "https://zephryx.in/whoami/"
http.host eq "security.zephryx.in" and http.request.uri.path in {"/privacy" "/privacy/"}
  -> "https://zephryx.in/privacy/"
http.host eq "security.zephryx.in" and http.request.uri.path in {"/process" "/process/"}
  -> "https://zephryx.in/services/process/"
http.host eq "security.zephryx.in" and http.request.uri.path in {"/contact" "/contact/"}
  -> "https://zephryx.in/services/request/"

# 3b — /services/* passes through verbatim; bare / lands on /services/
http.host eq "security.zephryx.in"
  -> concat("https://zephryx.in/services",
            regex_replace(http.request.uri.path, "^/services", ""))
```

> **The collision worth restating:** `zephryx.in/security/` is the
> **vulnerability disclosure policy**, not the services zone. Mapping
> `security.zephryx.in/*` onto `zephryx.in/security/*` would bury the policy
> under a sales page — and that is the one URL researchers and scanners are
> most likely to have bookmarked. Services land on `/services/`.

---

## After the rules are live

### Narrowing `run_worker_first`

`wrangler.jsonc` still sets `run_worker_first: true`, so every request executes
`worker/index.ts`. Scoping it to `["/api/*"]` means a parse or module-scope
error in that file can no longer take the static content down — which the
worker's own try/catch cannot protect against.

Two things must move to the edge first, because both need to see non-API
requests:

- **`REDIRECTS`** in `worker/index.ts` — `/connect` and `/contact` →
  `/handshake/`. Move to a redirect rule on `zephryx.in` in the same shape as
  the rules above, then delete the table.
- **`MAINTENANCE`** — the break-glass switch that serves `/503/` for every
  non-API path. Scoped, it would only cover `/api/*`, which is the opposite of
  what a maintenance mode is for. Either accept losing it, or reimplement it at
  the edge before narrowing.

Do both, then set `"run_worker_first": ["/api/*"]` in one change. The array
form is supported — verified against the pinned wrangler.

### Submit the sitemap

`https://zephryx.in/sitemap.xml` now claims 41 URLs. Resubmit it in Search
Console. The old per-host sitemaps die with their Workers.

---

## Verification

Every old URL must return exactly **one** `301` landing on a `200` — no chains,
no loops. A loop here is the failure mode that takes the site down.

```bash
for u in \
  https://writeups.zephryx.in/writeups/mr-robot-thm/ \
  https://writeups.zephryx.in/detections/wmi-lateral-movement/ \
  https://writeups.zephryx.in/matrix/ \
  https://writeups.zephryx.in/feed.xml \
  https://academy.zephryx.in/ \
  https://academy.zephryx.in/cheatsheets/ \
  https://academy.zephryx.in/glossary/ \
  https://academy.zephryx.in/roadmap/ \
  https://academy.zephryx.in/about/ \
  https://security.zephryx.in/ \
  https://security.zephryx.in/services/ \
  https://security.zephryx.in/services/api-security-testing/ \
  https://security.zephryx.in/process/ \
  https://security.zephryx.in/contact/ \
  https://security.zephryx.in/privacy/ \
  https://security.zephryx.in/about/ ; do
  printf '%-70s %s\n' "$u" "$(curl -sSL -o /dev/null -w '%{num_redirects} hop(s) -> %{http_code} %{url_effective}' "$u")"
done
```

Expect `1 hop(s) -> 200`. Anything reporting `0 hops` means the rule did not
match; more than one hop means a carve-out is ordered below its prefix rule.

And confirm the disclosure policy survived:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://zephryx.in/security/   # 200
```
