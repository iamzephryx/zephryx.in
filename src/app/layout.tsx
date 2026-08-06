import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { SITE } from '@/lib/site';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import Backdrop from '@/components/Backdrop';
import './globals.css';

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
    'red team',
    'offensive security',
    'penetration testing',
    'adversary emulation',
    'threat hunting',
    'SOC',
    'CTF writeups',
    'detection engineering',
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
  alternates: { canonical: SITE.url },
  formatDetection: { email: false, telephone: false, address: false },
};

export const viewport: Viewport = {
  themeColor: '#06070a',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
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
