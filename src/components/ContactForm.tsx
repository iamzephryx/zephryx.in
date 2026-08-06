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

export default function ContactForm() {
  const [fields, setFields] = useState<Fields>({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<Status>({ state: 'idle' });
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});

  // Honeypot + time-trap: bots fill hidden fields and submit instantly.
  const honeypotRef = useRef<HTMLInputElement>(null);
  const mountedAt = useRef<number>(Date.now());

  const set = (k: keyof Fields, max: number) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFields((f) => ({ ...f, [k]: e.target.value.slice(0, max) }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof Fields, string>> = {};
    if (fields.name.trim().length < 2) next.name = 'Tell me who you are (2+ chars).';
    if (!EMAIL_RE.test(fields.email.trim())) next.email = 'A reachable email, please.';
    if (fields.message.trim().length < 20) next.message = 'Give me something to work with (20+ chars).';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status.state === 'submitting') return;
    if (!validate()) return;

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
            error={errors.name}
            disabled={disabled}
            autoComplete="name"
          />
          <Field
            id="email"
            label="reply-to"
            hint="you@domain"
            type="email"
            value={fields.email}
            max={LIMITS.email}
            onChange={set('email', LIMITS.email)}
            error={errors.email}
            disabled={disabled}
            autoComplete="email"
          />
        </div>

        <Field
          id="subject"
          label="subject"
          hint="optional — one line"
          value={fields.subject}
          max={LIMITS.subject}
          onChange={set('subject', LIMITS.subject)}
          disabled={disabled}
        />

        <div>
          <LabelRow htmlFor="message" label="payload" hint={`${fields.message.length} / ${LIMITS.message}`} />
          <textarea
            id="message"
            name="message"
            rows={7}
            value={fields.message}
            onChange={set('message', LIMITS.message)}
            maxLength={LIMITS.message}
            disabled={disabled}
            spellCheck
            placeholder="Scope, timeline, target surface — or just say hello."
            aria-invalid={!!errors.message}
            className="w-full resize-y border border-line bg-void/70 p-3.5 font-mono text-[13.5px] leading-relaxed text-ink placeholder:text-ink-faint focus:border-red-deep/70 focus:outline-none disabled:opacity-60"
          />
          {errors.message ? (
            <p className="mt-1.5 font-mono text-[12px] text-red-blood">! {errors.message}</p>
          ) : null}
        </div>

        {/* status line */}
        {status.state === 'ok' ? (
          <p className="border border-signal/30 bg-signal/5 px-4 py-3 font-mono text-[13px] text-signal">
            <span className="mr-1">[OK]</span> {status.msg}
          </p>
        ) : null}
        {status.state === 'error' ? (
          <p className="border border-red-deep/40 bg-red-ash/10 px-4 py-3 font-mono text-[13px] text-red-blood">
            <span className="mr-1">[ERR]</span> {status.msg}
          </p>
        ) : null}

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
                <span className="animate-blink">▌</span> transmitting…
              </>
            ) : (
              <>./transmit</>
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
  max,
  type = 'text',
  error,
  disabled,
  autoComplete,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  max: number;
  type?: string;
  error?: string;
  disabled?: boolean;
  autoComplete?: string;
}) {
  return (
    <div>
      <LabelRow htmlFor={id} label={label} hint={hint} />
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        maxLength={max}
        disabled={disabled}
        autoComplete={autoComplete}
        spellCheck={false}
        aria-invalid={!!error}
        className="w-full border border-line bg-void/70 px-3.5 py-2.5 font-mono text-[13.5px] text-ink placeholder:text-ink-faint focus:border-red-deep/70 focus:outline-none disabled:opacity-60"
      />
      {error ? <p className="mt-1.5 font-mono text-[12px] text-red-blood">! {error}</p> : null}
    </div>
  );
}
