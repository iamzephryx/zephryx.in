---
title: 'Lateral Movement — Service Creation Over Admin Shares'
ruleId: 'ZPX-D009'
date: '2026-07-02'
techniques: ['T1021.002', 'T1569.002', 'T1570']
platform: 'Windows'
logsource: 'Windows Security · Events 5145/7045 · Sysmon 1'
severity: 'high'
status: 'stable'
tags: ['lateral-movement', 'active-directory', 'endpoint']
excerpt: 'PsExec and every impacket descendant write a binary to ADMIN$ and register a service to run it. Two events, one sequence, thirty years of the same pattern.'
---

## Why this fires

`psexec.py`, `smbexec.py`, `wmiexec.py` and the original Sysinternals tool all
share a skeleton: authenticate over SMB, drop a payload on `ADMIN$` or `C$`,
create a service pointing at it, start the service, clean up. Modern variants
randomise the filename and the service name; none of them can skip the
service-creation step without giving up the SYSTEM context that makes the
technique worth using.

The randomisation is itself the signal — a service whose name is eight random
characters is not something an administrator installed.

## The rule

```yaml
title: Remote Service Creation Following Admin Share Write
id: 2f95c8e7-6b31-4a0d-b7f2-9e83c14d5a70
status: stable
description: >
  Detects the PsExec-style lateral movement pattern: a write to an
  administrative share followed closely by creation of a service whose image
  path points into a system directory or share.
references:
  - https://attack.mitre.org/techniques/T1021/002/
  - https://attack.mitre.org/techniques/T1569/002/
author: Zephryx
date: 2026/07/02
tags:
  - attack.lateral_movement
  - attack.execution
  - attack.t1021.002
  - attack.t1569.002
logsource:
  product: windows
  service: security
detection:
  selection_share:
    EventID: 5145
    ShareName|contains:
      - '\\*\ADMIN$'
      - '\\*\C$'
    AccessMask: '0x2'
  selection_service:
    EventID: 7045
    ServiceType: 'user mode service'
    ServiceStartType: 'demand start'
  filter_known_services:
    ServiceName:
      - 'SCCMAgent'
      - 'MonitoringHost'
      - 'BackupExecAgent'
  timeframe: 5m
  condition: selection_share and selection_service and not filter_known_services
fields:
  - SubjectUserName
  - IpAddress
  - ShareName
  - RelativeTargetName
  - ServiceName
  - ServiceFileName
level: high
falsepositives:
  - Software deployment platforms (SCCM, PDQ, Intune scripts)
  - Remote-management and patching agents
  - Legitimate administrative use of PsExec
```

## Score the service name

The strongest discriminator is entropy. Administrators name services after
products; tooling names them after `random.choice`:

```kql
SecurityEvent
| where EventID == 7045
| extend name = tostring(ServiceName)
| where strlen(name) between (6 .. 12)
// no vowels and no separators: almost certainly generated
| where not(name matches regex @"(?i)[aeiou]") or name matches regex @"^[a-zA-Z]{8}$"
| join kind=inner (
    SecurityEvent
    | where EventID == 5145 and AccessMask == "0x2"
    | where ShareName has_any ("ADMIN$", "C$")
    | project shareTime = TimeGenerated, Computer, SubjectUserName, IpAddress, RelativeTargetName
  ) on Computer
| where datetime_diff('second', TimeGenerated, shareTime) between (0 .. 300)
| project TimeGenerated, Computer, SubjectUserName, IpAddress, RelativeTargetName, ServiceName, ServiceFileName
```

## Tuning notes

- 5145 requires **Detailed File Share** auditing, which is off by default and
  chatty when enabled. Turn it on for servers and domain controllers first; the
  volume on workstations rarely justifies itself.
- Allowlist deployment tooling by service name *and* source IP. The management
  server's address is stable; an operator's foothold is not.
- Where the estate permits, the durable control is blocking inbound SMB between
  workstations entirely. This technique needs peer-to-peer 445, and almost no
  legitimate workflow does.

## Standalone coverage

No writeup backs this one — it is baseline coverage for a technique that shows
up in nearly every intrusion regardless of how it started. Not every rule needs
an offensive story attached; some just need to exist before you need them.
