import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Reveal from '@/components/Reveal';
import { getService, SERVICES } from '@/lib/services';
import { getZone } from '@/lib/site';
import { buildMetadata } from '@/lib/metadata';

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};

  return buildMetadata({
    title: service.title,
    description: service.summary,
    path: `/services/${service.id}/`,
  zone: getZone('services'),
});
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const idx = SERVICES.findIndex((s) => s.id === service.id);

  return (
    <div className="mx-auto max-w-4xl px-5 pt-32 pb-16 sm:px-8">
      <Reveal>
        <Link
          href="/services/"
          className="mb-5 inline-block font-mono text-[12px] text-ink-faint transition-colors hover:text-red-blood"
        >
          ← all services
        </Link>
        <p className="font-mono text-[11px] tracking-[0.3em] text-red-blood/70">
          SERVICE {String(idx + 1).padStart(2, '0')} / {SERVICES.length}
        </p>
        <h1 className="mt-3 font-mono text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {service.title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-dim">{service.tagline}</p>
      </Reveal>

      <Reveal delay={60}>
        <p className="mt-8 max-w-2xl text-[15px] leading-relaxed text-ink-dim">{service.description}</p>
      </Reveal>

      <div className="mt-12 grid gap-px border border-line bg-line sm:grid-cols-2">
        <Reveal>
          <div className="h-full bg-surface p-6">
            <h2 className="font-mono text-[11px] tracking-[0.3em] text-red-blood/70">IDEAL FOR</h2>
            <ul className="mt-4 space-y-2.5">
              {service.idealFor.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-dim">
                  <span className="mt-0.5 font-mono text-red-blood">+</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={60}>
          <div className="h-full bg-surface p-6">
            <h2 className="font-mono text-[11px] tracking-[0.3em] text-red-blood/70">DELIVERABLES</h2>
            <ul className="mt-4 space-y-2.5">
              {service.deliverables.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-dim">
                  <span className="mt-0.5 font-mono text-signal">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>

      <Reveal>
        <section className="mt-10">
          <h2 className="font-mono text-[11px] tracking-[0.3em] text-red-blood/70">IN SCOPE</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {service.inScope.map((item) => (
              <li
                key={item}
                className="panel px-4 py-3 text-[13px] leading-relaxed text-ink-dim"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>
      </Reveal>

      <Reveal>
        <section className="mt-10 flex flex-wrap items-center gap-3 font-mono text-[12px] text-ink-faint">
          <span className="text-red-blood/70">$</span> typical duration: {service.duration}
        </section>
      </Reveal>

      <Reveal>
        <section className="panel clip-corner mt-14 p-7">
          <h2 className="font-mono text-lg font-semibold text-ink">Scope this engagement</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-dim">
            Every engagement starts with a scoping call, not a fixed price list — the request
            form lets you flag {service.short} specifically.
          </p>
          <Link
            href="/services/request/"
            className="clip-tab mt-6 inline-flex items-center gap-2 border border-red-deep bg-red-core px-6 py-3 font-mono text-sm font-medium text-void transition-all duration-300 hover:shadow-[0_0_30px_-4px_rgba(255,45,75,0.8)]"
          >
            ./request-assessment
          </Link>
        </section>
      </Reveal>

      <p className="mt-10 font-mono text-[12px] text-ink-faint">
        <Link href="/services/" className="text-red-blood/80 hover:text-red-blood">
          ← all services
        </Link>
      </p>
    </div>
  );
}
