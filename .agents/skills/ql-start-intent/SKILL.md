---
name: ql-start-intent
description: >-
  Open one intent to build — clear context, confirm it's in scope, cut its feature branch, flip the ledger to in-progress, draft its test script, and assemble its build brief. The front of the per-intent build loop, chaining /ql-check-scope, /ql-vet-intent, /ql-design-intent, and /ql-test-script. This owns "build INT-" (opening the intent to build); for the architecture/approach only, use /ql-design-intent. Triggers — "start an intent", "build INT-", "/ql-start-intent".
produces: A `feature/<engagement>/INT-00x-slug` git branch + the intent's ledger row flipped to In progress; chains /ql-design-intent and /ql-test-script, which write the design.md and test-script.md; the gitignored build brief, with its stamp and routing line in the build-rulings note. No commit of built code (the build is yours from there).
---

# Start an intent — open one unit of work the right way

This skill opens **one unit of work** — a single intent — so it begins on its own branch, with its ledger row flipped and its proof plan drafted, in a fresh context. It's the front of the per-intent loop: it doesn't re-implement `/ql-check-scope`, `/ql-vet-intent`, `/ql-design-intent`, or `/ql-test-script`, it *sequences* them and adds the three things nothing else does — the context-clear nudge, the feature branch, and the ledger flip.

