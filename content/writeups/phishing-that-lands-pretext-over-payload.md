---
title: 'Phishing That Lands: Pretext Over Payload'
date: '2026-03-09'
category: 'Tradecraft'
difficulty: 'Medium'
featured: false
techniques: ['T1583.001', 'T1566.001', 'T1566.002', 'T1204.002', 'T1059.001']
tags: ['social-engineering', 'phishing', 'initial-access', 'opsec']
excerpt: 'The best initial-access campaigns I have run barely touched malware. Here is how pretext, timing and infrastructure hygiene beat clever payloads.'
---

Junior operators obsess over payloads. After enough engagements you learn the
uncomfortable truth: **the payload is the least interesting part of a phishing
campaign.** Delivery and pretext decide whether you get a single click.

## Infrastructure that survives triage

A domain registered yesterday, with no history and a default TLS cert, dies in
the first automated scan. Build infrastructure that looks lived-in:

- **Aged or categorised domains.** Register early, park a benign site, let it
  gain a reputation category before the campaign.
- **Proper email auth.** SPF, DKIM and DMARC all aligned. Ironically, attackers
  who configure email authentication *correctly* land in more inboxes than
  sloppy ones.
- **Redirectors, not origins.** The victim never talks to your real infra. A CDN
  or a disposable redirector fronts everything and can be burned instantly.

## Pretext is the exploit

The message has to give the target a reason to act that fits their week. Generic
"reset your password" blasts are dead. What works:

1. **Ride a real process.** Benefits enrolment season, a genuine all-hands, a
   known vendor migration. Reconnaissance from LinkedIn and job posts tells you
   what is happening internally.
2. **Borrow authority carefully.** A believable internal sender beats a spoofed
   executive. Lookalike display names in a reply-chain outperform brand new
   threads.
3. **Lower the ask.** "View the document" converts far better than "enable
   macros and run this." Each additional action halves your click-through.

## The lightest possible payload

When you do need code execution, prefer the technique with the smallest
footprint that meets the objective. Frequently that is **no macro at all** — a
credential-harvest page behind a convincing SSO flow yields valid logins that
sail past EDR because nothing ever executes on the endpoint.

> If the objective is access and the target uses SSO without phishing-resistant
> MFA, you often do not need malware. You need a good login page and patience.

## Defending against all of this

- **Phishing-resistant MFA (FIDO2 / passkeys).** This single control neutralises
  the credential-harvest path above. Push-based MFA does not.
- **Inbound auth enforcement.** Quarantine on DMARC failure; flag lookalike
  display names and newly-registered sender domains.
- **Report-button culture.** A workforce that reports in ninety seconds beats
  any filter. Measure report *time*, not just click rate.

Great phishing is empathy pointed in the wrong direction. Defend it by removing
the reward (kill reusable credentials) rather than trying to win the arms race
on payloads.
