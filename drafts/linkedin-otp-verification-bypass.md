# LinkedIn post — Broken Access Control: Bypassing OTP Verification on a Crypto Exchange

Target URL: https://zephryx.in/writeups/otp-verification-bypass-crypto-exchange/

## Draft A — recommended (full technical, ~1,250 chars)

The OTP check worked fine. Everything downstream of it didn't.

A password-reset flow on a crypto trading platform decided "this user proved
they own the mailbox" by reading a field out of a JSON response — a response
the client sits in a position to rewrite.

Three requests:

1. Submit a deliberately wrong OTP. Note the failure body — `code: 3332`.
2. Submit the real OTP from my inbox. Same shape, zeroed out — `code: 0`.
3. Submit a wrong OTP again, but intercept the response on the way back.
   Delete the body, paste the captured `code: 0` over it, forward.

The client took it at face value and advanced straight to the password-reset
form. The wrong code was still sitting in the form field on screen.

That's the whole bug. No payload, no race, no crypto. Success and failure were
two values of the same JSON body, and the thing deciding which one counted
lived on the wrong side of the trust boundary.

OWASP A01, and it maps onto MITRE T1556.006 — the technique never touches the
second factor, it breaks the mechanism deciding whether the second factor was
ever checked.

The fix isn't a better OTP. Verification has to mint a server-side, single-use
token that the *next* request re-checks, instead of trusting the last response.

Private HackerOne program. Target anonymised, reported and remediated before
publication.

Full writeup with the intercepts: https://zephryx.in/writeups/otp-verification-bypass-crypto-exchange/

#BugBounty #AppSec #OWASP #InfoSec

## Draft B — shorter, defender-angled (~700 chars)

Two-factor is only as strong as the thing deciding whether the second factor
actually passed.

On a crypto exchange's password-reset flow, that decision was a field in a JSON
response body. Capture the response to a correct OTP (`code: 0`), replay it over
the response to a wrong one (`code: 3332`), forward — the client advances past
verification with an invalid code still in the form.

Blue-team takeaway, because this one is cheap to catch: alert on a failed OTP
immediately followed by a successful state transition on the same reset session.
A short gap between "wrong" and "right" against the same identifier is
high-signal for exactly this.

OWASP A01 / MITRE T1556.006. Writeup:
https://zephryx.in/writeups/otp-verification-bypass-crypto-exchange/

#BlueTeam #AppSec #DetectionEngineering #BugBounty

## Posting notes

- **Images over a link card.** Attach `03-wrong-otp-repeat.png`,
  `04-response-swapped.png` and `05-auth-bypassed.png` from
  `public/writeups/otp-verification-bypass-crypto-exchange/`. Attaching images
  suppresses the link preview, which is fine here — the site's OG card is the
  generic site-wide one (`src/app/opengraph-image.tsx`), not per-writeup, so the
  preview would only show name + role rather than the writeup title.
- **Link stays in the post body**, last line. Traffic to the writeup is the
  point, and "link in comments" costs more clicks than the ranking penalty costs
  impressions at this account size.
- **Hook is the first two lines.** Everything after roughly 140 characters hides
  behind "…see more" on mobile, so the first two lines have to carry the post on
  their own. Both drafts are built that way — don't add a greeting above them.
- **Disclosure.** The program note stays in. Keep the platform unnamed, and
  don't answer "which exchange?" in the comments.
- **Screenshots are already redacted** — host blurred, logo masked. The only
  legible identifier is the tail of the tester mailbox (`…n00@gmail.com`) in
  01/03; blur it before upload if that address is one you use elsewhere.

## Optional follow-up

Per-writeup OG images would make future shares render with the writeup's own
title and technique instead of the generic site card. Not needed for this post,
since images are being attached directly.
