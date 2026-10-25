---
name: ql-capability-map
disable-model-invocation: true
description: Generate a self-contained, offline interactive capability map of the whole scope — Phase to Epic to Intent — to present or walk a client through. Read-only; never edits scope.
produces: >-
  `delivery/capability-map.html` — a self-contained, offline interactive Phase to Epic to Intent map. Read-only over scope; a derived view recomputed each run, never edits an intent.
---

# Capability map — see and present the whole scope

This produces one self-contained HTML file — `delivery/capability-map.html` — that lays out the engagement as **Phase → Epic → Intent (capability)**, color-coded by phase, with click-to-drill-down panels. No server, no network, no dependencies: it opens from `file://` and works offline in a conference room. It's built for the **Intent & Align** phase — an Intent Architect walking a Product Owner through scope, or facilitating an intent gap-closing session.

It is a **derived view**, the same family of artifact as the README delivery index: computed fresh from canonical sources every run, never hand-maintained. It is strictly **read-only over scope** — it displays and helps you interrogate the intents; it never edits one. Refinement still flows through `/ql-refine-intent` and `/ql-capture-intent` (the governed, ratified paths).

## What it reads (all read-only)

- `intents/INT-NNN/intent.md` — the living canonical intents (the capabilities), including their internal dependencies. **This is the structural authority:** each intent's own `phase:`/`epic:` frontmatter decides which phase band and epic column it lands in.
- each tied Scopezilla source's `data/epics.json` — epic names, descriptions, confidence, KB sources (**enrichment** for the columns the intents define)
- each source's `data/roadmap.json` — phase names and the preferred epic column order (**enrichment + ordering**, not placement)

Both are read in place at the commit last reviewed (`source show … --at cursor`) and merged across sources. With no tied source, the map is built from the intents alone and says so.
- `delivery/intent-ledger.md` — per-intent delivery status, overlaid as a badge
- the engagement's `README.md` (ENGAGEMENT block) — optional; the "Client / project" line becomes the map title

**The intents drive structure; the source only enriches.** Living intents are refined in-repo while a tied source moves only at the next `/ql-ingest-scopezilla`, so the intent always wins on placement and the source supplies names, descriptions, KB sources, and column order. Where they diverge, the map follows the intent and surfaces the divergence as a data note.

## Step 1 — Regenerate

Run from the engagement repo root (the generator is vendored with this skill into the harness's skills dir — `.claude/skills/` or `.agents/skills/` — so the chain tries both, then falls back to the plugin for a plugin-only checkout). It reads the repo from your current directory and writes the map there:

```bash
node .claude/skills/ql-capability-map/capability-map.mjs --open \
  || node .agents/skills/ql-capability-map/capability-map.mjs --open \
  || node "${CLAUDE_PLUGIN_ROOT}/skills/ql-capability-map/capability-map.mjs" --open
```

It writes `delivery/capability-map.html` and prints the `file://` URL plus a one-line summary (intents · epics · phases) and any data notes. `--out <file>` writes somewhere else.

If the script exits with **"No intents/ directory yet"** or **"Missing … Run /ql-ingest-scopezilla"**, scope hasn't been ingested into this repo yet — run `/ql-ingest-scopezilla` first, then re-run this. (The map can only show what's been ingested; it never invents scope.)

## Step 2 — Open it

Open the printed `file://` URL in a browser (or `open delivery/capability-map.html` on macOS). Each phase is a band; each epic a column; each intent a card you can click for its full panel (build target, acceptance, dependencies, ledger status).

## Step 3 — Read what it surfaces, then facilitate

Before presenting, read the summary line and every footer **data note**, and tell the user each one by type (below) with its ids, or say "no data notes". They are signals worth knowing going in, not bugs in the map:

- **Low-confidence epics/intents** (Assumed / Draft) — the parts of scope still to be validated with the Product Owner. These are exactly the conversations a gap-closing session exists to have.
- **Unanswered open questions** carried on intents — decision points blocking lock-down.
- **Dependency cycles** between intents (A depends on B *and* B depends on A) — sequencing isn't yet settled. Worth flagging to the architect as a resequencing candidate, not something this skill fixes.
- **Source-reconcile notes** ("placed in phase N per the intent, but the Scopezilla source schedules its epic in phase M", or "epic X isn't in the Scopezilla source") — the intents have been restructured in-repo since the last `/ql-ingest-scopezilla`. The map is showing the *current* intent structure (correct); the note is telling you the source, as last reviewed, is behind. Run `/ql-ingest-scopezilla` to reconcile the source when convenient — the map is right either way, but reconciling clears the notes and restores the source's epic/phase names.

Use the drill-down live: when the PO questions a capability, open its card and ground the discussion in the actual build target and acceptance. When the session surfaces a change, **don't edit scope here** — route it: a correction to a known intent → `/ql-refine-intent`; net-new scope from the discussion → `/ql-capture-intent`. Both record a decision and re-validate. Then **re-run Step 1** so the map reflects the ratified change.

## What this does NOT do

- It does **not** edit, create, or resequence intents. It's a read-only view; scope changes go through `/ql-refine-intent` / `/ql-capture-intent`, which the Trusted Guide ratifies.
- It does **not** update on its own. Re-run after any refinement to see the current shape.
