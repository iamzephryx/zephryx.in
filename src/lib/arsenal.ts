/**
 * Released tooling.
 */

import { SOCIALS } from './site';

const GITHUB = SOCIALS.find((s) => s.id === 'github')?.href ?? 'https://github.com/zephryxsec';

export type ToolStatus = 'active' | 'maintained' | 'archived' | 'private';

export type Tool = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  language: string;
  tags: string[];
  status: ToolStatus;
  /** Repository URL, or null for tooling that stays in-house. */
  repo: string | null;
  /** ATT&CK techniques the tool exercises or defends against. */
  techniques: string[];
};

export const TOOLS: Tool[] = [
  {
    id: 'subsniper',
    name: 'SubSniper',
    tagline: 'Multi-threaded subdomain enumeration off a wordlist',
    description:
      'Sweeps a target domain against a wordlist across worker threads and resolves each candidate, printing hits as they land instead of waiting on the whole run. Ships with a default wordlist so it runs with just a domain.',
    language: 'Python',
    tags: ['recon', 'subdomain-enum', 'osint'],
    status: 'archived',
    repo: `${GITHUB}/SubSniper`,
    techniques: ['T1595.003', 'T1590.002'],
  },
  {
    id: 'dirblade',
    name: 'DirBlade',
    tagline: 'Concurrent directory and file bruteforcer for web servers',
    description:
      'Walks a wordlist against a target URL with concurrent requests to surface hidden paths and files, reporting what it finds as it finds them rather than dumping a log at the end.',
    language: 'Python',
    tags: ['recon', 'web', 'content-discovery'],
    status: 'archived',
    repo: `${GITHUB}/DirBlade`,
    techniques: ['T1595.003'],
  },
  {
    id: 'mac-switch',
    name: 'MACSwitch',
    tagline: 'MAC address changer for Linux network interfaces',
    description:
      'Sets a random or user-supplied MAC address on a chosen interface, and reverts it back — for privacy work, MAC-filter testing, or clearing an interface identity between engagements.',
    language: 'Python',
    tags: ['privacy', 'networking', 'opsec'],
    status: 'archived',
    repo: `${GITHUB}/Mac-switch`,
    techniques: [],
  },
];

export function publicToolCount(): number {
  return TOOLS.filter((t) => t.repo !== null).length;
}
