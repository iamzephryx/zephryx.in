---
title: 'FortiGate Admin Password Spray From Rotating Source IPs'
ruleId: 'ZPX-D010'
date: '2026-08-16'
techniques: ['T1110.003', 'T1133']
platform: 'Fortinet FortiGate'
logsource: 'FortiOS event log · logid 0100032001/0100032002'
severity: 'high'
status: 'test'
tags: ['password-spray', 'fortinet', 'credential-access', 'perimeter', 'soc']
writeup: 'fortigate-password-spray-investigation'
excerpt: 'Counting failed admin logins per source IP misses the attack entirely — the whole point of a spray is that no single IP looks busy. Count distinct sources against one account, then go looking for the success you did not expect.'
---

## Why this fires

A password spray inverts the shape a brute-force rule expects. One IP trying a
thousand passwords is trivially rate-limited and trivially detected. Nineteen
IPs trying one password each against the same admin account produce nothing
interesting per source — a couple of failures, well under any lockout
threshold — and only look like an attack when you pivot the count onto the
*account* and measure the **cardinality of the sources** instead of the volume
of the attempts.

That is the rule below. It is also, deliberately, only half the detection. The
other half is the part the
[investigation this came from](/writeups/fortigate-password-spray-investigation/)
showed most analysts skip: a spray that works does not announce itself from a
sprayed IP. It goes quiet, and the successful login arrives later from
somewhere clean.

## The rule

Sigma correlation, because the signal lives in the aggregate and not in any
single event:

```yaml
title: FortiGate Admin Login Failures - Base Event
id: 3c9a1f47-6e02-4b58-9d71-8a4c25e0f6b3
status: test
description: >
  Failed administrative authentication against a FortiGate management
  interface. Low value alone; consumed by the correlation rule below.
references:
  - https://attack.mitre.org/techniques/T1110/003/
author: Zephryx
date: 2026/08/16
name: fortigate_admin_login_failed
tags:
  - attack.credential_access
  - attack.t1110.003
logsource:
  product: fortinet
  service: fortios
detection:
  selection:
    logid: '0100032002'
    action: 'login'
    status: 'failed'
  condition: selection
fields:
  - user
  - srcip
  - dstip
  - method
  - reason
level: informational
---
title: FortiGate Admin Password Spray From Rotating Source IPs
id: b71d4e08-5a3c-47f9-8c2e-1d6f09b4a7e5
status: test
description: >
  One administrative account drawing failed logins from an unusual number of
  distinct source addresses inside a short window. Sprays keep per-source
  volume low to stay under lockout thresholds, so distinct-source cardinality
  is the discriminator, not attempt count.
correlation:
  type: value_count
  rules:
    - fortigate_admin_login_failed
  group-by:
    - user
    - dstip
  timespan: 30m
  condition:
    field: srcip
    gte: 11
falsepositives:
  - A single administrator behind a rotating carrier-grade NAT or a mobile
    network, repeatedly mistyping a password
  - Monitoring or configuration-management tooling with stale credentials,
    running from an autoscaled pool
  - A shared break-glass account used by a team from many home connections
level: high
```

### On `gte: 11`, and why that digit matters

The vendor rule this replaced was described as firing when unique IPs go
**above 10** within 30 minutes. Rebuilt by hand against real timestamps, one of
the two bursts in the source investigation reached exactly 10 distinct sources
and never crossed it — yet the alert fired anyway.

I could not prove why, and I am not going to pretend otherwise. What I took
from it is that "more than 10" and `>= 10` are one keystroke apart in an
implementation and produce alerts nobody can defend in a report. So this rule
says `gte: 11` and means it: eleven distinct sources, verifiable by counting.
If you would rather have the recall, move it to `gte: 8` deliberately and write
down that you did — but do not leave the boundary ambiguous, because the first
person to audit the alert will land exactly where I landed.

## Threshold companion

For SIEMs without Sigma correlation support, the same logic as a scheduled
query:

```kql fortigate-spray-threshold.kql
FortiGateEvent
| where logid == "0100032002" and action == "login" and status == "failed"
| summarize
    sources    = dcount(srcip),
    attempts   = count(),
    src_sample = make_set(srcip, 25),
    first_seen = min(TimeGenerated),
    last_seen  = max(TimeGenerated)
    by user, dstip, bin(TimeGenerated, 30m)
| where sources >= 11
| extend attempts_per_source = round(todouble(attempts) / sources, 2)
| order by sources desc
```

