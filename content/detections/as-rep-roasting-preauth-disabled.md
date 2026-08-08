---
title: 'AS-REP Roasting — Pre-Authentication Disabled Accounts'
ruleId: 'ZPX-D008'
date: '2026-06-04'
techniques: ['T1558.004']
platform: 'Windows'
logsource: 'Windows Security · Event 4768'
severity: 'medium'
status: 'stable'
tags: ['active-directory', 'kerberos', 'credential-access']
writeup: 'htb-blackfield-ctf-writeup'
excerpt: 'No password needed, no failed logon logged. Any account with pre-auth disabled will hand its encrypted TGT blob to a total stranger.'
---

## Why this fires

Kerberos pre-authentication proves you know the password *before* the KDC issues
anything. Turn it off — `DONT_REQ_PREAUTH` on the account — and the KDC will
return an AS-REP encrypted with a key derived from that password to anyone who
asks, including an unauthenticated attacker with only a username.

That blob cracks offline exactly like a Kerberoast ticket, and the request
generates no failed-logon noise at all. It is the quietest credential-access
technique in Active Directory.

## The rule

```yaml
title: AS-REP Roasting - Ticket Requested Without Pre-Authentication
id: 8d61f0a5-3b24-4e79-95c8-4f27ab0d61e3
status: stable
description: >
  Detects AS-REQ activity for accounts with Kerberos pre-authentication
  disabled, where the returned AS-REP is crackable offline. RC4 encryption
  indicates deliberate downgrade by roasting tooling.
references:
  - https://attack.mitre.org/techniques/T1558/004/
author: Zephryx
date: 2026/06/04
tags:
  - attack.credential_access
  - attack.t1558.004
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: 4768
    PreAuthType: '0'
    TicketEncryptionType:
      - '0x17'   # RC4-HMAC
      - '0x18'   # RC4-HMAC-EXP
  filter_machine:
    TargetUserName|endswith: '$'
  condition: selection and not filter_machine
fields:
  - TargetUserName
  - IpAddress
  - TicketEncryptionType
falsepositives:
  - Accounts intentionally configured for legacy Unix/Kerberos interop
  - Smart-card-only accounts in some configurations
level: medium
```

## The better control is a query, not an alert

This rule tells you roasting happened. A weekly inventory tells you whether it
*could*, which is the more useful artefact:

```powershell
Get-ADUser -Filter { DoesNotRequirePreAuth -eq $true } -Properties `
    DoesNotRequirePreAuth, PasswordLastSet, LastLogonDate, MemberOf |
  Select-Object SamAccountName, PasswordLastSet, LastLogonDate,
                @{ n = 'Groups'; e = { ($_.MemberOf -join '; ') } } |
  Sort-Object PasswordLastSet
```

Every row is an account whose password can be attacked offline by anyone who
learns its name. Sorted by `PasswordLastSet`, the top of that list is your
actual risk — old password, weak by definition of its era, still roastable.

## Tuning notes

- Alert on the flag being *set*, too. Event 4738 with
  `'Don't Require Preauth' - Enabled` is a legitimate change in almost no
  estate, and it is a tidy persistence primitive for an attacker with write
  access to a user object.
- Requests for several pre-auth-disabled accounts from one source in a short
  window are an enumeration sweep, not an interop client. Add the same
  distinct-count threshold used in the Kerberoasting rule.
- Fix the root cause: there is usually no remaining reason for the flag, and
  clearing it removes the technique entirely.

## What it would have caught

AS-REP roasting is the opening move in
[the Blackfield chain](/writeups/htb-blackfield-ctf-writeup/) — null-session
enumeration to build a user list, then a roast against every name in it. This
rule fires on the first crackable AS-REP, before the offline crack ever starts.
