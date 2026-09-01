import type { Metadata } from 'next';
import { SERVICES_MAILBOX } from '@/lib/services';
import { getZone } from '@/lib/site';
import { buildMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Privacy',
  description: 'What happens to the information you submit through the request-assessment form.',
  path: '/privacy/',
  zone: getZone('services'),
});

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-32 pb-16 sm:px-8">
      <p className="font-mono text-[11px] tracking-[0.3em] text-red-blood/70">PRIVACY</p>
      <h1 className="mt-3 font-mono text-4xl font-bold tracking-tight text-ink sm:text-5xl">
        What happens to your data
      </h1>

      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-ink-dim">
        <p>
          This site does not run analytics, does not use tracking cookies, and does not load any
          third-party script. The only thing it collects is what you submit through the{' '}
          <a href="/services/request/" className="text-red-blood hover:underline">
            request-assessment form
          </a>
          .
        </p>

        <section>
          <h2 className="font-mono text-lg font-semibold text-ink">What's collected</h2>
          <p className="mt-3">
            Name, work email, company (optional), company size (optional), the services you
            select, and whatever you write in the scope field. Submitting the form also records
            your IP address briefly, for spam and abuse prevention only.
          </p>
        </section>

        <section>
          <h2 className="font-mono text-lg font-semibold text-ink">Why it's collected</h2>
          <p className="mt-3">
            To reply to your request and scope a possible engagement. Nothing you submit is sold,
            shared with a third party, or used for marketing you didn't ask for.
          </p>
        </section>

        <section>
          <h2 className="font-mono text-lg font-semibold text-ink">Where it's stored</h2>
          <p className="mt-3">
            Submissions are stored to answer your request and are not retained beyond what's
            needed to do that. If an engagement moves forward, the details you shared become part
            of that engagement's records, governed by the NDA and scope agreement signed at that
            point — not by this page.
          </p>
        </section>

        <section>
          <h2 className="font-mono text-lg font-semibold text-ink">Deleting your data</h2>
          <p className="mt-3">
            Email{' '}
            <a href={`mailto:${SERVICES_MAILBOX.address}`} className="font-mono text-red-blood hover:underline">
              {SERVICES_MAILBOX.address}
            </a>{' '}
            and ask — this is a one-person operation, so that request goes straight to the person
            who can act on it, not a support queue.
          </p>
        </section>
      </div>
    </div>
  );
}
