/**
 * The commercial zone's data: the eight services, the engagement process, and
 * the FAQ.
 *
 * These lived in Zephryx-Security's site.ts, which was that repo's single
 * source of truth for identity *and* services. Identity is now shared across
 * the whole site, so only the zone-specific data came across — it lives here
 * rather than swelling site.ts, which no longer belongs to one zone.
 *
 * The services index and every /services/[slug]/ page render entirely from
 * SERVICES via generateStaticParams, so adding or re-scoping a service stays a
 * one-place edit.
 */

export type Service = {
  id: string;
  title: string;
  short: string;
  tagline: string;
  summary: string;
  description: string;
  idealFor: string[];
  inScope: string[];
  deliverables: string[];
  duration: string;
};

export const SERVICES: Service[] = [
  {
    id: 'web-application-penetration-testing',
    title: 'Web Application Penetration Testing',
    short: 'Web App',
    tagline: 'Manual testing of the app your customers actually log into.',
    summary:
      'Authenticated and unauthenticated manual testing of your web application — auth, access control, business logic, injection, and the OWASP Top 10 done properly rather than skimmed.',
    description:
      "Automated scanners catch the obvious. They miss broken access control between two account roles, a business-logic flaw in a checkout flow, or an IDOR that only shows up once you understand what the app is for. This engagement is manual-first: the scanner runs, but the findings that matter come from reading the app the way an attacker would — mapping every role, every state transition, every place user input reaches a decision.",
    idealFor: [
      'SaaS products ahead of a launch, funding round, or enterprise deal',
      'Apps handling auth, payments, or customer data',
      'Teams that have only ever run an automated scan',
    ],
    inScope: [
      'Authentication, session management & authorization (including role/tenant isolation)',
      'Business logic abuse (pricing, checkout, invite/referral flows, rate limits)',
      'Injection classes: SQLi, SSTI, command injection, XXE',
      'XSS, CSRF, SSRF, and insecure deserialization',
      'API endpoints backing the app (see also API Security Testing)',
      'File upload, IDOR, and mass-assignment issues',
    ],
    deliverables: [
      'Scoped, written rules of engagement before anything is touched',
      'A findings report: CVSS-scored, reproducible, with a fix for each',
      'A live debrief walking through every finding with your team',
      'One free retest once fixes ship',
    ],
    duration: 'Typically 1–3 weeks depending on the size of the app',
  },
  {
    id: 'network-infrastructure-penetration-testing',
    title: 'Network & Infrastructure Penetration Testing',
    short: 'Network',
    tagline: 'External perimeter and internal network, tested the way an intruder would move.',
    summary:
      'External perimeter testing to find what an internet-facing attacker can reach, and internal testing to find how far a foothold travels once someone is already in.',
    description:
      "External testing answers 'what can someone on the internet reach and break into.' Internal testing answers the harder question: once a laptop is phished or a foothold lands, how far does it go before someone notices? That second question is where most real breaches actually happen, and it's the one automated scans can't answer at all.",
    idealFor: [
      'Companies with their own VPCs, VPNs, or on-prem infrastructure',
      'Businesses about to open a new office network or acquire another company\'s infrastructure',
      'Anyone who has never had lateral movement tested, only the firewall',
    ],
    inScope: [
      'External attack surface enumeration and exploitation',
      'Internal network segmentation and lateral movement',
      'Credential exposure, weak services, and default configurations',
      'Firewall and VPN configuration review',
      'Privilege escalation paths from a standard foothold',
    ],
    deliverables: [
      'Scoped, written rules of engagement before anything is touched',
      'A findings report: CVSS-scored, reproducible, with a fix for each',
      'A live debrief walking through every finding with your team',
      'One free retest once fixes ship',
    ],
    duration: 'Typically 1–2 weeks per network segment',
  },
  {
    id: 'active-directory-security-assessment',
    title: 'Active Directory Security Assessment',
    short: 'Active Directory',
    tagline: 'The attack paths that turn one phished laptop into domain admin.',
    summary:
      'The specific attack paths — Kerberoasting, ACL abuse, delegation misconfiguration, credential relay — that turn a single compromised workstation into full domain control.',
    description:
      "Active Directory is where most real internal compromises end, not where they start. A misconfigured ACL three hops from a help-desk account, a service account with an old password and an SPN, unconstrained delegation left on from a migration years ago — none of that shows up in a vulnerability scan, and all of it is how domains actually fall. This assessment builds and chains those attack paths the way a real intrusion does, then hands you the graph so you can see exactly which fix breaks which path.",
    idealFor: [
      'Any business running Windows AD for identity — most mid-size companies do',
      'Post-acquisition environments where two domains were merged in a hurry',
      'Teams who\'ve had a pentest before but it never actually touched AD',
    ],
    inScope: [
      'Kerberoasting & AS-REP roasting',
      'ACL and delegation abuse (constrained, unconstrained, RBCD)',
      'Credential relay and pass-the-hash paths',
      'GPO and trust misconfiguration',
      'Domain admin path mapping from a standard user foothold',
    ],
    deliverables: [
      'Scoped, written rules of engagement before anything is touched',
      'An attack-path map, not just a findings list — see which fix collapses which path',
      'A findings report: CVSS-scored, reproducible, with a fix for each',
      'One free retest once fixes ship',
    ],
    duration: 'Typically 1–2 weeks',
  },
  {
    id: 'cloud-security-assessment',
    title: 'Cloud Security Assessment',
    short: 'Cloud',
    tagline: 'AWS, Azure, or GCP configuration reviewed like an attacker with a leaked key.',
    summary:
      'Configuration review and exploitation testing across AWS, Azure, or GCP — IAM, storage, network boundaries, and the identity chains that turn one leaked key into an account takeover.',
    description:
      "Cloud breaches are almost never a zero-day — they're a public bucket, an over-permissioned IAM role, a Lambda that trusts input it shouldn't, or a secret sitting in an environment variable three roles away from admin. This assessment reviews configuration against the cloud provider's own hardening guidance and then tries to actually exploit the gaps: what does one leaked access key, one compromised service, or one over-scoped role actually get an attacker.",
    idealFor: [
      'Companies born in the cloud with no on-prem network to test',
      'Teams scaling infrastructure faster than their IAM policies',
      'Anyone about to hand a customer a security questionnaire',
    ],
    inScope: [
      'IAM policy and privilege-escalation path review',
      'Storage, database, and secret exposure (public buckets, open indices, hardcoded keys)',
      'Network boundary and security group configuration',
      'Serverless and container misconfiguration',
      'Identity federation and cross-account trust chains',
    ],
    deliverables: [
      'Scoped, written rules of engagement before anything is touched',
      'A findings report: CVSS-scored, reproducible, with a fix for each',
      'A live debrief walking through every finding with your team',
      'One free retest once fixes ship',
    ],
    duration: 'Typically 1–2 weeks per cloud account/environment',
  },
  {
    id: 'api-security-testing',
    title: 'API Security Testing',
    short: 'API',
    tagline: 'REST and GraphQL tested against OWASP API Top 10, endpoint by endpoint.',
    summary:
      'REST and GraphQL APIs tested for broken object-level authorization, mass assignment, rate-limit gaps, and the rest of the OWASP API Security Top 10 — the class of bug that never shows up in a UI walkthrough.',
    description:
      "Most APIs ship faster than the frontend that calls them, which means the frontend hides bugs the API doesn't fix. Broken object-level authorization — one user's ID swapped for another's in a request that still returns 200 — is the single most common API finding, and it's invisible if you only click through the UI. This engagement tests the API directly: every endpoint, every role, every object reference.",
    idealFor: [
      'Products with a public or partner-facing API',
      'Mobile apps where most of the real logic lives server-side',
      'Multi-tenant SaaS where tenant isolation is the whole security model',
    ],
    inScope: [
      'Broken object & function-level authorization (BOLA/BFLA)',
      'Mass assignment and excessive data exposure',
      'Rate limiting, resource exhaustion, and abuse of business flows',
      'Authentication & token handling (JWT misconfig, key confusion, replay)',
      'GraphQL-specific issues: introspection, query depth, batching abuse',
    ],
    deliverables: [
      'Scoped, written rules of engagement before anything is touched',
      'A findings report: CVSS-scored, reproducible, with a fix for each',
      'A live debrief walking through every finding with your team',
      'One free retest once fixes ship',
    ],
    duration: 'Typically 1–2 weeks depending on endpoint count',
  },
  {
    id: 'social-engineering-phishing-simulation',
    title: 'Social Engineering & Phishing Simulation',
    short: 'Phishing',
    tagline: 'Test the control that every other control depends on — your people.',
    summary:
      'Realistic, scoped phishing campaigns that measure click-through, credential submission, and reporting rate — with the goal of building a training plan, not a shame list.',
    description:
      "Every technical control in this list sits behind one human clicking a link or not. A phishing simulation measures where that line actually holds — click rate, credential-submission rate, and (the metric that matters most) how many people reported it. Results are aggregate by design: this is built to fix a process, not to name names.",
    idealFor: [
      'Companies onboarding new hires faster than security awareness training keeps up',
      'Teams that want a baseline before rolling out training or a reporting button',
      'Businesses handling wire transfers or sensitive data over email',
    ],
    inScope: [
      'Pretext design scoped and approved with you in advance',
      'Simulated phishing send with tracked click/submit/report rates',
      'Optional pretext calls (vishing) where in scope',
      'Aggregate reporting — never named individual results',
    ],
    deliverables: [
      'Written pretext and scope sign-off before any send',
      'Aggregate results report with click, submission, and report rates',
      'Concrete recommendations for training and reporting workflow',
    ],
    duration: 'Typically a 1–2 week campaign window',
  },
  {
    id: 'purple-team-detection-engineering',
    title: 'Purple Team: Attack Simulation + Detection Engineering',
    short: 'Purple Team',
    tagline: "Every attack path comes back as the Sigma rule that would have caught it.",
    summary:
      "The differentiator: every technique run during the engagement is handed back as a detection rule your SOC can actually deploy, not just a paragraph telling you to 'improve monitoring.'",
    description:
      "Most pentest reports end at 'here's what we found.' This one keeps going: every technique that was actually run — the Kerberoast, the lateral movement, the C2 beacon — comes back mapped to MITRE ATT&CK and paired with a Sigma detection rule for it, tested against your own logs where possible. This is the same detection-engineering work published openly on zephryx.in, applied to your environment instead of a lab. You get to see not just where you're exposed, but exactly what you'd need logging to catch it next time.",
    idealFor: [
      'Teams with a SOC or SIEM who want detections, not just findings',
      'Companies that have already run a standard pentest and want the other half',
      'Anyone who wants to know what their logging would have actually caught',
    ],
    inScope: [
      'Scoped attack simulation across chosen techniques (web, network, AD, or cloud)',
      'MITRE ATT&CK mapping for every technique executed',
      'A Sigma rule per technique, validated against your log sources where accessible',
      'Log-source coverage gap analysis',
    ],
    deliverables: [
      'Scoped, written rules of engagement before anything is touched',
      'Attack narrative mapped to ATT&CK, technique by technique',
      'A ready-to-deploy Sigma rule set with coverage notes',
      'A live debrief with both the offensive and detection teams if you have them',
    ],
    duration: 'Typically 2–3 weeks',
  },
  {
    id: 'compliance-ready-penetration-testing',
    title: 'Compliance-Ready Penetration Testing',
    short: 'Compliance',
    tagline: 'A real test that also produces the artifact your auditor asked for.',
    summary:
      'A genuine, manual penetration test — not a rubber stamp — scoped and reported to satisfy the pentest requirement in SOC 2, ISO 27001, or a customer security questionnaire.',
    description:
      "SOC 2 and ISO 27001 both expect an annual penetration test, and most auditors will accept a report from an independent tester as long as it's real testing with a clear methodology, scope, and remediation evidence. This engagement is the same manual testing as the rest of this list, scoped and written specifically to satisfy that requirement — a report your auditor recognizes, not a scanner PDF with a logo on it.",
    idealFor: [
      'Companies mid-way through a SOC 2 or ISO 27001 audit',
      'Startups closing enterprise deals that require a recent pentest report',
      'Anyone who has been handed a security questionnaire with a pentest checkbox on it',
    ],
    inScope: [
      'Scope agreed jointly against your audit requirements before testing starts',
      'Manual testing of the in-scope system(s) — web, network, cloud, or a combination',
      'A report formatted for auditor and customer consumption',
      'Attestation letter confirming test dates, scope, and methodology on request',
    ],
    deliverables: [
      'Scoped, written rules of engagement mapped to your compliance requirement',
      'An auditor-ready findings report with remediation evidence',
      'One free retest once fixes ship, with updated evidence',
    ],
    duration: 'Typically 1–3 weeks depending on scope',
  },
];

