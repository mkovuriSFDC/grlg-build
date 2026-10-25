---
name: ql-ingest-scopezilla
disable-model-invocation: true
description: Ingest a Scopezilla project in place, turning its scoped intents into living intents and seeding delivery scaffolding, for a first ingest, a re-ingest, or a follow-on project.
produces: >-
  Living `intents/INT-NNN/intent.md` files (each recording its `source:`), a tied-source entry in the engagement profile, seeded `delivery/phase-N/` + `delivery/intent-ledger.md`, engagement details in the engagement README, adopted architecture ADRs in `launchpad/decisions/architecture/`, and a kickoff `decisions/` record. On re-ingest: a reconcile report only (never clobbers). On the `--grill` path: interactively-shaped living intents (origin local, `derived_from` provenance, intact `## Grounding`) authored via the `new` engine command, plus a `decisions/YYYY-MM-DD-scope-grill.md` session record and, optionally, a drafted upstream Scopezilla issue for scope gaps too thin to rebuild. No commit.
---

# Ingest Scopezilla output

You are pulling a Scopezilla scoping project into this AI-native delivery engagement. The scoping work has already been done in a separate project (a folder from Scopezilla's recent-projects list, or a cloned `scopezilla-<slug>` repo). This skill **ties that project to the engagement as a source**, **transforms its scoped intents into living per-intent files under `intents/`**, populates engagement metadata, and seeds the delivery scaffolding.

**Nothing from the Scopezilla project is copied into this repo** (`decisions/0082`). The repo is the customer's, and a scoping project holds deal and discovery material that doesn't belong in their history. The project is read **in place**: its location stays in the gitignored `.launchpad/local.json`, and the engine reads its files with `node launchpad/scripts/intent-ledger.mjs source show <name> <path>`. The one deliberate exception is an architecture ADR the Trusted Guide **adopts** (Step 4c): it becomes the engagement's own record.

Run **after** `setup` (which handles tooling). This skill handles engagement content.

> **Harness note.** Some steps use `AskUserQuestion`. In a harness without it, ask the same question as plain text with the options enumerated — the shape of the question matters, the tool doesn't.

> **Two paths through Step 4.** Everything else in this skill — locating and tying the source, the pre-flight, the existing-content guard, the metadata/delivery/ledger seeding — is shared. Only the transform in the middle forks:
>
> - **Deterministic (default).** `from-json` turns the scoped intents into living files. Fast, reproducible, right when the Scopezilla scope is clean.
> - **Interactive grill (`--grill`, or offered when the scope looks rough).** Instead of a straight transform, you sit down with the human over the *rich* Scopezilla source and shape it into buildable intents — split an oversized intent, rebuild a thin one from the discovery context, confirm the good ones as-is. The deliverable here is the **conversation**, not a classifier: you exercise judgment (informed by the ~24-hour build-validate-demo cycle as a *prompt*, not a hard gate) and the human ratifies each call. See **Step 4-grill**.
>
> Both paths are bound by the dirty-source membrane in `AGENTS.md`.

> **Scopezilla is a context source, not the scope of record.** `intents/INT-NNN/intent.md` is the **living canonical Intent**: human-owned, refined in-repo via `/ql-refine-intent` and `/ql-capture-intent`, with git + `decisions/` as its provenance. A first ingest *seeds* `intents/` from the source; after that **the repo owns the intents** — a re-ingest *reconciles and reports* against the source as last reviewed (its **cursor**), and never overwrites your refinements. An engagement can tie several Scopezilla projects over its life (a follow-on project for the next phase): each is its own named source, and the engagement allocates every intent id, so their numbers never collide.

## Step 1 — Locate and tie the source

The user must point at a Scopezilla project root. If they invoked the skill with a path, use it. Otherwise, if `.launchpad/local.json` records a `scopezilla_source` (set when the repo was seeded), offer that. Otherwise ask. If the engagement already has tied sources (`node launchpad/scripts/intent-ledger.mjs source list`), say which and ask whether this is a re-ingest of one of them or a **new** project for this engagement.

Validate:

- `<src>/.project-metadata.json` exists. If missing, abort: "That doesn't look like a Scopezilla project — no `.project-metadata.json` at the root. Point me at the project's root folder and re-run."
- `<src>/data/intents.json` exists. If missing, abort: "That project has no scoped intents yet (`data/intents.json`). Run `/scopezilla-dev:quantum-leap` in the Scopezilla project to produce them, commit `data/`, then re-run."

Use these messages as written. When `data/intents.json` is on disk but `source show <name> data/intents.json --at head` fails with `No data/intents.json in <name> at head`, the file isn't committed (the engine reads the project's last commit): abort with "`data/intents.json` isn't committed in the Scopezilla project. Commit `data/` there, then re-run."

