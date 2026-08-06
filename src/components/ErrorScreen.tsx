import Link from 'next/link';

type Action = { href: string; label: string; primary?: boolean };

/**
 * Shared hacker-themed error surface. Pure presentational server component —
 * reused by the 404, 403 and 503 pages so they stay visually identical.
 */
export default function ErrorScreen({
  code,
  status,
  title,
  message,
  log,
  actions = [
    { href: '/', label: 'cd ~', primary: true },
    { href: '/writeups/', label: './writeups' },
  ],
}: {
  code: string;
  status: string;
  title: string;
  message: string;
  log: string[];
  actions?: Action[];
}) {
  return (
    <section className="relative flex min-h-screen items-center justify-center px-5 py-24 sm:px-8">
      <div className="mx-auto w-full max-w-2xl text-center">
        {/* glitch code */}
        <h1
          className="glitch text-glow font-mono text-[6rem] font-bold leading-none tracking-tighter text-ink sm:text-[10rem]"
          data-text={code}
        >
          {code}
        </h1>

        <p className="mt-2 font-mono text-sm uppercase tracking-[0.4em] text-red-blood/80">
          {status}
        </p>

        <h2 className="mt-6 font-mono text-2xl font-semibold text-ink sm:text-3xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-ink-dim">{message}</p>

        {/* fake log block */}
        <div className="panel clip-corner scanlines mx-auto mt-9 max-w-lg overflow-hidden text-left">
          <div className="flex items-center gap-2 border-b border-line bg-elevated/70 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-red-blood/80" />
            <span className="h-2 w-2 rounded-full bg-warn/70" />
            <span className="h-2 w-2 rounded-full bg-signal/70" />
            <span className="ml-2 font-mono text-[10px] tracking-wide text-ink-faint">
              /var/log/edge.log
            </span>
          </div>
          <div className="space-y-1 bg-void/70 px-4 py-4 font-mono text-[12px] leading-relaxed">
            {log.map((line, i) => (
              <p
                key={i}
                className={
                  line.startsWith('[!]') || line.startsWith('[-]')
                    ? 'text-red-blood'
                    : line.startsWith('[+]')
                      ? 'text-signal'
                      : 'text-ink-dim'
                }
              >
                {line}
              </p>
            ))}
            <p className="text-ink">
              <span className="text-red-blood">❯</span>{' '}
              <span className="animate-blink">▌</span>
            </p>
          </div>
        </div>

        {/* actions */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          {actions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={
                a.primary
                  ? 'clip-tab border border-red-deep bg-red-core px-6 py-3 font-mono text-sm text-void transition-all hover:shadow-[0_0_30px_-4px_rgba(255,45,75,0.8)]'
                  : 'border border-line px-6 py-3 font-mono text-sm text-ink-dim transition-all hover:border-red-deep/70 hover:text-red-blood'
              }
            >
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
