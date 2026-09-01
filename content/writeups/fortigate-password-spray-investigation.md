---
title: 'How I Investigated a Real Password Spray Attack on a Firewall Admin Login'
date: '2026-08-16'
category: 'Detection'
difficulty: 'Medium'
techniques: ['T1110.003']
tags: ['soc-analyst', 'threat-hunting', 'fortinet', 'password-spray', 'siem']
excerpt: 'A real SOC investigation, step by step. 19 rotating IPs tried to break into a firewall admin login. Here is how I checked if it actually worked — and found a bigger problem than the alert itself.'
---

It was a normal night shift. Chai on the table, SIEM dashboard open in one tab.
Then a high severity alert came in.

**Fortinet Password Spray via Rotating Source IPs.**

Most people would look at this, write one line saying attempted but not
successful, and move on. I almost did the same. But something in the numbers
did not feel right, so I decided to check it properly. What I found was not
some dramatic hacking story. It was a good lesson on why you should never
trust a SIEM alert just because it looks closed.

Let me explain the whole thing in simple words, step by step, so if you work
in a SOC, you can use the same method next time.

## What triggered the alert

The rule was simple to understand. If the same admin account gets a failed
login from more than 10 different IP addresses within 30 minutes, the system
raises an alert.

![The alert that fired: Fortinet Password spray via rotating Source IPs, high severity, two total alerts, with a source-to-destination flow chart and a world map of the originating countries.](/writeups/fortigate-password-spray-investigation/01-alert-dashboard.png)

This is a common attack pattern called password spraying. Instead of one IP
trying thousands of passwords, which gets blocked quickly, the attacker uses
many different IPs so each one only tries a few times. This helps them stay
under the radar.

This alert fired two times within a few hours, and both times it was on the
admin login page of a firewall.

## Step 1: Do not trust the summary, check the raw logs

The dashboard showed a nice chart with a few IP addresses. But a chart is
just a summary, and summaries can hide details. I pulled the full raw logs,
23 login attempts in total, and checked them myself instead of just looking
at the graph.

![Alert Logs view showing the raw search results — 23 logs found for the Fortinet password spray rule, pulled instead of trusting the dashboard summary.](/writeups/fortigate-password-spray-investigation/02-raw-alert-logs.png)

Here is what I found once I went through everything properly.

- 23 login attempts, all failed, all against the same admin account.
- 19 different IP addresses used.
- Every attempt was aimed at the same login page.
- The attempts came in two separate bursts, about two hours apart.

## Step 2: Check where these IPs are actually coming from

This step is the one most people skip. I grouped the 19 IPs by their network
block, and one thing stood out right away.

![The 19 source IPs grouped and counted by address — more than half of them cluster into a single block.](/writeups/fortigate-password-spray-investigation/03-ip-block-breakdown.png)

More than half of the IPs, 10 out of 19, belonged to one single block of
addresses. The rest were spread across three smaller blocks from different
countries and different hosting providers.

![Each flagged source IP mapped to the same destination in a flow view — nineteen different paths converging on one target.](/writeups/fortigate-password-spray-investigation/04-source-ip-sankey.png)

This pattern matters. Real traffic from different genuine people does not
usually cluster like this. But one attacker using a bunch of rented server
IPs looks exactly like this. It is basically the fingerprint of an automated
tool, not random internet traffic.

## Step 3: Check the alert's own logic, do not just believe it

This is the most important part of the whole story, so read this slowly.

The rule said it should fire only when unique IPs go above 10 within 30
minutes. So I sat down and rebuilt this logic by hand using the real
timestamps, not the rounded numbers shown on the dashboard.

The second burst clearly crossed the limit. 11 unique IPs inside a real 30
minute window. Clean and easy to defend.

But the first burst never crossed 10, no matter how I checked it. It stayed
exactly at 10, one short of what the rule needed.

I am not saying the tool is broken. I am saying I could not fully prove why
the first alert fired, and that is a completely honest and normal thing to
write in a report. Most analysts never even check this part. This is the
habit that actually separates a good analyst from someone who just reads
dashboards.

