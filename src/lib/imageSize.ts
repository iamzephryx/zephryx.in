import fs from 'node:fs';
import path from 'node:path';

export type ImageSize = { width: number; height: number };

const PUBLIC_DIR = path.join(process.cwd(), 'public');

// readAll() re-reads content on every page render during the export build, so
// the same handful of screenshots would otherwise be re-opened dozens of times.
const cache = new Map<string, ImageSize | null>();

/** PNG: the IHDR chunk always leads the file, so the header is enough. */
function pngSize(buf: Buffer): ImageSize | null {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function gifSize(buf: Buffer): ImageSize | null {
  if (buf.length < 10 || buf.toString('ascii', 0, 3) !== 'GIF') return null;
  return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
}

/** JPEG: walk the marker chain to the start-of-frame segment. */
function jpegSize(buf: Buffer): ImageSize | null {
  if (buf.length < 4 || buf.readUInt16BE(0) !== 0xffd8) return null;

  let pos = 2;
  while (pos + 9 < buf.length) {
    if (buf[pos] !== 0xff) {
      pos += 1;
      continue;
    }

    const marker = buf[pos + 1];
    // SOF0–SOF15 carry the frame dimensions; DHT/JPG/DAC share the range.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(pos + 5), width: buf.readUInt16BE(pos + 7) };
    }

    const length = buf.readUInt16BE(pos + 2);
    if (length < 2) return null;
    pos += 2 + length;
  }

  return null;
}

/**
 * Intrinsic dimensions of a site-root image path (e.g. `/writeups/x/01.png`),
 * read straight from the bytes in `public/`. Emitting these as width/height
 * attributes lets the browser reserve the box before a lazy image loads —
 * without them, every screenshot below the fold shifts the page as it arrives
 * and anchor jumps land in the wrong place.
 *
 * Returns null for remote, unreadable, or unsupported images; callers simply
 * omit the attributes in that case.
 */
export function localImageSize(href: string): ImageSize | null {
  if (!href.startsWith('/') || href.startsWith('//')) return null;

  const cached = cache.get(href);
  if (cached !== undefined) return cached;

  let size: ImageSize | null = null;
  const file = path.join(PUBLIC_DIR, decodeURIComponent(href.split(/[?#]/)[0]));

  // Never follow a path that escapes public/ — content is first-party, but a
  // stray `../` in a markdown link should not turn into an arbitrary file read.
  if (file.startsWith(PUBLIC_DIR + path.sep)) {
    try {
      const handle = fs.openSync(file, 'r');
      try {
        const buf = Buffer.alloc(65536);
        const read = fs.readSync(handle, buf, 0, buf.length, 0);
        const head = buf.subarray(0, read);
        size = pngSize(head) ?? jpegSize(head) ?? gifSize(head);
      } finally {
        fs.closeSync(handle);
      }
    } catch {
      size = null;
    }
  }

  if (size && (size.width <= 0 || size.height <= 0)) size = null;

  cache.set(href, size);
  return size;
}
