'use client';

import { useEffect, useState } from 'react';
import { copyText } from '@/lib/browser';

const RESET_MS = 2200;

type Result = 'idle' | 'copied' | 'failed';

const LABEL: Record<Result, string> = {
  idle: 'copy',
  copied: 'copied',
  failed: 'failed',
};

/**
 * Copy control for a single value shown on the page — an address, a
 * fingerprint, an identifier. Pairs with the value rather than replacing it,
 * because the point is to take what you can already read.
 *
 * Rendered only after mount: copying is impossible without JavaScript, and a
 * visible-but-inert control is worse than none.
 */
export default function CopyValue({ value, label }: { value: string; label?: string }) {
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState<Result>('idle');

  useEffect(() => setReady(true), []);

  useEffect(() => {
    if (result === 'idle') return;
    const id = window.setTimeout(() => setResult('idle'), RESET_MS);
    return () => window.clearTimeout(id);
  }, [result]);

  if (!ready) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => void copyText(value).then((ok) => setResult(ok ? 'copied' : 'failed'))}
        aria-label={`Copy ${label ?? value}`}
        className={`shrink-0 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
          result === 'copied'
            ? 'border-signal/70 text-ink'
            : result === 'failed'
              ? 'border-warn/70 text-ink'
              : 'border-line text-ink-faint hover:border-red-deep/70 hover:text-red-blood'
        }`}
      >
        {LABEL[result]}
      </button>
      <span role="status" className="sr-only">
        {result === 'copied'
          ? `Copied ${label ?? value} to the clipboard`
          : result === 'failed'
            ? 'Copy failed — select the text manually'
            : ''}
      </span>
    </>
  );
}
