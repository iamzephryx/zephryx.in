import type { Metadata } from 'next';
import ErrorScreen from '@/components/ErrorScreen';

export const metadata: Metadata = {
  title: 'Access Denied',
  robots: { index: false, follow: false },
};

export default function Forbidden() {
  return (
    <ErrorScreen
      code="403"
      status="Access Denied"
      title="You reached the door. You don't have the key."
      message="The edge evaluated your request and declined it. This attempt has been logged, correlated and enriched with your user agent."
      log={[
        'GET /restricted HTTP/2',
        '[*] evaluating WAF ruleset …',
        '[*] checking authorisation …',
        '[-] principal lacks capability',
        '[!] 403 — forbidden · event logged',
      ]}
      actions={[
        { href: '/', label: 'cd ~', primary: true },
        { href: '/handshake/', label: 'request access' },
      ]}
    />
  );
}
