---
title: 'From One Low-Priv Account to Domain Admin in 40 Minutes'
date: '2026-06-18'
category: 'Tradecraft'
difficulty: 'Medium'
featured: true
tags: ['active-directory', 'kerberos', 'bloodhound', 'privesc']
excerpt: 'A single unprivileged domain account, one service ticket with a weak password behind it, and an ACL nobody had audited since 2019. The path is boring — which is exactly why it keeps working.'
---

The client asked for an assumed-breach exercise: one standard domain user, no local admin, no pr