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

### Narrowing `run_worker_first` — done

`wrangler.jsonc` sets `"run_worker_first": ["/api/*"]`. The Worker script runs
for the two form endpoints and nothing else; every content route is served by
the asset layer without executing it, so a parse error or a module-scope throw
in `worker/index.ts` cannot take the site down.

Both prerequisites were handled in code rather than left as dashboard work:

- `/connect` and `/contact` → `/handshake/` moved to **`public/_redirects`**,
  which Workers static assets applies natively. Nothing to configure.
- `MAINTENANCE` was **rescoped**: `on` now 503s the `/api/*` endpoints rather
  than serving `/503/` site-wide. It could no longer see a content request, so
  the old behaviour would have been a switch that silently did nothing.

**To take the whole site down** you now need an edge rule, because no Worker
code runs for content paths. A Redirect Rule on `zephryx.in` pointing at a
static holding page is the simplest form; a WAF custom response also works.
Decide which before you need it — an incident is a bad time to find out the
break-glass switch changed shape.

**If you add anything to the Worker that must see a content request**, widen
this back. The narrowing is not free: it trades reach for blast radius, and the
trade only holds while `/api/*` really is everything the script does.

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

---

# Retirement checklist

Everything here is platform work — Cloudflare and GitHub — and none of it is in
this repo. Do it **after** the redirect rules above are live and verified, not
before.

## 1. Delete the three Workers

`zephryx-writeups`, `zephryx-academy`, `zephryx-security`.

**Keep their DNS records and certificates.** A redirect rule needs the hostname
to still resolve through Cloudflare; deleting the record takes the old URLs down
entirely instead of redirecting them, which is the opposite of the point.

Confirm the rules still answer after each deletion — a rule and a Worker on the
same hostname can mask each other, so "it worked before I deleted the Worker" is
not evidence it works after.

## 2. Archive the three repos

Archive, do not delete. The git history is the only record of why the splits
happened and why they were undone, and the `CLAUDE.md` files in them carry
reasoning that is worth being able to read back — the detection library's
"no attack surface" posture, the academy's removed waitlist, the services
site's "verifiable, not asserted" credibility rule. All three now carry a
retirement banner pointing here.

Each repo also holds content that is duplicated in `zephryx.in`. That is fine:
archived repos are read-only, so there is no risk of the two copies diverging.

## 3. Resubmit the sitemap

`https://zephryx.in/sitemap.xml` now claims **41 URLs**, up from 9. Resubmit it
in Search Console. The three per-host sitemaps die with their Workers; there is
nothing to remove, but expect the old hostnames to take a while to drop out of
the index while the 301s are followed.

Watch for coverage errors on the old hosts in the weeks after — a redirect
reported as a soft 404 usually means a carve-out is ordered below its prefix
rule, which the curl loop above would also catch.

## 4. Mail keeps working

`hello@security.zephryx.in` is a live inbox and is deliberately unchanged — the
`/api/quote` handler still sends there, and `/services/request/` still shows it.
Mail routing is independent of where the pages are served. Do not "tidy" this to
match the web consolidation without deciding to move a working mailbox, which is
a separate change with its own failure mode.

## What is deliberately NOT done

Nothing in the code side remains. `run_worker_first` is narrowed, the redirects
that had to leave the Worker have left it, and maintenance mode has been
rescoped rather than quietly broken.

What is left is this file's other three sections — deleting the Workers,
archiving the repos, resubmitting the sitemap — plus the redirect rules
themselves. All of it is platform work, and all of it should happen after a
deploy that has been verified with the curl loop above.
