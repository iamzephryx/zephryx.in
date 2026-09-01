---
title: 'Possible Pass-the-Hash - NTLM Logon Where Kerberos Is Expected'
ruleId: 'ZPX-D013'
date: '2026-08-21'
techniques: ['T1550.002']
platform: 'Windows Server / Active Directory'
logsource: 'Windows Security Event Log · EventID 4624'
severity: 'low'
status: 'experimental'
tags: ['pass-the-hash', 'lateral-movement', 'active-directory', 'ntlm']
writeup: 'ad-killchain-lab'
excerpt: 'NTLM logons happen for ordinary reasons on most domains, which is exactly why this rule ships at low severity — it only earns its keep once you have baselined which accounts and hosts should be seeing it at all.'
---

## Why this fires

I'll be upfront about this one: on its own it's a blunt instrument. NTLM
logons happen for perfectly ordinary reasons on most domains — older
applications, some backup agents, anything hitting a host by IP instead of
name skips Kerberos entirely. What makes it worth a rule is the pairing: a
domain-joined member server, an account that should be authenticating with
Kerberos for literally everything else it does, suddenly showing a Logon
Type 3 with NTLM. That combination is exactly what `mimikatz`'s
`sekurlsa::pth` (and every PtH-capable lateral-movement module built on the
same idea) produces, because the injected hash never touches an actual
Kerberos exchange.

Do not run this at a paging severity out of the box. Baseline which accounts
and hosts legitimately show NTLM first, then tune the filter list to your
own noise, or you'll be muting this within a week — which is the whole
reason it ships at `low` here.

Third rule in the [KillChainSigma](https://github.com/iamzephryx/KillChainSigma)
pack, tested against the lab in [this writeup](/writeups/ad-killchain-lab/).

## The rule

```yaml pass-the-hash.yml
title: Possible Pass-the-Hash - NTLM Logon Where Kerberos Is Expected
id: a2cb5933-3183-413f-870e-393024874e6d
status: experimental
description: |
  I'll be upfront about this one: on its own it's a blunt instrument. NTLM
  logons happen for perfectly ordinary reasons on most domains (older
  applications, some backup agents, anything hitting a host by IP instead of
  name skips Kerberos entirely). What makes it worth a rule is the pairing -
  a domain-joined member server, an account that should be authenticating
  with Kerberos for literally everything else it does, suddenly showing a
  Logon Type 3 with NTLM. That combination is exactly what mimikatz's
  sekurlsa::pth (and every PtH-capable C2 module built on the same idea)
  produces, because the injected hash never touches an actual Kerberos
  exchange.

  Do not run this at a paging severity out of the box. Baseline which
  accounts and hosts legitimately show NTLM first, then tune the filter list
  to your own noise, or you'll be muting this within a week.
author: Zephryx
date: 2026-08-21
references:
  - https://attack.mitre.org/techniques/T1550/002/
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: 4624
    LogonType: 3
    AuthenticationPackageName: NTLM
  filter_anonymous:
    TargetUserName: ANONYMOUS LOGON
  filter_computer_accounts:
    TargetUserName|endswith: '$'
  condition: selection and not 1 of filter_*
falsepositives:
  - Legacy applications and some scanners that only ever speak NTLM
  - Backup/monitoring agents authenticating by IP rather than hostname
  - Any environment that hasn't disabled NTLM fallback - this will be loud there, tune before enabling
level: low
tags:
  - attack.lateral_movement
  - attack.t1550.002
```
