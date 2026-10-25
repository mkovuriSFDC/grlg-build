---
id: INT-010
phase: 1
epic: E03
confidence: Assumed
surface: integration
origin: scopezilla
source: grlg-discovery-2026#INT-010
title: Customers' web and mobile browsing links to their profile once they sign in
---

# INT-010 — Customers' web and mobile browsing links to their profile once they sign in

## Outcome

Browsing and engagement in GRLG's web and mobile app is captured, and anything done before sign-in is joined to the customer once they sign in, respecting their tracking choice.

## Build target

- Collection of the agreed behavior events from GRLG's web and mobile app (strawman: product views, searches, wishlist, loyalty page visits)
- Anonymous pre-sign-in activity joined to the known customer at sign-in
- The customer's tracking consent carried on each event, and events from customers who restricted tracking not stored

## Guardrails

- Cart and checkout events come from TAMS, not the app, so purchases aren't counted twice (G0306).
- No event is collected before the customer's tracking choice is known.

## Out of scope

- Must not embed the collection code in the app (GRLG app team's work).
- Must not build engagement scores or segments (Phase 3).

## Acceptance

Lee browses three jackets on the GRLG mobile app without signing in, then signs in. Mei, a Data Engineer, sees all three product views on Lee's record. Sam, who restricted tracking during onboarding, browses the same jackets and no events are stored for Sam.

## Success criteria

_none_

## Dependencies

### Internal
- INT-009

### External
- GRLG web and mobile app | Salesforce collection SDKs embedded and the agreed event list instrumented (G0301) | owner: GRLG app team

## Open questions

- Q-018: Can the app team embed Salesforce's web and mobile SDKs, or must all events go server-to-server? (G0301) (Resolver: GRLG app team lead) — UNANSWERED
- Q-019: Which behavior events are in scope at go-live? (G0306) (Resolver: GRLG marketing lead) — UNANSWERED
- Q-020: If the org is hosted in Australia, is the mobile event route available there? (G0302) (Resolver: Solution Architect + Salesforce account team) — UNANSWERED

## Grounding

- Source: grlg-discovery-2026#INT-010
