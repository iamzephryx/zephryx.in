---
title: 'Broken Access Control: Bypassing OTP Verification on a Crypto Exchange'
date: '2026-08-09'
category: 'Tradecraft'
difficulty: 'Medium'
featured: false
techniques: ['T1556.006']
tags: ['broken-access-control', 'authentication', 'bug-bounty', 'web', 'mfa-bypass']
excerpt: 'The password-reset OTP check lived entirely in a JSON response the client was trusted to report honestly. Capture one successful response, replay it over a failed one, and the verification step disappears.'
---

Not every bypass needs a clever payload. This one needed a proxy, some patience,
and a target whose password-reset flow trusted the client to be honest about
whether an OTP check had actually passed.

> Program note: found on a private HackerOne engagement against a crypto
> trading platform. Target anonymised at my discretion; reported and
> remediated through the program before publication.

## Recon

Standard opening: `subfinder` against the root domain, `httprobe` to filter
down to what was actually alive, then a manual pass over the main site before
touching anything automated.

The login form was the obvious first target. It wasn't cooperative — a
handful of manual bypass attempts later, the server cut me off outright.
Rather than fight a rate limiter, I went looking for a second door.

## The reset flow, and an anomaly worth noting

Password reset asked for a registered email, then sent a one-time code. First
pass, I requested a code and submitted a deliberately wrong one just to see
how the server talked about failure. The response was small, structured, and
very predictable:

![A deliberately wrong OTP returns a clean, structured error: code 3332, error_code "3332".](/writeups/otp-verification-bypass-crypto-exchange/01-wrong-otp-response.png)

Nothing exotic — a `code`, an `error_code`, and a human-readable `msg`. But
structured, well-formed failure responses are worth pausing on: something on
the client side is almost certainly branching on this exact shape.

## Capturing the template

I ran the flow again, this time entering the OTP that had actually landed in
my inbox, and pulled the resulting response straight out of Burp's proxy
history.

![Response to a correct OTP: code 0, error_code "0", no error message. This is the template.](/writeups/otp-verification-bypass-crypto-exchange/02-correct-otp-response.png)

Same shape as the failure response, same fields, just zeroed out. That
symmetry is the whole vulnerability: if success and failure are just two
values of the same JSON body, whoever controls that body controls which one
the client believes.

## The swap

Third pass. New reset request, a deliberately wrong OTP again, Burp's
intercept armed on the way back from the server this time instead of the way
out.

![Same wrong code, same 3332 response — this time caught live in the interceptor instead of let through.](/writeups/otp-verification-bypass-crypto-exchange/03-wrong-otp-repeat.png)

I deleted the intercepted body and pasted the captured success response over
it — the one with `code: 0` from the previous step — then forwarded it on.
The OTP field on screen still showed the wrong code I'd typed; the bytes
actually reaching the browser told a different story.

![The intercepted response edited in place: 3332 replaced with the captured code-0 body, then forwarded. The wrong OTP is still visible in the form behind it.](/writeups/otp-verification-bypass-crypto-exchange/04-response-swapped.png)

## The result

The client took the forged response at face value. No re-check, no
server-side confirmation — it simply advanced past OTP verification straight
into the password-reset form, as if the code I'd typed had been correct.

![Straight through to Reset Password — verification bypassed, the wrong OTP never actually validated.](/writeups/otp-verification-bypass-crypto-exchange/05-auth-bypassed.png)

## Why it worked

The OTP check itself was fine. What broke was everything *downstream* of
it: the application treated a JSON field in an HTTP response as the
authoritative record of "this user proved they own the mailbox," instead of
tying that fact to something the client can't rewrite — a signed, single-use,
server-issued token minted only at the moment the code was actually verified
against the stored value.

Anyone sitting in the request path — a proxy, a malicious extension, a
compromised network — can forge that field. This is textbook OWASP A01
Broken Access Control, and it maps cleanly onto MITRE's
**T1556.006 — Modify Authentication Process: Multi-Factor Authentication**:
the technique doesn't crack the second factor, it breaks the mechanism that
decides whether the second factor was ever actually checked.

## Closing it

1. Never let a client-visible response body be the source of truth for a
   security-relevant state transition. Verification should mint a
   server-side, single-use session flag or short-lived signed token — the
   *next* request re-checks that token, not the previous response.
2. Re-validate the verified state on every step that depends on it
   (password-reset submission, session issuance), not just once at the OTP
   screen.
3. Rate-limit and invalidate OTPs after a small number of failed attempts,
   regardless of what any individual response claims about the outcome.
4. Log and alert on a failed OTP immediately followed by a successful state
   transition on the same reset session. A short gap between "wrong" and
   "right" against the same identifier is a cheap, high-signal indicator this
   exact technique is in play.

Two-factor is only as strong as the thing deciding whether the second factor
actually passed — and that decision has to live somewhere the client can't
rewrite it.