## Step 4: Find out if the attack actually worked

This is the part that decides if you close the ticket or escalate it.

My first move was to check if any of those same 19 IPs managed a successful
login. Result was zero. It would have been easy to just write no compromise
and move on.

But that would have been wrong.

Think about it like this. If an attacker actually guesses the right password
in the middle of a spray attack, why would they log in again using the same
IP that is already flagged and blocked everywhere. A smart attacker would get
the password, then log in quietly from a totally different, clean IP that
never shows up in this alert at all.

So checking only those 19 IPs for a successful login is like checking
fingerprints only on the window a thief did not use to enter the house.

I redid the search properly. Successful admin logins, same account, same
destination, but with no IP filter at all. I checked a wide time window, well
before and well after the attack.

Result, zero successful logins on that address across more than ten days.

![Re-running the search for the exact destination IP with every source-IP filter removed — no data found, zero successful admin logins over the window checked.](/writeups/fortigate-password-spray-investigation/05-zero-result-search.png)

## Step 5: Make sure the zero result actually means something

Before trusting that clean result, I did one more check that most people
forget. I needed to confirm the SIEM was even able to show me a successful
login if one existed. Some firewalls, if set up wrong, simply do not log
successful admin logins at all, which would make my zero result completely
useless.

So I ran the same search again with no filters at all. Any user, any source,
any destination, going back seven days. I got 13 results. Real logins, all
looking normal.

![The same log ID with every filter stripped away — thirteen real admin logins turn up over the surrounding week, proving the logging pipeline actually works.](/writeups/fortigate-password-spray-investigation/06-unfiltered-login-search.png)

This confirmed the logging was working properly. So my earlier zero result
was now trustworthy, not just a blind spot.

## Step 6: The twist nobody expects

Here is where the story got more interesting than the attack itself.

I looked closely at those 13 real, successful logins. Every single one came
from a private internal IP address. And every single one logged into a
completely different internal management address, never the public address
that was actually under attack.

Read that again. The address that got hit by 19 external IPs was never once
used for a real admin login, not even once in an entire week of normal
activity.

![All thirteen legitimate logins, side by side — every one from a private internal source IP into an internal management address, never the public one the spray attack targeted.](/writeups/fortigate-password-spray-investigation/07-successful-logins-internal.png)

So the real finding of this whole case was not the spray attack failing. It
was this question: why is an admin login page, on an address nobody ever
legitimately uses, sitting open to the internet in the first place.

That is the actual risk here. Even though this particular attack did not
succeed, the exposure itself is the real problem. Because next time, the
attacker does not need to get lucky with a password. They just need to find
any other way in through a door that should never have been open to begin
with.

## What I would recommend if you find something similar

1. Do not mark a spray alert as safe just because the attacking IPs did not
   get a successful login. Always search for successful logins with no
   source-IP filter.
2. Always confirm your zero result search actually means something. Test if
   the logging system can even show you a positive result before trusting a
   negative one.
3. Break down the attacking IPs by their network blocks, not just by count.
   This tells you if it is one actor using a tool or just random noise.
4. Check the correlation rule's own math by hand at least once. Do not
   assume the automated logic is always correct.
5. If an admin interface is open to the internet and never legitimately used
   from outside, that is a bigger finding than the attack itself. Report it
   separately.

## Final word

This investigation did not end with a dramatic *we got hacked* story. It
ended with something more useful: a real gap in how an admin interface was
exposed, and I only found it because I did not stop at the first comfortable
answer.

That is the actual job of a SOC analyst. Not just reading the alert.
Investigating it properly.

If you work in a SOC, next time an alert looks closed, ask yourself one more
question before you close the ticket. That one extra question is usually
where the real finding is hiding.

> All IP addresses, hostnames, and organisation details in this post have
> been changed or hidden. This post explains the investigation method only.
> The actual environment involved is not identified, in line with
> responsible disclosure practice.
