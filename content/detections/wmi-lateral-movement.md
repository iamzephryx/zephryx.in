---
title: 'Process Spawned by WmiPrvSE.exe (Possible WMI Lateral Movement)'
ruleId: 'ZPX-D015'
date: '2026-08-21'
techniques: ['T1047']
platform: 'Windows Server / Active Directory'
logsource: 'Sysmon · EventID 1 (Process Creation)'
severity: 'medium'
status: 'test'
tags: ['wmi', 'lateral-movement', 'active-directory', 'sysmon']
writeup: 'ad-killchain-lab'
excerpt: 'wmiexec and its C2 equivalents reach for Win32_Process.Create specifically to dodge the service-install event PsExec leaves behind. The cost of doing it that way: the spawned process shows up as a child of WmiPrvSE.exe.'
---

## Why this fires

`wmiexec.py`, `Invoke-WmiMethod`, and a lot of C2 lateral-movement modules
reach for `Win32_Process.Create` over WMI instead of PsExec's service-install
route specifically to dodge the 7045 event that route leaves behind. The
cost of doing it that way is this: whatever gets spawned shows up as a child
of `WmiPrvSE.exe`, and almost nothing legitimate spawns `cmd`, `powershell`,
or `rundll32` as a child of the WMI provider host outside of actual systems
management tooling.

Fifth rule in the [KillChainSigma](https://github.com/zephryxsec/KillChainSigma)
pack — the companion to rule 4 for the lateral-movement stage. Both are
covered in [the writeup](/writeups/ad-killchain-lab/).

## The rule

```yaml wmi-execution.yml
title: Process Spawned by WmiPrvSE.exe (Possible WMI Lateral Movement)
id: 71870bc3-e4b9-4fa2-851e-c356befe5eff
status: test
description: |
  wmiexec.py, Invoke-WmiMethod, and a lot of C2 lateral-movement modules
  reach for Win32_Process.Create over WMI instead of PsExec's service-install
  route specifically to dodge the 7045 event that route leaves behind. The
  cost of doing it that way is this: whatever gets spawned shows up as a
  child of WmiPrvSE.exe, and almost nothing legitimate spawns cmd, powershell
  or rundll32 as a child of the WMI provider host outside of actual systems
  management tooling.
author: Zephryx
date: 2026-08-21
references:
  - https://attack.mitre.org/techniques/T1047/
logsource:
  product: windows
  category: process_creation
  definition: 'Requires Sysmon (EventID 1) or Windows process-creation auditing with command-line logging enabled.'
detection:
  selection:
    ParentImage|endswith: '\WmiPrvSE.exe'
    Image|endswith:
      - '\cmd.exe'
      - '\powershell.exe'
      - '\rundll32.exe'
      - '\mshta.exe'
  condition: selection
falsepositives:
  - SCCM, Tanium, and similar management platforms that legitimately drive remote execution through WMI
  - Some backup and inventory agents
level: medium
tags:
  - attack.lateral_movement
  - attack.execution
  - attack.t1047
```
