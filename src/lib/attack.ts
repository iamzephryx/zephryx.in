/**
 * MITRE ATT&CK (Enterprise) technique catalogue.
 *
 * This is a *curated* slice of the matrix, not a mirror of it — it exists so an
 * id written in content can be rendered as a name and linked to attack.mitre.org
 * instead of being shown as a bare `T1558.003`.
 *
 * Techniques in ATT&CK can belong to several tactics. Each entry below is
 * assigned the single tactic it is most commonly executed under, so any grid
 * built from this shows every technique exactly once.
 *
 * The coverage model that used to live here — deriving emulated/detected state
 * from writeup and detection frontmatter, and backing the /matrix/ board — moved
 * to writeups.zephryx.in along with the content it reads. What stays is the
 * lookup half, which the arsenal pages use to label the techniques a tool
 * exercises. Keep the two catalogues in step if a tool cites a technique the
 * other site has not catalogued yet.
 */

export type Tactic = {
  id: string;
  name: string;
  /** Column label — the grid is tight, full tactic names do not fit. */
  short: string;
};

export const TACTICS: readonly Tactic[] = [
  { id: 'TA0043', name: 'Reconnaissance', short: 'Recon' },
  { id: 'TA0042', name: 'Resource Development', short: 'Resource Dev' },
  { id: 'TA0001', name: 'Initial Access', short: 'Initial Access' },
  { id: 'TA0002', name: 'Execution', short: 'Execution' },
  { id: 'TA0003', name: 'Persistence', short: 'Persistence' },
  { id: 'TA0004', name: 'Privilege Escalation', short: 'Priv Esc' },
  { id: 'TA0005', name: 'Defense Evasion', short: 'Defense Evasion' },
  { id: 'TA0006', name: 'Credential Access', short: 'Cred Access' },
  { id: 'TA0007', name: 'Discovery', short: 'Discovery' },
  { id: 'TA0008', name: 'Lateral Movement', short: 'Lateral Mvmt' },
  { id: 'TA0009', name: 'Collection', short: 'Collection' },
  { id: 'TA0011', name: 'Command and Control', short: 'C2' },
  { id: 'TA0010', name: 'Exfiltration', short: 'Exfiltration' },
] as const;

export type Technique = {
  id: string;
  name: string;
  tacticId: string;
};

