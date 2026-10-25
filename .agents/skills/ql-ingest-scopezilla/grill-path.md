# Ingest — the grill path (`--grill`)

Reached from `/ql-ingest-scopezilla` Step 4-grill.

Reach here when the user passed `--grill` or accepted the Step 2 offer. This **replaces** the deterministic Step 4a transform (first ingest) or works the reconcile's worklist (populated repo, per Step 4b). The point is a working session, not a pipeline: you and the human go through the scope together and land good, buildable living intents.

> **Same session, one difference — where the intent comes from.** This is the *same* interactive shaping session `/ql-grill-intents` runs on **existing** living intents (the four shapes, the facts/decisions posture, the membrane, the conditional scrub — all canonical there). The one difference is authoring: at ingest the intents **don't exist yet**, so this path **authors them directly** from upstream (the `new` scaffold, below) instead of decide-and-routing through `/ql-refine-intent` / `/ql-capture-intent` the way `/ql-grill-intents` does. Reshaping intents *after* ingest — a mid-engagement drift check, a phase-2 grill — is `/ql-grill-intents`, not a re-run of this.

**What "the rich source" is, and why it matters.** The deterministic transform reads only `data/intents.json`. The grill may read the *whole* Scopezilla project at `<src>` for context — `discovery-notes/`, `knowledge/`, `outputs/*.md`, the deliverables — because that's where the detail to rebuild a thin intent or justify a split actually lives. Reading it is the grill's job; **landing any of it in the repo is forbidden** (see the membrane below).

## The session, the membrane, and the scrub — same as `/ql-grill-intents`

Run the sitting **exactly as `/ql-grill-intents` specifies**, grilling each intent relentlessly — the four shapes (good-as-is / oversized→split / thin→rebuild / reconcile-against-the-build), the facts-vs-decisions posture, the lane boundary (refine the *expression* of scope, never originate it), and the dirty-source membrane (provenance is a pointer, never a quote) are all canonical there (its Step 3 and Step 5). Go intent by intent — first ingest: the whole set; populated repo: only the 🆕 + 🔴 worklist from Step 4b.

The membrane is at its **sharpest** on this path: ingest reads the *most* sensitive material to rebuild the *most* scope, so the scrub-verify pass (Step 4-grill-scrub) is **unconditional** here.

## Authoring each ratified intent

Use the engine's scaffold — the same primitive `/ql-capture-intent` uses — so grilled intents are honest `origin: local` living intents, collision-safe, never clobbering:

```bash
node launchpad/scripts/intent-ledger.mjs new --phase <N> --title "<title>"    # prints the allocated INT-NNN
```

Then fill the scaffolded `intents/INT-NNN/intent.md`:

- **Body sections** (`build_target`, `guardrails`, `out_of_scope`, `acceptance`, dependencies, open questions) — written as clean, derived prose. No verbatim source.
- **`derived_from:` frontmatter** — the provenance pointer(s), comma-separated on one line: the upstream intent ID(s) this came from, qualified with the source name, or the epic/requirement ID when rebuilt from below-intent-level context. A split stamps every child with the parent's pointer. Example: `derived_from: discovery-2026#INT-014` or `derived_from: discovery-2026#E05, REQ-042`. (Provenance metadata only: the engine doesn't read it, and it's excluded from the scope hash.)
- **`## Grounding`** — in a grounded/ARB engagement, preserve the requirement ID / approved-architecture reference exactly as the deterministic transform would (source-qualified, `<name>:<path>@<sha>`), so the `conformance` report keeps working. **On a rebuild, actively re-assert the requirement-level trace** — a rebuilt intent must still say which requirement it satisfies.

Then stamp and validate as usual:

```bash
node launchpad/scripts/intent-ledger.mjs hash INT-NNN        # print the scope hash (a test script stamps `hash --proof`)
node launchpad/scripts/intent-ledger.mjs validate            # confirm it parses, sections present, deps resolve
node launchpad/scripts/intent-ledger.mjs ratify INT-NNN --by "<name>"   # the human ratified it in this session
```

Open a ledger row for each with `node launchpad/scripts/intent-ledger.mjs sync` — it adds a `⬜ Not started` row for every intent that lacks one and re-derives the footer count and README index. On a populated repo, an accepted 🔴-conflict resolution updates the existing row rather than adding one; a 🆕 add gets a new row.

## The session decision record

Write **one** `decisions/YYYY-MM-DD-scope-grill.md` for the whole session (copy `launchpad/decisions/TEMPLATE.md`), recording what was split / rebuilt / confirmed / escalated and **why** — sources cited **by pointer, never quoted**. This is the paper trail for the shaping calls the human ratified and the provenance of every derived intent. For an escalated scope gap, add a line naming the gap; then **offer** (default off) to draft an upstream issue for the Scopezilla team (with the Salesforce plugin installed, its curated-KB skill lists the upstream sources and how to file there) — scrubbed of client/org specifics, since it lands in the public plugin-adjacent repo. The human decides whether it goes upstream.

Once every ratified intent is authored, stamped, and validated, run the scrub-verify pass before anything is considered landed.

## Step 4-grill-scrub — Independent scrub of the authored output

The membrane's backstop, and **always warranted here** — the ingest grill reads the dirty rich source by definition, so the scrub is not conditional on this path (unlike `/ql-grill-intents`, where it fires only when a dirty source was opened). Because you (the authoring session) have read the source, you're not a reliable judge of whether the *output* leaked it — the check must be made by a reader that **never saw the source**, judging the files purely on their face.

Run it exactly as **`/ql-grill-intents` Step 5** specifies (the canonical scrub-verify mechanics: fresh-context subagent → fresh session → isolated re-read, by harness capability; the reader gets *only* the authored output, never the source). Here the authored files are this session's new/changed `intents/INT-NNN/intent.md` and the `decisions/YYYY-MM-DD-scope-grill.md`. Surface findings, resolve each before the files are considered landed. Nothing commits here regardless — but the scrub gates the session's *"done."*

## Guardrails on this path

- The dirty-source membrane (AGENTS.md) holds at its sharpest here: nothing verbatim from the rich source lands in any repo file, and no dirty source goes in a scratch file, gitignored ones included.
- **Don't** give the scrub reader (subagent, fresh session, or isolated re-read) the source — only the authored output files. Its independence *is* the check; feeding it the transcripts defeats it. And don't skip the scrub because your harness lacks subagents — use the fresh-session or isolated-re-read fallback instead.
- **Don't** invent scope to fill a gap. A source too thin to rebuild honestly is a Scopezilla scope gap — escalate it (decision-record line + optional upstream issue), don't guess.
- **Don't** grill a settled (🔵 refined-in-repo) intent on a populated repo. The grill only works the reconcile's 🆕 adds and 🔴 conflicts; the never-clobber rule stands.
- **Don't** author grilled intents through `from-json` — they're derived, not transformed. Use `new` (origin local) so a future reconcile correctly treats them as locally-authored, not upstream-deleted.
