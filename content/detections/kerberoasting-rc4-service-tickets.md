---
title: 'Kerberoasting via RC4 Service Ticket Requests'
ruleId: 'ZPX-D001'
date: '2026-06-20'
techniques: ['T1558.003']
platform: 'Windows'
logsource: 'Windows Security · Event 4769'
severity: 'high'
status: 'stable'
tags: ['active-directory', 'kerberos', 'credential-access']
writeup: 'kerberoasting-to-domain-admin'
excerpt: 'Service tickets issued with RC4 encryption to accounts that normally negotiate AES. The downgrade is the tell — modern clients do not ask for RC4, crackers do.'
---

## Why this fires

A Kerberoasting run asks the KDC for service tickets (TGS-REQ) for every account
carrying an SPN, then cracks the ticket offline against the service account's
password. The requests themselves are legitimate Kerberos traffic — every domain
user is entitled to make them.

What is *not* normal is the encryption type. Windows clients in a modern domain
negotiate AES256 (`0x12`). Roasting tooling deliberately requests **RC4-HMAC
(`0x17`)** because the resulting ticket cracks orders of magnitude faster. That
downgrade, plus the volume, is the signal.

## The rule

```yaml
title: Kerberoasting - RC4 Service Ticket Requests
id: 6f0e5cd2-0a1b-4c73-9a5f-2b3f8d417c91
status: stable
description: >
  Detects TGS-REQ activity where service tickets are issued using RC4-HMAC
  encryption. Roasting tooling requests RC4 to speed up offline cracking, while
  modern domain-joined clients negotiate AES.
references:
  - https://attack.mitre.org/techniques/T1558/003/
author: Zephryx
date: 2026/06/20
tags:
  - attack.credential_access
  - attack.t1558.003
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: 4769
    TicketEncryptionType: '0x17'
    TicketOptions: '0x40810000'
  filter_machine:
    ServiceName|endswith: '$'
  filter_krbtgt:
    ServiceName: 'krbtgt'
  filter_anonymous:
    TargetUserName: '*$@*'
  condition: selection and not 1 of filter_*
fields:
  - TargetUserName
  - ServiceName
  - IpAddress
falsepositives:
  - Legacy applications and appliances that only support RC4
  - Domain functional levels below 2008 where AES is unavailable
  - Long-lived service accounts with msDS-SupportedEncryptionTypes unset
level: high
```

## Threshold companion

The single-event rule above is noisy in estates with genuine RC4 stragglers.
Pair it with a volume rule — one account pulling tickets for many distinct SPNs
in a short window is the actual roasting behaviour, and it is very hard to make
quiet:

```kql
SecurityEvent
| where EventID == 4769 and TicketEncryptionType == "0x17"
| where ServiceName !endswith "$" and ServiceName != "krbtgt"
| summarize spns = dcount(ServiceName), tickets = count()
    by TargetUserName, IpAddress, bin(TimeGenerated, 10m)
| where spns >= 6
| order by spns desc
```

## Tuning notes

- Baseline `msDS-SupportedEncryptionTypes` across every SPN-bearing account
  first. Anything still on RC4 is both a false-positive source *and* a finding —
  fix it and the rule sharpens itself.
- Exclude the handful of appliances that genuinely cannot do AES by
  `ServiceName`, never by `TargetUserName`. Excluding the requesting account is
  how you blind yourself to the attack.
- `TicketOptions: '0x40810000'` narrows to the forwardable/renewable request
  shape most tooling emits. Drop it if you want recall over precision.

## What it would have caught

This is the detection that closes
[the 40-minute domain admin path](/writeups/kerberoasting-to-domain-admin/). In
that engagement the roast pulled 31 SPNs in under two minutes from a single
workstation. The threshold rule fires at ticket six.