export function getService(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id);
}

export type ProcessStep = {
  n: string;
  title: string;
  body: string;
};

export const PROCESS: ProcessStep[] = [
  {
    n: '01',
    title: 'Scoping call',
    body: "A short call to understand what you're building, what's in scope, and what 'done' looks like for you. No engagement starts without this — scope written from a form nobody read is how testing goes sideways.",
  },
  {
    n: '02',
    title: 'Rules of engagement',
    body: 'A written scope document: exact targets, testing windows, what is and isn\'t authorized, and an emergency contact on both sides. You sign it before anything is touched — this is also what makes the testing legal.',
  },
  {
    n: '03',
    title: 'Testing',
    body: "Manual testing against the agreed scope. You get a status check-in at the midpoint of any engagement over a week, and immediate notice — not a footnote in the final report — if something critical or exploitable-right-now turns up.",
  },
  {
    n: '04',
    title: 'Reporting & debrief',
    body: 'A written report: every finding reproducible, severity-scored, with a specific fix — not "harden your configuration." Then a live call to walk through it with whoever is going to actually fix it.',
  },
  {
    n: '05',
    title: 'Retest',
    body: 'One retest of the reported findings is included once fixes ship, confirming what closed and what didn\'t — so the report you hand to a customer or an auditor reflects the current state, not the day testing ended.',
  },
];

