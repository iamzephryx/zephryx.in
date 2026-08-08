---
title: 'Indirect Syscalls — Unbacked Return Addresses in the Call Stack'
ruleId: 'ZPX-D005'
date: '2026-04-20'
techniques: ['T1055', 'T1106', 'T1620']
platform: 'Windows'
logsource: 'EDR telemetry · ETW ThreadStackWalk · Sysmon 8/10'
severity: 'high'
status: 'test'
tags: ['maldev', 'edr', 'evasion', 'endpoint']
writeup: 'edr-evasion-indirect-syscalls'
excerpt: 'Indirect syscalls fix the return address so the stack looks like it came from ntdll. It does not fix where the shellcode itself lives.'
---

## Why this fires

Direct syscalls got caught because the return address on the stack pointed into
the payload's own memory instead of `ntdll.dll` — a trivially anomalous stack.
Indirect syscalls solve that by jumping to a real `syscall` instruction inside
`ntdll`, so the return address lands where a sensor expects it.

What indirect syscalls do **not** solve is provenance. The shellcode that
orchestrated the call still lives in memory that is not backed by any file on
disk. Walk the stack past the first frame and the private, `RX` region gives it
away.

> This rule is `status: test` on purpose. It is high-signal but sensor-dependent
> — validate stack-walk fidelity in your own estate before promoting it.

## The rule

```yaml
title: Unbacked Memory in Call Stack of Sensitive Native API
id: 4e17b9c8-2d3a-40f5-9b81-6c05af73e2d1
status: experimental
description: >
  Detects invocation of sensitive native APIs where the call stack contains a
  return address in private, unbacked memory. Indirect syscall techniques
  normalise the immediate return address but cannot relocate the calling
  shellcode into a file-backed region.
references:
  - https://attack.mitre.org/techniques/T1055/
  - https://attack.mitre.org/techniques/T1620/
author: Zephryx
date: 2026/04/20
tags:
  - attack.defense_evasion
  - attack.t1055
  - attack.t1106
  - attack.t1620
logsource:
  product: windows
  category: process_access
detection:
  selection_stack:
    CallTrace|contains:
      - 'UNKNOWN'
      - 'unbacked'
  selection_target:
    TargetImage|endswith:
      - '\lsass.exe'
      - '\explorer.exe'
      - '\svchost.exe'
      - '\RuntimeBroker.exe'
  filter_jit:
    SourceImage|endswith:
      - '\devenv.exe'
      - '\node.exe'
      - '\java.exe'
      - '\javaw.exe'
      - '\dotnet.exe'
      - '\powershell.exe'
      - '\chrome.exe'
      - '\msedge.exe'
  condition: selection_stack and selection_target and not filter_jit
fields:
  - SourceImage
  - TargetImage
  - CallTrace
  - GrantedAccess
falsepositives:
  - JIT compilers (.NET, JVM, V8) legitimately execute unbacked code
  - Packed but benign commercial software
  - Sensors with incomplete stack-unwinding on optimised frames
level: high
```

## The stronger signal: syscall stub mismatch

Stack heuristics degrade. A more durable check compares the address of the
`syscall` instruction against the loaded `ntdll` module range, and flags the case
where a thread's start address is unbacked entirely:

```sql
DeviceEvents
| where ActionType in ("ProcessAccess", "CreateRemoteThread")
| extend stack = parse_json(AdditionalFields).CallTrace
| where stack has "UNKNOWN"
| join kind=leftouter (
    DeviceImageLoadEvents
    | where FileName =~ "ntdll.dll"
    | project DeviceId, ntdllBase = tostring(AdditionalFields.ImageBase)
  ) on DeviceId
| extend unbackedFrames = countof(tostring(stack), "UNKNOWN")
| where unbackedFrames >= 2
| project Timestamp, DeviceName, InitiatingProcessFileName, unbackedFrames, stack
```

## Tuning notes

- Require **two or more** unbacked frames. A single `UNKNOWN` is usually an
  unwinding artefact; a chain of them is a payload.
- Exclude JIT hosts by full path and treat that exclusion as an attack surface —
  `powershell.exe` on the allowlist is exactly where an operator will hide.
- Complement this with module-stomping detection. An operator who reads this
  rule will move the shellcode into a hollowed, file-backed section next, and
  then the call stack looks perfect.

## The honest limitation

I wrote [the offensive side of this](/writeups/edr-evasion-indirect-syscalls/)
first. This rule catches the technique as commonly implemented, not the
technique as it could be implemented. Anyone willing to stomp a legitimate
module and forge a full synthetic stack walks past it — and that is the next
rule to write, not a reason to skip this one.
