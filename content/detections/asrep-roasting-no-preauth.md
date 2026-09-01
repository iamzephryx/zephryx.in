---
title: 'AS-REP Roasting - TGT Requested Without Pre-Authentication'
ruleId: 'ZPX-D012'
date: '2026-08-21'
techniques: ['T1558.004']
platform: 'Windows Server / Active Directory'
logsource: 'Windows Security Event Log · EventID 4768'
severity: 'medium'
status: 'stable'
tags: ['asrep-roasting', 'active-directory', 'credential-access', 'kerberos']
writeup: 'ad-killchain-lab'
excerpt: 'An account with Kerberos pre-authentication disabled hands its AS-REP to anyone who asks, no password needed. This one is a much cleaner signal than Kerberoasting — there is almost no legitimate reason for it to fire.'
---

## Why this fires

Kerberos pre-authentication exists specifically so a client has to prove it
knows the account's password before the KDC hands out anything encrypted
with it. Flip "Do not require Kerberos preauthentication" on an account —
usually a leftover from old application compatibility, or just a
misconfigured account nobody revisited — and anyone can request that
account's AS-REP cold, no credentials needed, then crack it offline exactly
like a Kerberoast hash.

This is a cleaner signal than Kerberoasting. There's very little legitimate
reason for `PreAuthType 0` to show up at all in a modern domain, which is
what makes this rule worth running at `stable` rather than `test`.

Second rule in the [KillChainSigma](https://github.com/iamzephryx/KillChainSigma)
pack — see [the full writeup](/writeups/ad-killchain-lab/) for where this
sits in the chain.

## The rule

```yaml asrep-roasting.yml
title: AS-REP Roasting - TGT Requested Without Pre-Authentication
id: b09cb260-ce2f-4ded-8fb7-88b49fa84fc9
status: stable
description: |
  Kerberos pre-authentication exists specifically so a client has to prove it
  knows the account's password before the KDC hands out anything encrypted
  with it. Flip "Do not require Kerberos preauthentication" on an account
  (old habit from legacy app compat, or just a misconfigured account nobody
  revisited) and anyone can request that account's AS-REP cold, no
  credentials needed, then crack it offline exactly like a Kerberoast hash.
  This one is a much cleaner signal than Kerberoasting - there's very little
  legitimate reason for PreAuthType 0 to show up at all in a modern domain.
author: Zephryx
date: 2026-08-21
references:
  - https://attack.mitre.org/techniques/T1558/004/
  - https://github.com/GhostPack/Rubeus
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: 4768
    PreAuthType: '0'
  condition: selection
falsepositives:
  - A handful of legacy service accounts still configured this way for old Kerberos clients that never got pre-auth support. Should be a short, known list - inventory it once and exclude by name rather than leaving this rule noisy.
level: medium
tags:
  - attack.credential_access
  - attack.t1558.004
```
