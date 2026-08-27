'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { NAV, SITE } from '@/lib/site';
import ThemeToggle from './ThemeToggle';

const SEARCH_HREF = '/search/';

/** Renders `Link` for an internal route, or a new-tab anchor for `external` — see NAV in site.ts. */
function NavLink({
  item,
  active,
  className,
  children,
}: {
  item: { href: string; external: boolean };
  active: boolean;
  className: string;
  children: ReactNode;
}) {
  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer external"
        aria-current={active ? 'page' : undefined}
        className={className}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={item.href} aria-current={active ? 'page' : undefined} className={className}>
      {children}
    </Link>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the drawer on route change and on Escape.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // `/` and ⌘/Ctrl+K open the unified search from anywhere. Guarded on the
  // focused element so the section filter boxes, the terminal prompt and the
  // contact form keep receiving the keystroke they were typed into.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.isContentEditable || /^(input|textarea|select)$/i.test(el?.tagName ?? '')) return;

      const slash = e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey;
      const cmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      if (!slash && !cmdK) return;
      if (pathname === SEARCH_HREF.replace(/\/$/, '') || pathname === SEARCH_HREF) return;

      e.preventDefault();
      router.push(SEARCH_HREF);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pathname, router]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href.replace(/\/$/, ''));

  // The top bar carries the primary destinations only, minus Contact — that one
  // is the CTA button at the end of the row, so listing it twice would be noise.
  // Home is the wordmark on desktop. Everything else lives in the drawer/footer.
  const desktopNav = NAV.filter((item) => item.primary && item.href !== '/handshake/');
  const contact = NAV.find((item) => item.href === '/handshake/');

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'border-b border-line/80 bg-void/80 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        {/* wordmark */}
        <Link href="/" className="group flex items-center gap-2.5" aria-label={`${SITE.name} — home`}>
          <span className="relative flex h-7 w-7 items-center justify-center border border-red-deep/60 bg-red-ash/20">
            <span className="animate-pulse-ring absolute inset-0" />
            <span className="font-mono text-[13px] font-bold text-red-blood">Z</span>
          </span>
          <span className="font-mono text-[15px] font-semibold tracking-tight text-ink">
            {SITE.handle}
            <span className="text-red-blood">.in</span>
          </span>
        </Link>

        {/* desktop nav */}
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {desktopNav.map((item) => {
            const active = !item.external && isActive(item.href);
            return (
              <NavLink
                key={item.href}
                item={item}
                active={active}
                className={`group relative flex items-baseline gap-1.5 px-3 py-2 font-mono text-[13px] transition-colors duration-300 ${
                  active ? 'text-ink' : 'text-ink-faint hover:text-ink-dim'
                }`}
              >
                {item.label}
                <span
                  className={`text-[10px] transition-colors duration-300 ${
                    active ? 'text-red-blood/70' : 'text-ink-faint/60 group-hover:text-red-blood/60'
                  }`}
                  aria-hidden
                >
                  {item.cmd}
                </span>
                <span
                  className={`absolute inset-x-2.5 bottom-1 h-px origin-left bg-red-blood transition-transform duration-300 ${
                    active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`}
                />
              </NavLink>
            );
          })}
          {contact ? (
            <Link
              href={contact.href}
              aria-current={isActive(contact.href) ? 'page' : undefined}
              className="clip-tab group ml-2.5 flex items-baseline gap-1.5 border border-red-deep/70 bg-red-ash/25 px-3.5 py-2 font-mono text-[13px] text-red-blood transition-all duration-300 hover:bg-red-blood hover:text-void hover:shadow-[0_0_24px_-4px_rgba(255,45,75,0.7)]"
            >
              {contact.label}
              <span className="text-[10px] text-red-blood/60 transition-colors duration-300 group-hover:text-void/70" aria-hidden>
                {contact.cmd}
              </span>
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2.5">
          {/* One box for writeups and detections alike. */}
          <Link
            href={SEARCH_HREF}
            aria-label="Search writeups and detections"
            title="Search everything ( / )"
            aria-current={isActive(SEARCH_HREF) ? 'page' : undefined}
            className={`flex h-9 items-center gap-2 border px-2.5 transition-colors duration-300 ${
              isActive(SEARCH_HREF)
                ? 'border-red-deep bg-red-ash/25 text-red-blood'
                : 'border-line text-ink-dim hover:border-red-deep/60 hover:text-red-blood'
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
              <circle
                cx="10.5"
                cy="10.5"
                r="6.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M15.5 15.5 21 21"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <kbd className="hidden font-mono text-[10px] text-ink-faint sm:inline" aria-hidden>
              /
            </kbd>
          </Link>

          <ThemeToggle />

          {/* mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 border border-line lg:hidden"
          >
            <span
              className={`h-px w-4 bg-ink transition-all duration-300 ${open ? 'translate-y-[3.5px] rotate-45' : ''}`}
            />
            <span
              className={`h-px w-4 bg-ink transition-all duration-300 ${open ? '-translate-y-[3.5px] -rotate-45' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* mobile drawer */}
      <div
        id="mobile-nav"
        className={`overflow-hidden border-t border-line/60 bg-void/95 backdrop-blur-xl transition-[max-height,opacity] duration-400 lg:hidden ${
          open ? 'max-h-[32rem] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="flex flex-col px-5 py-3" aria-label="Mobile">
          {NAV.map((item) => {
            const active = !item.external && isActive(item.href);
            return (
              <NavLink
                key={item.href}
                item={item}
                active={active}
                className={`flex items-center justify-between border-b border-line/50 py-3.5 font-mono text-sm last:border-0 ${
                  active ? 'text-red-blood' : 'text-ink-dim'
                }`}
              >
                <span>{item.label}</span>
                <span className="text-[11px] text-ink-faint" aria-hidden>
                  {item.cmd}
                </span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
