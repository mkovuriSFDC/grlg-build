---
id: INT-006
phase: 1
epic: E02
confidence: Unknown
surface: integration
origin: scopezilla
source: grlg-discovery-2026#INT-006
title: Each hub's transaction and cart files load into Data 360 every night
---

# INT-006 — Each hub's transaction and cart files load into Data 360 every night

## Outcome

Every night each Australian hub's new and changed transactions and carts arrive in Data 360 without manual steps, and corrections or deletions are applied rather than duplicated.

## Build target

- One nightly file feed per hub, picked up from cloud storage
- New and changed records update in place; corrections and deletions are applied, not appended
- Records with out-of-scope transaction types filtered out before loading
- Each run logged to the failure log in INT-004

## Guardrails

- A rerun of the same file must not create duplicate records.
- Out-of-scope rows are dropped at load time, not stored and hidden.

## Out of scope

- Must not load historical backfill (Phase 4, data migration).
- Must not build near-real-time feeds (handled by INT-007).

## Acceptance

On Tuesday morning Mei, a Data Engineer, sees Monday's transactions from all three hubs in Data 360. A refund that Hub 1 posted against last week's sale shows as an update to that sale, not as a new record, and rerunning Hub 1's file changes nothing.

## Success criteria

_none_

## Dependencies

### Internal
- INT-005
- INT-004

### External
- TAMS Commerce (3 Australian hubs) | nightly extract files delivered to agreed cloud storage in the agreed format (G0201, G0208) | owner: GRLG TAMS platform team

## Open questions

- Q-011: Can each hub's TAMS instance drop files to cloud storage, and in what format and at what time? If not, an integration layer is needed (G0017). (Resolver: GRLG TAMS platform team + Solution Architect) — UNANSWERED
- Q-012: What are daily and peak-day volumes per hub? (G0202) (Resolver: GRLG TAMS platform team) — UNANSWERED

## Grounding

- Source: grlg-discovery-2026#INT-006
