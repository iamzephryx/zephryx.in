---
title: 'ADCS ESC8 — NTLM Relay to Certificate Web Enrollment'
ruleId: 'ZPX-D002'
date: '2026-07-24'
techniques: ['T1649', 'T1187', 'T1550.003']
platform: 'Windows'
logsource: 'AD CS · Events 4886/4887 · IIS access logs'
severity: 'critical'
status: 'stable'
tags: ['active-directory', 'adcs', 'ntlm-relay', 'privilege-escalation']
writeup: 'breaching-the-forest-adcs-esc8'
excerpt: 'A machine account enrolling for a certificate through the HTTP endpoint, from an IP that is not its own. Relay leaves a fingerprint in the CA logs that no malleable profile can hide.'
---

## Why this fires

ESC8 is the web enrollment endpoint (`/certsrv/`) accepting NTLM authentication.
An attacker coerces a privileged machine — usually a Domain Controller — into
authenticating to a host they control, relays that authentication to the CA, and
walks away with a certificate for the DC's identity. That certificate is then
good for a TGT, and the TGT is good for everything.

The relay cannot forge the request path. The CA still logs an issuance, and the
requester IP recorded by IIS belongs to the attacker's relay host, not to the
account named in the request. **That mismatch is the detection.**

## The rule

```yaml
title: ADCS Certificate Issued to Machine Account via Web Enrollment
id: b1d9a7f4-5e28-4c60-8f13-7a4c9e2d6b05
status: stable
description: >
  Detects certificate requests fulfilled through the AD CS web enrollment
  interface on behalf of a machine account. Machine accounts normally enroll
  over RPC/DCOM using the machine's own credentials, so an HTTP-borne request
  for a machine identity is a strong indicator of NTLM relay (ESC8).
references:
  - https://attack.mitre.org/techniques/T1649/
  - https://posts.specterops.io/certified-pre-owned-d95910965cd2
author: Zephryx
date: 2026/07/24
tags:
  - attack.credential_access
  - attack.t1649
  - attack.privilege_escalation
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID:
      - 4886   # Certificate Services received a certificate request
      - 4887   # Certificate Services approved and issued a certificate
    Requester|endswith: '$'
  selection_template:
    CertificateTemplate:
      - 'Machine'
      - 'DomainController'
      - 'DomainControllerAuthentication'
      - 'KerberosAuthentication'
  condition: selection and selection_template
fields:
  - Requester
  - CertificateTemplate
  - RequestId
  - SubjectKeyIdentifier
falsepositives:
  - Autoenrollment misconfigured to route through the web interface
  - Certificate lifecycle tooling that proxies enrollment for endpoints
level: critical
```

## Correlate with the web tier

The CA event alone tells you *what* was issued. The IIS log tells you *from
where* — join them on timestamp and requester to expose the relay host:

```kql
let ca = SecurityEvent
    | where EventID in (4886, 4887)
    | where Requester endswith "$"
    | project reqTime = TimeGenerated, Requester, RequestId, CertificateTemplate;
let web = W3CIISLog
    | where csUriStem startswith "/certsrv"
    | where scStatus == 200
    | project webTime = TimeGenerated, cIP, csUsername, csUriStem;
ca
| join kind=inner (web) on $left.Requester == $right.csUsername
| where abs(datetime_diff('second', reqTime, webTime)) <= 5
| extend requesterHost = trim_end("$", Requester)
| project reqTime, Requester, cIP, CertificateTemplate, RequestId
```

Resolve `cIP` against the machine's own A record. If a certificate for
`DC01$` was requested from an address that is not `DC01`, you are looking at a
completed relay — treat it as an active domain compromise, not an alert.

## Hardening beats detecting

This rule exists because the endpoint is still reachable. The durable fixes:

- Enable **Extended Protection for Authentication** on the `/certsrv` site, or
  require HTTPS-only with channel binding.
- Disable NTLM on the CA entirely where the estate allows it.
- Remove the web enrollment role if nothing genuinely uses it.
- Enforce manager approval on any template that permits client authentication
  with a caller-supplied subject.

## What it would have caught

The forest breach in
[the ESC8 writeup](/writeups/breaching-the-forest-adcs-esc8/) ran coercion to
Enterprise Admin in eleven minutes. Event 4887 fired at minute four, naming
`DC01$` as requester with the relay host's IP in the matching IIS line.
