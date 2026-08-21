---
title: 'Directory Replication Requested From a Non-DC Source (DCSync)'
ruleId: 'ZPX-D016'
date: '2026-08-21'
techniques: ['T1003.006']
platform: 'Windows Server / Active Directory'
logsource: 'Windows Security Event Log · EventID 4662'
severity: 'critical'
status: 'stable'
tags: ['dcsync', 'active-directory', 'credential-access', 'domain-dominance']
writeup: 'ad-killchain-lab'
excerpt: 'Real domain controllers replicate directory data among themselves constantly. A request for the same replication rights from anything that is not a DC is the one rule in this pack worth paging someone over.'
---

## Why this fires

This is the one rule in the whole pack I'd actually trust to page someone.
Real domain controllers replicate directory data among themselves constantly
using the **DS-Replication-Get-Changes** and **DS-Replication-Get-Changes-All**
extended rights — that traffic is normal, and it happens between DCs, full
stop. `mimikatz`'s `lsadump::dcsync`, and anything else built on the same
DRSUAPI calls, asks for those same two rights from wherever the attacker's
foothold happens to be, which is essentially never a domain controller's own
computer account. There is no tuning needed here beyond excluding your
actual DCs and your legitimate sync accounts — Azure AD Connect being the
one everyone forgets the first time this rule goes live and immediately
fires.

Sixth rule in the [KillChainSigma](https://github.com/zephryxsec/KillChainSigma)
pack, and the payoff of [the full chain](/writeups/ad-killchain-lab/) — once
a foothold reaches this stage, it has the `krbtgt` hash and the domain is
done.

## The rule

```yaml dcsync.yml
title: Directory Replication Requested From a Non-DC Source (DCSync)
id: 5f9e1946-084e-47a3-bf9a-7a7944aabac0
status: stable
description: |
  This is the one rule in the whole pack I'd actually trust to page someone.
  Real domain controllers replicate directory data among themselves
  constantly using the DS-Replication-Get-Changes and
  DS-Replication-Get-Changes-All extended rights - that traffic is normal and
  it happens between DCs, full stop. mimikatz's lsadump::dcsync, and anything
  else built on the same DRSUAPI calls, asks for those same two rights from
  wherever the attacker's foothold happens to be, which is essentially never
  a domain controller's own computer account. There is no tuning needed here
  beyond excluding your actual DCs and your legitimate sync accounts (Azure
  AD Connect being the one everyone forgets about the first time this rule
  goes live and immediately fires).
author: Zephryx
date: 2026-08-21
references:
  - https://attack.mitre.org/techniques/T1003/006/
logsource:
  product: windows
  service: security
  definition: 'Requires "Audit Directory Service Access" success auditing on the DCs, with a SACL on the domain object auditing the two replication extended rights below.'
detection:
  selection:
    EventID: 4662
    Properties|contains|all:
      - '1131f6aa-9c07-11d1-f79f-00c04fc2dcd2'
      - '1131f6ad-9c07-11d1-f79f-00c04fc2dcd2'
  filter_domain_controllers:
    SubjectUserName|endswith: '$'
  condition: selection and not filter_domain_controllers
falsepositives:
  - Azure AD Connect / AAD Connect sync accounts - these legitimately hold the rights and will trip this. Exclude the specific sync account by name, do not just widen the computer-account filter to cover it.
  - Any third-party identity or backup tool that does its own directory replication for sync purposes
level: critical
tags:
  - attack.credential_access
  - attack.t1003.006
```
