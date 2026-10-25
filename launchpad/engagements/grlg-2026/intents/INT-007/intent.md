---
id: INT-007
phase: 1
epic: E02
confidence: Unknown
surface: integration
origin: scopezilla
source: grlg-discovery-2026#INT-007
title: Named TAMS feeds stream into Data 360 within minutes
---

# INT-007 — Named TAMS feeds stream into Data 360 within minutes

## Outcome

Only the TAMS feeds that a named use case needs fresh arrive within minutes; everything else stays on the nightly load to control cost.

## Build target

- A streaming feed for each TAMS event type GRLG names as time-sensitive (strawman: cart activity for abandonment)
- Streamed records land in the same shared model as the nightly load (INT-005)
- Streamed and nightly records for the same transaction reconcile to one record

## Guardrails

- Do not stream a feed without a named use case recorded in the open question below.
- Streamed and batch copies of one transaction must never both survive.

## Out of scope

- Must not trigger journeys or segments from streamed data (Phase 3).
- Must not stream app events (handled by INT-009 and INT-010).

## Acceptance

Lee, a shopper, adds a jacket to a cart in Hub 2's e-commerce site. Within the agreed streaming window Mei, a Data Engineer, sees that cart in Data 360 tagged Hub 2, and the next morning's nightly load does not create a second copy.

## Success criteria

_none_

## Dependencies

### Internal
- INT-005

### External
- TAMS Commerce | ability to push events to an API for the named feeds (G0201) | owner: GRLG TAMS platform team

## Open questions

- Q-013: Which TAMS feeds, if any, have a use case that needs data within minutes rather than overnight? If none, drop this intent. (Resolver: GRLG marketing lead + Solution Architect) — UNANSWERED

## Grounding

- Source: grlg-discovery-2026#INT-007
