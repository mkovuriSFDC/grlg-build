# Re-ingest: reconcile fresh upstream against living intents

Reached from `/ql-ingest-scopezilla` Step 4b, on a re-ingest only. The repo owns these intents; this reports what changed and the human decides.

Start with what changed since the last review, then run the read-only 3-way reconcile — base = the source at its cursor, ours = the intents recorded as coming from it, theirs = the source now:

```bash
node launchpad/scripts/intent-ledger.mjs source status <name>
node launchpad/scripts/intent-ledger.mjs source show <name> data/intents.json --at cursor > "$TMP/base.json"
node launchpad/scripts/intent-ledger.mjs reconcile "$TMP/fresh.json" --source <name> --base "$TMP/base.json"
```

A **lost cursor** (the project's history was rewritten) has no base: the reconcile then flags every intent that differs for a human, which is the honest answer.

It reports, per intent (engagement id with its source id), who changed it since the last review:

- **🆕 Added upstream** — new intents not in the repo. Pull just these in: `from-json "$TMP/fresh.json" --source <name> --at <head sha>` writes only the missing ones, then `node launchpad/scripts/intent-ledger.mjs sync` opens their ledger rows.
- **🟡 Changed upstream ONLY** — upstream refined them, we didn't touch them. Usually safe to take the new text; re-author those specific intents — hand-merge, or run the exact `from-json … --source <name> --force --only <source ids>` command `reconcile` prints (never a bare `--force`, which overwrites every intent from the source including ones refined in-repo) — but it's the human's call.
- **🔵 Refined in-repo ONLY** — we changed them, upstream didn't. **Keep ours.** Do nothing.
- **🔴 CONFLICT — changed BOTH sides** — a human must settle each: compare `intents/<id>/intent.md` against the fresh output and decide. Record the decision.
- **ℹ Changed upstream outside scope** — upstream moved a phase, an epic, grounding or an answer, which the scope hash doesn't cover. Not drift; nothing re-verifies. Read the change to the human, who refines the intent if it matters.
- **⚫ Removed from upstream** — an intent from this source vanished from the fresh output. If intentional, retire it through `/ql-refine-intent` (decision + `intent-ledger.mjs retire`, never a deleted directory or row); if upstream dropped it by mistake, keep ours and flag upstream.

Present this to the user and apply only what they ratify. Once the chosen upstream changes are applied, **move the cursor** so the next reconcile compares against this review: `node launchpad/scripts/intent-ledger.mjs source ack <name>`. Re-run `validate`, then continue to the ledger drift check (Step 6b).

> **Grilling on a populated repo composes with this reconcile — it is never a door around it.** Grilling is useful past the first ingest (a phase-2 batch, a fresh upstream run for the next value drop, mid-engagement discovery). But the reconcile is the safety net that protects your in-repo refinements, so the grill operates on **what the reconcile surfaces**, not around it: after this report, an accepted grill works *only* the **🆕 added upstream** intents and the **🔴 conflicts** — exactly the things worth an interactive session. A **🔵 refined-in-repo** (settled) intent is never touched by the grill; the never-clobber rule stands. Shaping brand-new scope from notes/rich source *without* a fresh upstream run is `/ql-capture-intent`'s job, not this. So: reconcile first, then grill its output. Go to Step 4-grill with that scoped worklist.
