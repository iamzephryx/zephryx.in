---
title: 'Cobalt Strike Beaconing — Jitter Regularity and Default Named Pipes'
ruleId: 'ZPX-D006'
date: '2026-06-16'
techniques: ['T1071.001', 'T1573.001', 'T1090']
platform: 'Network / Windows'
logsource: 'Zeek conn.log · Proxy logs · Sysmon 17/18'
severity: 'high'
status: 'stable'
tags: ['threat-hunting', 'c2', 'cobalt-strike', 'network']
writeup: 'hunting-cobalt-strike-jarm-and-sleep'
excerpt: 'Jitter makes a beacon look irregular to a human and perfectly regular to statistics. Two independent angles: the callback distribution and the pipe it forgot to rename.'
---

## Why this fires

A malleable C2 profile can rewrite every HTTP header, URI and body a beacon
emits. What it cannot rewrite is the *shape* of the traffic. Sleep with jitter
produces callbacks drawn from a narrow uniform distribution around the sleep
interval — irregular enough to defeat a fixed-interval rule, far too regular to
be a human driving a browser.

The second angle is cheaper and even higher signal: post-exploitation modules
open named pipes, and a surprising share of real intrusions never change the
default pipe names.

## Rule A — default named pipes

```yaml
title: Cobalt Strike Default Named Pipe Creation
id: c73f81b0-4a96-4d27-8e5c-0b1927dfa364
status: stable
description: >
  Detects creation of named pipes matching Cobalt Strike default and
  commonly-observed patterns used by SMB beacons and post-exploitation modules.
references:
  - https://attack.mitre.org/techniques/T1071/001/
author: Zephryx
date: 2026/06/16
tags:
  - attack.command_and_control
  - attack.t1071.001
  - attack.lateral_movement
logsource:
  product: windows
  category: pipe_created
detection:
  selection:
    PipeName|startswith:
      - '\msagent_'
      - '\MSSE-'
      - '\postex_'
      - '\postex_ssh_'
      - '\status_'
      - '\mojo_'
      - '\wkssvc_'
  condition: selection
fields:
  - Image
  - PipeName
  - ProcessId
falsepositives:
  - Chromium-derived browsers use mojo_ pipes with numeric suffixes
  - Some legitimate remote-management agents use similar naming
level: high
```

Tighten `\mojo_` with a browser-path exclusion before deploying — Chrome and
Edge generate these constantly, and an untuned rule here will bury the analyst.

## Rule B — beacon periodicity

Named-pipe detection catches the careless operator. Periodicity catches the
careful one. Score each internal-to-external destination pair on how tightly its
callback intervals cluster:

```kql
let window = 24h;
let minCallbacks = 20;
CommonSecurityLog
| where TimeGenerated > ago(window)
| where DeviceAction != "blocked" and isnotempty(DestinationIP)
| where not(ipv4_is_private(DestinationIP))
| sort by SourceIP asc, DestinationIP asc, TimeGenerated asc
| extend prev = prev(TimeGenerated), prevSrc = prev(SourceIP), prevDst = prev(DestinationIP)
| where SourceIP == prevSrc and DestinationIP == prevDst
| extend delta = datetime_diff('second', TimeGenerated, prev)
| where delta between (5 .. 3600)
| summarize callbacks = count(),
            meanDelta = avg(delta),
            stdevDelta = stdev(delta),
            bytesOut = sum(SentBytes)
    by SourceIP, DestinationIP, DestinationHostName
| where callbacks >= minCallbacks
// coefficient of variation: jittered beacons cluster tightly, humans do not
| extend cv = stdevDelta / meanDelta
| where cv < 0.35
| order by cv asc
```

A coefficient of variation below `0.35` corresponds roughly to Cobalt Strike's
default 37% jitter. Genuine user-driven traffic to a single destination almost
never scores that low over twenty-plus callbacks.

## Tuning notes

- Exclude by *destination category*, not by IP. Software update endpoints,
  telemetry and SaaS keepalives are the top false positives and they all move
  addresses.
- Beacons that sleep longer than an hour fall outside the `delta` bound above.
  Run a second pass with a 7-day window and a `3600 .. 86400` bound for the
  low-and-slow tier.
- JARM fingerprinting of the destination is a useful *enrichment*, not a
  detection — team servers behind a redirector inherit the redirector's TLS
  stack and the fingerprint disappears.

## Where this came from

The full hunt methodology, including the sleep-mask memory angle, is in
[Hunting Cobalt Strike](/writeups/hunting-cobalt-strike-jarm-and-sleep/).
