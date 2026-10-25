# Offline mode — full plan without Jira access

Reached from `/ql-sync-jira`'s Prerequisite when neither transport can be reached and nothing is quickly fixable.

When neither transport is reachable (auth failure, network block, OAuth denied, or `jira.config.json` missing entirely), the skill still has everything it needs for the plan: the living intents, the ledger, and the Scopezilla epics (when present) are all in the repo. Offline mode computes the complete projection plan from those sources — identical to Steps 1–3 of the live flow, with one simplification: no JQL lookup, so Jira is assumed empty and every item is a `CREATE`.

**What changes in offline mode:**

- **Step 1 (desired state)** — identical. Read the sources' epics (if any, as above), all `intents/INT-NNN/intent.md`, and `delivery/intent-ledger.md` exactly as in the live flow, including the no-epics rule.
- **Step 2 (JQL lookup)** — skipped. The in-memory `label → issue key` map starts empty. No transport needed.
- **Step 3 (plan)** — every item is `CREATE` (no `UPDATE`, no `TRANSITION`, no `COMMENT` — those require knowing what already exists). The plan is still sorted: epics first, stories under them, sub-tasks under stories.
- **`jira.config.json` absent** — proceed with defaults (`project_key: "UNKNOWN"`, `issue_types: {epic:"Epic", intent:"Story", open_question:"Sub-task"}`) and **flag each assumption explicitly** in the plan output so the user can correct them before executing.
- **No files written** — not even the `jira.config.json` stub; the config is created on the first live run.
- **Step 4 (apply)** — not offered in offline mode. The plan is read-only; no transport means nothing can be pushed. Tell the user clearly: "This plan is ready to execute once a Jira transport is available — run `/ql-sync-jira` again with MCP or API token configured to push it."

**What the output looks like:**

> ⚠️ **Offline mode** — neither transport is reachable. Treating Jira as empty; all items are CREATEs.
>
> Using defaults: `project_key: UNKNOWN` (update `delivery/jira.config.json` before pushing).
>
> ```
> CREATE epic E01 "Patient Portal & Onboarding" (phase 1–3)
> CREATE story INT-001 "…" → epic E01
> CREATE sub-task Q-001 "…" → INT-001
> …
> ```
>
> **101 operations total** (10 epic CREATEs, 25 story CREATEs, 66 sub-task CREATEs).
>
> To push: configure a transport (`/ql-setup`) then re-run `/ql-sync-jira`. The first live run will create everything shown above; subsequent runs update only what changed.

The plan is the artifact — a preview to share with a PM or paste into a ticket before Jira access is sorted. **Push it by re-running `/ql-sync-jira` live, not by hand.** The live run anchors identity on durable `intent:<id>` labels and does the JQL lookup that dedupes against existing issues; hand-creating issues from this one-line plan skips both, so the labels are lost and the next live run can't tell your manual issues from missing ones — it duplicates them.