`attempts_per_source` is worth keeping in the output. A spray sits near 1.0 —
that ratio *is* the technique. Anything north of about 5 is a conventional
brute force wearing a few proxies, which is a different rule and a different
response.

## The half nobody writes: did it work?

Firing on the spray is the easy part. The investigation's actual finding came
from two follow-up queries, and both belong in the runbook attached to this
rule rather than in an analyst's memory.

**1. Look for success with no source filter.** The instinct is to check
whether any of the sprayed IPs later logged in successfully. That check is
close to worthless: an attacker who guesses the password mid-spray has no
reason to reuse a burned address. Drop the source constraint entirely and widen
the window well past the alert.

```kql fortigate-spray-success-unfiltered.kql
FortiGateEvent
| where logid == "0100032001" and action == "login" and status == "success"
| where user == "<sprayed_account>" and dstip == "<sprayed_interface>"
| where TimeGenerated between (ago(14d) .. now())
| project TimeGenerated, user, srcip, dstip, method, ui
| order by TimeGenerated asc
```

**2. Prove the zero means something.** A clean result from a source that
cannot log success is not evidence, it is a blind spot wearing evidence's
clothes. Before trusting an empty table, confirm the pipeline can produce a
positive at all — same event, every filter removed:

```kql fortigate-admin-login-baseline.kql
FortiGateEvent
| where logid == "0100032001" and action == "login" and status == "success"
| where TimeGenerated > ago(7d)
| summarize logins = count() by user, srcip, dstip
| order by logins desc
```

If that returns rows, the earlier zero is a finding. If it returns nothing,
you have discovered that successful admin authentication is not being logged,
which is a bigger problem than the spray and should be raised as its own
ticket.

## The exposure check this rule keeps surfacing

Run query 2 and read the `dstip` column rather than the counts. In the source
investigation every legitimate administrative login over a full week arrived
from an internal source and landed on an internal management address — never
once on the public interface that the nineteen external IPs were hammering.

That inverts the whole finding. The spray failing was never the story; a
management interface exposed to the internet and used by nobody legitimate
was. It is worth standing that up as a low-noise rule of its own, because it
fires on the exposure rather than on somebody attacking it:

```kql fortigate-external-admin-login.kql
FortiGateEvent
| where logid == "0100032001" and action == "login" and status == "success"
| where not(ipv4_is_private(srcip))
| project TimeGenerated, user, srcip, dstip, method, ui
```

In an estate where administration happens over VPN or from a jump host, that
query should return nothing, forever. A single row is either a genuine
emergency access — which should be documented — or the successful end of a
spray somebody already closed the ticket on. This is the `T1133` half of the
mapping above: the technique here is not the guessing, it is the reachable
management service that made guessing worth attempting.

## Tuning notes

- **Group by `dstip`, not just `user`.** A firewall estate shares admin account
  names across appliances. Without the destination in the grouping key, one
  spray across many devices merges into one alert and a slow spray against a
  single device hides underneath it.
- **Do not exclude noisy source IPs.** The instinct to filter a chatty scanner
  address is how you blind the cardinality count — the whole rule is built on
  distinct sources, so every exclusion lowers the number you are thresholding.
  Filter on `user` or `dstip` when you must; never on `srcip`.
- **Group the sources by network block when triaging.** Nineteen addresses that
  collapse into three or four blocks is one actor on rented infrastructure.
  Nineteen unrelated blocks is background internet noise that happened to
  cluster. The count alone does not distinguish them; the ownership does.
- **Verify the logids against your FortiOS version.** `0100032001` /
  `0100032002` are the admin login success/failure pair in the versions I have
  worked with, but this family has moved between releases. Confirm against a
  known-good login before deploying, and prefer matching on
  `action`/`status` alongside the id rather than on the id alone.

## What it would have caught

The alert that started
[this investigation](/writeups/fortigate-password-spray-investigation/) fired
twice on 23 failed logins from 19 distinct addresses against a single admin
account. The correlation rule above catches the second burst cleanly at eleven
distinct sources; on the first burst it stays silent at ten, which is the
honest outcome and the reason the threshold is written the way it is.

The queries underneath it are the ones that mattered. They are what turned
"attempted, not successful, closing" into a documented exposure finding.
