'use client';

import { useEffect, useRef, useState } from 'react';
import { copyText, downloadText } from '@/lib/browser';

/** How long a button holds its "copied" / "saved" state before reverting. */
const RESET_MS = 2200;

/**
 * Renders a detection's body and wires the copy/download controls that
 * lib/codeblock.ts bakes into every fenced block.
 *
 * One delegated listener covers every block on the page, and the controls stay
 * hidden until this component mounts (`prose-terminal--interactive`), so a
 * reader without JavaScript sees the plain rule text instead of dead buttons.
 */
export default function DetectionBody({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    setInteractive(true);

    // Button → pending revert. Keyed by element so a second click on the same
    // button restarts its timer instead of leaving a stale one to fire early.
    const timers = new Map<HTMLElement, number>();

    const flash = (button: HTMLElement, label: string, state: 'done' | 'error', spoken: string) => {
      const text = button.querySelector<HTMLElement>('[data-code-label]') ?? button;
      const status = button
        .closest('.code-block')
        ?.querySelector<HTMLElement>('[data-code-status]');

      const pending = timers.get(button);
      if (pending) window.clearTimeout(pending);

      // Captured on first use — the idle wording lives in the server-rendered
      // markup, not here.
      const idle = (button.dataset.codeIdle ??= text.textContent ?? '');

      text.textContent = label;
      button.dataset.state = state;
      if (status) status.textContent = spoken;

      timers.set(
        button,
        window.setTimeout(() => {
          text.textContent = idle;
          delete button.dataset.state;
          if (status) status.textContent = '';
          timers.delete(button);
        }, RESET_MS),
      );
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const button = target?.closest<HTMLButtonElement>('[data-code-action]');
      if (!button) return;

      const block = button.closest<HTMLElement>('.code-block');
      const code = block?.querySelector('pre code')?.textContent;
      if (!block || code == null) return;

      const filename = block.dataset.filename || 'rule.txt';

      if (button.dataset.codeAction === 'download') {
        downloadText(filename, code);
        flash(button, 'saved', 'done', `Downloaded ${filename}`);
        return;
      }

      void copyText(code).then((ok) =>
        flash(
          button,
          ok ? 'copied' : 'failed',
          ok ? 'done' : 'error',
          ok ? `Copied ${filename} to the clipboard` : 'Copy failed — select the text manually',
        ),
      );
    };

    root.addEventListener('click', onClick);
    return () => {
      root.removeEventListener('click', onClick);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  return (
    /*
      Body HTML is produced by the markdown pipeline in lib/detections.ts,
      which disables raw-HTML passthrough (html: () => ''). The content is
      first-party and cannot emit author-controlled markup, so injecting it
      here carries no stored-XSS surface.
    */
    <div
      ref={ref}
      className={`prose-terminal mt-10 ${interactive ? 'prose-terminal--interactive' : ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
