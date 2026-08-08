---
title: 'Phishing Payload Execution — Office Spawning a Script Interpreter'
ruleId: 'ZPX-D007'
date: '2026-03-12'
techniques: ['T1566.001', 'T1059.001', 'T1204.002']
platform: 'Windows'
logsource: 'Sysmon · Event 1 (ProcessCreate)'
severity: 'high'
status: 'stable'
tags: ['initial-access', 'phishing', 'execution', 'endpoint']
writeup: 'phishing-that-lands-pretext-over-payload'
excerpt: 'Word has no legitimate reason to start PowerShell. The pretext gets the click; this is where the click becomes execution.'
---

## Why this fires

The pretext is the hard part of phishing. The execution is the loud part. When a
maldoc, container file or LNK finally runs, an Office application or archive
handler becomes the parent of a script interpreter — a relationship that has
essentially no legitimate use in a managed estate.

This is old ground and it still works, because the alternative for the attacker
is worse: every technique that avoids a script interpreter costs reliability.

## The rule

```yaml
title: Office Application Spawning Script Interpreter or LOLBin
id: 5b0c9d31-e847-4f62-a913-7d240fb85c6e
status: stable
description: >
  Detects Microsoft Office applications and archive handlers creating script
  interpreters or common living-off-the-land binaries, the standard execution
  step following a successful phishing click.
references:
  - https://attack.mitre.org/techniques/T1566/001/
  - https://attack.mitre.org/techniques/T1204/002/
author: Zephryx
date: 2026/03/12
tags:
  - attack.initial_access
  - attack.execution
  - attack.t1566.001
  - attack.t1059.001
  - attack.t1204.002
logsource:
  product: windows
  category: process_creation
detection:
  selection_parent:
    ParentImage|endswith:
      - '\winword.exe'
      - '\excel.exe'
      - '\powerpnt.exe'
      - '\outlook.exe'
      - '\onenote.exe'
      - '\msaccess.exe'
      - '\7zFM.exe'
      - '\winrar.exe'
  selection_child:
    Image|endswith:
      - '\powershell.exe'
      - '\pwsh.exe'
      - '\cmd.exe'
      - '\wscript.exe'
      - '\cscript.exe'
      - '\mshta.exe'
      - '\rundll32.exe'
      - '\regsvr32.exe'
      - '\msbuild.exe'
      - '\installutil.exe'
      - '\curl.exe'
      - '\certutil.exe'
  filter_repair:
    CommandLine|contains: '/repair'
  condition: selection_parent and selection_child and not filter_repair
fields:
  - ParentImage
  - Image
  - CommandLine
  - User
falsepositives:
  - Legacy macro-enabled workbooks in finance and engineering teams
  - Office add-in installers and repair operations
  - Document-automation platforms that drive Office headlessly
level: high
```

## Enrich, do not just alert

The parent-child pair is the trigger. Three enrichments turn it into a verdict
worth waking someone for:

```sql
DeviceProcessEvents
| where InitiatingProcessFileName in~ ("winword.exe","excel.exe","powerpnt.exe","outlook.exe")
| where FileName in~ ("powershell.exe","cmd.exe","wscript.exe","mshta.exe","rundll32.exe")
| extend encoded  = ProcessCommandLine matches regex @"(?i)\s-e(nc|ncoded)?\s"
| extend hidden   = ProcessCommandLine has_any ("-w hidden","-windowstyle hidden")
| extend download = ProcessCommandLine has_any ("http://","https://","DownloadString","Invoke-WebRequest","BitsTransfer")
| extend score = toint(encoded) + toint(hidden) + toint(download)
| where score >= 1
| project Timestamp, DeviceName, AccountName, InitiatingProcessFileName, FileName, ProcessCommandLine, score
| order by score desc
```

Cross-reference the originating mail: if the document arrived in the last hour
from an external sender whose domain was registered in the last thirty days, the
campaign is live and you are triaging scope, not deciding severity.

## Tuning notes

- Baseline first. Every organisation has one finance macro that legitimately
  shells out, and you want it on an explicit exception with an owner's name
  attached, not silently dropped.
- Attack Surface Reduction rule
  `D4F940AB-401B-4EFC-AADC-AD5F3C50688A` blocks this parent-child relationship
  outright. Deploy it in audit mode, use *this* rule to find what breaks, then
  enforce.
- Watch for the pivot to `dllhost.exe`, `explorer.exe` and scheduled tasks as
  intermediate parents — that is what operators do the week after you enforce.

## Field notes

The campaign design that makes this the *only* noisy moment is in
[Phishing That Lands](/writeups/phishing-that-lands-pretext-over-payload/).
Pretext gets the click; the estate still gets exactly one clean chance to catch
what the click starts.
