// Rasterises banner.html to a PNG at LinkedIn's banner geometry.
//   node render.mjs [scale] [outfile]
// Scale 1 => 1584x396 (LinkedIn's spec). Scale 3 => 4752x1188 (retina-safe upload).
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require('playwright');
} catch {
  // fall back to a globally installed playwright (ESM ignores NODE_PATH)
  playwright = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
}

const W = 1584, H = 396;
const scale = Number(process.argv[2] ?? 3);
const here = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[3] ?? path.join(here, `linkedin-banner-zephryx@${scale}x.png`);

const browser = await playwright.chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--font-render-hinting=none'],
});
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: scale });
await page.goto('file://' + path.join(here, 'banner.html'));
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: out, clip: { x: 0, y: 0, width: W, height: H } });
await browser.close();
console.log(`${out}  ${W * scale}x${H * scale}`);
