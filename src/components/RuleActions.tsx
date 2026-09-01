'use client';

import { useEffect, useState } from 'react';
import { copyText, downloadText } from '@/lib/browser';
import type { CodeBlock } from '@/lib/codeblock';

const RESET_MS = 2200;

type Result = 'idle' | 'copied' | 'failed';

const COPY_LABEL: Record<Result, string> = {
  idle: 'copy rule',
  copied: 'copied ✓',
  failed: 'copy failed',
};

/**
 * Header-level handoff for the rule itself — the thing most readers came for —
 * so taking it never depends on scrolling to the right block. Every block on
 * the page still carries its own controls; this one just leads with the rule.
 *
 * Rendered only after mount: without JavaScript neither action can work, and a
 * fixed-height shell keeps the header from shifting when they appear.
 */
export default function RuleActions({
  block,
  blockCount,
}: {
  block: CodeBlock;
  blockCount: number;
}) {
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState<Result>('idle');

  useEffect(() => setReady(true), []);

  useEffect(() => {
    if (result === 'idle') return;
    const id = window.setTimeout(() => setResult('idle'), RESET_MS);
    return () => window.clearTimeout(id);
  }, [result]);

  return (
    <div className="mt-6 min-h-[2.5rem]">
      {ready ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => downloadText(block.filename, block.code)}
            className="clip-tab border border-red-deep bg-red-core px-4 py-2 font-mono text-[12px] text-void transition-all hover:shadow-[0_0_24px_-6px_rgba(255,45,75,0.85)]"
          >
            download {block.filename}
          </button>

          <button
            type="button"
            onClick={() => void copyText(block.code).then((ok) => setResult(ok ? 'copied' : 'failed'))}
            /* Result colour lives on the border: the accent greens and ambers
               are tuned for the dark backdrop and lose contrast as text on the
               light theme, where this button is not inside a .panel. */
            className={`border px-4 py-2 font-mono text-[12px] transition-all ${
              result === 'copied'
                ? 'border-signal/70 text-ink'
                : result === 'failed'
                  ? 'border-warn/70 text-ink'
                  : 'border-line text-ink-dim hover:border-red-deep/70 hover:text-red-blood'
            }`}
          >
            {COPY_LABEL[result]}
          </button>

          {blockCount > 1 ? (
            <span className="font-mono text-[11px] text-ink-faint">
              +{blockCount - 1} more block{blockCount > 2 ? 's' : ''} below
            </span>
          ) : null}

          <span role="status" className="sr-only">
            {result === 'copied'
              ? `Copied ${block.filename} to the clipboard`
              : result === 'failed'
                ? 'Copy failed — select the rule text manually'
                : ''}
          </span>
        </div>
      ) : null}
    </div>
  );
}
