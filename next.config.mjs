import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root so a stray parent lockfile can't confuse tracing.
  outputFileTracingRoot: __dirname,

  // Fully static build -> ./out, served by Cloudflare Pages as immutable assets.
  // Security headers and the nonce-based CSP are applied at the edge by
  // functions/_middleware.ts, because static assets have no server to set them.
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,

  // No Node image optimizer exists in a static export.
  images: { unoptimized: true },

  // Do not leak framework fingerprint in the (rare) dev-server responses.
  poweredByHeader: false,

  // 404/403/503 are emitted as static HTML and wired up in Cloudflare.
  skipTrailingSlashRedirect: false,
};

export default nextConfig;