Why this matters: an intent that starts on the wrong branch (or on top of the last intent's branch), without its ledger row moved or its proof plan drafted, is already off the trust chain before a line is built. This skill makes the disciplined start the easy one.

**The lane.** You build to Intent on a feature branch and take it as far as a **PR into the integration line** (`develop`, or the branch Step 5 picks). That's where your autonomy ends. Cutting `release/*` branches and promoting to production are the **Trusted Guide's** calls — the human owns the release gate and the customer. Don't open release branches or push toward prod on your own.

## Step 1 — Clear context first (advisory)

A fresh intent deserves a fresh context. If this session already carries work from another intent, a debugging thread, or a long exploration, **recommend the user run `/clear`, then re-invoke `/ql-start-intent INT-00x`** — stale build state from the last unit of work leaks bugs and false assumptions into the next one. A skill can't clear its own context; this boundary is the one place the nudge reliably lands, so surface it rather than skip it.

If the session is already clean (you've just started, or just finished a `/clear`), say so and continue.

## Step 2 — Resolve the intent

Take the `INT-00x` id from the user. Confirm it exists and read its identity:

```bash
node launchpad/scripts/intent-ledger.mjs hash INT-00x   # confirms it exists; prints its id, scope hash and title
```

If the id doesn't match, stop and list the intents (`node launchpad/scripts/intent-ledger.mjs hash` with no id). If no id was given, list them and ask which one.

**Snapshot mode** (`intent_storage: "snapshot"` in `engagement.json`): first refresh this intent from the tracker (`/ql-sync-jira` → "Snapshot mode", Refreshing). If the refresh reports a scope change, stop: the Trusted Guide ratifies the new text before anything is built to it. Commit the refreshed copy on the feature branch.

Then read the full intent from `intents/INT-NNN/intent.md` (the living canonical Intent). You need its `phase`, `title`, and a short slug derived from the title for the branch name. Keep the slug lowercase, hyphenated, a few words (e.g. INT-005 "Allocate the closest qualified practitioner" → `practitioner-allocation`).

## Step 3 — Scope reflex

Before building anything, confirm the intent is actually buildable now — invoke `/ql-check-scope` on it (in a harness that can't chain skills, follow its Steps 1–3): is it **current-phase** (not a future-phase intent you'd be building early), **not already ✅ Delivered** in the ledger, and **not gated on an unanswered open question** (`Q-00x`, cross-checked against `decisions/`)? State the verdict as one line per check. If it's deferred, delivered, or blocked, say so and stop — don't open a branch for work that shouldn't start.

```bash
node launchpad/scripts/intent-ledger.mjs drift   # also confirms the intent isn't already delivered/drifted
```

**When the whole phase is gated** (you stopped on a gated intent): check the rest of the phase and give the Trusted Guide its routes, per `.claude/skills/ql-start-intent/branches.md`, or `.agents/skills/ql-start-intent/branches.md` on other harnesses, or `${CLAUDE_PLUGIN_ROOT}/skills/ql-start-intent/branches.md` on a plugin-only checkout.

## Step 4 — Readiness reflex

`/ql-check-scope` settled *should I build this?* — now confirm *is the intent ready to build against?* Invoke `/ql-vet-intent` on it (or follow its steps where skills can't chain): is the `build target` concrete, the `acceptance` provable, the silence honest (open questions, not guesses), the cascading Salesforce work and dependencies acknowledged? If it surfaces a **⛔ Not ready** finding — an unprovable acceptance, a silent gap on a core requirement, a build target too vague to implement — surface it and **pause**: the fix is a human-ratified edit via `/ql-refine-intent` (or `/ql-capture-intent` for a gap that's really its own intent), not something to power through. A buildable-with-caveats verdict is fine to proceed on with the caveats named. **Done when** its verdict is stated: Ready, buildable with each caveat named, or Not ready.

## Step 5 — Cut the feature branch

One branch per intent, named `feature/<engagement>/INT-00x-slug` (e.g. `feature/acme-2026/INT-005-practitioner-allocation`). The engagement slug keeps two engagements' INT-005 apart, here and in PR titles and commit messages (`acme-2026/INT-005`).

**Adapt the base/target to the repo's actual pipeline** — read what's there, don't assume:

```bash
git branch -a            # is there a develop branch?
ls .github/workflows/    # are the feature-ci_* workflows present?
```

- **Full pipeline** (a `develop` branch exists, or `feature-ci_*.yml` workflows are present): base the branch off `develop` and target your eventual PR at `develop`. This is the canonical flow — `feature/* → develop → release/* → main → prod`.
- **Simple flow** (only `main`, with `sf-validate.yml` + `sf-deploy.yml`, e.g. a repo seeded before the four-workflow pipeline): base off `main` and target `main`.
- **Neither** (no `develop`, and no deploy pipeline yet, only `intent-trust-chain.yml`): base off and target the repo's default branch, and say the repo has no deploy pipeline (`/ql-resync` offers one as an add-on).

State which you chose and why ("Found a `develop` branch and `feature-ci_*` workflows — basing off `develop`."). Make sure the base is up to date first:

```bash
git checkout <base> && git pull     # <base>: develop, main, or the default branch, per the cases above
git checkout -b feature/<engagement>/INT-00x-slug
```

**Push the branch if anything beyond this local checkout will build on it.** `git checkout -b` creates the branch *locally only* — a teammate or an external build tool that reads the remote repo can't see it until it's pushed:

```bash
git push -u origin feature/<engagement>/INT-00x-slug
```

For cross-cutting foundation work that maps to no single intent, `feature/phase-N-foundation` is the fallback name — but prefer per-intent branches.

**When the build happens in an external tool** (a builder that reads the remote repo), the branch cut can be handed to it; read `.claude/skills/ql-start-intent/branches.md`, or `.agents/skills/ql-start-intent/branches.md` on other harnesses, or `${CLAUDE_PLUGIN_ROOT}/skills/ql-start-intent/branches.md` on a plugin-only checkout for what stays in this session.

## Step 6 — Flip the ledger to in-progress

```bash
node launchpad/scripts/intent-ledger.mjs start INT-00x [--pr <ref>]
```

This is the ledger write that **opens** the work (`deliver`, `retire` and `reverify` are its lifecycle siblings) — it flips the row to 🔧 In progress, is idempotent, and refuses to reopen a ✅ Delivered or 🔄 Needs re-verify row. Pass `--pr` once you have a PR number; it's fine to start without one and add it when the PR opens. If `start` warns the intent isn't ratified, ask the Trusted Guide now — they've just read it with you in Step 4 — and record it with `node launchpad/scripts/intent-ledger.mjs ratify INT-00x --by "<their name>"`. Never ratify it yourself; `deliver` refuses a draft with no ratification or a stale one (a missing record only warns). If the engagement reports through Jira, `/ql-sync-jira start INT-00x` is the scoped, transition-only path that flips the ledger *and then* the Jira story (ledger first, always).

> **Start the intent when the *work* begins — including design review — not when coding begins.** The ledger tracks the delivery lifecycle (⬜ / 🔧 / ✅ / 🔄 / 🚫), not a project-management workflow, so a design-review window is correctly 🔧 In progress. A felt need for an "in design" status means sequence the start here, not add a state.

## Step 7 — Design the approach (when it's non-trivial)

If the intent creates an object, changes the sharing or FLS of what already exists, adds an integration, or adds Apex, hand off to `/ql-design-intent` to propose the Salesforce build approach **before** you build: the data model, the sharing & security (with the cascading app/page/layout work), the automation choice (standard-first), the integration pattern, and the alternatives considered. It writes `intents/INT-00x/design.md` (beside the intent). The Trusted Guide **ratifies it before the build starts**, recorded with `node launchpad/scripts/intent-ledger.mjs ratify INT-00x --design --by "<name>"` on their say-so — catching a wrong relationship type or a should-be-declarative-Apex call while it's cheap.

An intent that does none of those four skips the design; say which you checked. The brief (Step 9) still gives it the neighbourhood and the existing-org read, which is where a "trivial" field turns out not to be.

## Step 8 — Draft the test script up front

Hand off to `/ql-test-script` to draft this intent's proof plan **before** you build — `intents/INT-00x/test-script.md` (beside the intent), decomposing every guardrail, acceptance clause, and out-of-scope denial into discrete criteria marked by how each is proven. Building against the proof plan (rather than writing it after) is what keeps "done" meaning *proven*. With a ratified design in hand (Step 7), the proof plan is drafted against a real approach, not guessed. Invoke the skill; it writes the file.

## Step 9 — Assemble the build brief, then build to it

Every build agent builds to the same brief: what to build and the rules to follow, from ratified sources, never how to build (`decisions/0082`). Pick the build agent with the Trusted Guide for this intent: the Launchpad recommends **sf-pi** for interactive Salesforce work and **MeshMesh** for a hosted build; Claude Code, SEAP and any harness following the open standards also build. Then:

```bash
node launchpad/scripts/intent-ledger.mjs brief INT-00x --agent <picked> --recommended <recommended> [--for hosted]
```

It writes `.launchpad/briefs/<engagement>/INT-00x.md` (gitignored) and prints its **stamp line**. Warnings at the top of the brief (an unratified intent or design, a stale proof plan) are the Trusted Guide's to clear or accept; with `--for hosted` the engine refuses until they're cleared, because nobody is watching a hosted build.

**Fill the brief's judgment slots** before anyone builds from it:

- **Existing org (§6).** Name the metadata this intent will create or touch, then look for it: local `force-app/**` first (per `sfdx-project.json`; always available) and a tied Scopezilla source's head-start prototype briefs (AGENTS.md, brownfield), then a targeted org query when an org is reachable (`sf sobject describe` for a field, the tooling API for automation, or the build toolkit's skills). Record the disposition of each: a **clean match** (reuse it), **genuinely different** (proceed), or a **collision / structural duplicate / untracked-in-org** — which **stops** for the human's call (route to `/ql-design-intent` or `/ql-refine-intent`). When unsure, treat it as hard to reverse and stop. If neither the repo nor an org can be read, write `⚠ org not consulted` and confirm with the human (`decisions/0005`). Done when every metadata item you named has one disposition.
- **Grounding (§7)**, when the intent is grounded: the short excerpts that matter, read in place with `source show`.
- **Other engagements' hits (§4)**, when there are any: for each, whether it constrains this build and how. A standing premise in §4 (`Source: scopezilla-inherited`) gets the one question even a trivial change must pass: does this cut against it? If so, that's a deviation for `/ql-design-intent` Step 6b, never a silent one.

**Record the routing** at the top of the build-rulings note (Step 10), with the stamp line the brief printed:

```
routing: recommended <x>, picked <y>, <accepted|override>, <why>
brief: <the stamp line>
```

**Hand it to the build agent.** In this session, or another interactive agent: read the brief and build to it, re-reading it after any context reset (your memory of the planning is not the source). A hosted build: `/ql-drive-meshmesh` with the brief as its input. While the build runs, `/ql-check-scope` is still the reflex before acting on feedback.

## Step 10 — While you build: rulings, not stalls (decisions/0066)

This step governs the build session's conduct. The rules are the brief's §9, the one canonical copy: decide where the intent and design are silent on *how*, stop and ask where §9 says to, and keep to the lane. The note is done when every ruling is in it and carried into PR §6.

Write each ruling down when you make it (`<ruling> — <why> — <cost if wrong>`) so it survives a context reset, and each stop-and-ask the same way as `- ASKED: <question> — <the human's answer>`. Keep them in one dated build note for this build, `decisions/YYYY-MM-DD-INT-00x-build-rulings.md`, under the routing and stamp lines from Step 9: the first ruling creates it (append if it already exists, e.g. after a restart), with **Deciders:** `agent rulings, pending Trusted Guide review in PR §6` so nobody reads it as ratified. Carry the list into PR §6 when you open the PR; §6 says how the note is closed out at review.

## Step 11 — Close out: from deployed build to PR

Run this once the build is deployed to its build org, before the PR opens. Each line is done only on the evidence it names. With no reachable org, run items 1 and 2 anyway: item 1 records `⚠ org not verified`, which is not proof, so name each such criterion as unverified in PR §2, whatever preflight prints.

1. **Org-probe** — if the test script has `org-probe` ✅ criteria, run `/ql-verify-build INT-00x`. Done when every org-probe criterion has a Sign-off cell from this run, on the PR's commit (decisions/0031).
2. **Preflight** — `node launchpad/scripts/intent-ledger.mjs preflight INT-00x` runs the coverage and drift checks CI would. Done when it prints `✅ Ready to deliver`, or each hold it names is fixed or listed in PR §6 (advisory, never a gate).
3. **Deliver** — as you assemble the PR, `node launchpad/scripts/intent-ledger.mjs deliver INT-00x --pr <ref>` flips the row to ✅ Delivered, stamps the scope hash, and refreshes the delivery index in one write (PR template §2). `start` opens; `deliver` closes.
4. **Trust chain ran** — once the PR is open, `gh pr checks <n>` (or the Checks tab) shows the trust chain ran. No checks reported → see "Prerequisite — enable GitHub Actions" in `.github/workflows/README.md` (a warning, never a block).
5. **Outcomes** — when the PR is approved and green, record the build's outcomes as its last commit: `node launchpad/scripts/intent-ledger.mjs outcomes INT-00x --kind <field|object|flow|apex|lwc|integration|permissions|data|config|other> --red-runs <n> --review-rounds <n>`. Read both counts, never estimate them: red runs are the failed trust-chain runs before the first green on the branch (`gh run list --branch <branch> --workflow intent-trust-chain.yml --json conclusion`), review rounds are the PR's change requests (`gh pr view <n> --json reviews`). The engine counts the note's rulings and `ASKED` lines itself.

## What this does NOT do

- It does **not** cut `release/*` branches or promote to production — those are the human's (see **The lane**, above Step 1).
- It does **not** re-implement `/ql-check-scope`, `/ql-vet-intent`, `/ql-design-intent`, or `/ql-test-script` — it sequences them.
- It does **not** edit the intent itself (`intents/INT-NNN/intent.md`) — refining scope is `/ql-refine-intent` / `/ql-capture-intent`. Its writes are the ledger `start` in Step 6, the gitignored brief in Step 9, the build-rulings note in Step 10, and the close-out writes in Step 11.
- It does **not** build the intent. It opens the unit of work cleanly; the build is yours from there.
