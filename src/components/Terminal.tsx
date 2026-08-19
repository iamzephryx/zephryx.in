'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BOOT_BANNER,
  COMMANDS,
  COMPLETIONS,
  execute,
  type CommandContext,
  type Line,
} from '@/lib/terminal/commands';
import { LIMITS, parse, RateLimiter, safeRoute, sanitize } from '@/lib/terminal/safety';
import ZephryxWordmark from '@/components/ZephryxWordmark';

type Row = Line & { id: number };

const KIND_CLASS: Record<string, string> = {
  input: 'text-ink',
  out: 'text-ink-dim',
  dim: 'text-ink-faint',
  ok: 'text-signal',
  warn: 'text-warn',
  err: 'text-red-blood',
  accent: 'text-red-blood font-semibold',
  link: 'text-red-blood',
};

const BOOT_SEQUENCE: Line[] = [
  { kind: 'dim', text: 'Initialising secure session …' },
  { kind: 'dim', text: 'TLS 1.3 · X25519MLKEM768 · HSTS preload   [OK]' },
  { kind: 'dim', text: 'Security headers enforced at the edge     [OK]' },
  { kind: 'dim', text: 'Input sanitiser · rate limiter armed      [OK]' },
];

let uid = 0;
const nextId = () => ++uid;

/** Longest prefix every candidate shares — how far one Tab press can safely fill in. */
function commonPrefix(words: readonly string[]): string {
  if (words.length === 0) return '';
  return words.slice(1).reduce((prefix, word) => {
    let i = 0;
    while (i < prefix.length && i < word.length && prefix[i] === word[i]) i += 1;
    return prefix.slice(0, i);
  }, words[0]);
}

/*
 * The control bar doubles as the keyboard legend on a desktop and as the only
 * way to reach Tab/↑/↓ on a touch device, so each entry is a real button: flat
 * text from `sm` up, a tappable chip below it.
 */
const CONTROL_CLASS =
  'inline-flex min-h-9 touch-manipulation items-center gap-1.5 rounded border border-line/80 ' +
  'bg-void/50 px-2.5 text-ink-faint transition-colors hover:text-ink-dim ' +
  'hover:border-red-blood/50 active:bg-elevated disabled:opacity-40 ' +
  'disabled:hover:border-line/80 disabled:hover:text-ink-faint ' +
  'sm:min-h-0 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0';

