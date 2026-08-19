# LinkedIn banner

Source for the profile banner. The PNG is rendered from `banner.html`, so the
copy, the terminal output and the colours are all editable text — nothing is
baked into a raster file.

## Render

```bash
cd design/linkedin-banner
./fonts/fetch.sh          # Anton + JetBrains Mono, once (gitignored)
node render.mjs 3         # -> linkedin-banner-zephryx@3x.png (4752x1188)
node render.mjs 1         # -> linkedin-banner-zephryx@1x.png (1584x396)
```

Needs `playwright` (global install is fine — `render.mjs` falls back to
`npm root -g`). Set `CHROMIUM_PATH` if Playwright's own Chromium isn't
installed.

## Layout constraints this design respects

- **Canvas is 1584x396**, LinkedIn's spec. Upload the `@3x` file: LinkedIn
  accepts up to 8 MB and downsamples, which keeps the type crisp on retina
  displays. `@1x` is the safe fallback.
- **Bottom-left is deliberately empty.** The profile photo overlays roughly the
  left 250 px of the bottom ~110 px on desktop. Nothing readable goes there —
  the identity block ends above y≈285.
- **The terminal panel sits right of centre.** Mobile crops the banner's sides,
  so the name and title (left-of-centre) survive the crop; the panel is the
  part that may lose an edge.
- Contact details live inside the terminal output rather than in a separate
  card, so the links read as shell output instead of a badge row.

## Editing

Everything is in `banner.html`:

- `.identity` — name, alias, headline, tagline. `.hit` is the red word.
- `.term-body` — the shell transcript holding the contact links. At the current
  19px type the panel fits ~34 characters per line; longer lines need
  `.term`'s width to grow with them.
- `:root` — the palette. `--red` is the accent carried over from the previous
  banner.