The `quantum-leap` build bundle (`<src>/outputs/quantum-leap/`) is **optional**: the Launchpad assembles its own build brief. When the project has one, the pre-flight and the phase seeding read a few details from it.

**Tie it** (first time for this project). Propose a short name for the source: the project slug without the `scopezilla-` prefix plus a year or phase (`discovery-2026`, `phase2-2027`), lowercase with hyphens. The Trusted Guide confirms it; it appears in every intent's `source:` line and can't change once an intent records it. The Scopezilla slug is the project's own (its repo name without `scopezilla-`, or its folder name):

```bash
node launchpad/scripts/intent-ledger.mjs source tie <name> --slug <scopezilla-slug> --path "<src>" [--role follow-on]
```

This writes `{name, scopezilla_slug, role, cursor, tied_at}` into the engagement profile and the folder path only into `.launchpad/local.json`. A teammate who clones finds the project from the slug (their recent-projects list, `gh` search, or a pasted path), clones it themselves if they don't have it, and re-runs the tie with `--path` on their machine.

## Step 2 — Pre-flight summary

Read `<src>/.project-metadata.json` in place, plus `<src>/data/roadmap.json` and `<src>/data/epics.json`. Surface a one-screen summary:

- Project name (`project_name`)
- Quantum Leap blueprint (`quantum_leap_blueprint`, top level)
- Target org name + type + build_allowed (`target_org`, top level: `name`, `type`, `build_allowed`)
- Phase count and names (`data/roadmap.json`: `phase_number`, `phase_name`)
- Clouds in scope: the "Clouds in scope:" line of `outputs/quantum-leap/00-agent-brief.md` when the bundle exists; otherwise read them off the epics' names and descriptions
- Depth mode (`depth_mode`)
- Total weeks if `timeline.user_commitment.total_weeks` is set

These reads come off the folder, but the transform reads the project's last commit. Run `node launchpad/scripts/intent-ledger.mjs source status <name>`: if it warns about uncommitted changes in `data/` or `decisions/`, say so in the summary and recommend committing in Scopezilla, then re-running, so the intents you ingest are the ones on screen.

Ask the user to confirm before writing anything.

**Quality read → offer the grill path.** Read the shape of every upstream intent (`source show <name> data/intents.json --at head`): its build-target step count, whether it reads as a placeholder, and whether it's too broad to land in one build-validate-demo cycle. State the tally ("3 of 12 oversized, 1 thin"). This is a shape read, not a `/ql-vet-intent` sweep. Then:

- If the user invoked with **`--grill`**, go the interactive path (Step 4-grill) regardless of what the read shows — they asked for it.
- If the read surfaces **oversized or thin intents** and no flag was passed, surface what you saw and **offer** the grill: *"3 of these 12 intents look oversized for a single build cycle and 1 reads like a placeholder — want to grill the scope interactively instead of a straight transform? (default: proceed deterministic)."* Use `AskUserQuestion`. **Default to deterministic** — a clean source is never slowed down, and the offer is a nudge, not a gate.
- If the read is clean and no flag was passed, say nothing about grilling and proceed deterministic.

The read is judgment you'll reuse *inside* the grill if the user accepts — carry it forward rather than re-deriving it.

## Step 3 — First ingest or re-ingest (per source)

Whether this **source** has been ingested decides the flow, not whether `intents/` is empty: a second project for the same engagement is a first ingest *of that source*.

