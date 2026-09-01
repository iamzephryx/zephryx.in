import Link from 'next/link';
import type { ReactNode } from 'react';
import { type Zone, zoneHref, zoneIsExternal } from '@/lib/site';

/**
 * A link to one of the site's content zones, rendered correctly for wherever
 * that zone currently lives.
 *
 * While a zone is still on its own hostname this is a plain anchor opened in a
 * new tab, with the "leaves this site" affordance the rest of the site uses.
 * Once the zone has been migrated onto this site the same call site becomes an
 * ordinary `Link` — no new tab, no glyph, client-side routing — without the
 * caller changing.
 *
 * That is the point: every zone link in the tree goes through here, so the
 * cutover for a zone is the `migrated` flag in ZONES and nothing else. Nav has
 * its own near-identical NavLink because it renders from the derived NAV list
 * and carries active-state styling this does not.
 */
export default function ZoneLink({
  zone,
  subpath = '',
  className,
  children,
}: {
  zone: Zone;
  /** Path within the zone, e.g. 'feed.xml' or 'cheatsheets/'. */
  subpath?: string;
  className?: string;
  children: ReactNode;
}) {
  const href = zoneHref(zone, subpath);

  if (zoneIsExternal(zone)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer external" className={className}>
        {children}
        <span className="sr-only"> — leaves zephryx.in, opens in a new tab</span>
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
