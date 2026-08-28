import { MAILBOXES, SITE, SOCIALS } from '@/lib/site';
import {
  ALLOWED_ROUTES,
  RESEARCH_ORIGIN,
  safeHref,
  safeMailto,
  searchUrl,
  type ParsedCommand,
} from './safety';

/* ------------------------------------------------------------------ */
/* Output model                                                        */
/* ------------------------------------------------------------------ */

export type LineKind = 'input' | 'out' | 'dim' | 'ok' | 'warn' | 'err' | 'accent' | 'wordmark';

export type Line =
  | { kind: LineKind; text: string; href?: undefined }
  /** Link cells carry a pre-validated href; the renderer never re-derives one. */
  | { kind: 'link'; text: string; href: string; external: boolean };

export type CommandContext = {
  /** Navigate to an allowlisted internal route. */
  navigate: (route: string) => void;
  clear: () => void;
  history: readonly string[];
  bootedAt: number;
};

export type CommandResult = Line[];

export type Command = {
  name: string;
  summary: string;
  usage: string;
  /** Hidden from `help` listings but still executable. */
  secret?: boolean;
  run: (args: string[], ctx: CommandContext) => CommandResult;
};

const out = (text: string): Line => ({ kind: 'out', text });
const dim = (text: string): Line => ({ kind: 'dim', text });
const ok = (text: string): Line => ({ kind: 'ok', text });
const warn = (text: string): Line => ({ kind: 'warn', text });
const err = (text: string): Line => ({ kind: 'err', text });
const accent = (text: string): Line => ({ kind: 'accent', text });
const blank = (): Line => ({ kind: 'out', text: '' });

/** Build a link cell, or degrade to plain text when the target fails validation. */
function link(text: string, target: string): Line {
  const href = safeHref(target);
  if (!href) return dim(`${text} [link blocked: target not allowlisted]`);
  return { kind: 'link', text, href, external: !href.startsWith('/') };
}

function mailLink(address: string): Line {
  const href = safeMailto(address);
  if (!href) return dim(`${address} [link blocked]`);
  return { kind: 'link', text: address, href, external: false };
}

/** Pad for column alignment without any format-string interpretation. */
const pad = (s: string, n: number) => (s.length >= n ? s : s + ' '.repeat(n - s.length));

/* ------------------------------------------------------------------ */
/* Static content                                                      */
/* ------------------------------------------------------------------ */

// A single marker row: Terminal.tsx renders `wordmark` kind rows as the
// <ZephryxWordmark /> SVG pixel-art logo (src/components/ZephryxWordmark.tsx)
// rather than printing `text` as characters, so the blocky banner look no
// longer depends on any font's glyph coverage.
const BANNER = ['ZEPHRYX'];

const FILES: ReadonlyMap<string, Line[]> = new Map([
  [
    'about.txt',
    [
      out("23 years old. Got into all this in 8th standard because of a shared"),
      out("login on a school lab machine and way too much curiosity for my own"),
      out("good. Never really grew out of it, just got paid for it eventually."),
      blank(),
      out("Penetration tester — scoped, authorised, and the part I would still"),
      out("be doing for free. Day job is a SOC, hunting it from the other side."),
    ],
  ],
  [
    'creds.txt',
    [
      err('cat: creds.txt: Permission denied'),
      dim('Nice try. Logged, correlated, and enriched with your user agent.'),
      dim('If you found a real path to this file, mail security@zephryx.in.'),
    ],
  ],
  [
    'contact.txt',
    [
      accent('Preferred channels'),
      ...MAILBOXES.map((m) => mailLink(m.address)),
      blank(),
      dim('Or use the vetted form:'),
      link('/handshake', '/handshake/'),
    ],
  ],
  [
    'flag.txt',
    [
      ok('ZPX{cur10s1ty_1s_th3_f1rst_expl01t}'),
      dim('You read the filesystem before you read the docs. Good instinct.'),
    ],
  ],
  [
    'rules.md',
    [
      accent('Rules of engagement'),
      out('1. Scope is sacred. Out of scope is out of bounds.'),
      out('2. Authorisation in writing, or it does not happen.'),
      out('3. Prove impact, never cause it.'),
      out('4. Data touched is data reported, minimised and destroyed.'),
      out('5. The report is the deliverable. The shell is just evidence.'),
    ],
  ],
]);