- **No intent records `source: <name>#…` → FIRST INGEST of this source.** Step 4a transforms it.
- **Some do → RE-INGEST.** The repo already owns those living intents. Reconcile and report (Step 4b) — the human decides what upstream changes to take.

Then:

- **`delivery/`** — if non-empty, default to **merge** (only create phase folders that don't exist). The user has build notes there.
- **`decisions/`** — if a kickoff file already exists for today's date, skip it.

**An old repo with a committed `scopezilla/` mirror** belongs to the migration (`/ql-resync`), which ties the source and removes the mirror in its own PR. Stop and point the user at `/ql-resync`.

If anything's ambiguous, ask the user.

## Step 4 — Read the source in place

Everything below reads `<src>` where it is. The engine reads a file at the reviewed commit with:

```bash
node launchpad/scripts/intent-ledger.mjs source show <name> data/intents.json --at cursor   # or --at head
node launchpad/scripts/intent-ledger.mjs source status <name>                                # what changed since the last review
```

A project with no git is read from its folder; the engine keeps the reviewed copy on this machine only and says so, and the user should hear that teammates can't reconcile it until the project is in git (Scopezilla's `collaborate`).

Stage the upstream intents for the engine in a scratch dir outside the repo:

```bash
TMP=$(mktemp -d)
node launchpad/scripts/intent-ledger.mjs source show <name> data/intents.json --at head > "$TMP/fresh.json"
```

## Step 4a — Transform scoped intents → living `intents/` (FIRST INGEST of this source)

> **Grill path chosen?** If the user passed `--grill` or accepted the Step 2 offer, skip this transform and go to Step 4-grill.

Once the user has confirmed the pre-flight, mark the source as reviewed at what you just read, then transform at that commit:

```bash
node launchpad/scripts/intent-ledger.mjs source ack <name>
node launchpad/scripts/intent-ledger.mjs source status <name> --json      # read "cursor" for --at
node launchpad/scripts/intent-ledger.mjs from-json "$TMP/fresh.json" --source <name> --at <cursor>
```

The engine allocates the engagement ids. Each source intent keeps its own number when that number is free in this engagement, so a first source lines up 1:1; a later source's colliding numbers get the next free ids, and the engine prints every remap (`phase2-2027#INT-001 → INT-013`). Each file records `source: <name>#INT-NNN`, and upstream dependency ids are remapped to engagement ids. The transform is **hash-stable** (the scope hash is identical before and after, so seeding never causes false drift), and `from-json` **refuses to overwrite** an existing intent file, so it can't clobber a refinement. It also checks the project's `contract_version`: output from before the field existed reads as version 1, and a version this engine doesn't know is refused with a pointer to `/ql-resync`. On that refusal, stop and say so; don't edit the JSON to get past it.

**Loss-proof by construction — surface the carry report.** `from-json` doesn't drop upstream fields it has no first-class home for. Architectural **grounding** — a requirement ID, the approved-architecture reference, a wireframe — lands in a `## Grounding` section, with each project-relative location written source-qualified and pinned to the reviewed commit (`discovery-2026:reference/arch.pdf@abc123def456`), so it opens with `source show`. Any *other* unmapped upstream field is preserved **verbatim** under `## Grounding → ### Carried` and **reported on stdout**. Read that report to the user:

- If it says *"Carried architectural grounding for N intent(s)"* — the scope carries **architectural grounding** (a requirement ID / approved-architecture reference). Traceability is now something the `conformance` report can surface, and `/ql-design-intent` / `/ql-vet-intent` will check the build approach against it.
- If it warns *"Preserved N intent(s) with upstream fields that have no first-class schema home"* — list every carried field name and the intent ids it landed on. They were kept, not lost, but a field the transform had to carry-verbatim is a hint the SZ→QL contract may need a first-class home for it (a cross-repo hand-off issue).

Then, if any intent carried grounding, run the conformance report so the user sees the traceability baseline:

```bash
node launchpad/scripts/intent-ledger.mjs conformance     # per-intent grounding traceability (a report, never a gate)
```

If no intent carries grounding, the report says "nothing to trace" — say so and move on.

Confirm the transform:

```bash
node launchpad/scripts/intent-ledger.mjs validate     # every intent parses, sections present, deps resolve
```

