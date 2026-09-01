'use client';

import { useRef, useState } from 'react';
import { SERVICES } from '@/lib/services';

/* Mirror the server-side caps so the UI fails fast and identically. */
const LIMITS = {
  name: 80,
  email: 120,
  company: 100,
  message: 4000,
  maxServices: SERVICES.length,
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const COMPANY_SIZES = ['1–10', '11–50', '51–200', '201–1000', '1000+', 'Not sure'] as const;

type Status =
  | { state: 'idle' }
  | { state: 'submitting' }
  | { state: 'ok'; msg: string }
  | { state: 'error'; msg: string };

type Fields = {
  name: string;
  email: string;
  company: string;
  companySize: string;
  services: string[];
  message: string;
};

const VALIDATED = ['name', 'email', 'message'] as const;
type Validated = (typeof VALIDATED)[number];

function validateField(k: keyof Fields, v: string): string | undefined {
  const trimmed = v.trim();
  switch (k) {
    case 'name':
      return trimmed.length < 2 ? 'Tell me who you are (2+ chars).' : undefined;
    case 'email':
      return EMAIL_RE.test(trimmed) ? undefined : 'A reachable work email, please.';
    case 'message':
      return trimmed.length < 20 ? 'Give me enough to scope this (20+ chars).' : undefined;
    default:
      return undefined;
  }
}

export default function QuoteForm() {
  const [fields, setFields] = useState<Fields>({
    name: '',
    email: '',
    company: '',
    companySize: '',
    services: [],
    message: '',
  });
  const [status, setStatus] = useState<Status>({ state: 'idle' });
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
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

  const setText =
    (k: 'name' | 'email' | 'company', max: number) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.slice(0, max);
      setFields((f) => ({ ...f, [k]: value }));
      setErrors((prev) => {
        if (!attempted && !prev[k]) return prev;
        return { ...prev, [k]: validateField(k, value) };
      });
    };

  const setMessage = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.slice(0, LIMITS.message);
    setFields((f) => ({ ...f, message: value }));
    setErrors((prev) => {
      if (!attempted && !prev.message) return prev;
      return { ...prev, message: validateField('message', value) };
    });
  };

  const onBlur =
    (k: 'name' | 'email' | 'message') =>
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (!value.trim() && !attempted) return;
      setErrors((prev) => ({ ...prev, [k]: validateField(k, value) }));
    };

  const toggleService = (id: string) => {
    setFields((f) => {
      const has = f.services.includes(id);
      const next = has ? f.services.filter((s) => s !== id) : [...f.services, id];
      return { ...f, services: next.slice(0, LIMITS.maxServices) };
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status.state === 'submitting') return;

    setAttempted(true);

    const next: Partial<Record<keyof Fields, string>> = {};
    for (const k of VALIDATED) next[k] = validateField(k, fields[k]);
    setErrors(next);

    const firstBad = VALIDATED.find((k) => next[k]);
    if (firstBad) {
      fieldRefs[firstBad].current?.focus();
      return;
    }

    setStatus({ state: 'submitting' });

    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fields.name.trim(),
          email: fields.email.trim(),
          company: fields.company.trim(),
          companySize: fields.companySize,
          services: fields.services,
          message: fields.message.trim(),
          // anti-spam signals
          hp: honeypotRef.current?.value ?? '',
          elapsedMs: Date.now() - mountedAt.current,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.ok) {
        setStatus({
          state: 'ok',
          msg: "Received. I read every request myself and reply within one business day, usually sooner.",
        });
        setFields({ name: '', email: '', company: '', companySize: '', services: [], message: '' });
        setErrors({});
        setAttempted(false);
        return;
      }

      setStatus({
        state: 'error',
        msg: data?.error ?? 'Send failed. Email hello@security.zephryx.in directly.',
      });
    } catch {
      setStatus({
        state: 'error',
        msg: 'Network error. The channel may be offline — reach me at hello@security.zephryx.in.',
      });
    }
  };

  const disabled = status.state === 'submitting';

  return (
    <form onSubmit={onSubmit} noValidate className="panel clip-corner relative overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line bg-elevated/70 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-blood/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-signal/70" />
        <span className="ml-3 font-mono text-[11px] tracking-wide text-ink-faint">
          zephryx@security — ./request-assessment
        </span>
      </div>

      <div className="space-y-6 p-6 sm:p-8">
        {/* honeypot — visually hidden, off the a11y tree, off tab order */}
        <div aria-hidden className="absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="hp-company">Company website (leave blank)</label>
          <input ref={honeypotRef} id="hp-company" name="hp" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="name"
            label="whoami"
            hint="your name"
            value={fields.name}
            max={LIMITS.name}
            onChange={setText('name', LIMITS.name)}
            onBlur={onBlur('name')}
            error={errors.name}
            disabled={disabled}
            required
            autoComplete="name"
            inputRef={nameRef}
          />
          <Field
            id="email"
            label="reply-to"
            hint="you@company.com"
            type="email"
            value={fields.email}
            max={LIMITS.email}
            onChange={setText('email', LIMITS.email)}
            onBlur={onBlur('email')}
            error={errors.email}
            disabled={disabled}
            required
            autoComplete="email"
            inputRef={emailRef}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="company"
            label="company"
            hint="optional"
            value={fields.company}
            max={LIMITS.company}
            onChange={setText('company', LIMITS.company)}
            disabled={disabled}
            autoComplete="organization"
          />
          <div>
            <LabelRow htmlFor="companySize" label="company size" hint="optional" />
            <select
              id="companySize"
              name="companySize"
              value={fields.companySize}
              onChange={(e) => setFields((f) => ({ ...f, companySize: e.target.value }))}
              disabled={disabled}
              className="w-full appearance-none border border-line bg-void/70 px-3.5 py-2.5 font-mono text-[13.5px] text-ink focus:border-red-deep/70 disabled:opacity-60"
            >
              <option value="">Select…</option>
              {COMPANY_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset>
          <legend className="mb-2.5 font-mono text-[12px] tracking-wide text-ink-dim">
            <span className="text-red-blood/70">$</span> what are you looking for?{' '}
            <span className="font-mono text-[10px] text-ink-faint">(optional, pick any)</span>
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {SERVICES.map((s) => {
              const checked = fields.services.includes(s.id);
              return (
                <label
                  key={s.id}
                  className={`flex cursor-pointer items-center gap-2.5 border px-3 py-2 font-mono text-[12.5px] transition-colors ${
                    checked ? 'border-red-deep/70 bg-red-ash/10 text-ink' : 'border-line text-ink-dim hover:border-line-hot'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleService(s.id)}
                    disabled={disabled}
                    className="h-3.5 w-3.5 accent-red-blood"
                  />
                  {s.short}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <LabelRow htmlFor="message" label="scope" hint={`${fields.message.length} / ${LIMITS.message}`} />
          <textarea
            ref={messageRef}
            id="message"
            name="message"
            rows={6}
            value={fields.message}
            onChange={setMessage}
            onBlur={onBlur('message')}
            maxLength={LIMITS.message}
            disabled={disabled}
            required
            spellCheck
            placeholder="What are you building, what needs testing, and any timeline or deadline (audit, funding round, launch) driving it."
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? 'message-error' : undefined}
            className="w-full resize-y border border-line bg-void/70 p-3.5 font-mono text-[13.5px] leading-relaxed text-ink placeholder:text-ink-faint focus:border-red-deep/70 disabled:opacity-60"
          />
          {errors.message ? (
            <p id="message-error" className="mt-1.5 font-mono text-[12px] text-red-blood">
              ! {errors.message}
            </p>
          ) : null}
        </div>

        {/* Both regions stay mounted so assistive tech is already watching them
            when the result lands. */}
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
            NDA on request · no spam · no trackers
          </p>
          <button
            type="submit"
            disabled={disabled}
            className="clip-tab inline-flex items-center gap-2 border border-red-deep bg-red-core px-7 py-3 font-mono text-sm font-medium text-void transition-all duration-300 hover:shadow-[0_0_30px_-4px_rgba(255,45,75,0.8)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {disabled ? (
              <>
                <span className="animate-blink">▌</span> sending…
              </>
            ) : (
              <>./send-request</>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

function LabelRow({ htmlFor, label, hint }: { htmlFor: string; label: string; hint?: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3">
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
  required,
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
  required?: boolean;
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
        required={required}
        autoComplete={autoComplete}
        spellCheck={false}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className="w-full border border-line bg-void/70 px-3.5 py-2.5 font-mono text-[13.5px] text-ink placeholder:text-ink-faint focus:border-red-deep/70 disabled:opacity-60"
      />
      {error ? (
        <p id={errorId} className="mt-1.5 font-mono text-[12px] text-red-blood">
          ! {error}
        </p>
      ) : null}
    </div>
  );
}