const SKILLS: ReadonlyArray<[string, string, number]> = [
  ['Penetration Testing', 'Scoped engagements · exploitation · reporting', 92],
  ['Initial Access', 'Phishing · payload dev · C2 · AV/EDR evasion', 88],
  ['Active Directory', 'Kerberos abuse · ACL paths · delegation', 90],
  ['Threat Hunting', 'Hypothesis-driven · Sigma · KQL', 94],
  ['Detection Engineering', 'ATT&CK mapping · rule tuning', 86],
  ['Web / API Exploitation', 'Authz flaws · SSRF · deserialisation', 89],
  ['Malware Analysis', 'Static triage · sandboxing · unpacking', 78],
  ['Cloud Attack Paths', 'Identity pivots · metadata · misconfig', 82],
];

const STACK: ReadonlyArray<[string, string]> = [
  ['C2 / Post-Ex', 'Cobalt Strike, Sliver, Mythic, Havoc'],
  ['Recon', 'Amass, nuclei, httpx, BloodHound, Kerbrute'],
  ['Exploitation', 'Burp Suite Pro, Metasploit, impacket, ffuf'],
  ['Defence', 'Splunk, Elastic, Sentinel, Velociraptor, Zeek'],
  ['Rules & Intel', 'Sigma, YARA, Suricata, MISP, ATT&CK Navigator'],
  ['Code', 'Python, Go, PowerShell, C#, Rust, Bash'],
];

const TTPS: ReadonlyArray<[string, string]> = [
  ['T1566.001', 'Spearphishing Attachment'],
  ['T1059.001', 'PowerShell'],
  ['T1055', 'Process Injection'],
  ['T1548.002', 'Bypass User Account Control'],
  ['T1558.003', 'Kerberoasting'],
  ['T1021.002', 'SMB / Admin Shares'],
  ['T1071.001', 'Web Protocols (C2)'],
  ['T1567.002', 'Exfiltration to Cloud Storage'],
];

/* ------------------------------------------------------------------ */
/* Registry                                                            */
/* ------------------------------------------------------------------ */

/**
 * A Map, deliberately. Object lookup would let `__proto__`, `constructor` or
 * `toString` resolve to inherited members and be invoked as a command.
 */
