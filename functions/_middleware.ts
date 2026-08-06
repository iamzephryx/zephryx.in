/**
 * Optional edge middleware for Cloudflare Pages.
 *
 * MAINTENANCE MODE — serves the themed /503/ page with a real HTTP 503 while
 * you deploy or take the origin down. It is OFF unless the environment variable
 * MAINTENANCE is set to "on" (Pages → Settings → Environment variables), so by
 * default this file is a transparent pass-through.
 *
 * The /api/* routes are exempted so a maintenance flag never masks a genuine
 * API error while you debug.
 */

type Env = { MAINTENANCE?: string; ASSETS: Fetcher };

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  const maintenanceOn = env.MAINTENANCE === 'on';
  const isApi = url.pathname.startsWith('/api/');

  if (maintenanceOn && !isApi) {
    // Reuse the statically-built /503/ page so the styling stays in one place.
    const page = await env.ASSETS.fetch(new URL('/503/', url.origin));
    return new Response(page.body, {
      status: 503,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'retry-after': '3600',
        'cache-control': 'no-store',
      },
    });
  }

  return context.next();
};
