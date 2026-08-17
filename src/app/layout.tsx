import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { SITE, SOCIALS } from '@/lib/site';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import Backdrop from '@/components/Backdrop';
import './globals.css';

/**
 * Person structured data — helps Google associate the domain with the person
 * and surface the social profiles as sameAs. Built entirely from first-party
 * constants (SITE / SOCIALS), so the inline script carries no injection risk.
 */
const personLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: SITE.name,
  url: SITE.url,
  jobTitle: SITE.role,
  description: SITE.description,
  knowsAbout: [
    'Threat Hunting',
    'Detection Engineering',
    'Security Operations',
    'Active Directory Security',
    'Adversary Emulation',
    'Penetration Testing',
  ],
  sameAs: SOCIALS.map((s) => s.href),
};

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.role}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  keywords: [
    'threat hunting',
    'detection engineering',
    'SOC analyst',
    'sigma rules',
    'purple team',
    'offensive security',
    'penetration testing',
    'adversary emulation',
    'CTF writeups',
    'Zephryx',
  ],
  openGraph: {
    type: 'website',
    locale: SITE.locale,
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.role}`,
    description: SITE.description,
  },
  twitter: {
    card: 'summary_large_image',
    site: '@zephryxsec',
    creator: '@zephryxsec',
    title: `${SITE.name} — ${SITE.role}`,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  alternates: {
    canonical: SITE.url,
    types: { 'application/rss+xml': `${SITE.url}/feed.xml` },
  },
  formatDetection: { email: false, telephone: false, address: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#06070a' },
    { media: '(prefers-color-scheme: light)', color: '#f5f6f8' },
  ],
  width: 'device-width',
  initialScale: 1,
};

/**
 * Sets data-theme on <html> before first paint, so there's no flash of the
 * wrong theme. Runs as the first thing in <body> — synchronous scripts block
 * rendering until they finish, so nothing has painted yet by the time this
 * decides light vs dark. Reads a stored preference first, then falls back to
 * the visitor's OS setting. Dark needs no attribute (it's the CSS default),
 * so this only ever has to *add* data-theme="light", never remove anything.
 */
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('zephryx-theme');
    var wantsLight = stored === 'light' || (stored !== 'dark' && window.matchMedia('(prefers-color-scheme: light)').matches);
    if (wantsLight) document.documentElement.setAttribute('data-theme', 'light');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />

        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
        />

        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-red-core focus:px-4 focus:py-2 focus:font-mono focus:text-sm focus:text-white"
        >
          skip to content
        </a>

        <Backdrop />
        <Nav />

        <main id="main" className="relative z-10">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