If `validate` flags anything, the upstream JSON had a shape the template didn't expect — surface it (and consider an issue for the Scopezilla team); don't hand-patch silently.

## Step 4b — Reconcile fresh upstream against living intents (RE-INGEST only)

Run the read-only 3-way reconcile and walk the human through its buckets; apply only what they ratify, then move the cursor. The commands, the six buckets and what each means, and how a grill composes with it: `.claude/skills/ql-ingest-scopezilla/reconcile.md`, or `.agents/skills/ql-ingest-scopezilla/reconcile.md` on other harnesses, or `${CLAUDE_PLUGIN_ROOT}/skills/ql-ingest-scopezilla/reconcile.md` on a plugin-only checkout. **Done when** every intent the reconcile reported has the human's call recorded, the cursor is moved, and `validate` passes; then continue to Step 6b.

## Step 4c — Adopt the source's architecture ADRs (only if it has any)

**Default zero.** Check with `source show <name> decisions/ --at cursor` (or `ls` it in a folder-only project). None → say "no architecture ADRs in source" and move on. Some → follow `.claude/skills/ql-ingest-scopezilla/adopt-adrs.md`, or `.agents/skills/ql-ingest-scopezilla/adopt-adrs.md` on other harnesses, or `${CLAUDE_PLUGIN_ROOT}/skills/ql-ingest-scopezilla/adopt-adrs.md` on a plugin-only checkout and report the count adopted in Step 8.

## Step 4-grill — Interactively shape scope from the rich source

Reach here when the user passed `--grill` or accepted the Step 2 offer. It replaces Step 4a on a first ingest, or works Step 4b's 🆕 + 🔴 worklist on a populated repo. Run it per `.claude/skills/ql-ingest-scopezilla/grill-path.md`, or `.agents/skills/ql-ingest-scopezilla/grill-path.md` on other harnesses, or `${CLAUDE_PLUGIN_ROOT}/skills/ql-ingest-scopezilla/grill-path.md` on a plugin-only checkout: the session (as `/ql-grill-intents` specifies, grilling each intent relentlessly), authoring each ratified intent with `new`, the session decision record, and the **unconditional** scrub. **Done when** every worklist intent is authored, stamped, validated and ratified, the session record is written, and the scrub's findings are all resolved.

## Step 5 — Populate engagement metadata in the engagement README

Patch the engagement's own `README.md` (in its folder, not the repo root) with an Engagement block delimited by HTML comments so re-runs replace cleanly. It goes nowhere else: a repo can hold several engagements, so the root `AGENTS.md` describes none of them (`decisions/0082`).

```markdown
<!-- ENGAGEMENT:BEGIN -->
## Engagement at a glance

- **Client / project:** <project_name>
- **Blueprint:** <quantum_leap_blueprint>
- **Clouds in scope:** <clouds list>
- **Phases:** <N>
- **Target org:** `<target_org.name>` (<target_org.type>)
- **Depth mode:** <depth_mode>
- **Timeline:** <total_weeks> weeks (if available)
- **Scopezilla sources:** <name> (<scopezilla_slug>)[, <name> (<scopezilla_slug>)]
<!-- ENGAGEMENT:END -->
```

Name sources by name and slug only. If the block already exists (find the `<!-- ENGAGEMENT:BEGIN -->` marker), replace its contents in place; on a later source, add it to the sources line. If not, insert it after the H1 line. An older repo may still carry one in the root `AGENTS.md`: leave it as it is.

In `README.md`, also remove or rewrite the line `After setup, fill in the engagement details above.` since the details are now populated.

## Step 6 — Seed `delivery/`

For each phase in the source's `data/roadmap.json`, create `delivery/phase-N/README.md` (if it doesn't already exist):

```markdown
# Phase N — <phase_name>

<duration line, when the source's bundle has one>

The source's phase plan, when it has one: `source show <name> outputs/quantum-leap/10-phase-N.md`.

## Plan-mode notes

_(Capture answers to Plan-mode questions here as you walk them.)_

## Build log

_(Append build progress, decisions, and gotchas here.)_

## Acceptance evidence

_(Capture pass/fail for each proof criterion (`INT-00x-Cy`) as it lands.)_
```