export default function Terminal() {
  const router = useRouter();

  const [rows, setRows] = useState<Row[]>([]);
  const [input, setInput] = useState('');
  const [booted, setBooted] = useState(false);
  const [focused, setFocused] = useState(false);
  const [histIndex, setHistIndex] = useState(-1);
  // Mirrors historyRef's depth so the ↑/↓ controls can disable themselves.
  const [histCount, setHistCount] = useState(0);

  const historyRef = useRef<string[]>([]);
  const draftRef = useRef('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bootedAtRef = useRef(Date.now());
  const limiter = useMemo(() => new RateLimiter(), []);

  const push = useCallback((lines: Line[]) => {
    if (lines.length === 0) return;
    setRows((prev) => {
      const merged = [...prev, ...lines.map((l) => ({ ...l, id: nextId() }) as Row)];
      // Bound memory: keep only the most recent scrollback.
      return merged.length > LIMITS.SCROLLBACK ? merged.slice(-LIMITS.SCROLLBACK) : merged;
    });
  }, []);

  /* -------------------- boot animation -------------------- */
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const script: Line[] = [
      ...BOOT_BANNER.map((text) => ({ kind: 'wordmark' as const, text })),
      { kind: 'out', text: '' },
      ...BOOT_SEQUENCE,
      { kind: 'out', text: '' },
      { kind: 'ok', text: `Session ready. ${COMMANDS.size} commands loaded.` },
      { kind: 'dim', text: "Type 'help' to begin, or 'whoami' if you are in a hurry." },
      { kind: 'out', text: '' },
    ];

    if (reduced) {
      push(script);
      setBooted(true);
      return;
    }

    let i = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const step = () => {
      if (i >= script.length) {
        setBooted(true);
        return;
      }
      push([script[i]]);
      i += 1;
      // Banner rows snap in; status rows tick.
      timers.push(setTimeout(step, i <= BOOT_BANNER.length ? 55 : 140));
    };
    timers.push(setTimeout(step, 320));
    return () => timers.forEach(clearTimeout);
  }, [push]);

  /* -------------------- autoscroll -------------------- */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [rows]);

  /* -------------------- command context -------------------- */
  const ctx: CommandContext = useMemo(
    () => ({
      navigate: (route: string) => {
        // Second gate: the registry validates, and so does the caller. Routes
        // may carry a bounded ?q= for the search page; safeRoute re-encodes it.
        const target = safeRoute(route);
        if (target) {
          setTimeout(() => router.push(target), 380);
        }
      },
      clear: () => setRows([]),
      get history() {
        return historyRef.current;
      },
      bootedAt: bootedAtRef.current,
    }),
    [router],
  );

  /* -------------------- submit -------------------- */
  const submit = useCallback(() => {
    const parsed = parse(input);
    setInput('');
    setHistIndex(-1);
    draftRef.current = '';

    if (!parsed) {
      push([{ kind: 'input', text: '' }]);
      return;
    }

    if (!limiter.allow()) {
      push([
        { kind: 'input', text: parsed.raw },
        { kind: 'warn', text: 'Rate limit reached. Slow down for a moment.' },
      ]);
      return;
    }

    historyRef.current = [...historyRef.current, parsed.raw].slice(-LIMITS.HISTORY);
    setHistCount(historyRef.current.length);
    push([{ kind: 'input', text: parsed.raw }, ...execute(parsed, ctx)]);
  }, [ctx, input, limiter, push]);

  /* -------------------- editing actions -------------------- */
  /*
   * ↑/↓, Tab and clear live here rather than inside the key handler because the
   * on-screen controls drive the same three actions — a phone has no Tab key.
   */
  const historyStep = useCallback(
    (delta: -1 | 1) => {
      const hist = historyRef.current;
      if (hist.length === 0) return;

      if (delta === -1) {
        // Stepping back: stash the half-typed line before it is overwritten.
        if (histIndex === -1) draftRef.current = input;
        const next = histIndex === -1 ? hist.length - 1 : Math.max(0, histIndex - 1);
        setHistIndex(next);
        setInput(hist[next]);
        return;
      }

      if (histIndex === -1) return;
      const next = histIndex + 1;
      if (next >= hist.length) {
        setHistIndex(-1);
        setInput(draftRef.current);
      } else {
        setHistIndex(next);
        setInput(hist[next]);
      }
    },
    [histIndex, input],
  );

  const complete = useCallback(() => {
    const stem = input.trim().toLowerCase();

    // Every branch below ends in visible feedback. A completion that silently
    // does nothing reads as a broken key, which is exactly what an empty
    // prompt, a dead stem and an already-complete word used to do.
    if (!stem) {
      push([{ kind: 'dim', text: COMPLETIONS.join('   ') }]);
      return;
    }
    if (stem.includes(' ')) return;

    const matches = COMPLETIONS.filter((c) => c.startsWith(stem));
    if (matches.length === 0) {
      push([{ kind: 'dim', text: `no completion for '${stem}'` }]);
      return;
    }
    if (matches.length === 1) {
      setInput(`${matches[0]} `);
      return;
    }

    // Several candidates: fill in as far as they agree, then list the set.
    const shared = commonPrefix(matches);
    if (shared.length > stem.length) setInput(shared);
    push([
      { kind: 'input', text: stem },
      { kind: 'dim', text: matches.join('   ') },
    ]);
  }, [input, push]);

  const clearScreen = useCallback(() => setRows([]), []);

  /** Run a control-bar action and hand the caret straight back to the prompt. */
  const control = (action: () => void) => () => {
    action();
    inputRef.current?.focus();
  };

  /* -------------------- key handling -------------------- */
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        submit();
        return;

      case 'ArrowUp':
        e.preventDefault();
        historyStep(-1);
        return;

      case 'ArrowDown':
        e.preventDefault();
        historyStep(1);
        return;

      case 'Tab':
        e.preventDefault();
        complete();
        return;

      default:
        break;
    }

    if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault();
      push([{ kind: 'input', text: `${input}^C` }]);
      setInput('');
      setHistIndex(-1);
      return;
    }

    if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
      e.preventDefault();
      clearScreen();
    }
  };

  /* -------------------- paste clamp -------------------- */
  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = sanitize(e.clipboardData.getData('text').slice(0, LIMITS.PASTE));
    setInput((prev) => sanitize(prev + text));
  };

  return (
    <div
      className="panel clip-corner scanlines relative overflow-hidden"
      onClick={() => inputRef.current?.focus()}
    >
      {/* chrome */}
      <div className="flex items-center justify-between border-b border-line bg-elevated/70 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-blood/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-signal/70" />
          <span className="ml-3 font-mono text-[11px] tracking-wide text-ink-faint">
            zephryx@ops — /bin/zsh — 80×24
          </span>
        </div>
        <span className="hidden font-mono text-[10px] tracking-[0.2em] text-ink-faint sm:block">
          {focused ? 'INPUT ACTIVE' : 'CLICK TO FOCUS'}
        </span>
      </div>

      {/* scrollback */}
      <div
        ref={scrollRef}
        className="h-[380px] overflow-y-auto bg-void/70 px-4 py-4 font-mono text-[12.5px] leading-[1.65] sm:h-[440px] sm:text-[13px]"
        role="log"
        aria-live="polite"
        aria-label="Terminal output"
      >
        {rows.map((row) => {
          if (row.kind === 'link') {
            return (
              <div key={row.id}>
                <a
                  href={row.href}
                  {...(row.external
                    ? { target: '_blank', rel: 'noopener noreferrer external' }
                    : {})}
                  className="text-red-blood underline decoration-red-blood/40 underline-offset-2 transition-colors hover:decoration-red-blood"
                  onClick={(e) => e.stopPropagation()}
                >
                  {row.text}
                  {row.external ? ' ↗' : ''}
                </a>
              </div>
            );
          }

          if (row.kind === 'input') {
            return (
              <div key={row.id} className="flex gap-2 whitespace-pre-wrap break-words">
                <span className="shrink-0 text-red-blood" aria-hidden>
                  ❯
                </span>
                <span className="text-ink">{row.text}</span>
              </div>
            );
          }

          if (row.kind === 'wordmark') {
            return (
              <div key={row.id} className="py-1">
                <ZephryxWordmark />
              </div>
            );
          }

          return (
            <div
              key={row.id}
              className={`whitespace-pre-wrap break-words ${KIND_CLASS[row.kind] ?? 'text-ink-dim'}`}
            >
              {row.text === '' ? ' ' : row.text}
            </div>
          );
        })}

        {/* live prompt */}
        {booted ? (
          <div className="mt-1 flex items-baseline gap-2">
            <span className="shrink-0 font-mono text-red-blood" aria-hidden>
              ❯
            </span>
            <div className="relative flex-1">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(sanitize(e.target.value))}
                onKeyDown={onKeyDown}
                onPaste={onPaste}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                maxLength={LIMITS.INPUT}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                inputMode="text"
                enterKeyHint="go"
                aria-label="Terminal command input"
                className="w-full border-0 bg-transparent p-0 font-mono text-[12.5px] text-ink caret-red-blood outline-none placeholder:text-ink-faint sm:text-[13px]"
                placeholder="help"
              />
              {!focused && input === '' ? (
                <span className="animate-blink pointer-events-none absolute left-0 top-0 font-mono text-[12.5px] text-red-blood sm:text-[13px]">
                  ▌
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {/* control bar — keyboard legend on a desktop, the only way in on a phone */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-line bg-elevated/50 px-3 py-2 font-mono text-[10px] text-ink-faint sm:gap-x-4 sm:gap-y-1 sm:px-4">
        <button
          type="button"
          // Keeping the default off the press keeps the prompt focused, so a
          // phone's on-screen keyboard does not close between taps.
          onMouseDown={(e) => e.preventDefault()}
          onClick={control(complete)}
          className={CONTROL_CLASS}
          aria-label="Complete the current command"
        >
          <kbd className="hidden text-ink-dim sm:inline">Tab</kbd>
          <span aria-hidden className="text-ink-dim sm:hidden">
            ⇥
          </span>
          complete
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={control(() => historyStep(-1))}
          disabled={histCount === 0}
          className={CONTROL_CLASS}
          aria-label="Previous command from history"
        >
          <kbd className="text-ink-dim">↑</kbd>
          prev
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={control(() => historyStep(1))}
          disabled={histCount === 0}
          className={CONTROL_CLASS}
          aria-label="Next command from history"
        >
          <kbd className="text-ink-dim">↓</kbd>
          next
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={control(clearScreen)}
          className={CONTROL_CLASS}
          aria-label="Clear the terminal"
        >
          <kbd className="hidden text-ink-dim sm:inline">Ctrl+L</kbd>
          <span aria-hidden className="text-ink-dim sm:hidden">
            ⌫
          </span>
          clear
        </button>
        <span className="ml-auto hidden sm:inline">sandboxed · no eval · no network</span>
      </div>
    </div>
  );
}
