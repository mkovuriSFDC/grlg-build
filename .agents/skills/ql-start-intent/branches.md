# Start an intent — branch-only paths

Reached from `/ql-start-intent` only when its pointer fires. Each section is a whole path; read the one you were sent to.

## When the whole phase is gated (from Step 3)

If you stopped on a gated intent, check the rest of the current phase before handing back: run the `/ql-check-scope` digest for the phase and read the ledger. If at least one current-phase intent is buildable, name it. If none is (each is ✅ Delivered, 🔧 In progress, or gated on an unanswered `Q-00x` with no answer in `decisions/`), report the phase as a table (intent, ledger status, gating Q-ids) and give the Trusted Guide these routes. Each one is their call, so don't take any of them yourself:

- **Get the answers.** Collect every gating question into one list for the Trusted Guide to take to the customer. Each answer lands as a `decisions/` record plus the `ANSWERED:` marker via `/ql-refine-intent`.
- **Rule a working assumption.** The Trusted Guide can decide a question provisionally. It's recorded the same way, and the `decisions/` record says the answer is provisional so it gets revisited. You never pick the assumption.
- **Narrow the gate.** If a question governs only part of the acceptance rather than the build target or data model, the Trusted Guide can rule to build the rest, with the dependent criteria written `⛔ blocked` on that Q-id (`/ql-test-script`). Record the ruling in `decisions/`; the question stays open.
- **Resequence.** A later-phase intent whose internal dependencies are all delivered can move into the current phase via `/ql-refine-intent` (change `phase:`; the scope hash ignores it). Start it only after that edit is ratified, never as a silent pull-forward.

## When the build happens in an external tool (from Step 5)

When the build happens in an external tool (a builder that reads the remote git repo rather than this Claude Code session), the branch cut is a mechanical step you can hand *to that tool* rather than doing it here — and doing so removes the "was the branch ever pushed?" failure mode, since a branch the build tool creates is born on the remote where the tool can use it. In that setup, keep every trust-significant act in this session — the scope gate (Step 3), readiness (Step 4), design ratification (Step 7), and the ledger `start` flip (Step 6) — and treat the **ledger flip as the "go" signal, not the branch**. The build tool then cuts and pushes `feature/<engagement>/INT-00x-slug` (to the naming convention above) as its first build action. Either way the branch name follows the convention so CI and `deliver --pr` line up.
