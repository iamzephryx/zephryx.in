---
title: 'Mr. Robot: 1 (TryHackMe)'
date: '2026-08-20'
category: 'CTF'
difficulty: 'Medium'
techniques: ['T1110.003', 'T1110.001', 'T1110.002', 'T1505.003', 'T1548.001']
tags: ['thm', 'ctf', 'web', 'wordpress', 'privesc']
excerpt: 'A wordlist hiding inside robots.txt, a WordPress login that never rate-limited Hydra, and an old SUID nmap binary that hands you root the moment you type !sh.'
---

This was my first proper TryHackMe box that I sat down and did start to
finish, no hints, no walkthrough open in another tab. Mr. Robot: 1 is an old
room but it is still a really good one to learn the basics — enumeration,
brute forcing a WordPress login, getting a shell through a template, and
then a classic SUID privesc at the end. Writing this down mainly so I don't
forget my own steps, but sharing it here in case it helps someone else who
is stuck on the same box.

![TryHackMe Mr. Robot CTF room banner.](/writeups/mr-robot-thm/01-banner.png)

## Getting connected

Before anything else, I went to the TryHackMe access page and connected to
their network so my machine could actually reach the target box.

![Connected to the TryHackMe network.](/writeups/mr-robot-thm/02-thm-connected.png)

![Mr. Robot room overview on TryHackMe.](/writeups/mr-robot-thm/03-room-a.png)

![Mr. Robot room, second view.](/writeups/mr-robot-thm/04-room-b.png)

There are 3 keys/flags to find in this box, and this writeup covers all
three of them.

## Recon

Like on every box, I started with an nmap scan on the target IP
`10.49.158.138`:

![Running the nmap scan.](/writeups/mr-robot-thm/05-nmap-run.png)

```bash
nmap -sV -T4 -v -open 10.49.158.138 -oA nmap-output
```

Quick note on what these flags actually do, since I keep forgetting and
googling this every time:

- `-sV` — detect the version of whatever service is running on each port.
- `-T4` — a faster, more aggressive timing template for the scan.
- `-oA nmap-output` — save the output in all 3 formats (normal, XML, grepable).
- `-open` — only show ports that are actually open, skip the closed/filtered noise.

Scan finished and gave me this:

![nmap scan results showing open ports.](/writeups/mr-robot-thm/06-nmap-results.png)

Ports `22`, `80` and `443` were open. SSH, HTTP and HTTPS. Nothing too
unusual on the surface, so the website was the obvious place to dig
further.

## Poking at the website

I opened the site on port 80 in the browser:

![Website running on port 80.](/writeups/mr-robot-thm/07-website-port80.png)

There is a fake terminal on the homepage itself, with a list of commands you
can "type" into it. I got curious and started clicking around, and one of
those gave me this message:

```bash
18:03 -!- friend_ [friend@208.185.115.6] has joined #fsociety.

18:03 <mr. robot> Hello friend. If you've come, you've come for a reason.
You may not be able to explain it yet, but there's a part of you that's
exhausted with this world... a world that decides where you work, who you
see, and how you empty and fill your depressing bank account. Even the
Internet connection you're using to read this is costing you, slowly
chipping away at your existence. There are things you want to say. Soon I
will give you a voice. Today your education begins.
```

Nice bit of flavour text from the show, but not something I could actually
use. So I moved on and tried the rest of the terminal commands one by one —
none of them turned out to be interesting for actually breaking in.

## Directory brute forcing

Since the fake terminal was a dead end, I ran `dirb` against the site to
see what directories and files actually exist on the server:

![Running dirb against the target.](/writeups/mr-robot-thm/08-dirb-run.png)

```bash
dirb http://10.49.158.138 /usr/share/wordlists/dirbuster/directory-list-2.3-small.txt
```

![dirb results listing discovered paths.](/writeups/mr-robot-thm/09-dirb-results.png)

Out of everything dirb found, one entry caught my eye straightaway:
`robots.txt`.

![Contents of robots.txt.](/writeups/mr-robot-thm/10-robots-txt.png)

Inside `robots.txt` there were two entries — `fsocity.dic` and
`key-1-of-3.txt`. I had no idea at that point whether these were files or
folders or where they would lead me, so I just went and opened them one by
one, starting with `fsocity.dic`:

```bash
http://10.49.158.138/fsocity.dic
```

![404 page after mistyping fsociety.dic.](/writeups/mr-robot-thm/11-fsocity-404.png)

This gave me a 404 page, but that page itself told me something useful —
the site is running on `WordPress`. Now, why did it 404 when `robots.txt`
literally listed the file? Turns out I had made a silly typo — I typed
`fsociety.dic` (with an "e") instead of the actual `fsocity.dic`.

![The correct wordlist file loading properly.](/writeups/mr-robot-thm/12-wordlist-page.png)

Fixed the spelling and there it was, the wordlist opened up properly. I
downloaded it right away:

```bash
wget http://10.49.158.138/fsocity.dic
```

## First key

