/**
 * Pure formatting helpers — no Node built-ins, safe to import from client
 * components. Keeping these out of writeups.ts is what prevents node:fs / node:path
 * from being pulled into a client bundle.
 */

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
