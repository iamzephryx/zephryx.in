---
title: 'Kerberoasting - Bulk RC4 Service Ticket Requests'
ruleId: 'ZPX-D011'
date: '2026-08-21'
techniques: ['T1558.003']
platform: 'Windows Server / Active Directory'
logsource: 'Windows Security Event Log · EventID 4769'
severity: 'high'
status: 'test'
tags: ['kerberoasting', 'active-directory', 'credential-access', 'kerberos']
writeup: 'ad-killchain-lab'
excerpt: 'A single account requesting eight or more service tickets encrypted with RC4 in a five-minute window is not a normal workday — it is a Kerberoasting tool working through every SPN in the domain.'
---

## Why this fires

Rubeus, PowerView, and pretty much every other Kerberoasting tool land on
the same primitive: enumerate every account with an SPN, then request a
service ticket for each one with RC4 encryption specifically. AES tickets
are useless offline unless the account's password is already weak — RC4 is
what actually gets cracked. A real user touches maybe one or two SPNs a day
as a side effect of normal work. A single account requesting eight or more
distinct service tickets in RC4 inside a few minutes is a wordlist being run
against every SPN in the domain, not a workday.

This is the first rule from the [KillChainSigma](https://github.com/iamzephryx/KillChainSigma)
pack — the full chain and how each stage was tested is in
[the writeup this came from](/writeups/ad-killchain-lab/).

## The rule

```yaml kerberoasting.yml
title: Kerberoasting - Bulk RC4 Service Ticket Requests
id: 98dcacfc-722e-4a54-a53c-af3d39ed3b50
status: test
description: |
  Rubeus, PowerView and pretty much every other Kerberoasting tool work the same
  way under the hood: pull every account with an SPN from AD, then request a
  service ticket for each one with RC4 encryption specifically (AES tickets
  are useless offline unless the account's password is already weak, RC4 is
  what you actually want to crack). A real user touches maybe one or two SPNs
  a day as a side effect of normal work. A single account requesting eight or
  more distinct service tickets in RC4 within a few minutes is not normal
  work, it's a wordlist.
author: Zephryx
date: 2026-08-21
references:
  - https://attack.mitre.org/techniques/T1558/003/
  - https://github.com/GhostPack/Rubeus
logsource:
  product: windows
  service: security
  definition: 'Requires "Audit Kerberos Service Ticket Operations" success auditing enabled on every DC. Off by default on most builds - check this before you trust the "no hits" result.'
detection:
  selection:
    EventID: 4769
    TicketEncryptionType: '0x17'
  filter_machine_accounts:
    ServiceName|endswith: '$'
  filter_krbtgt:
    ServiceName: krbtgt
  timeframe: 5m
  condition: selection and not 1 of filter_* | count(ServiceName) by TargetUserName > 8
fields:
  - TargetUserName
  - ServiceName
  - IpAddress
falsepositives:
  - A scheduled key/keytab rotation script that touches every SPN in one pass
  - Vulnerability scanners or AD health-check tools that enumerate SPNs as part of their run
  - Legit but sloppy service accounts used to run several different services under one identity
level: high
tags:
  - attack.credential_access
  - attack.t1558.003
```
