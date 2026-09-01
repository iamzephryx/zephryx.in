/**
 * Severity and rule-status chip styling.
 *
 * Lives in its own module because both the client-side detections index and the
 * server-rendered rule pages need it — lib/detections.ts touches `fs` and can
 * never be imported from a client component.
 */

import type { RuleStatus, Severity } from './detections';

export const SEVERITY_STYLE: Record<Severity, string> = {
  critical: 'border-red-deep bg-red-ash/30 text-red-blood',
  high: 'border-red-deep/50 bg-red-ash/15 text-red-blood/90',
  medium: 'border-warn/40 bg-warn/10 text-warn',
  low: 'border-line text-ink-faint',
  informational: 'border-line text-ink-faint',
};

/** Stable rules read as trustworthy; experimental ones should look provisional. */
export const STATUS_STYLE: Record<RuleStatus, string> = {
  stable: 'border-signal/40 bg-signal/10 text-signal',
  test: 'border-warn/40 bg-warn/10 text-warn',
  experimental: 'border-line text-ink-faint',
  deprecated: 'border-line text-ink-faint line-through',
};
