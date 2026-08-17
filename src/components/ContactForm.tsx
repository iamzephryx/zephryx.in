'use client';

import { useRef, useState } from 'react';

/* Mirror the server-side caps so the UI fails fast and identically. */
const LIMITS = {
  name: 80,
  email: 120,
  subject: 120,
  message: 4000,
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Status =
  | { state: 'idle' }
  | { state: 'submitting' }
  | { state: 'ok'; msg: string }
  | { state: 'error'; msg: string };

type Fields = { name: string; email: string; subject: string; message: string };

/* Subject is optional, so it never carries an error. Order matters: a failed
   submit sends focus to the first field in this list that came back bad. */
const VALIDATED = ['name', 'email', 'message'] as const;
type Validated = (typeof VALIDATED)[number];

function validateField(k: keyof Fields, v: string): string | undefined {
  const trimmed = v.trim();
  switch (k) {
    case 'name':
      return trimmed.length < 2 ? 'Tell me who you are (2+ chars).' : undefined;
    case 'email':
      return EMAIL_RE.test(trimmed) ? undefined : 'A reachable email, please.';
    case 'message':
      return trimmed.length < 20 ? 'Give me something to work with (20+ chars).' : undefined;
    default:
      return undefined;
  }
}

export default function ContactForm() {
  const [fields, setFields] = useState<Fields>({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<Status>({ state: 'idle' });
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Fields, boolean>>>({});
  const [attempted, setAttempted] = useState(false);

  // Honeypot + time-trap: bots fill hidden fields and submit instantly.
  const honeypotRef = useRef<HTMLInputElement>(null);
  const mountedAt = useRef<number>(Date.now());

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const fieldRefs: Record<Validated, React.RefObject<HTMLElement | null>> = {
    name: nameRef,
    email: emailRef,
    message: messageRef,
  };

  const set = (k: keyof Fields, max: number) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value.slice(0, max);
    setFields((f) => ({ ...f, [k]: value }));
    setErrors((prev) => {
      // Typing may correct a message that's already on screen, but it must not
      // raise a new one mid-word — before a submit attempt that's blur's job.
      if (!attempted && !prev[k]) return prev;
      return { ...prev, [k]: validateField(k, value) };
    });
  };

  const onBlur = (k: keyof Fields) => (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setTouched((t) => ({ ...t, [k]: true }));
    // Don't scold someone for tabbing through a form they haven't filled in
    // yet; empty required fields surface when they try to submit.
    if (!value.trim() && !attempted) return;
    setErrors((prev) => ({ ...prev, [k]: validateField(k, value) }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status.state === 'submitting') return;

    setAttempted(true);
    setTouched({ name: true, email: true, subject: true, message: true });

    const next: Partial<Record<keyof Fields, string>> = {};
    for (const k of VALIDATED) next[k] = validateField(k, fields[k]);
    setErrors(next);

    const firstBad = VALIDATED.find((k) => next[k]);
    if (firstBad) {
      // Errors are useless to a keyboard or screen reader user if focus stays
      // parked on the submit button at the bottom of the form.
      fieldRefs[firstBad].current?.focus();
      return;
    }

    setStatus({ state: 'submitting' });

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fields.name.trim(),
          email: fields.email.trim(),
          subject: fields.subject.trim(),
          message: fields.message.trim(),
          // anti-spam signals
          company: honeypotRef.current?.value ?? '',
          elapsedMs: Date.now() - mountedAt.current,
        }),
      });

      // The static export has no /api at build time; a 404/HTML response here
      // means the Pages Function is not wired yet. Handle it gracefully.
      const data = await res.json().catch(() => null);

      if (res.ok && data?.ok) {
        setStatus({
          state: 'ok',
          msg: 'Transmission received. I read every message — expect a reply within a few days.',
        });
        setFields({ name: '', email: '', subject: '', message: '' });
        setErrors({});
        setTouched({});
        setAttempted(false);
        return;
      }

      setStatus({
        state: 'error',
        msg: data?.error ?? 'Transmission failed. Email me directly at contact@zephryx.in.',
      });
    } catch {
      setStatus({
        state: 'error',
        msg: 'Network error. The channel may be offline — reach me at contact@zephryx.in.',
      });
    }
  };

  const disabled = status.state === 'submitting';

  return (
    <form onSubmit={onSubmit} noValidate className="panel clip-corner scanlines relative overflow-hidden">
      {/* terminal chrome */}
      <div className="flex items-center gap-2 border-b border-line bg-elevated/70 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-blood/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-signal/70" />
        <span className="ml-3 font-mono text-[11px] tracking-wide text-ink-faint">
          zephryx@ops — ./handshake --init
        </span>
      </div>

      <div className="space-y-6 p-6 sm:p-8">
        {/* honeypot — visually hidden, off the a11y tree, off tab order */}
        <div aria-hidden className="absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="company">Company (leave blank)</label>
          <input
            ref={honeypotRef}
            id="company"
            name="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            id="name"
            label="whoami"
            hint="your name / handle"
            value={fields.name}
            max={LIMITS.name}
            onChange={set('name', LIMITS.name)}
            onBlur={onBlur('name')}
            error={errors.name}
            disabled={disabled}
            autoComplete="name"
            inputRef={nameRef}
          />
          <Field
            id="email"
            label="reply-to"
            hint="you@domain"
            type="email"
            value={fields.email}
            max={LIMITS.email}
            onChange={set('email', LIMITS.email)}
            onBlur={onBlur('email')}
            error={errors.email}
            disabled={disabled}
            autoComplete="email"
            inputRef={emailRef}
          />
        </div>

        <Field
          id="subject"
          label="subject"
          hint="optional — one line"
          value={fields.subject}
          max={LIMITS.subject}
          onChange={set('subject', LIMITS.subject)}
          onBlur={onBlur('subject')}
          disabled={disabled}
        />

        <div>
          <LabelRow htmlFor="message" label="payload" hint={`${fields.message.length} / ${LIMITS.message}`} />
          <textarea
            ref={messageRef}
            id="message"
            name="message"
            rows={7}
            value={fields.message}
            onChange={set('message', LIMITS.message)}
            onBlur={onBlur('message')}
            maxLength={LIMITS.message}
            disabled={disabled}
            spellCheck
            placeholder="Scope, timeline, target surface — or just say hello."
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? 'message-error' : undefined}
            className="w-full resize-y border border-line bg-void/70 p-3.5 font-mono text-[13.5px] leading-relaxed text-ink placeholder:text-ink-faint focus:border-red-deep/70 focus:outline-none disabled:opacity-60"
          />
          {errors.message ? (
            <p id="message-error" className="mt-1.5 font-mono text-[12px] text-red-blood">
              ! {errors.message}
            </p>
          ) : null}
        </div>

        {/* Status line. Both regions stay mounted so assistive tech is already
            watching them when the result lands — a live region injected at the
            same moment as its text is routinely missed. `empty:m-0` keeps the
            idle, zero-height region from opening a gap in the space-y stack. */}
        <div
          role="status"
          className="empty:m-0 border border-signal/30 bg-signal/5 px-4 py-3 font-mono text-[13px] text-signal empty:border-0 empty:p-0"
        >
          {status.state === 'ok' ? (
            <>
              <span className="mr-1">[OK]</span> {status.msg}
            </>
          ) : null}
        </div>
        <div
          role="alert"
          className="empty:m-0 border border-red-deep/40 bg-red-ash/10 px-4 py-3 font-mono text-[13px] text-red-blood empty:border-0 empty:p-0"
        >
          {status.state === 'error' ? (
            <>
              <span className="mr-1">[ERR]</span> {status.msg}
            </>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-[11px] text-ink-faint">
            <span className="text-red-blood/70"># </span>
            validated · rate-limited · no trackers
          </p>
          <button
            type="submit"
            disabled={disabled}
            className="clip-tab group relative inline-flex items-center gap-2 border border-red-deep bg-red-core px-7 py-3 font-mono text-sm font-medium text-void transition-all duration-300 hover:shadow-[0_0_30px_-4px_rgba(255,45,75,0.8)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {disabled ? (
              <>
                <span className="animate-blink">▌</span> sending…
              </>
            ) : (
              <>./send-message</>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

/* ---------------------------- sub-parts ---------------------------- */

function LabelRow({ htmlFor, label, hint }: { htmlFor: string; label: string; hint?: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between">
      <label htmlFor={htmlFor} className="font-mono text-[12px] tracking-wide text-ink-dim">
        <span className="text-red-blood/70">$</span> {label}
      </label>
      {hint ? <span className="font-mono text-[10px] text-ink-faint">{hint}</span> : null}
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  value,
  onChange,
  onBlur,
  max,
  type = 'text',
  error,
  disabled,
  autoComplete,
  inputRef,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  max: number;
  type?: string;
  error?: string;
  disabled?: boolean;
  autoComplete?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  const errorId = `${id}-error`;
  return (
    <div>
      <LabelRow htmlFor={id} label={label} hint={hint} />
      <input
        ref={inputRef}
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        maxLength={max}
        disabled={disabled}
        autoComplete={autoComplete}
        spellCheck={false}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className="w-full border border-line bg-void/70 px-3.5 py-2.5 font-mono text-[13.5px] text-ink placeholder:text-ink-faint focus:border-red-deep/70 focus:outline-none disabled:opacity-60"
      />
      {error ? (
        <p id={errorId} className="mt-1.5 font-mono text-[12px] text-red-blood">
          ! {error}
        </p>
      ) : null}
    </div>
  );
}
