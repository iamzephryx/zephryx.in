---
title: 'LSASS Handle Access With Credential-Read Rights'
ruleId: 'ZPX-D004'
date: '2026-06-02'
techniques: ['T1003.001']
platform: 'Windows'
logsource: 'Sysmon · Event 10 (ProcessAccess)'
severity: 'high'
status: 'stable'
tags: ['credential-access', 'sysmon', 'endpoint']
writeup: 'htb-blackfield-ctf-writeup'
excerpt: 'Every credential dumper needs a handle to LSASS with read rights. The tooling changes constantly; the access mask does not.'
---

## Why this fires

Dumping credentials from `lsass.exe` requires opening a handle to it with — at
minimum — `PROCESS_VM_READ` (`0x0010`) and `PROCESS_QUERY_INFORMATION`
(`0x0400`). Mimikatz, `procdump`, `comsvcs.dll MiniDump`, nanodump and every
homegrown variant converge on the same masks because Windows gives them no
choice.

Naming the tool is a losing game. Watching the *handle* is durable.

## The rule

```yaml
title: LSASS Process Access With Credential Dumping Rights
id: 9a2c5e10-fb63-4d81-a0c7-1e6b47f2d938
status: stable
description: >
  Detects handles opened to lsass.exe with access masks sufficient to read
  process memory, which is the required primitive for LSASS credential
  extraction regardless of the tool used.
references:
  - https://attack.mitre.org/techniques/T1003/001/
author: Zephryx
date: 2026/06/02
tags:
  - attack.credential_access
  - attack.t1003.001
logsource:
  product: windows
  category: process_access
detection:
  selection:
    TargetImage|endswith: '\lsass.exe'
    GrantedAccess:
      - '0x1010'   # VM_READ | QUERY_LIMITED_INFORMATION
      - '0x1410'
      - '0x1438'
      - '0x143a'
      - '0x1f0fff' # PROCESS_ALL_ACCESS
      - '0x1fffff'
  filter_known_good:
    SourceImage|startswith:
      - 'C:\Windows\System32\'
      - 'C:\Program Files\Windows Defender\'
    SourceImage|endswith:
      - '\wmiprvse.exe'
      - '\MsMpEng.exe'
      - '\csrss.exe'
      - '\services.exe'
  filter_unbacked:
    CallTrace|contains: 'UNKNOWN'
  condition: selection and not filter_known_good
fields:
  - SourceImage
  - SourceProcessId
  - GrantedAccess
  - CallTrace
falsepositives:
  - EDR and AV agents performing memory inspection
  - Crash-dump and performance-monitoring tooling
  - Some enterprise backup agents
level: high
```

Note that `filter_unbacked` is declared but deliberately **not** subtracted in
the condition — a call trace containing `UNKNOWN` means the access came from
unbacked memory, which raises severity rather than lowering it. Keep it as a
named selection so a downstream enrichment can promote those events.

## Escalate on the call trace

The access mask tells you someone read LSASS. The call trace tells you whether
they did it from a legitimate module:

```sql
Event
| where Source == "Microsoft-Windows-Sysmon" and EventID == 10
| extend TargetImage = tostring(EventData.TargetImage),
         SourceImage = tostring(EventData.SourceImage),
         CallTrace   = tostring(EventData.CallTrace)
| where TargetImage endswith "lsass.exe"
| extend unbacked = CallTrace has "UNKNOWN"
| extend severity = case(unbacked, "critical",
                         SourceImage startswith "C:\\Users\\", "high",
                         "medium")
| project TimeGenerated, Computer, SourceImage, GrantedAccess = tostring(EventData.GrantedAccess), unbacked, severity
```

## Tuning notes

- Build the `filter_known_good` list from a week of your own telemetry, not from
  a blog post. Every estate has a different set of agents touching LSASS.
- Filter by full path, never by image name. `svchost.exe` in a user-writable
  directory is the entire attack.
- Enabling **Credential Guard** and **LSA protection (RunAsPPL)** removes most
  of the attack surface this rule watches. Deploy those first; keep the rule for
  the hosts that cannot take them.

## Related coverage

Pairs with the SeBackupPrivilege path in
[the Blackfield writeup](/writeups/htb-blackfield-ctf-writeup/) — when LSASS is
hardened, operators pivot to stealing `ntds.dit` from a shadow copy instead, and
that needs its own rule.
