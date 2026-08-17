# Working notes for this repo

Next.js 15 App Router, static export (`out/`) served by Cloudflare Workers.
Content is Markdown under `content/{writeups,detections,cheatsheets}/`, rendered
at build time by `marked` in `src/lib/{writeups,detections}.ts`.

## Anything a reader might copy gets a copy control

This is a standing rule, not a per-page decision. If a value on the page exists
so somebody can take it — a rule, a query, a command, an address, a
fingerprint, an identifier — it ships with a way to take it. Select-and-drag out
of a scrolling `<pre>` does not count.

Two pieces implement it; reuse them rather than writing a third:

- **Fenced code blocks** — `codeBlockActions()` in `src/lib/codeblock.ts` is a
  `marked` `code` renderer that wraps each block in a labelled figure with the
  controls. Wire it into any new markdown pipeline. `download: 'always'` offers
  every block as a file (detections, where blocks are rules you deploy);
  `download: 'named'` offers only blocks whose fence names a file
  (` ```bash recon.sh `), which keeps pasted output from being dressed up as
  something worth saving. Copy is offered either way. Bodies render through
  `<ProseBody html={…} />`, which binds one delegated listener for the page.
- **Single values** — `<CopyValue value={…} label={…} />`, used next to the
  value rather than replacing it.

Rules the implementation follows, worth keeping if you extend it:

- Controls are inert markup until the client component mounts
  (`.prose-terminal--interactive`, or `CopyValue` returning `null` before
  mount). A reader without JavaScript sees the plain text, never a dead button.
- Every copy or download announces its result through a `role="status"` region,
  and the button label reverts after ~2s.
- Clipboard writes go through `copyText()` in `src/lib/browser.ts`, which falls
  back to a hidden textarea outside secure contexts. Downloads go through
  `downloadText()`. Both are verified against the CSP in `public/_headers` —
  `default-src 'self'` permits the blob save, but re-check if that policy
  tightens.
- Accent green and amber (`--color-signal`, `--color-warn`) are tuned for the
  dark backdrop. Outside a `.panel` they lose contrast on the light theme, so
  put result colour on the border and keep the text on an ink token.

## Other things worth knowing

- Both markdown pipelines disable raw HTML (`html: () => ''`). Content is
  first-party, but that keeps stored XSS off the board entirely — don't
  re-enable it to solve a formatting problem.
- The build is the validator: a malformed ATT&CK id, an unknown technique, or a
  cheatsheet pointing at a missing PDF fails `npm run build` rather than
  shipping a quiet gap in the coverage matrix.
- `npm run lint` is not usable — there's no ESLint config, so `next lint` drops
  into an interactive setup prompt. Use `npx tsc --noEmit` plus `npm run build`.