export type FaqItem = { q: string; a: string };

export const FAQ: FaqItem[] = [
  {
    q: 'How is this different from an automated vulnerability scan?',
    a: 'A scanner checks for known signatures and misconfigurations. It cannot understand what your app or network is for, so it cannot find a business-logic flaw, an authorization bug between two account roles, or an attack path that chains three small issues into one serious one. Every engagement here is manual-first; automated tooling supports it but never replaces the person doing the testing.',
  },
  {
    q: 'Will testing affect our production systems?',
    a: "That's exactly what the rules-of-engagement step exists to control. Testing windows, excluded targets, and anything destructive (like denial-of-service style testing) are agreed in writing before testing starts, and are opt-in, not default.",
  },
  {
    q: 'Do you sign an NDA before you see anything?',
    a: "Yes, standard practice, before scoping details are shared and again as part of the rules of engagement. I test other people's businesses for a living — confidentiality isn't optional.",
  },
  {
    q: 'What do we actually receive at the end?',
    a: 'A written report with every finding reproducible and severity-scored, a specific fix for each one, a live debrief call with your team, and one free retest once fixes ship. See the Process page for the full breakdown.',
  },
  {
    q: 'Can this satisfy our SOC 2 / ISO 27001 pentest requirement?',
    a: "Usually, yes — see Compliance-Ready Penetration Testing. Most auditors accept a report from an independent tester as long as the methodology and scope are documented, which every engagement here already produces as standard output.",
  },
  {
    q: 'Do you offer ongoing or retainer testing?',
    a: "Yes, for teams shipping fast enough that an annual test doesn't cover it. Get in touch and it's scoped the same way as a one-off engagement — no pre-set package, no forcing your environment into a template that doesn't fit it.",
  },
  {
    q: "Why work with one person instead of a firm?",
    a: "Every engagement, from scoping call to final retest, is run by the same person — not handed to whoever is on the bench that week. That means direct access to the tester throughout, and a report written by someone who was actually there, not assembled from a junior's notes.",
  },
];

/**
 * Where a scoped-engagement enquiry lands.
 *
 * Deliberately left on security.zephryx.in even though the web zone moved: this
 * is a live business inbox with mail flowing to it, and changing a working
 * address is a mail-routing decision, not a side effect of a URL migration. The
 * hostname keeps resolving for mail regardless of where the pages are served.
 *
 * Kept out of site.ts's MAILBOXES because those three are the personal
 * addresses /handshake/ renders; this one belongs to the commercial zone and is
 * rendered only by /services/request/.
 */
export const SERVICES_MAILBOX = {
  address: 'hello@security.zephryx.in',
} as const;
