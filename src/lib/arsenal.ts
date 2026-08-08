/**
 * Released tooling and security advisories.
 *
 * ┌───────────────────────────────────────────────────────────────────────┐
 * │  ⚠  BEFORE DEPLOY — REPLACE THE PLACEHOLDER DATA BELOW                │
 * │                                                                       │
 * │  Advisory entries carry `cve: 'CVE-20XX-NNNNN'` deliberately. A        │
 * │  plausible-looking but invented CVE id would collide with a real       │
 * │  advisory belonging to someone else, so the placeholders are visibly   │
 * │  fake by design. Swap in your genuine identifiers, vendors, dates and  │
 * │  advisory URLs — or delete the entries you cannot substantiate.        │
 * │                                                                       │
 * │  The homepage "CVEs credited" stat is derived from ADVISORIES.length,  │
 * │  so the number on the front page can never drift from this list.       │
 * └───────────────────────────────────────────────────────────────────────┘
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
    id: 'spnhound',
    name: 'spnhound',
    tagline: 'Kerberoast triage that sorts by crackability, not by count',
    description:
      'Enumerates SPN-bearing accounts, requests tickets at a configurable rate, and scores each result on encryption type, password age and group membership — so the first hash you queue is the one most likely to break.',
    language: 'Python',
    tags: ['active-directory', 'kerberos', 'recon'],
    status: 'active',
    repo: `${GITHUB}/spnhound`,
    techniques: ['T1558.003', 'T1069.002'],
  },
  {
    id: 'certcheck',
    name: 'certcheck',
    tagline: 'AD CS template auditor covering ESC1 through ESC8',
    description:
      'Reads certificate templates and CA configuration over LDAP and reports every escalation primitive with the exact ACE that grants it. Outputs a remediation plan, not just a finding list.',
    language: 'Go',
    tags: ['active-directory', 'adcs', 'audit'],
    status: 'active',
    repo: `${GITHUB}/certcheck`,
    techniques: ['T1649', 'T1187'],
  },
  {
    id: 'sigma-forge',
    name: 'sigma-forge',
    tagline: 'Sigma rules to KQL, SPL and Elastic with coverage diffing',
    description:
      'Converts a rule directory into per-platform queries, then diffs the resulting ATT&CK coverage against the previous run so you can see exactly what a pull request adds or breaks.',
    language: 'Python',
    tags: ['detection-engineering', 'sigma', 'ci'],
    status: 'maintained',
    repo: `${GITHUB}/sigma-forge`,
    techniques: ['T1071.001', 'T1003.001'],
  },
  {
    id: 'jitterscope',
    name: 'jitterscope',
    tagline: 'Beacon periodicity scoring over netflow and proxy logs',
    description:
      'Implements the coefficient-of-variation hunt from the Cobalt Strike writeup as a standalone analyser. Takes Zeek conn.log or proxy exports and ranks destination pairs by how mechanically regular their callbacks are.',
    language: 'Rust',
    tags: ['threat-hunting', 'c2', 'network'],
    status: 'active',
    repo: `${GITHUB}/jitterscope`,
    techniques: ['T1071.001', 'T1090', 'T1573.001'],
  },
  {
    id: 'pretext',
    name: 'pretext',
    tagline: 'Phishing infrastructure hygiene checker',
    description:
      'Pre-flight checks for an authorised campaign: domain age and categorisation, SPF/DKIM/DMARC alignment, TLS posture and blocklist presence. Refuses to run without a scope file naming the engagement.',
    language: 'Go',
    tags: ['initial-access', 'phishing', 'opsec'],
    status: 'private',
    repo: null,
    techniques: ['T1583.001', 'T1566.001'],
  },
  {
    id: 'stackwalk-rs',
    name: 'stackwalk-rs',
    tagline: 'Call-stack provenance checks for unbacked memory',
    description:
      'Research harness behind the indirect-syscall detection: walks thread stacks, resolves each return address against loaded module ranges, and flags frames living in private RX regions.',
    language: 'Rust',
    tags: ['windows-internals', 'edr', 'research'],
    status: 'maintained',
    repo: `${GITHUB}/stackwalk-rs`,
    techniques: ['T1055', 'T1620'],
  },
];

export type DisclosureStage = 'published' | 'coordinated' | 'reported';

export type Advisory = {
  id: string;
  /** CVE identifier, or null while an assignment is pending. */
  cve: string | null;
  title: string;
  vendor: string;
  product: string;
  /** CVSS v3.1 base score. */
  cvss: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  /** Vulnerability class, e.g. "Authentication bypass". */
  class: string;
  stage: DisclosureStage;
  /** ISO date the advisory went public, or the report date if not yet public. */
  date: string;
  summary: string;
  /** Vendor or CVE-database advisory URL. Null while embargoed. */
  advisoryUrl: string | null;
};

export const ADVISORIES: Advisory[] = [
  {
    id: 'adv-001',
    cve: 'CVE-20XX-NNNNN',
    title: 'Authentication bypass in device management console',
    vendor: 'Vendor name',
    product: 'Product name',
    cvss: 9.8,
    severity: 'critical',
    class: 'Authentication bypass',
    stage: 'published',
    date: '2026-02-11',
    summary:
      'An unauthenticated request to the provisioning endpoint returned a valid session for any known device serial, granting full administrative access to the management console.',
    advisoryUrl: null,
  },
  {
    id: 'adv-002',
    cve: 'CVE-20XX-NNNNN',
    title: 'Deserialisation of untrusted data in reporting module',
    vendor: 'Vendor name',
    product: 'Product name',
    cvss: 8.8,
    severity: 'high',
    class: 'Insecure deserialisation',
    stage: 'published',
    date: '2025-11-04',
    summary:
      'A report template accepted a serialised object from an authenticated low-privilege user and reconstructed it without type restrictions, yielding remote code execution as the service account.',
    advisoryUrl: null,
  },
  {
    id: 'adv-003',
    cve: null,
    title: 'Privilege escalation via world-writable service binary path',
    vendor: 'Vendor name',
    product: 'Product name',
    cvss: 7.8,
    severity: 'high',
    class: 'Insecure file permissions',
    stage: 'coordinated',
    date: '2026-05-19',
    summary:
      'The installer created its service directory with inherited write permissions for authenticated users, allowing any local account to replace the service binary and execute as SYSTEM on restart.',
    advisoryUrl: null,
  },
  {
    id: 'adv-004',
    cve: null,
    title: 'Server-side request forgery in webhook validation',
    vendor: 'Vendor name',
    product: 'Product name',
    cvss: 7.5,
    severity: 'high',
    class: 'SSRF',
    stage: 'reported',
    date: '2026-07-08',
    summary:
      'Webhook destination validation resolved DNS twice, permitting a rebinding attack that reached cloud instance metadata and returned short-lived credentials in the response body.',
    advisoryUrl: null,
  },
];

/** Advisories with a public identifier — the number worth quoting anywhere. */
export function creditedCount(): number {
  return ADVISORIES.filter((a) => a.stage === 'published').length;
}

export function publicToolCount(): number {
  return TOOLS.filter((t) => t.repo !== null).length;
}
