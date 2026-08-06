/**
 * Single source of truth for identity, links and metadata.
 * Nothing else in the app should hardcode a handle or an email address.
 */

export const SITE = {
  name: 'Zephryx',
  handle: 'zephryx',
  role: 'Red Team Operator',
  subrole: 'SOC Analyst & Threat Hunter',
  domain: 'zephryx.in',
  url: 'https://zephryx.in',
  tagline: 'I break things before they do.',
  description:
    'Zephryx — Red Team operator, SOC analyst and threat hunter. Offensive security research, adversary emulation, CTF writeups and detection engineering.',
  locale: 'en_IN',
} as const;

export type SocialLink = {
  id: string;
  label: string;
  handle: string;
  href: string;
  blurb: string;
  /** Simple-icons style path, drawn at 24x24. */
  icon: string;
  accent: string;
};

export const SOCIALS: SocialLink[] = [
  {
    id: 'github',
    label: 'GitHub',
    handle: '@zephryxsec',
    href: 'https://github.com/zephryxsec',
    blurb: 'Tooling, exploit PoCs, detection rules and automation.',
    accent: '#f0f6fc',
    icon: 'M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.8.1-.8.1-.8 1.2.1 1.9 1.2 1.9 1.2 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z',
  },
  {
    id: 'x',
    label: 'X / Twitter',
    handle: '@zephryxsec',
    href: 'https://x.com/zephryxsec',
    blurb: 'Live threat intel, TTP notes and short-form research.',
    accent: '#e7e9ea',
    icon: 'M18.9 1.2h3.7l-8.1 9.2 9.5 12.4h-7.4l-5.8-7.6-6.7 7.6H.4l8.6-9.9L0 1.2h7.6l5.2 6.9 6.1-6.9Zm-1.3 19.4h2L6.5 3.3H4.4l13.2 17.3Z',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    handle: '/in/zephryx',
    href: 'https://www.linkedin.com/in/zephryx/',
    blurb: 'Professional track record, engagements and collaboration.',
    accent: '#0a66c2',
    icon: 'M20.4 20.4h-3.6v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9v5.7H9.3V9h3.4v1.6h.1a3.8 3.8 0 0 1 3.4-1.9c3.6 0 4.3 2.4 4.3 5.5v6.2ZM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2Zm1.8 13H3.5V9h3.6v11.4ZM22.2 0H1.8A1.8 1.8 0 0 0 0 1.8v20.4C0 23.2.8 24 1.8 24h20.4c1 0 1.8-.8 1.8-1.8V1.8c0-1-.8-1.8-1.8-1.8Z',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    handle: '@ZephryxSec',
    href: 'https://www.youtube.com/@ZephryxSec',
    blurb: 'Lab walkthroughs, tradecraft breakdowns and box takedowns.',
    accent: '#ff0033',
    icon: 'M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    handle: '@zephryx.in',
    href: 'https://www.instagram.com/zephryx.in',
    blurb: 'Off-console: rigs, conferences and the human behind the shell.',
    accent: '#e1306c',
    icon: 'M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2ZM12 0C8.7 0 8.3 0 7 .1 5.7.1 4.8.3 4.1.6c-.8.3-1.4.7-2.1 1.4C1.3 2.7.9 3.3.6 4.1.3 4.8.1 5.7.1 7 0 8.3 0 8.7 0 12s0 3.7.1 5c0 1.3.2 2.2.5 2.9.3.8.7 1.4 1.4 2.1.7.7 1.3 1.1 2.1 1.4.7.3 1.6.5 2.9.5 1.3.1 1.7.1 5 .1s3.7 0 5-.1c1.3 0 2.2-.2 2.9-.5.8-.3 1.4-.7 2.1-1.4.7-.7 1.1-1.3 1.4-2.1.3-.7.5-1.6.5-2.9.1-1.3.1-1.7.1-5s0-3.7-.1-5c0-1.3-.2-2.2-.5-2.9-.3-.8-.7-1.4-1.4-2.1C21.3 1.3 20.7.9 19.9.6 19.2.3 18.3.1 17 .1 15.7 0 15.3 0 12 0Zm0 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4Zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm7.8-10.4a1.4 1.4 0 1 1-2.9 0 1.4 1.4 0 0 1 2.9 0Z',
  },
];

export type MailBox = {
  address: string;
  purpose: string;
  detail: string;
  pgp: boolean;
};

export const MAILBOXES: MailBox[] = [
  {
    address: 'contact@zephryx.in',
    purpose: 'General',
    detail: 'Engagements, collaborations, speaking, press.',
    pgp: false,
  },
  {
    address: 'security@zephryx.in',
    purpose: 'Disclosure',
    detail: 'Vulnerability reports and coordinated disclosure. Encrypt sensitive findings.',
    pgp: true,
  },
  {
    address: 'support@zephryx.in',
    purpose: 'Support',
    detail: 'Questions about tooling, writeups and published research.',
    pgp: false,
  },
];

export const NAV = [
  { href: '/', label: 'home', cmd: '~' },
  { href: '/whoami/', label: 'whoami', cmd: 'id' },
  { href: '/writeups/', label: 'writeups', cmd: 'cat' },
  { href: '/connect/', label: 'connect', cmd: 'net' },
  { href: '/handshake/', label: 'handshake', cmd: 'syn' },
] as const;
