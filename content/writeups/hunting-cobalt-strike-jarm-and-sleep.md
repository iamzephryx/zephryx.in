---
title: 'Hunting Cobalt Strike: JARM, Sleep Masks and Named Pipes'
date: '2026-06-14'
category: 'Detection'
difficulty: 'Medium'
featured: true
techniques: ['T1071.001', 'T1573.001', 'T1090', 'T1055']
tags: ['threat-hunting', 'cobalt-strike', 'c2', 'sigma', 'edr']
excerpt: 'Wearing the defender hat: three independent, high-signal ways to surface Cobalt Strike beacons that survive malleable C2 profiles and sleep-mask evasion.'
---

Red teamers love Cobalt Strike; so do real adversaries. The good news for the
blue side is that even a well-tuned malleable profile leaves fingerprints across
the network, the host and memory. Here are three hunts I run that do not depend
on a single brittle IOC.

## 1. Network: JARM and default ports

JARM actively fingerprints a TLS server by sending ten crafted `ClientHello`
packets and hashing the responses. A default Cobalt Strike team server has a
well-known JARM hash.

```bash
python3 jarm.py c2.suspicious.example
# 07d14d16d21d21d07c42d41d00041d24a458a375eef0c576d23a7bab9a9fb1
```

Do not block on JARM alone — mature operators randomise it. Use it to *rank*
candidates, then confirm with behaviour.

## 2. Host: named-pipe naming conventions

Beacon's SMB and post-ex jobs create named pipes. Default and lazily-modified
profiles reuse recognisable patterns. This Sigma rule catches the common ones:

```yaml
title: Suspicious Cobalt Strike Named Pipe
logsource:
  product: windows
  category: pipe_created
detection:
  selection:
    PipeName|re: '\\(msagent_|status_|postex_|MSSE-|\d{4}\.\d{3})'
  condition: selection
level: high
tags:
  - attack.command_and_control
  - attack.t1071
```

## 3. Memory: the sleep mask gap

Modern beacons encrypt their own memory while sleeping and decrypt to act. That
means a periodic memory scan will *sometimes* catch a plaintext beacon config —
but the more reliable tell is the **RWX or freshly-`VirtualProtect`-ed private
memory region** that has no backing file.

```text
# Signals that correlate strongly with a sleeping beacon
- Private (MEM_PRIVATE) committed region, RX, not image-backed
- Periodic thread wake on a fixed jitter interval (e.g. 60s ± 37%)
- Small (~5-6 byte) trampoline at the wake site
```

Hunt for the *timing*: a process that makes an outbound TLS connection on a
suspiciously regular cadence, from a thread that spends most of its life blocked,
is beacon-shaped regardless of the profile.

## Putting it together

No single one of these is proof. Together they form a funnel:

1. **JARM + rare destination** narrows the network to a handful of candidates.
2. **Named-pipe / process-injection telemetry** ties a candidate to a host.
3. **Memory characteristics + beacon cadence** confirm.

The lesson cuts both ways. As an operator I now tune every profile against these
exact hunts before an engagement. As a hunter, I assume the operator has done
the same — which is why I never rely on one indicator.
