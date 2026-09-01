---
title: 'Suspicious Remote Service Installation (PsExec-Style Lateral Movement)'
ruleId: 'ZPX-D014'
date: '2026-08-21'
techniques: ['T1021.002']
platform: 'Windows Server / Active Directory'
logsource: 'Windows System Event Log · EventID 7045'
severity: 'high'
status: 'test'
tags: ['psexec', 'lateral-movement', 'active-directory', 'service-creation']
writeup: 'ad-killchain-lab'
excerpt: 'PsExec and its lookalikes all land on the same primitive: drop a binary over ADMIN$, register it as a service, run it. That install gets logged whether the tool hides anything else or not.'
---

## Why this fires

PsExec and its lookalikes — CrackMapExec's SMB execution, Impacket's
`psexec.py`, plenty of lateral-movement modules — all land on the same
primitive in the end: drop a binary over `ADMIN$`, register it as a service
through the Service Control Manager, start it, let it run, clean up after.
The service install itself gets logged whether the tool bothers to hide
anything else or not. Random-looking service names and anything executing
straight out of `ADMIN$` are the two easiest tells — most legitimate remote
admin tooling in a given environment settles into a small, boring, known set
of service names, so anything outside it is worth a look.

Fourth rule in the [KillChainSigma](https://github.com/iamzephryx/KillChainSigma)
pack. [The writeup](/writeups/ad-killchain-lab/) covers where this sits
relative to the WMI-based alternative (rule 5) and why both are worth
having.

## The rule

```yaml remote-service-creation.yml
title: Suspicious Remote Service Installation (PsExec-Style Lateral Movement)
id: 9c8a11b9-4de1-41d5-80ce-7af113e804af
status: test
description: |
  PsExec and its lookalikes (CrackMapExec's smb execution, Impacket's
  psexec.py, plenty of C2 lateral-movement modules) all land on the same
  primitive in the end: drop a binary over ADMIN$, register it as a service
  through the Service Control Manager, start it, let it run, clean up after.
  The service install itself gets logged whether the tool bothers to hide
  anything else or not. Random-looking service names and anything executing
  straight out of ADMIN$ are the two easiest tells - most legitimate remote
  admin tooling in a given environment settles into a small, boring, known
  set of service names, so anything outside it is worth a look.
author: Zephryx
date: 2026-08-21
references:
  - https://attack.mitre.org/techniques/T1021/002/
logsource:
  product: windows
  service: system
detection:
  selection:
    EventID: 7045
  suspicious_path:
    ServiceFileName|contains: '\ADMIN$\'
  suspicious_name:
    ServiceName|contains:
      - 'PSEXEC'
      - 'PAExec'
  condition: selection and (suspicious_path or suspicious_name)
falsepositives:
  - Your own IT team's actual PsExec usage, SCCM package delivery, and similar legitimate remote-admin tooling. Build the known-good service name list for your environment first, this rule is only as good as that exclusion list.
level: high
tags:
  - attack.lateral_movement
  - attack.execution
  - attack.t1021.002
```
