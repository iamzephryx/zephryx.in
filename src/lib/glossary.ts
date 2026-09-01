/**
 * Pure data — no Node built-ins, safe to import from the client filter
 * component. Same split as cheatsheetTypes.ts for the same reason.
 *
 * Definitions are written to be technically correct, not just quotable —
 * check any edit against a primary source before merging it.
 */

export const GLOSSARY_CATEGORIES = [
  'General',
  'Active Directory',
  'Web',
  'Network',
  'Detection',
] as const;

export type GlossaryCategory = (typeof GLOSSARY_CATEGORIES)[number];

export type GlossaryTerm = {
  term: string;
  category: GlossaryCategory;
  definition: string;
};

export const GLOSSARY: GlossaryTerm[] = [
  // ---------------------------------------------------------------- General
  {
    term: 'CVE',
    category: 'General',
    definition:
      'Common Vulnerabilities and Exposures — a public, unique identifier assigned to a specific, disclosed security vulnerability (e.g. CVE-2021-34527).',
  },
  {
    term: 'CVSS',
    category: 'General',
    definition:
      'Common Vulnerability Scoring System — a standardized 0–10 severity score for a vulnerability, built from factors like attack vector and required privileges.',
  },
  {
    term: 'Rules of Engagement (RoE)',
    category: 'General',
    definition:
      'The document that defines what is in scope, what is explicitly off-limits, and what a pentester is authorized to do during an engagement. Nothing in this glossary is a substitute for having one, signed, before you touch a system you do not own.',
  },
  {
    term: 'Red Team',
    category: 'General',
    definition:
      'An offensive team simulating a real adversary against an organization — typically longer, stealthier and more objective-driven than a standard scoped pentest.',
  },
  {
    term: 'Blue Team',
    category: 'General',
    definition: "The defensive side: the people and tooling responsible for detecting and responding to an attack.",
  },
  {
    term: 'Purple Team',
    category: 'General',
    definition:
      'A collaborative exercise where red and blue work together in the open — the attacker runs a technique, the defender checks whether it was seen, and both sides tune from the result.',
  },
  {
    term: 'Privilege Escalation',
    category: 'General',
    definition: 'Turning limited access into higher-level access — from a low-priv user to admin/root, or from local admin to domain admin.',
  },
  {
    term: 'Lateral Movement',
    category: 'General',
    definition: 'Moving from one compromised host to another inside the same network, usually to reach a system that has the access the attacker actually wants.',
  },
  {
    term: 'Persistence',
    category: 'General',
    definition: 'Techniques for keeping access to a system across reboots, credential rotations, or the original foothold being closed.',
  },
  {
    term: 'C2 (Command and Control)',
    category: 'General',
    definition: 'The infrastructure and channel an attacker uses to send instructions to, and receive output from, a compromised host.',
  },
  {
    term: 'Payload',
    category: 'General',
    definition: 'The code actually delivered to and executed on a target — as distinct from the exploit or delivery mechanism that got it there.',
  },
  {
    term: 'Shell',
    category: 'General',
    definition: 'An interactive command-execution channel on a compromised host. A reverse shell connects back to the attacker; a bind shell listens on the target for the attacker to connect in.',
  },
  {
    term: 'IOC (Indicator of Compromise)',
    category: 'General',
    definition: 'A forensic artifact — a hash, an IP, a registry key, a filename — that suggests a system has been breached.',
  },
  {
    term: 'TTP (Tactics, Techniques, Procedures)',
    category: 'General',
    definition: 'The layered way adversary behavior is described: the goal (tactic), the general method (technique), and the specific implementation (procedure). This is the vocabulary MITRE ATT&CK is built from.',
  },
  {
    term: 'MITRE ATT&CK',
    category: 'General',
    definition: 'A public knowledge base of adversary tactics and techniques, built from real-world observed intrusions. Used to map both attacks and the detections written for them onto a shared reference.',
  },

  // ---------------------------------------------------------- Active Directory
  {
    term: 'Active Directory (AD)',
    category: 'Active Directory',
    definition: "Microsoft's directory service for managing users, groups, computers and permissions across a Windows network — the backbone of most corporate internal networks.",
  },
  {
    term: 'Domain Controller (DC)',
    category: 'Active Directory',
    definition: 'The server that hosts Active Directory and handles authentication for the domain. Compromising one usually means compromising the domain.',
  },
  {
    term: 'Kerberos',
    category: 'Active Directory',
    definition: "The ticket-based authentication protocol AD relies on. Most AD-specific attacks are really Kerberos attacks — abusing how tickets are requested, issued or trusted.",
  },
  {
    term: 'Kerberoasting',
    category: 'Active Directory',
    definition: 'Requesting a Kerberos service ticket for an account with a Service Principal Name, then cracking it offline to recover that account\'s password.',
  },
  {
    term: 'AS-REP Roasting',
    category: 'Active Directory',
    definition: 'Extracting a crackable hash from an account that has Kerberos pre-authentication disabled, without needing any credentials first.',
  },
  {
    term: 'Golden Ticket',
    category: 'Active Directory',
    definition: 'A forged Kerberos Ticket Granting Ticket, built using the krbtgt account\'s hash, that grants access to the domain as any user for as long as the attacker chooses.',
  },
  {
    term: 'Silver Ticket',
    category: 'Active Directory',
    definition: "A forged Kerberos service ticket for a single specific service, built with that service account's hash rather than krbtgt.",
  },
  {
    term: 'Pass-the-Hash',
    category: 'Active Directory',
    definition: "Authenticating with a stolen NTLM password hash directly, without ever needing or cracking the plaintext password.",
  },
  {
    term: 'DCSync',
    category: 'Active Directory',
    definition: 'Abusing AD replication permissions to make a Domain Controller hand over password hashes directly, impersonating another DC rather than touching disk.',
  },
  {
    term: 'BloodHound',
    category: 'Active Directory',
    definition: 'A tool that maps AD permissions and relationships as a graph, surfacing the attack paths — often multiple small misconfigurations chained together — that get a low-priv user to Domain Admin.',
  },
  {
    term: 'ACL (Access Control List)',
    category: 'Active Directory',
    definition: "The list of permissions attached to an AD object, defining which principals can read, write, or take specific actions on it. Misconfigured ACLs are one of the most common ways a domain quietly hands over control.",
  },
  {
    term: 'Delegation',
    category: 'Active Directory',
    definition: 'An AD feature letting one account act on behalf of another to access a resource. Unconstrained or misconfigured delegation is a frequent, high-impact escalation path.',
  },
  {
    term: 'SPN (Service Principal Name)',
    category: 'Active Directory',
    definition: 'A unique identifier for a service instance, used by Kerberos to locate which account a service ticket should be issued for. What Kerberoasting actually targets.',
  },
  {
    term: 'LDAP',
    category: 'Active Directory',
    definition: 'The protocol used to query and modify directory data in AD — how tools enumerate users, groups, and computer objects.',
  },
  {
    term: 'NTLM',
    category: 'Active Directory',
    definition: "Microsoft's older, weaker authentication protocol. Still present alongside Kerberos in most environments, and a common relay/downgrade target.",
  },
  {
    term: 'ADCS (Active Directory Certificate Services)',
    category: 'Active Directory',
    definition: "AD's built-in PKI role. Misconfigured certificate templates — the ESC1 through ESC8 family of issues — are one of the most reliable modern domain-escalation paths.",
  },

  // ---------------------------------------------------------------------- Web
  {
    term: 'SQL Injection',
    category: 'Web',
    definition: 'Injecting attacker-controlled input into a SQL query the application builds unsafely, to read, modify or bypass logic in the underlying database.',
  },
  {
    term: 'XSS (Cross-Site Scripting)',
    category: 'Web',
    definition: "Getting a malicious script to run in another user's browser session by injecting it into a page that trusts unsanitized input.",
  },
  {
    term: 'CSRF (Cross-Site Request Forgery)',
    category: 'Web',
    definition: "Tricking an already-authenticated user's browser into submitting a request they didn't intend to make, using their existing session.",
  },
  {
    term: 'SSRF (Server-Side Request Forgery)',
    category: 'Web',
    definition: "Forcing a server to make an HTTP request on the attacker's behalf — often to internal-only infrastructure the attacker couldn't otherwise reach.",
  },
  {
    term: 'IDOR (Insecure Direct Object Reference)',
    category: 'Web',
    definition: "Accessing another user's data by directly changing an identifier — an ID in a URL or request body — with no server-side check that you're allowed to.",
  },
  {
    term: 'Burp Suite',
    category: 'Web',
    definition: 'An intercepting proxy and toolkit for inspecting, modifying and replaying HTTP traffic — the standard tool for manual web app testing.',
  },

  // ------------------------------------------------------------------- Network
  {
    term: 'Nmap',
    category: 'Network',
    definition: 'A network scanner used for host discovery, open-port enumeration, and service/version fingerprinting — usually the first tool run against a new target.',
  },
  {
    term: 'Port Scanning',
    category: 'Network',
    definition: 'Systematically probing a host to find which network ports are open and what is listening on them.',
  },
  {
    term: 'Pivoting',
    category: 'Network',
    definition: 'Using a compromised host as a relay to reach a network segment the attacker could not otherwise route to directly.',
  },
  {
    term: 'ARP Spoofing',
    category: 'Network',
    definition: 'Sending forged ARP replies to associate the attacker\'s MAC address with a target IP on the local network, enabling a man-in-the-middle position.',
  },

  // ----------------------------------------------------------------- Detection
  {
    term: 'Sigma',
    category: 'Detection',
    definition: 'An open, generic format for writing detection rules once and translating them to different SIEM/query languages — what a detection engineer writes instead of a vendor-specific rule.',
  },
  {
    term: 'SIEM',
    category: 'Detection',
    definition: 'Security Information and Event Management — a platform that aggregates and correlates logs from across an environment so detections can run against them centrally.',
  },
  {
    term: 'EDR',
    category: 'Detection',
    definition: 'Endpoint Detection and Response — software running on a host that monitors process, file and network behavior for signs of malicious activity.',
  },
  {
    term: 'Sysmon',
    category: 'Detection',
    definition: "Microsoft Sysinternals' System Monitor — a free Windows service that logs detailed system activity (process creation, network connections, and more) far beyond default Windows logging.",
  },
  {
    term: 'Baseline',
    category: 'Detection',
    definition: 'The normal, expected pattern of activity in an environment. A rule is tuned against a baseline so it fires on what is actually anomalous instead of paging on routine noise.',
  },
  {
    term: 'False Positive',
    category: 'Detection',
    definition: 'An alert that fires without a real underlying malicious event behind it. A rule with too many gets muted, not fixed — which is worse than not having the rule.',
  },
];