The duration comes from a `> Phase duration:` line in the bundle's `outputs/quantum-leap/10-phase-N.md`, read with `source show`; leave it out when there's no bundle.

## Step 6b — Seed or reconcile the intent ledger

**Snapshot mode** (`intent_storage: "snapshot"` in `engagement.json`): the tracker holds the text, so write each new or changed intent there and pull it back with the loop in `/ql-sync-jira` → "Snapshot mode" before seeding the ledger. Report any intent whose `pull --check` refused; it stays out of the commit.

`delivery/intent-ledger.md` is the backward link between scope and delivery — one row per intent, tracking status / PR / evidence / the scope hash captured at delivery. The helper `launchpad/scripts/intent-ledger.mjs` seeds it and detects drift. The living `intents/` are the WHAT; the ledger is the STATUS.

Bring the ledger in step with the intents. With no ledger yet, this seeds one (every intent ⬜ Not started); with one, it opens rows for the new intents and leaves every existing row as it is:

```bash
node launchpad/scripts/intent-ledger.mjs sync
```

Then write the README **Delivery index** — a derived, phase-grouped view of intent → status → PR that lives in the engagement `README.md` between `<!-- ENGAGEMENT:INDEX:BEGIN -->` markers (distinct from the Step 5 "at a glance" block). It's regenerated, never hand-edited; CI warns on a PR whose index is stale:

```bash
node launchpad/scripts/intent-ledger.mjs index --write
```

**On a re-ingest**, reconcile the *ledger* to the new intent set once Step 4b's changes are applied:

1. Run the drift check against the now-current `intents/`:

   ```bash
   node launchpad/scripts/intent-ledger.mjs drift
   ```

2. If it reports **🔄 SCOPE DRIFT** for any intent, that intent's `build_target` / guardrails / out_of_scope / acceptance changed **after** it was delivered — whether the change came from upstream (applied in Step 4b) or from an in-repo refinement. Either way it's the same honest signal. For each drifted intent: run `node launchpad/scripts/intent-ledger.mjs reverify INT-NNN` (flips the row to `🔄 Needs re-verify`, keeping the hash + PR — never hand-edit the ledger), and surface it in the Step 8 summary as an explicit action item (re-verify the delivered build against the new intent text; `deliver INT-NNN` re-stamps it if it still holds). Do not auto-resolve — the human decides whether the build still satisfies the changed scope.
3. If `drift` lists intents the ledger tracks that are no longer in `intents/`, take each to the Trusted Guide. A dropped intent is a de-scope: on their call, `node launchpad/scripts/intent-ledger.mjs retire INT-NNN --decision <record>`. Anything else (an id that changed) is a stop: report it rather than editing the ledger.
4. Once the ledger reflects the new scope, refresh the index: `node launchpad/scripts/intent-ledger.mjs index --write`.

Never hand-edit an intent file just to make drift go away — drift is information. The fix is either a deliberate `/ql-refine-intent` (with a decision) or accepting the re-verify; not silencing the signal.

## Step 6c — Offer to refresh the Jira projection (only if already configured)

If — and only if — `delivery/jira.config.json` exists, this engagement already projects scope + delivery status into Jira (via `/ql-sync-jira`). A fresh ingest may have added intents, changed scope, or flipped a ledger row to 🔄, so the Jira side is now behind. Offer (via `AskUserQuestion`) to run **`/ql-sync-jira`** to preview the projection — its plan step shows the diff (new stories, status transitions, any `scope-drift` labels) and writes nothing until the user confirms. Default to **no**; this is a convenience nudge, not part of ingest, and `/ql-sync-jira` is the human-validated path for any actual push.

If `delivery/jira.config.json` does **not** exist, skip this step silently — first-time engagements have no Jira connection and `/ql-sync-jira` sets one up when the user wants it.

## Step 7 — Record the engagement kickoff decision

