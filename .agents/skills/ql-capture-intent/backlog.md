# The backlog — parking and graduating

Reached from `/ql-capture-intent` for a **PARK** candidate (Step 4c) or a graduation run over `intents/BACKLOG.md`. The backlog is pre-Intent: no id, no ledger row, no scope hash, no CI.

## Step 4c — Park a candidate to the backlog

For a **PARK** candidate, do the cheap thing: append one line to `intents/BACKLOG.md`. **No intent file, no decision record, no ledger row, no scope hash, no vet.** That's the whole point — parking is pre-Intent. If the candidate is a `deferred-backlog` 👁 criterion from `/ql-record-test-execution`, also append ` / → intents/BACKLOG.md` to that criterion's Sign-off cell so `coverage` reads the deferral as routed.

If `intents/BACKLOG.md` doesn't exist yet (an engagement seeded before this file shipped, and not yet `/ql-resync`'d), **create it** with its header first — mirror the seeded template exactly:

```
<!-- Un-committed ideas, NOT Intent. … (the header block from templates/_launchpad-engagement/intents/BACKLOG.md) -->

# Backlog — un-committed ideas

_Pre-Intent inbox. Park ideas here fast; graduate them into living Intent via `/ql-capture-intent`._
```

Then append each parked candidate as one freeform line:

```
- <one-line outcome, in the input's own terms> — <source, if known>
```

- **One idea per line.** No table, no ID, no status, no priority, no owner — keep it flat on purpose. If you find yourself adding a column, stop: that's the backlog turning into a worse Jira, the exact thing it exists to avoid.
- **Source is best-effort, never hunted.** Note whatever you already know — "from the 7/23 UAT call", "from the pasted transcript" — and leave it blank rather than round-trip through the Google MCP to pin it down. (The provenance hunt is the ceremony PARK exists to skip; the *real* provenance gets established at graduation, when the line earns a decision record.)
- **Don't dedup against the existing backlog.** Redundant lines are fine here; graduation is where duplicates get resolved.

## Graduating backlog lines into Intent

The reverse trip: turn parked ideas into real Intent. When the user points at the backlog ("graduate the backlog", "let's turn these backlog ideas into intents", or just re-runs capture over `intents/BACKLOG.md`), treat each **line** as a candidate and run the normal flow — Steps 2–6 — with two specifics:

- **The line's inline source seeds the decision record.** When a graduated line becomes a real intent (Step 4a) or a change (Step 4b), the source note you jotted at park time ("from the 7/23 UAT call" — a pointer, never a name; see the dirty-source membrane) is the **starting point for that decision record's Context** — don't re-hunt provenance you already captured. If the line's source was left blank, *now* is when to ask, because it's becoming committed Intent and earning a real trail.
- **A cluster of small items can graduate into one bundle.** When several parked lines are sub-capability-sized and share a trigger (a run of regression fixes, a pile of UX cleanups), disposition them **BUNDLE** and attach them as items to one bundle intent (Step 4d) rather than cutting an intent per line. Show the batch ("these 4 lines → INT-0xx UX enhancements") before writing.
- **Delete each graduated line — but show it first.** A line that becomes an intent (or that the user confirms is already covered / no longer wanted) is **removed** from `intents/BACKLOG.md`, so the file stays a *live* inbox rather than an archive. Per the repo's move-aside discipline, don't silently blast lines: as part of the confirm-the-table step, show which lines you're clearing and why ("these 3 graduated to INT-041/042/043; removing them from the backlog"), then remove them on approval. The intent's decision record — citing the backlog source — is the durable record that the idea existed; the git history of `BACKLOG.md` is the backstop. A line the user wants to *keep parked* stays.
