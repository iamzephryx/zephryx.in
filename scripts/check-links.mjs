/**
 * Post-build guard: every route must be reachable by following links from `/`.
 *
 * The consolidation collapsed four navs into one, and each zone went from
 * several top-level nav entries to a single one. That moved the job of
 * surfacing a zone's child pages onto the zone's landing page — and two pages
 * quietly lost their only route in the process:
 *
 *   /learn/glossary/  the academy site had a Glossary nav entry; the merged nav
 *                     has one "Academy" entry, and /learn/ linked cheatsheets
 *                     and the roadmap but not the glossary.
 *   /privacy/         linked from the services site's own footer, which no
 *                     longer exists. Zero inbound links, on a site running two
 *                     forms that collect personal data.
 *
 * Both built cleanly and rendered correctly. Nothing but a link graph catches
 * this class of bug, so it runs as part of the build like every other validator
 * in this repo.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Served by status code, never linked. The only legitimate orphans. */
const UNLINKED_BY_DESIGN = new Set(['/403/', '/404/', '/503/']);

const OUT = 'out';

const routes = new Set();
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (entry === 'index.html') {
      const route = `${full.slice(OUT.length, -'index.html'.length)}`.replace(/\/+/g, '/');
      if (!route.startsWith('/_next')) routes.add(route);
    }
  }
})(OUT);

const outgoing = new Map();
for (const route of routes) {
  const html = readFileSync(join(OUT, route, 'index.html'), 'utf8');
  const targets = new Set();
  for (const [, href] of html.matchAll(/href="(\/[^"#?]*)"/g)) {
    const normalised = (href.endsWith('/') ? href : `${href}/`).replace(/\/+/g, '/');
    if (routes.has(normalised)) targets.add(normalised);
  }
  outgoing.set(route, targets);
}

const reachable = new Set(['/']);
const queue = ['/'];
while (queue.length) {
  for (const next of outgoing.get(queue.pop()) ?? []) {
    if (!reachable.has(next)) {
      reachable.add(next);
      queue.push(next);
    }
  }
}

const orphans = [...routes].filter((r) => !reachable.has(r) && !UNLINKED_BY_DESIGN.has(r)).sort();

if (orphans.length > 0) {
  console.error(
    `\nUnreachable routes — nothing on the site links to these, so a visitor can only\n` +
      `arrive via search or a bookmark:\n\n` +
      orphans.map((r) => `  ${r}`).join('\n') +
      `\n\nLink each from somewhere a reader would look — usually the zone's landing\n` +
      `page or the footer — or add it to UNLINKED_BY_DESIGN in scripts/check-links.mjs\n` +
      `if it is genuinely served by status code rather than navigation.\n`,
  );
  process.exit(1);
}

console.log(`✓ links: all ${routes.size - UNLINKED_BY_DESIGN.size} linkable routes reachable from /`);
