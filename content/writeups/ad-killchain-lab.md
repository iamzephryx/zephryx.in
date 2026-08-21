---
title: 'Building Detections for a Full AD Kill Chain, Not Just One Technique'
date: '2026-08-21'
category: 'Detection'
difficulty: 'Hard'
techniques: ['T1558.003', 'T1558.004', 'T1550.002', 'T1021.002', 'T1047', 'T1003.006', 'T1558.001']
tags: ['active-directory', 'kerberos', 'lateral-movement', 'dcsync', 'sigma', 'detection-engineering', 'purple-team']
excerpt: 'Every detection I had written up to this point covered one technique in isolation. So I built a small AD lab, ran a full attack chain end to end — Kerberoasting through Golden Ticket — and wrote the seven rules that actually catch each stage.'
---

Every detection on this site so far has been a response to one specific
thing — one alert, one technique, one investigation. That's honest work, but
it's also not how a real intrusion looks. A real attacker doesn't stop at
Kerberoasting. They crack the hash, use it to move laterally, and if the
domain lets them, they end up running DCSync against a domain controller
before anyone's noticed. So instead of writing one more one-off rule, I
wanted to build the detections for an entire chain and prove each stage
actually leaves the log entry I expected it to.

I spun up a small lab — one domain controller, two domain-joined member
servers, a handful of user accounts seeded with the usual real-world
misconfigurations (an SPN-heavy service account, one account with Kerberos
pre-auth disabled that nobody remembers why). Then I ran the chain against
it exactly the way an attacker would, stage by stage, and watched what
showed up in the Windows Security log at each step.

