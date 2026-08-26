---
title: 'Possible Golden Ticket - RC4 Service Ticket Issued Against krbtgt'
ruleId: 'ZPX-D017'
date: '2026-08-21'
techniques: ['T1558.001']
platform: 'Windows Server / Active Directory'
logsource: 'Windows Security Event Log · EventID 4769'
severity: 'high'
status: 'experimental'
tags: ['golden-ticket', 'active-directory', 'credential-access', 'kerberos', 'domain-dominance']
writeup: 'ad-killchain-lab'
excerpt: 'The weakest rule in the pack, included anyway because it is better than nothing: a lot of ticket-forging tooling still defaults to RC4 even against domains that should be running AES everywhere.'
---

## Why this fires

Full disclosure, this is the weakest rule in the pack and I'm including it
anyway because it's genuinely better than nothing. A forged TGT built
offline from a stolen `krbtgt` hash gets encrypted with whatever the forging
tool defaults to, and a lot of the popular tooling still defaults to RC4
even against domains running at a functional level that should mean AES
everywhere. So the signal here is narrow and specific: an RC4-encrypted
service ticket request against the `krbtgt` account itself, which shouldn't
be happening at all in a domain that's actually enforcing AES. It will miss
anything forged with an AES-aware tool, and it depends entirely on your
domain having actually killed RC4 already — if you haven't, this rule isn't
worth turning on yet, go do that first, it's worth more than this rule is.

Last rule in the [KillChainSigma](https://github.com/0xZephryx/KillChainSigma)
pack. [The writeup](/writeups/ad-killchain-lab/) has the full chain this
sits at the end of, and what actually fired versus what needed tuning when I
tested it in the lab.

## The rule

```yaml golden-ticket.yml
title: Possible Golden Ticket - RC4 Service Ticket Issued Against krbtgt
id: 9564c141-0ddc-40b4-8885-725a0ae9a431
status: experimental
description: |
  Full disclosure, this is the weakest rule in the pack and I'm including it
  anyway because it's genuinely better than nothing. A forged TGT built
  offline from a stolen krbtgt hash gets encrypted with whatever the forging
  tool defaults to, and a lot of the popular tooling still defaults to RC4
  even against domains running at a functional level that should mean AES
  everywhere. So the signal here is narrow and specific: an RC4-encrypted
  service ticket request against the krbtgt account itself, which shouldn't
  be happening at all in a domain that's actually enforcing AES. It will
  miss anything forged with an AES-aware tool, and it depends entirely on
  your domain having actually killed RC4 already - if you haven't, don't turn
  this rule on yet, go do that first, it's worth more than this rule is.
author: Zephryx
date: 2026-08-21
references:
  - https://attack.mitre.org/techniques/T1558/001/
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: 4769
    ServiceName: krbtgt
    TicketEncryptionType: '0x17'
  condition: selection
falsepositives:
  - Any domain that hasn't disabled RC4 Kerberos encryption yet - this rule assumes you have. Legacy clients (old Linux/Java Kerberos stacks, some embedded devices) that only speak RC4 will also trip it.
level: high
tags:
  - attack.credential_access
  - attack.t1558.001
```