export const COMMANDS: ReadonlyMap<string, Command> = new Map<string, Command>([
  [
    'help',
    {
      name: 'help',
      summary: 'List available commands',
      usage: 'help [command]',
      run: (args) => {
        if (args[0]) {
          const cmd = COMMANDS.get(args[0].toLowerCase());
          if (!cmd) return [err(`help: no entry for '${args[0]}'`)];
          return [
            accent(cmd.name),
            out(`  ${cmd.summary}`),
            dim(`  usage: ${cmd.usage}`),
          ];
        }
        const visible = [...COMMANDS.values()].filter((c) => !c.secret);
        return [
          accent('Available commands'),
          blank(),
          ...visible.map((c) => out(`  ${pad(c.name, 12)} ${c.summary}`)),
          blank(),
          dim('  Tab completes · ↑/↓ recalls history · Ctrl+L clears · Ctrl+C aborts'),
          dim('  A few commands are undocumented. Poke around.'),
        ];
      },
    },
  ],
  [
    'whoami',
    {
      name: 'whoami',
      summary: 'Identity and current posture',
      usage: 'whoami',
      run: () => [
        accent(`${SITE.name.toLowerCase()}@${SITE.domain}`),
        out(`  name      ${SITE.legalName}`),
        out(`  craft     ${SITE.craft}`),
        out(`  day job   ${SITE.dayJob}`),
        out('  age       23'),
        out('  since     8th standard'),
        out('  focus     AD attack paths, detection engineering, the loop between them'),
        out('  posture   assume breach'),
        blank(),
        dim('  Full dossier:'),
        link('/whoami', '/whoami/'),
      ],
    },
  ],
  [
    'ls',
    {
      name: 'ls',
      summary: 'List files in the current directory',
      usage: 'ls [-la]',
      run: (args) => {
        const long = args.some((a) => a.startsWith('-') && a.includes('l'));
        const names = [...FILES.keys()];
        if (!long) return [out(names.join('   '))];
        return [
          dim('total 5'),
          ...names.map((n) => {
            const restricted = n === 'creds.txt';
            return out(
              `${restricted ? '-rw-------' : '-rw-r--r--'}  1 zephryx opsec  ${pad(
                String(320 + n.length * 37),
                5,
              )} ${pad(n, 14)}`,
            );
          }),
        ];
      },
    },
  ],
  [
    'cat',
    {
      name: 'cat',
      summary: 'Read a file',
      usage: 'cat <file>',
      run: (args) => {
        if (!args[0]) return [err('cat: missing operand'), dim("Try 'ls' first.")];
        const file = FILES.get(args[0].toLowerCase());
        if (!file) return [err(`cat: ${args[0]}: No such file or directory`)];
        return [...file];
      },
    },
  ],
  [
    'skills',
    {
      name: 'skills',
      summary: 'Capability matrix',
      usage: 'skills',
      run: () => [
        accent('Capability matrix'),
        blank(),
        ...SKILLS.flatMap(([label, detail, level]) => {
          const filled = Math.round(level / 5);
          return [
            out(`  ${pad(label, 24)} ${'█'.repeat(filled)}${'░'.repeat(20 - filled)} ${level}%`),
            dim(`  ${' '.repeat(24)} ${detail}`),
          ];
        }),
      ],
    },
  ],
  [
    'stack',
    {
      name: 'stack',
      summary: 'Tooling and languages',
      usage: 'stack',
      run: () => [
        accent('Operating stack'),
        blank(),
        ...STACK.map(([k, v]) => out(`  ${pad(k, 16)} ${v}`)),
      ],
    },
  ],
  [
    'ttp',
    {
      name: 'ttp',
      summary: 'ATT&CK techniques in regular rotation',
      usage: 'ttp',
      run: () => [
        accent('MITRE ATT&CK — frequently emulated'),
        blank(),
        ...TTPS.map(([id, label]) => out(`  ${pad(id, 12)} ${label}`)),
        blank(),
        dim('  Full coverage board — emulation vs. published detections:'),
        link('writeups.zephryx.in/matrix', `${RESEARCH_ORIGIN}/matrix/`),
        link('attack.mitre.org', 'https://attack.mitre.org'),
      ],
    },
  ],
  [
    'detections',
    {
      name: 'detections',
      summary: 'Published Sigma rules and hunts',
      usage: 'detections',
      run: () => [
        ok('Detections moved to writeups.zephryx.in'),
        link('writeups.zephryx.in/detections', `${RESEARCH_ORIGIN}/detections/`),
      ],
    },
  ],
  [
    'matrix',
    {
      name: 'matrix',
      summary: 'ATT&CK coverage board',
      usage: 'matrix',
      run: () => [
        ok('The board moved to writeups.zephryx.in'),
        link('writeups.zephryx.in/matrix', `${RESEARCH_ORIGIN}/matrix/`),
      ],
    },
  ],
  [
    'arsenal',
    {
      name: 'arsenal',
      summary: 'Released tooling and advisories',
      usage: 'arsenal',
      run: (_args, ctx) => {
        ctx.navigate('/arsenal/');
        return [ok('Opening /arsenal …')];
      },
    },
  ],
  [
    'social',
    {
      name: 'social',
      summary: 'Open channels',
      usage: 'social',
      run: () => [
        accent('Channels'),
        blank(),
        ...SOCIALS.map((s) => link(`  ${pad(s.label, 14)} ${s.handle}`, s.href)),
        blank(),
        dim('  All of it, plus the form and the mailboxes:'),
        link('/handshake', '/handshake/'),
      ],
    },
  ],
  [
    'contact',
    {
      name: 'contact',
      summary: 'How to reach me',
      usage: 'contact',
      run: () => [...(FILES.get('contact.txt') ?? [])],
    },
  ],
  [
    // /connect folded into /handshake; the old name still works so muscle
    // memory from the previous nav does not dead-end.
    'connect',
    {
      name: 'connect',
      summary: 'Open the contact page',
      usage: 'connect',
      secret: true,
      run: (_args, ctx) => {
        ctx.navigate('/handshake/');
        return [ok('Opening /handshake …')];
      },
    },
  ],
  [
    'writeups',
    {
      name: 'writeups',
      summary: 'Research notes and CTF writeups',
      usage: 'writeups',
      run: () => [
        ok('Writeups moved to writeups.zephryx.in'),
        link('writeups.zephryx.in/writeups', `${RESEARCH_ORIGIN}/writeups/`),
      ],
    },
  ],
  [
    'search',
    {
      name: 'search',
      summary: 'Search writeups and detections at once',
      usage: 'search <terms>',
      run: (args) => [
        ok(
          args.length
            ? `Search for "${args.join(' ')}" on writeups.zephryx.in`
            : 'Search moved to writeups.zephryx.in',
        ),
        // The URL is built from parsed tokens and re-encoded by searchUrl, so
        // nothing typed here reaches it uninspected.
        link('open search', searchUrl(args)),
      ],
    },
  ],
  [
    // Muscle memory: the site describes every filter box as a grep.
    'grep',
    {
      name: 'grep',
      summary: 'Search all content',
      usage: 'grep <terms>',
      secret: true,
      run: (args) => {
        const terms = args.filter((a) => !a.startsWith('-'));
        return [
          ok(
            terms.length
              ? `Search for "${terms.join(' ')}" on writeups.zephryx.in`
              : 'Search moved to writeups.zephryx.in',
          ),
          link('open search', searchUrl(terms)),
        ];
      },
    },
  ],
  [
    'cd',
    {
      name: 'cd',
      summary: 'Navigate to a page',
      usage: 'cd <route>',
      run: (args, ctx) => {
        const target = args[0];
        if (!target || target === '~' || target === '/') {
          ctx.navigate('/');
          return [ok('Opening / …')];
        }
        const normalised = `/${target.replace(/^\/+|\/+$/g, '')}/`;
        if (!ALLOWED_ROUTES.has(normalised)) {
          return [
            err(`cd: ${target}: No such route`),
            dim(`Valid: ${[...ALLOWED_ROUTES].join(' ')}`),
          ];
        }
        ctx.navigate(normalised);
        return [ok(`Opening ${normalised} …`)];
      },
    },
  ],
  [
    'echo',
    {
      name: 'echo',
      summary: 'Print arguments back',
      usage: 'echo <text>',
      // Args are already sanitized and length-capped, and render as text nodes.
      run: (args) => [out(args.join(' '))],
    },
  ],
  [
    'history',
    {
      name: 'history',
      summary: 'Show command history for this session',
      usage: 'history',
      run: (_args, ctx) =>
        ctx.history.length
          ? ctx.history.map((h, i) => out(`  ${pad(String(i + 1), 4)} ${h}`))
          : [dim('No history yet.')],
    },
  ],
  [
    'uname',
    {
      name: 'uname',
      summary: 'System information',
      usage: 'uname [-a]',
      run: () => [
        out('ZephryxOS 6.6.0-purple #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux'),
        dim('edge: cloudflare · csp: strict · object-src: none · frame-ancestors: none'),
      ],
    },
  ],
  [
    'uptime',
    {
      name: 'uptime',
      summary: 'Session uptime',
      usage: 'uptime',
      run: (_args, ctx) => {
        const secs = Math.max(0, Math.floor((Date.now() - ctx.bootedAt) / 1000));
        const mm = String(Math.floor(secs / 60)).padStart(2, '0');
        const ss = String(secs % 60).padStart(2, '0');
        return [out(`up ${mm}:${ss},  1 user,  load average: 0.14, 0.09, 0.05`)];
      },
    },
  ],
  [
    'date',
    {
      name: 'date',
      summary: 'Current UTC time',
      usage: 'date',
      run: () => [out(new Date().toUTCString())],
    },
  ],
  [
    'banner',
    {
      name: 'banner',
      summary: 'Reprint the banner',
      usage: 'banner',
      run: () => [...BANNER.map((l) => ({ kind: 'wordmark' as const, text: l }))],
    },
  ],
  [
    'clear',
    {
      name: 'clear',
      summary: 'Clear the screen',
      usage: 'clear',
      run: (_args, ctx) => {
        ctx.clear();
        return [];
      },
    },
  ],
  /* ---------------- undocumented ---------------- */
  [
    'sigma',
    {
      name: 'sigma',
      summary: 'Detection rule library',
      usage: 'sigma',
      secret: true,
      run: () => [
        accent('Detection rule library'),
        out('  Sigma sources, KQL translations, tuning notes and the blind spots'),
        out('  each rule still has. Every rule names the attack it answers.'),
        blank(),
        link('/detections', '/detections/'),
      ],
    },
  ],
  [
    'cve',
    {
      name: 'cve',
      summary: 'Advisories and released tooling',
      usage: 'cve',
      secret: true,
      run: () => [
        accent('Coordinated disclosure'),
        out('  Advisories filed, current disclosure stage, and the tooling that'),
        out('  found most of them. Embargoed entries stay vague on purpose.'),
        blank(),
        link('/arsenal', '/arsenal/'),
        blank(),
        dim('  Reporting something in my own estate? Policy and safe harbour:'),
        link('/security', '/security/'),
      ],
    },
  ],
  [
    'sudo',
    {
      name: 'sudo',
      summary: 'Elevate privileges',
      usage: 'sudo <command>',
      secret: true,
      run: (args) => [
        err(`zephryx is not in the sudoers file. This incident has been reported.`),
        dim(args.length ? `(attempted: ${args.join(' ')})` : '(no command supplied)'),
        dim('Privilege escalation starts with enumeration, not optimism.'),
      ],
    },
  ],
  [
    'rm',
    {
      name: 'rm',
      summary: 'Remove files',
      usage: 'rm [-rf] <path>',
      secret: true,
      run: () => [
        warn('rm: refusing to operate recursively on a production filesystem'),
        dim('Destructive actions need scope, authorisation and a rollback plan.'),
      ],
    },
  ],
  [
    'nmap',
    {
      name: 'nmap',
      summary: 'Scan a host',
      usage: 'nmap <target>',
      secret: true,
      run: (args) => [
        dim(`Starting Nmap 7.95 ( https://nmap.org ) against ${args[0] ?? 'zephryx.in'}`),
        out('PORT    STATE    SERVICE   VERSION'),
        out('80/tcp  open     http      cloudflare (301 -> https)'),
        out('443/tcp open     ssl/https cloudflare'),
        out('22/tcp  filtered ssh'),
        blank(),
        ok('Host is up. Everything else is behind the edge.'),
        dim('Only scan what you are authorised to scan.'),
      ],
    },
  ],
  [
    'exploit',
    {
      name: 'exploit',
      summary: 'Run an exploit',
      usage: 'exploit',
      secret: true,
      run: () => [
        dim('[*] Building payload …'),
        dim('[*] Checking scope authorisation …'),
        err('[-] No signed rules of engagement found for this target.'),
        dim("Read 'cat rules.md'. The paperwork is the exploit chain."),
      ],
    },
  ],
  [
    'ping',
    {
      name: 'ping',
      summary: 'Ping a host',
      usage: 'ping <host>',
      secret: true,
      run: (args) => {
        const host = (args[0] ?? SITE.domain).slice(0, 48);
        return [
          out(`PING ${host}: 56 data bytes`),
          out('64 bytes: icmp_seq=0 ttl=57 time=11.2 ms'),
          out('64 bytes: icmp_seq=1 ttl=57 time=10.8 ms'),
          ok('2 packets transmitted, 2 received, 0.0% packet loss'),
        ];
      },
    },
  ],
  [
    'id',
    {
      name: 'id',
      summary: 'Print effective identity',
      usage: 'id',
      secret: true,
      run: () => [
        out('uid=1337(zephryx) gid=1337(pentest) groups=1337(pentest),27(threat-hunt),4(soc)'),
      ],
    },
  ],
  [
    'pwd',
    {
      name: 'pwd',
      summary: 'Print working directory',
      usage: 'pwd',
      secret: true,
      run: () => [out('/home/zephryx/ops')],
    },
  ],
  [
    'exit',
    {
      name: 'exit',
      summary: 'Close the session',
      usage: 'exit',
      secret: true,
      run: () => [
        warn('Session persists. There is no logout from curiosity.'),
        dim('Close the tab if you must.'),
      ],
    },
  ],
]);

/** Names offered to Tab completion — secret commands are excluded. */
export const COMPLETIONS: readonly string[] = [...COMMANDS.values()]
  .filter((c) => !c.secret)
  .map((c) => c.name);

export const BOOT_BANNER = BANNER;

/**
 * Execute a parsed command. Unknown names produce a suggestion rather than
 * touching the registry a second time.
 */
export function execute(parsed: ParsedCommand, ctx: CommandContext): CommandResult {
  const cmd = COMMANDS.get(parsed.name);
  if (!cmd) {
    const near = COMPLETIONS.find(
      (c) => c.startsWith(parsed.name.slice(0, 2)) && parsed.name.length > 1,
    );
    return [
      err(`zsh: command not found: ${parsed.name}`),
      ...(near ? [dim(`Did you mean '${near}'?`)] : []),
      dim("Type 'help' for the command list."),
    ];
  }

  try {
    return cmd.run(parsed.args, ctx);
  } catch {
    // A command bug must never take the whole terminal down.
    return [err('Internal error while executing command.')];
  }
}