This step is **not** conditional on Jira — it runs on the first ingest of each source (it is a declared deliverable). Create `decisions/YYYY-MM-DD-engagement-kickoff.md` (today's date; `…-<name>-kickoff.md` for a later source) **only if** no kickoff record for this source exists yet. When the source has a bundle, read `01-engagement-intent.md` and `10-phase-1.md` from it with `source show`; without one, write the Context from the project's own summary in your words.

```markdown
# Engagement kickoff — <project_name>

**Date:** <today>
**Source:** <name> (Scopezilla project <scopezilla_slug>), reviewed at <cursor sha, 12 chars>

## Context

<the Intent paragraph from `01-engagement-intent.md`, or a short derived summary>

## Choice

- **Quantum Leap blueprint:** <blueprint>
- **Clouds in scope:** <clouds>
- **Target org:** `<target_org.name>` (<target_org.type>; build_allowed=<bool>)
- **Phase plan:** <N> phases over <total_weeks> weeks
- **Depth mode:** <depth_mode>

## Consequences (cross-cutting commitments)

<the Pre-decided list from `10-phase-1.md`, when the bundle has one>

These were locked during scoping. Do not re-litigate; surface them as constraints to the build agent.
```

## Step 8 — Summary

If `.launchpad/local.json` lists `ingest` in `pending`, remove it now (keep the file's other fields).

Print a Deliverables block with inline-backtick absolute paths so the user can click to reveal in Finder:

```
**Deliverables**
- `<engagement>/intents/` (the living canonical Intent — one INT-NNN/intent.md per intent, each with its `source:`)
- `<engagement>/engagement.json` (the tied source: name, Scopezilla slug, the cursor it was reviewed at)
- `<repo>/launchpad/decisions/architecture/` (adopted ADRs — **only when the source has any**; report the count, or "no architecture ADRs in source")
- `<engagement>/delivery/phase-1/README.md` (...one per phase)
- `<engagement>/delivery/intent-ledger.md` (seeded on first ingest; drift-checked on re-ingest)
- `<engagement>/decisions/<date>-engagement-kickoff.md`
- `<engagement>/decisions/<date>-scope-grill.md` (**grill path only** — the session record: what was split/rebuilt/confirmed/escalated, sources by pointer)
- `<engagement>/README.md` (engagement "at a glance" + the generated Delivery index)
```

Report any id remaps `from-json` printed, so nobody looks for upstream INT-001 at engagement INT-001 when it moved. On the **grill path**, also report how many intents were confirmed / split / rebuilt / escalated; that the scrub-verify pass ran and what it flagged (or "clean"); and whether an upstream Scopezilla issue was drafted for any escalated gap.

Then suggest next steps:

1. `/ql-start-intent` on the first intent to build; it assembles the build brief.
2. If `sfdx-project.json` is missing, run `sf project generate --name . --manifest`.
3. Authorize the target org: `sf org login web --alias <target_org.name>`.

## What NOT to do

- **Don't** copy anything from the Scopezilla project into the repo: not the bundle, deliverables, `data/`, `reference/`, `knowledge/` or metadata. Read it in place; the one exception is an adopted ADR (Step 4c).
- **Don't** write the project's path or URL into a committed file. It lives only in `.launchpad/local.json`.
- **Don't** delete user content in `delivery/`, `decisions/`, or `intents/` — those have human-authored content after first run. Use merge / reconcile semantics. On re-ingest, **never overwrite `intents/`** — reconcile and report (Step 4b); the human applies what they ratify.
- **Don't** move the cursor (`source ack`) before the human has reviewed the changes. It records that the team reviewed the source up to there.
- **Don't** regenerate Scopezilla outputs. A fresh upstream run comes in via reconcile; in-repo scope corrections are `/ql-refine-intent` and `/ql-capture-intent`, not a patch here.
- **Don't** commit. The user reviews the diff first.
- **Don't** call any `mcp__plugin_scopezilla_*` telemetry tools — this skill runs on the launchpad side, not inside a Scopezilla project.

The grill path's own guardrails are in `.claude/skills/ql-ingest-scopezilla/grill-path.md`, or `.agents/skills/ql-ingest-scopezilla/grill-path.md` on other harnesses, or `${CLAUDE_PLUGIN_ROOT}/skills/ql-ingest-scopezilla/grill-path.md` on a plugin-only checkout.
