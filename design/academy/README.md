# academy.zephryx.in — landing page concepts

Three visual directions for the courses subdomain, made as mockups. **None of this
is wired into the Next.js app** — `design/` sits outside `src/app`, so nothing here
touches `npm run build` or the static export. They're self-contained HTML: fonts are
inlined as data URIs, so you can open any file straight off disk with no server and
no network.

| | Direction | Type | Sells on |
|---|---|---|---|
| `v1.html` | **Range Access** | JetBrains Mono + Inter | Continuity — the main site's identity extended |
| `v2.html` | **Kill Chain** | Saira Condensed + IBM Plex | Structure — you can see the whole path at a glance |
| `v3.html` | **Field Manual** | Zilla Slab + Spectral | Authority — quiet, editorial, trust-first |

`*-hero.jpg` is the first screen, `*-full.jpg` is the whole page.

## What's the same in all three

Copy is written in the site's first-person voice and follows the same positioning
as the main site: the SOC work is the profession, the offensive work is what fills
the rest of the time. Figures are drawn from what `zephryx.in` can actually show
(published detections, credited CVEs, boxes rooted), so nothing here over-promises
relative to the main site. There is deliberately no engagement count. Pricing (₹14,900 single /
₹64,900 full) and the 12-seat cohort cap are **placeholders** — they're there to
make the layout real, not because they're decided.

## What differs, and why it matters

- **V1** reuses the tokens from `src/app/globals.css` verbatim. Pick this if the
  academy should read as the same person rather than a separate brand.
- **V2** makes colour mean something: green cleared, amber in progress, red not
  started. That's a real system to maintain, not decoration — the phase state
  appears on the spine, the phase rows, and the coverage matrix, and all three
  have to agree.
- **V3** drops the terminal entirely. It's the only one that would comfortably
  carry a ₹65k price tag to somebody who isn't already in the scene.

## Regenerating the screenshots

```bash
npx playwright screenshot --full-page design/academy/v1.html v1-full.png
```

## If one of these gets built for real

Two things from the root `CLAUDE.md` apply and are **not** implemented in these
mockups, because they're static mockups:

- Anything a reader might copy needs a copy control. The console blocks in V1 and
  the Sigma rule in particular would need `codeBlockActions()` / `<CopyValue>`.
- The light theme. All three commit to a single dark world; the main site supports
  `data-theme="light"`, so a real build needs the light palette designed rather
  than inverted.
