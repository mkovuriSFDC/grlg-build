---
id: INT-008
phase: 1
epic: E02
confidence: Assumed
surface: integration
origin: scopezilla
source: grlg-discovery-2026#INT-008
title: Members' loyalty balance and tier are available on their profile
---

# INT-008 — Members' loyalty balance and tier are available on their profile

## Outcome

Each Australian loyalty member's current points balance and tier are refreshed in Data 360 daily, so later segments and insights can use them; the points engine itself stays where it is.

## Build target

- A daily snapshot feed of points balance, tier, and enrolment date per loyalty member
- Snapshot keyed by loyalty member ID and linked to the member's commerce records
- Previous balance kept only as of the last snapshot, not a full ledger

## Guardrails

- Data 360 is not the points system of record; nothing here writes back to the points engine.
- Balances are read-only for every internal role.

## Out of scope

- Must not migrate or rebuild the points ledger (G0019, G1001).
- Must not award or adjust points.

## Acceptance

Priya, a Marketer, opens a test member's profile and sees 4,250 points and Gold tier, matching what the loyalty system shows that morning. After the member redeems 1,000 points, the next day's profile shows 3,250.

## Success criteria

_none_

## Dependencies

### Internal
- INT-005

### External
- GRLG loyalty points system (name unconfirmed) | daily balance and tier extract for Australian members (G1001) | owner: GRLG loyalty platform owner

## Open questions

- Q-014: Which system holds Australian points balances and tier today, and can it produce a daily extract? (Resolver: GRLG loyalty platform owner) — UNANSWERED
- Q-015: Is the loyalty member ID issued centrally and the same across hubs and the app? (G0504) (Resolver: GRLG loyalty platform owner) — UNANSWERED

## Grounding

- Source: grlg-discovery-2026#INT-008