The seven rules that came out of this are published as a pack —
**[KillChainSigma](https://github.com/zephryxsec/KillChainSigma)** — instead
of being scattered here one at a time. This post is the walkthrough behind
them.

## Stage 1: Credential access

### Kerberoasting

Any authenticated domain account can request a service ticket for any SPN in
the domain — that's normal Kerberos behaviour, not a misconfiguration. The
attack is asking for tickets encrypted with RC4 specifically, because that's
what's crackable offline.

```bash
GetUserSPNs.py lab.local/j.patel:'Winter2025!' -dc-ip 10.10.10.10 -request
```

Every request like this generates a **4769** on the DC with
`TicketEncryptionType 0x17`. One or two of those a day is nothing. A single
account pulling eight or more in a five-minute window is a wordlist, not a
workday — that's rule 1,
[`kerberoasting.yml`](https://github.com/zephryxsec/KillChainSigma/blob/main/rules/1-credential-access/kerberoasting.yml).

### AS-REP roasting

One of the seeded accounts had "Do not require Kerberos preauthentication"
set — a leftover from an old application integration, the kind of thing that
survives in real domains for years because nobody's job is to go looking for
it.

```bash
GetNPUsers.py lab.local/ -usersfile users.txt -dc-ip 10.10.10.10 -format hashcat
```

This one's a cleaner signal than Kerberoasting. A **4768** with
`PreAuthType 0` has almost no legitimate reason to exist in a modern domain,
which is exactly what rule 2,
[`asrep-roasting.yml`](https://github.com/zephryxsec/KillChainSigma/blob/main/rules/1-credential-access/asrep-roasting.yml),
looks for.

Cracked both hashes offline with `hashcat` against a wordlist within a few
minutes — neither password would survive a real password policy, but plenty
of real domains still don't enforce one.

## Stage 2: Lateral movement

With one set of working credentials, the next question is how far they
reach.

### Pass-the-hash

```bash
impacket-wmiexec -hashes :b9f2321a5c3c0c9c8e1f5e3f8a1b2c3d lab.local/j.patel@10.10.10.20
```

This produces a **4624** with `LogonType 3` and `AuthenticationPackageName
NTLM` on the target member server. On its own this is weak — plenty of
legitimate things generate NTLM logons — which is exactly what rule 3,
[`pass-the-hash.yml`](https://github.com/zephryxsec/KillChainSigma/blob/main/rules/2-lateral-movement/pass-the-hash.yml),
says about itself. It's included because it's a real signal once you've
baselined your own environment, not because it's reliable out of the box.

### Remote service creation

```bash
impacket-psexec j.patel@10.10.10.20 -hashes :b9f2321a5c3c0c9c8e1f5e3f8a1b2c3d
```

Drops a binary over `ADMIN$`, registers it as a service, runs it. Shows up
as a **7045** in the System log with the service file path pointing straight
into `ADMIN$` — rule 4,
[`remote-service-creation.yml`](https://github.com/zephryxsec/KillChainSigma/blob/main/rules/2-lateral-movement/remote-service-creation.yml).

### WMI execution

```bash
impacket-wmiexec j.patel@10.10.10.20 -hashes :b9f2321a5c3c0c9c8e1f5e3f8a1b2c3d
```

Same idea, different primitive — no service install this time, so no 7045.
Instead, whatever gets run shows up as a child process of `WmiPrvSE.exe` in
Sysmon Event ID 1. Almost nothing legitimate spawns `cmd.exe` under the WMI
provider host outside of actual management tooling, which is rule 5,
[`wmi-execution.yml`](https://github.com/zephryxsec/KillChainSigma/blob/main/rules/2-lateral-movement/wmi-execution.yml).

## Stage 3: Domain dominance

This is where a foothold turns into "game over."

### DCSync

```bash
secretsdump.py -just-dc-user krbtgt lab.local/j.patel@10.10.10.10 -hashes :b9f2321a5c3c0c9c8e1f5e3f8a1b2c3d
```

`secretsdump.py -just-dc` (and `mimikatz`'s `lsadump::dcsync` behind it) asks
a domain controller for the same **DS-Replication-Get-Changes** and
**DS-Replication-Get-Changes-All** extended rights that DCs use to replicate
with each other — except this request comes from a member server, not
another DC. That shows up as a **4662** with both rights' GUIDs in the
`Properties` field, and the requesting account isn't a computer account
ending in `$`. That combination is rule 6,
[`dcsync.yml`](https://github.com/zephryxsec/KillChainSigma/blob/main/rules/3-domain-dominance/dcsync.yml)
— the one rule in this whole pack I'd trust to actually page someone. There's
no ambiguity in what it means once you've excluded your real DCs and any
legitimate sync accounts (Azure AD Connect being the one everybody forgets
to exclude the first time this rule goes live).

Once the `krbtgt` hash is out, everything downstream of it is over.

### Golden ticket

```bash
mimikatz "kerberos::golden /user:anyone /domain:lab.local /sid:S-1-5-21-... /krbtgt:9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c /ticket:golden.kirbi" exit
```

A forged TGT built this way gets used directly, no matching TGT request ever
having actually happened on a DC. The detail worth catching: a lot of
forging tooling still defaults to RC4 encryption for the ticket even when a
domain's functional level should mean AES everywhere. Rule 7,
[`golden-ticket.yml`](https://github.com/zephryxsec/KillChainSigma/blob/main/rules/3-domain-dominance/golden-ticket.yml),
flags exactly that — an RC4-encrypted service ticket against `krbtgt`
itself. I'm upfront in the rule description that this is the weakest
detection in the pack: it misses anything forged with AES-aware tooling, and
it's useless if your domain hasn't disabled RC4 already. Still worth having,
because "weak signal" beats "no signal" for the stage that actually matters
most.

## What actually fired, and what didn't

Every stage produced its expected event on the first run, which was
reassuring but not the whole story. Two things surprised me:

1. **Audit policy is not on by default.** Rules 1 and 2 depend on "Audit
   Kerberos Service Ticket Operations" and "Audit Kerberos Authentication
   Service" being explicitly turned on. My lab DC didn't have either enabled
   out of the box — I got total silence on the first Kerberoasting run and
   spent a confused ten minutes assuming my Sigma logic was wrong before
   checking the actual audit policy. It wasn't the rule. It was the log
   source.
2. **The pass-the-hash rule is genuinely noisy.** Even in a clean two-host
   lab with nothing else running, I got NTLM logon events I hadn't
   accounted for from a scheduled task. In a real domain with hundreds of
   hosts, this rule needs real tuning before it's worth anything above `low`
   severity — which is exactly why it ships at `low` in the pack, not `high`.

## Why publish the whole chain together instead of one rule at a time

A single Kerberoasting rule tells a defender "someone might be roasting
tickets." Reading all seven together tells a much more useful story: here is
what each stage of a real compromise looks like end to end, in order, and
here's exactly where in that chain you still have a chance to catch it if
you missed the stage before. DCSync is the rule that matters most, but it's
also the last chance — everything before it exists so you don't have to
depend on catching that one alone.

The full rule pack, with usage notes and the audit-policy prerequisites for
each rule, is here: **[KillChainSigma](https://github.com/zephryxsec/KillChainSigma)**.
