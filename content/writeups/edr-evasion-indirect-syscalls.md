---
title: 'Notes on EDR Evasion: Indirect Syscalls Without the Hype'
date: '2026-04-18'
category: 'Research'
difficulty: 'Insane'
featured: true
techniques: ['T1106', 'T1055', 'T1620', 'T1562.001']
tags: ['maldev', 'edr', 'syscalls', 'evasion', 'windows-internals']
excerpt: 'Why direct syscalls got caught, how indirect syscalls restore a clean call stack, and the detections that still see through both.'
---

Userland EDR hooks live in `ntdll.dll`. The whole cat-and-mouse game of the last
few years is about how you reach the kernel without tripping those hooks — and
how defenders catch you doing it anyway.

## Why unhooked direct syscalls got caught

The first wave was **direct syscalls**: copy the `syscall` stub into your own
memory, skip the hooked `ntdll` export entirely. It worked, briefly. Then EDRs
started walking the call stack at the kernel boundary and asking a simple
question:

> Did this `syscall` instruction originate from inside `ntdll.dll`?

A direct syscall answers "no" — the return address points into your payload's
private memory, not into a legitimate module. That is a screaming anomaly.

## Indirect syscalls: borrow ntdll's stub

Indirect syscalls fix the call-stack tell. Instead of executing the `syscall`
instruction yourself, you resolve the syscall number, then **jump to a real
`syscall; ret` gadget that already exists inside `ntdll`**. Now the return
address at the kernel boundary points back into a legitimate module. The stack
looks clean.

```nasm
; SSN resolved dynamically at runtime into eax
mov    r10, rcx
mov    eax, <ssn>
jmp    qword ptr [ntdll_syscall_gadget]   ; syscall lives in ntdll, not here
```

The syscall number itself should never be hardcoded — those shift between
Windows builds. Resolve it at runtime by sorting the `Zw*` stubs by address
(the "Hell's Gate / Halo's Gate" family of techniques) so a hooked stub does
not poison the number.

## What still catches you

Indirect syscalls defeat naive stack-origin checks, but they are not magic:

- **Kernel callbacks** (`PsSetCreateProcessNotifyRoutine`,
  `ObRegisterCallbacks`) fire from the kernel side, below anything you did in
  userland. A userland trick cannot hide the *effect* of the action.
- **Stack-walking that validates the whole frame chain**, not just the top
  return address, notices a `jmp` gadget being used as a call target with a
  mismatched frame.
- **ETW-Ti (Threat-Intelligence provider)** reports sensitive operations —
  memory protection changes, remote thread creation — straight from the kernel.
  Your clean stack does not matter if the operation itself is reported.
- **Time-of-check anomalies**: a process that resolves dozens of syscall numbers
  by walking `ntdll` exports at startup is itself a behavioural signal.

## The honest conclusion

Evasion buys time, not invisibility. Every userland technique eventually meets a
kernel-side sensor it cannot reach. As an operator I treat evasion as a way to
control *when* I am detected, not *whether*. As a defender I stopped chasing the
userland hook game and invested in kernel telemetry and behavioural correlation —
which is exactly where these techniques run out of road.
