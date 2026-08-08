---
title: 'DCSync — Directory Replication From a Non-DC Host'
ruleId: 'ZPX-D003'
date: '2026-06-22'
techniques: ['T1003.006']
platform: 'Windows'
logsource: 'Windows Security · Event 4662'
severity: 'critical'
status: 'stable'
tags: ['active-directory', 'credential-access', 'domain-controller']
writeup: 'kerberoasting-to-domain-admin'
excerpt: 'Replication rights are how domain controllers sync. When anything that is not a domain controller exercises them, someone is pulling the hash of every account you own.'
---

## Why this fires

`DS-Replication-Get-Changes-All` is a legitimate extended right — it is how
domain controllers replicate the directory to each other. It is also how
`mimikatz lsadump::dcsync` and `secretsdump.py -just-dc` retrieve the krbtgt
hash without ever touching a DC's disk or memory.

There is no way to perform DCSync without exercising that right, and the DC
audits it in event 4662. The rule is therefore close to zero-false-negative:
the only work is excluding the accounts that are *supposed* to replicate.

## The rule

```yaml
title: DCSync - Directory Replication Rights Exercised by Non-DC Principal
id: 3c8f47ab-91d5-4e0a-b276-5d9f1c83e740
status: stable
description: >
  Detects use of the DS-Replication-Get-Changes / -All extended rights by a
  principal that is not a domain controller. This is the required primitive for
  DCSync-style credential extraction.
references:
  - https://attack.mitre.org/techniques/T1003/006/
author: Zephryx
date: 2026/06/22
tags:
  - attack.credential_access
  - attack.t1003.006
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: 4662
    Properties|contains:
      - '1131f6aa-9c07-11d1-f79f-00c04fc2dcd2'   # DS-Replication-Get-Changes
      - '1131f6ad-9c07-11d1-f79f-00c04fc2dcd2'   # DS-Replication-Get-Changes-All
      - '89e95b76-444d-4c62-991a-0facbeda640c'   # Replicating Directory Changes In Filtered Set
  filter_dc_accounts:
    SubjectUserName|endswith: '$'
  filter_system:
    SubjectUserName:
      - 'SYSTEM'
      - 'ANONYMOUS LOGON'
  condition: selection and not 1 of filter_*
fields:
  - SubjectUserName
  - SubjectDomainName
  - ObjectName
  - Properties
falsepositives:
  - Azure AD Connect / Entra Connect sync accounts
  - Directory synchronisation appliances and backup agents
  - Legitimate DC promotion and demotion windows
level: critical
```

## Do not filter on `$` alone

The `filter_dc_accounts` clause above excludes every machine account, which is
convenient and wrong in a targeted attack — an operator with control of a
non-DC computer object can replicate too. Tighten it to an explicit allowlist of
your actual DCs plus your sync accounts:

```sql
let replicationGuids = dynamic([
    "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2",
    "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2",
    "89e95b76-444d-4c62-991a-0facbeda640c"]);
let approved = dynamic(["DC01$", "DC02$", "AADCONNECT_SVC"]);
SecurityEvent
| where EventID == 4662
| where Properties has_any (replicationGuids)
| where SubjectUserName !in~ (approved)
| project TimeGenerated, Computer, SubjectUserName, SubjectDomainName, ObjectName
```

## Tuning notes

- Maintain the allowlist as configuration, not as a rule edit. It changes when
  the estate changes, and it should be reviewed like any other privileged group.
- Every entry on that allowlist is a DCSync-capable identity. If the list is
  long, the finding is not the alert — it is the list.
- Audit the ACL on the domain object quarterly. Replication rights granted to a
  stale service account are the single most common path to this technique.

## What it would have caught

The final hop in
[the 40-minute domain admin path](/writeups/kerberoasting-to-domain-admin/) was
a DCSync from a standard workstation using an account that had inherited
replication rights from a 2019 ACL change nobody had audited. This rule fires on
the first request — before krbtgt leaves the building.
