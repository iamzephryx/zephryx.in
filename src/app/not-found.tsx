import type { Metadata } from 'next';
import ErrorScreen from '@/components/ErrorScreen';

export const metadata: Metadata = {
  title: 'Endpoint Missing',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <ErrorScreen
      code="404"
      status="Endpoint Missing"
      title="This resource never existed — or it moved."
      message="The path you requested returned nothing. No shell, no loot, no route. Enumerate somewhere else."
      log={[
        'GET /' + '???' + ' HTTP/2',
        '[*] resolving route in manifest …',
        '[-] no matching endpoint',
        '[!] 404 — not found',
      ]}
    />
  );
}
