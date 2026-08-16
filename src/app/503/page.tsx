import type { Metadata } from 'next';
import ErrorScreen from '@/components/ErrorScreen';

export const metadata: Metadata = {
  title: 'Server Offline',
  robots: { index: false, follow: false },
};

export default function ServiceUnavailable() {
  return (
    <ErrorScreen
      code="503"
      status="Server Offline"
      title="The service stepped out. It'll be back."
      message="The origin is temporarily unavailable — maintenance, deploy, or the edge shedding load. Nothing to exploit here; try again shortly."
      log={[
        'GET / HTTP/2',
        '[*] routing to origin …',
        '[-] upstream did not answer',
        '[*] serving cached edge response',
        '[!] 503 — service unavailable',
      ]}
      actions={[
        { href: '/', label: 'retry', primary: true },
        { href: '/handshake/', label: 'contact' },
      ]}
    />
  );
}
