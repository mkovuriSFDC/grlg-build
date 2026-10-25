# Intent delivery ledger

> The backward link between scope and delivery. `intents/INT-NNN/intent.md`
> is the canonical WHAT (living — refined in-repo); this file tracks STATUS —
> which intent was built, in which PR, with what evidence, against which version
> of the scope.
>
> **Written by the ledger commands, not by hand.** `start INT-00x` opens a row
> (🔧 In progress); `deliver INT-00x --pr <ref>` closes it out as you assemble the
> PR — atomically flipping to ✅ Delivered, stamping the current scope hash, and
> refreshing the README index. When `drift` finds a delivered intent whose
> scope moved after you built it, `reverify INT-00x` flips the row to 🔄 (keeping
> the hash + PR); `deliver` re-stamps it once the build is re-verified.

Status: ⬜ Not started · 🔧 In progress · ✅ Delivered · 🔄 Needs re-verify (scope drifted) · 🚫 Retired (de-scoped)

| Intent | Phase | Status | PR | Evidence | Scope hash @ delivery |
|--------|-------|--------|----|----------|-----------------------|
| INT-001 | 1 | ⬜ Not started | — | — | — |
| INT-002 | 1 | ⬜ Not started | — | — | — |
| INT-003 | 1 | ⬜ Not started | — | — | — |
| INT-004 | 1 | ⬜ Not started | — | — | — |
| INT-005 | 1 | ⬜ Not started | — | — | — |
| INT-006 | 1 | ⬜ Not started | — | — | — |
| INT-007 | 1 | ⬜ Not started | — | — | — |
| INT-008 | 1 | ⬜ Not started | — | — | — |
| INT-009 | 1 | ⬜ Not started | — | — | — |
| INT-010 | 1 | ⬜ Not started | — | — | — |

_10 intents across phase(s) 1. Seeded from `intents/`._