The second thing `robots.txt` pointed to was `key-1-of-3.txt`, so I opened
that next:

![Contents of key-1-of-3.txt.](/writeups/mr-robot-thm/13-key1.png)

And that's key number 1, done. One down, two to go.

## Trying the WordPress login

I found the `/wp-login` page and went there. Just to see how the login form
behaves, I typed in some random creds — `admin` / `admin` — and captured
the request in Burp to see exactly what it was sending.

![The WordPress login form.](/writeups/mr-robot-thm/14-wp-login.png)

![Captured POST request from the login attempt.](/writeups/mr-robot-thm/15-post-request.png)

The request body was straightforward:

```bash
log=admin&pwd=admin
```

So the server accepts a plain `log` and `pwd` field over POST — good to
know, because this is exactly what I would need to automate a brute force
attempt against.

## Cleaning up the wordlist

Before brute forcing anything, I looked at `fsocity.dic` properly, and
noticed it had a LOT of duplicate words in it:

![fsocity.dic with duplicate entries visible.](/writeups/mr-robot-thm/16-duplicate-words.png)

```bash
tr ' ' '\n' < fsocity.dic | sort | uniq -d
```

This takes the wordlist, splits it word by word onto separate lines, sorts
it, and shows only the duplicates. Once I confirmed there really were a lot
of repeats, I cleaned it up into a smaller `unique.txt` file:

![unique.txt after removing duplicates.](/writeups/mr-robot-thm/17-unique-txt.png)

> Side note: I also tried brute forcing SSH with this same wordlist first,
> just in case, but that did not go anywhere. Port 80 turned out to be the
> real way in.

## Brute forcing the login with Hydra

With a smaller, cleaner wordlist ready, I pointed Hydra at the WordPress
login form:

```bash
hydra -L unique.txt -p test 10.48.157.61 http-post-form "/wp-login.php:log=^USER^&pwd=^PASS^:F=Invalid username" -t 30
```

| Part | Meaning |
| --- | --- |
| `hydra` | starts Hydra |
| `-L unique.txt` | use the usernames from `unique.txt` |
| `-p test` | use a single, fixed password `test` for this run |
| `10.48.157.61` | the target IP address |
| `http-post-form` | tells Hydra we're attacking a form submitted with POST |
| `/wp-login.php` | the WordPress login endpoint |
| `log=^USER^` | Hydra substitutes each username from the list here |
| `pwd=^PASS^` | Hydra substitutes the password here |
| `F=Invalid username` | treat any response containing this text as a failed login |
| `-t 30` | run up to 30 login attempts in parallel |

The idea here is simple — I don't know the username yet, so first I just
fix the password to a throwaway value (`test`) and let Hydra run through
every username in the list, looking for the one response that does NOT say
"Invalid username".

![Hydra running against the login form for username enumeration.](/writeups/mr-robot-thm/18-hydra-userenum.png)

Running it with the dummy password `test` was enough to find a valid
username — `elliot`.

![Hydra output showing the username elliot.](/writeups/mr-robot-thm/19-elliot-confirm.png)

I double-checked this manually on the login page too, and it confirmed it —
the error message changed to `The password you entered for the username
elliot is incorrect`, instead of the generic invalid-username message. That
confirms `elliot` is a real, valid username on this WordPress install.

![Login page confirming elliot is a valid username.](/writeups/mr-robot-thm/20-hydra-password.png)

Now that the username is fixed, I ran Hydra again — this time flipping it
around to brute force the password for `elliot`:

```bash
hydra -l elliot -P unique.txt 10.48.157.61 http-post-form "/wp-login.php:log=^USER^&pwd=^PASS^:F=The password you entered for the username" -t 30
```

And this time, it actually found the password:

![Hydra finding the correct password for elliot.](/writeups/mr-robot-thm/21-password-found.png)

## Getting into WordPress admin

Logged in with the `elliot` credentials Hydra found, and I was in.

```bash
curl -s http://10.48.157.61/feed/ | grep -i generator
```

I ran this quickly just to fingerprint the exact WordPress version — turned
out to be **WordPress 4.3.1**.

![Logged into the WordPress dashboard as elliot.](/writeups/mr-robot-thm/22-wp-admin.png)

The `elliot` account turned out to be an admin account, which is a big
deal, because admins on WordPress can directly edit theme template files
from inside the dashboard — no plugin upload or file manager needed.

![WordPress appearance/theme editor showing template files.](/writeups/mr-robot-thm/23-templates.png)

## Getting a shell

Since I had access to edit templates directly, the plan was simple — drop a
PHP reverse shell into one of the theme files, and then just hit that page
from the browser to trigger it.

I grabbed the well known reverse shell script from pentestmonkey's GitHub
repo:

```bash
https://github.com/pentestmonkey/php-reverse-shell
```

![Copying the PHP reverse shell code from GitHub.](/writeups/mr-robot-thm/24-php-shell-copy.png)

![Editing the shell code before pasting it into WordPress.](/writeups/mr-robot-thm/25-shell-edit.png)

