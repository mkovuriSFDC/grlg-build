---
id: INT-005
phase: 1
epic: E02
confidence: Unknown
surface: data-model
origin: scopezilla
source: grlg-discovery-2026#INT-005
title: Commerce data from all three hubs lands in one shared model
ratified: 2026-10-25 by Madhuri @ 382286216a4f · absorbed
---

# INT-005 — Commerce data from all three hubs lands in one shared model

## Outcome

Transactions and carts from the three Australian TAMS Commerce hubs read the same way in Data 360, whatever each hub's local schema extensions, so one segment can span all hubs.

## Build target

- A shared commerce model for transactions, line items, and carts that all three hubs map into
- Each hub's local schema extensions translated into the shared fields
- Transaction and cart IDs prefixed by hub so records from different hubs can never collide
- The 500+ transaction types grouped into business categories (for example sale, return, void, loyalty accrual, redemption)
- Every record tagged with hub, store, and channel

## Guardrails

- Card numbers must not be mapped into the model; tokens or last-4 only.
- Amounts stored in AUD with an explicit flag for whether tax is included.

## Out of scope

- Must not configure identity matching (Phase 2).
- Must not build calculated insights or segments (Phase 3).

## Acceptance

Mei, a Data Engineer, queries all sales in the last week and sees transactions from Hub 1, Hub 2, and Hub 3 side by side with the same fields, each ID carrying its hub prefix. A Hub 3-only 'click and collect' type appears under the Sale category.

## Success criteria

_none_

## Dependencies

### Internal
_none_

### External
- TAMS Commerce (3 Australian hubs) | data dictionary for each hub's schema extensions, sample extracts, and the transaction-type catalog (G0203, G0204) | owner: GRLG TAMS platform team

## Open questions

- Q-008: Are the 500+ transaction types values of one field or distinct record structures? (Resolver: GRLG TAMS platform team) — ANSWERED: Provisional: values of one type field, grouped by a category mapping. See decisions/2026-10-25-int-005-provisional-tams-assumptions.md
- Q-009: Are amounts consistently GST-inclusive or GST-exclusive across hubs? (Resolver: GRLG finance + TAMS team) — ANSWERED: Provisional: all three hubs send GST-inclusive amounts. See decisions/2026-10-25-int-005-provisional-tams-assumptions.md
- Q-010: Are transaction IDs unique only within a hub? How are voids, refunds, and edits represented? (G0206) (Resolver: GRLG TAMS platform team) — ANSWERED: Provisional: IDs unique only within a hub; voids, refunds and edits arrive as new records linked to the original. See decisions/2026-10-25-int-005-provisional-tams-assumptions.md

## Grounding

- Source: grlg-discovery-2026#INT-005
