import Link from 'next/link';
import { FOOTER_LINKS, NAV, SITE, SOCIALS } from '@/lib/site';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 mt-32 border-t border-line/70 bg-abyss/60 backdrop-blur-sm">
      {/* status ticker */}
      <div className="overflow-hidden border-b border-line/50 bg-void/50 py-2">
        <div className="animate-marquee flex w-max gap-10 font-mono text-[11px] tracking-wider text-ink-faint">
          {Array.from({ length: 2 }).map((_, dup) => (
            <div key={dup} className="flex shrink-0 gap-10" aria-hidden={dup === 1}>
              <span className="text-signal">● OPERATIONAL</span>
              <span>ASSUME BREACH</span>
              <span className="text-red-blood/70">TTP: T1059 / T1055 / T1548</span>
              <span>PENETRATION TESTING</span>
              <span>DETECTION ENGINEERING</span>
              <span>ADVERSARY EMULATION</span>
              <span className="text-red-blood/70">PURPLE TEAM LOOP</span>
              <span>OPSEC FIRST</span>
              <span>REPORT · REMEDIATE · REPEAT</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center border border-red-deep/60 bg-red-ash/20 font-mono text-[13px] font-bold text-red-blood">
                Z
              </span>
              <span className="font-mono text-[15px] font-semibold text-ink">
                {SITE.handle}
                <span className="text-red-blood">.in</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-dim">
              {SITE.craft}. Active Directory attack paths, tooling and CTF work — and the
              detection for each one, because I go back afterwards and check what would
              have caught me.
            </p>
            <p className="mt-4 font-mono text-[11px] leading-relaxed text-ink-faint">
              PGP fingerprint available on request via{' '}
              <span className="text-red-blood/80">security@{SITE.domain}</span>
            </p>
          </div>

          <nav aria-label="Footer">
            <h3 className="mb-4 font-mono text-[11px] tracking-[0.3em] text-ink-faint">ROUTES</h3>
            <ul className="space-y-2.5">
              {NAV.map((item) => {
                const linkClassName =
                  'group flex items-baseline gap-1.5 font-mono text-sm text-ink-dim transition-colors hover:text-red-blood';
                const cmd = (
                  <span
                    className="text-[10px] text-ink-faint transition-colors group-hover:text-red-blood/60"
                    aria-hidden
                  >
                    {item.cmd}
                  </span>
                );
                return (
                  <li key={item.href}>
                    {item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer external"
                        className={linkClassName}
                      >
                        {item.label}
                        {cmd}
                      </a>
                    ) : (
                      <Link href={item.href} className={linkClassName}>
                        {item.label}
                        {cmd}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div>
            <h3 className="mb-4 font-mono text-[11px] tracking-[0.3em] text-ink-faint">CHANNELS</h3>
            <ul className="space-y-2.5">
              {SOCIALS.map((s) => (
                <li key={s.id}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer external"
                    className="group inline-flex items-center gap-2 font-mono text-sm text-ink-dim transition-colors hover:text-red-blood"
                  >
                    {s.label}
                    <span className="text-ink-faint transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-red-blood">
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ul className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line/60 pt-6">
          {FOOTER_LINKS.map((item) => {
            const className =
              'font-mono text-[12px] text-ink-faint transition-colors hover:text-red-blood';
            return (
              <li key={item.href}>
                {item.external ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
                    {item.label}
                  </a>
                ) : item.asset ? (
                  <a href={item.href} className={className}>
                    {item.label}
                  </a>
                ) : (
                  <Link href={item.href} className={className}>
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-8 flex flex-col gap-3 border-t border-line/60 pt-6 font-mono text-[11px] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SITE.legalName}. All findings responsibly disclosed.
          </p>
          <p className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
            edge: cloudflare · csp: enforced · hsts: preload
          </p>
        </div>
      </div>
    </footer>
  );
}