Before pasting it in, I updated the `$ip` and `$port` variables in the
script to point back to my own machine and the port I was going to listen
on:

![Reviewing the shell script with IP and port updated.](/writeups/mr-robot-thm/26-nc-listener.png)

I picked the `404.php` template to paste the shell into, since that's the
page that loads whenever someone hits a URL that doesn't exist on the
site — an easy trigger.

Before saving the template, I started a netcat listener on my own machine
to catch the incoming connection:

```bash
nc -lvnp 9001
```

![The edited shell inside the 404 template file.](/writeups/mr-robot-thm/27-404-template.png)

With the listener running and the shell saved inside the 404 template, all
that's left is to visit any URL on the target that doesn't exist, so that
WordPress serves up the 404 page and runs my shell code:

```bash
http://10.48.129.131/anythingdoesnotexist
```

And there it is — shell access:

![Reverse shell connection received on the listener.](/writeups/mr-robot-thm/28-shell-access.png)

## Finding the second key

Poking around the filesystem, I found some interesting files inside
`/home/robot`. There was a `key-2-of-3.txt` in there, but the current shell
user (`daemon`, from the web server) did not have read permission on it —
so I needed to become the `robot` user first.

![Files inside /home/robot, key file not readable as daemon.](/writeups/mr-robot-thm/29-home-robot.png)

What I *did* have read access to was `password.raw-md5`, and that turned
out to have a password hash inside it that I could crack offline.

![Contents of password.raw-md5.](/writeups/mr-robot-thm/30-password-md5.png)

I copied that hash out and saved it into a file called `pass` on my own
machine:

![Hash saved locally into a file called pass.](/writeups/mr-robot-thm/31-hash-file.png)

Then I ran John the Ripper against it to crack the hash:

![John the Ripper cracking the password hash.](/writeups/mr-robot-thm/32-john-crack.png)

And it cracked, giving me the plaintext password for the `robot` user:

![Password for the robot user recovered.](/writeups/mr-robot-thm/33-robot-password.png)

I switched to the `robot` user with this password, and from there I could
finally read the second key.

![Logged in as robot user.](/writeups/mr-robot-thm/34-key2-login.png)

![Contents of key-2-of-3.txt.](/writeups/mr-robot-thm/35-key2.png)

## Privilege escalation to root

Two keys down, one to go — and for the third one I needed full root access.

First thing I checked was whether `robot` had any `sudo` rights, and it
didn't:

![Checking sudo access as robot — no permissions.](/writeups/mr-robot-thm/36-no-sudo.png)

So instead, I went looking for SUID binaries — programs that run with the
permissions of their owner (often root) no matter which user actually
executes them:

```bash
find / -perm -4000 -type f 2>/dev/null
```

And this is where it got interesting — the search turned up
`/usr/local/bin/nmap`:

![find command output showing SUID nmap binary.](/writeups/mr-robot-thm/37-suid-nmap.png)

This particular box ships an old version of nmap that still has an
"interactive mode", and because the binary has the SUID bit set, anything
you run from inside that interactive mode also runs as root. This is
actually the intended privilege escalation path for this box.

```bash
/usr/local/bin/nmap --interactive
```

![nmap interactive mode prompt.](/writeups/mr-robot-thm/38-nmap-interactive.png)

Once inside the `nmap>` prompt, dropping into a shell is just one command
away:

```bash
!sh
```

And that's it — root shell, and the third and final key:

![Root shell and the third key.](/writeups/mr-robot-thm/39-root-key3.png)

## Flags

All three keys, one after another:

```bash flags.txt
key-1-of-3: 073403c8a58a1f80d943455fb30724b9
key-2-of-3: 822c73956184f694993bede3eb39f959
key-3-of-3: 04787ddef27c3dee1ee161b21670b4e4
```

## Takeaways

A few things stuck with me after finishing this box:

1. **`robots.txt` is not just for search engines.** It's meant to tell
   crawlers what *not* to index, which ironically makes it one of the first
   places to check when you're looking for stuff an admin didn't want
   showing up in search results.
2. **A wordlist full of duplicates is still a wordlist, but a cleaned one
   is a faster attack.** `sort | uniq` before you brute force anything —
   it's a two second command that can save you real time on a large list.
3. **Username enumeration before password brute forcing is worth the extra
   Hydra run.** Fixing the password and rotating usernames first, then
   flipping it around once you have a valid username, is much faster than
   trying every combination blindly.
4. **An admin who can edit theme templates can get code execution.** This
   is basically expected WordPress behaviour, not a bug, which is exactly
   why locking down who gets admin/editor roles on a WordPress install
   matters so much.
5. **Old SUID binaries with "helper" or interactive modes are a classic
   privesc path.** `find / -perm -4000` should be one of the first things
   you run once you land a shell on any box — nmap, vim, less, find itself
   have all been used this way at some point.

Fun box overall, and a good reminder that most real-world intrusions don't
need a fancy 0-day — a leaked wordlist, a weak login, and a forgotten SUID
binary got the job done here.
