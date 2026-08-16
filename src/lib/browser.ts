/**
 * Browser-only helpers for handing page content to the reader. Both are
 * no-ops outside a document, so they are safe to import from a component that
 * renders on the server before hydration.
 */

/**
 * Copy `text`, reporting whether it landed. The async Clipboard API is the
 * happy path; it is unavailable over plain HTTP and on older Safari, where the
 * hidden-textarea route still works because the call happens inside the click
 * handler's user-gesture window.
 */
export async function copyText(text: string): Promise<boolean> {
  if (typeof document === 'undefined') return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied or a non-secure context — fall through to the legacy path.
  }

  const scratch = document.createElement('textarea');
  scratch.value = text;
  scratch.setAttribute('readonly', '');
  // Off-screen rather than hidden: a display:none element cannot be selected.
  scratch.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(scratch);
  scratch.select();

  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }
  scratch.remove();

  return copied;
}

/** Save `text` to the reader's downloads as `filename`. */
export function downloadText(filename: string, text: string): void {
  if (typeof document === 'undefined') return;

  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Revoking synchronously can cancel the download in some browsers.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