export const TECHNIQUES: readonly Technique[] = [
  /* ---- Reconnaissance ---- */
  { id: 'T1595', name: 'Active Scanning', tacticId: 'TA0043' },
  { id: 'T1589', name: 'Gather Victim Identity Information', tacticId: 'TA0043' },
  { id: 'T1598', name: 'Phishing for Information', tacticId: 'TA0043' },

  /* ---- Resource Development ---- */
  { id: 'T1583.001', name: 'Acquire Infrastructure: Domains', tacticId: 'TA0042' },
  { id: 'T1587.001', name: 'Develop Capabilities: Malware', tacticId: 'TA0042' },
  { id: 'T1588.002', name: 'Obtain Capabilities: Tool', tacticId: 'TA0042' },

  /* ---- Initial Access ---- */
  { id: 'T1566.001', name: 'Spearphishing Attachment', tacticId: 'TA0001' },
  { id: 'T1566.002', name: 'Spearphishing Link', tacticId: 'TA0001' },
  { id: 'T1078.002', name: 'Valid Accounts: Domain Accounts', tacticId: 'TA0001' },
  { id: 'T1190', name: 'Exploit Public-Facing Application', tacticId: 'TA0001' },
  { id: 'T1133', name: 'External Remote Services', tacticId: 'TA0001' },

  /* ---- Execution ---- */
  { id: 'T1059.001', name: 'Command and Scripting Interpreter: PowerShell', tacticId: 'TA0002' },
  { id: 'T1059.003', name: 'Command and Scripting Interpreter: Windows Shell', tacticId: 'TA0002' },
  { id: 'T1106', name: 'Native API', tacticId: 'TA0002' },
  { id: 'T1204.002', name: 'User Execution: Malicious File', tacticId: 'TA0002' },
  { id: 'T1569.002', name: 'System Services: Service Execution', tacticId: 'TA0002' },
  { id: 'T1047', name: 'Windows Management Instrumentation', tacticId: 'TA0002' },

  /* ---- Persistence ---- */
  { id: 'T1053.005', name: 'Scheduled Task/Job: Scheduled Task', tacticId: 'TA0003' },
  { id: 'T1098', name: 'Account Manipulation', tacticId: 'TA0003' },
  { id: 'T1136.002', name: 'Create Account: Domain Account', tacticId: 'TA0003' },
  { id: 'T1547.001', name: 'Registry Run Keys / Startup Folder', tacticId: 'TA0003' },
  { id: 'T1505.003', name: 'Server Software Component: Web Shell', tacticId: 'TA0003' },

  /* ---- Privilege Escalation ---- */
  { id: 'T1548.002', name: 'Bypass User Account Control', tacticId: 'TA0004' },
  {
    id: 'T1548.001',
    name: 'Abuse Elevation Control Mechanism: Setuid and Setgid',
    tacticId: 'TA0004',
  },
  { id: 'T1134.001', name: 'Token Impersonation/Theft', tacticId: 'TA0004' },
  { id: 'T1484.001', name: 'Domain Policy Modification: GPO', tacticId: 'TA0004' },
  { id: 'T1068', name: 'Exploitation for Privilege Escalation', tacticId: 'TA0004' },

  /* ---- Defense Evasion ---- */
  { id: 'T1055', name: 'Process Injection', tacticId: 'TA0005' },
  { id: 'T1620', name: 'Reflective Code Loading', tacticId: 'TA0005' },
  { id: 'T1562.001', name: 'Impair Defenses: Disable or Modify Tools', tacticId: 'TA0005' },
  { id: 'T1070.001', name: 'Indicator Removal: Clear Event Logs', tacticId: 'TA0005' },
  { id: 'T1027', name: 'Obfuscated Files or Information', tacticId: 'TA0005' },
  { id: 'T1550.003', name: 'Use Alternate Auth Material: Pass the Ticket', tacticId: 'TA0005' },

  /* ---- Credential Access ---- */
  { id: 'T1558.001', name: 'Steal or Forge Kerberos Tickets: Golden Ticket', tacticId: 'TA0006' },
  { id: 'T1558.003', name: 'Steal or Forge Kerberos Tickets: Kerberoasting', tacticId: 'TA0006' },
  { id: 'T1558.004', name: 'Steal or Forge Kerberos Tickets: AS-REP Roasting', tacticId: 'TA0006' },
  { id: 'T1003.001', name: 'OS Credential Dumping: LSASS Memory', tacticId: 'TA0006' },
  { id: 'T1003.003', name: 'OS Credential Dumping: NTDS', tacticId: 'TA0006' },
  { id: 'T1003.006', name: 'OS Credential Dumping: DCSync', tacticId: 'TA0006' },
  { id: 'T1649', name: 'Steal or Forge Authentication Certificates', tacticId: 'TA0006' },
  { id: 'T1187', name: 'Forced Authentication', tacticId: 'TA0006' },
  { id: 'T1110.001', name: 'Brute Force: Password Guessing', tacticId: 'TA0006' },
  { id: 'T1110.002', name: 'Brute Force: Password Cracking', tacticId: 'TA0006' },
  { id: 'T1110.003', name: 'Brute Force: Password Spraying', tacticId: 'TA0006' },
  {
    id: 'T1556.006',
    name: 'Modify Authentication Process: Multi-Factor Authentication',
    tacticId: 'TA0006',
  },

  /* ---- Discovery ---- */
  { id: 'T1087.002', name: 'Account Discovery: Domain Account', tacticId: 'TA0007' },
  { id: 'T1069.002', name: 'Permission Groups Discovery: Domain', tacticId: 'TA0007' },
  { id: 'T1018', name: 'Remote System Discovery', tacticId: 'TA0007' },
  { id: 'T1482', name: 'Domain Trust Discovery', tacticId: 'TA0007' },

  /* ---- Lateral Movement ---- */
  { id: 'T1021.002', name: 'Remote Services: SMB / Admin Shares', tacticId: 'TA0008' },
  { id: 'T1021.001', name: 'Remote Services: Remote Desktop Protocol', tacticId: 'TA0008' },
  { id: 'T1550.002', name: 'Use Alternate Auth Material: Pass the Hash', tacticId: 'TA0008' },
  { id: 'T1570', name: 'Lateral Tool Transfer', tacticId: 'TA0008' },

  /* ---- Collection ---- */
  { id: 'T1005', name: 'Data from Local System', tacticId: 'TA0009' },
  { id: 'T1114.002', name: 'Email Collection: Remote Email Collection', tacticId: 'TA0009' },

  /* ---- Command and Control ---- */
  { id: 'T1071.001', name: 'Application Layer Protocol: Web Protocols', tacticId: 'TA0011' },
  { id: 'T1573.001', name: 'Encrypted Channel: Symmetric Cryptography', tacticId: 'TA0011' },
  { id: 'T1090', name: 'Proxy', tacticId: 'TA0011' },
  { id: 'T1572', name: 'Protocol Tunneling', tacticId: 'TA0011' },

  /* ---- Exfiltration ---- */
  { id: 'T1041', name: 'Exfiltration Over C2 Channel', tacticId: 'TA0010' },
  { id: 'T1567.002', name: 'Exfiltration to Cloud Storage', tacticId: 'TA0010' },
] as const;

const BY_ID = new Map(TECHNIQUES.map((t) => [t.id, t]));

/** attack.mitre.org URL for a technique or sub-technique id. */
export function attackUrl(id: string): string {
  return `https://attack.mitre.org/techniques/${id.replace('.', '/')}/`;
}
/** Technique name lookup, used to render ids on the arsenal pages. */
export function techniqueName(id: string): string {
  return BY_ID.get(id)?.name ?? id;
}
