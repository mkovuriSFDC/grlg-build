---
id: INT-009
phase: 1
epic: E03
confidence: Assumed
surface: integration
origin: scopezilla
source: grlg-discovery-2026#INT-009
title: The app's profile and onboarding-complete events reach Data 360
---

# INT-009 — The app's profile and onboarding-complete events reach Data 360

## Outcome

When a customer creates an account, updates their profile, or finishes onboarding in GRLG's app, Data 360 has that change within minutes, including the flag that says onboarding is complete.

## Build target

- An inbound feed for profile created, profile updated, and onboarding completed events from GRLG's app backend
- Each event carries the agreed identifiers (strawman: app customer ID, loyalty member ID, email, phone)
- An onboarding-complete flag and timestamp on the customer record
- Preferred language and preferred currency captured from the profile event
- Privacy preferences captured from onboarding, marked with their source as the app

## Guardrails

- The event list and payload must be signed off with GRLG's app team before the feed is created, because event schemas can't be changed afterwards.
- Payload fields are a strawman until confirmed against the app's actual events.

## Out of scope

- Must not build the onboarding wizard, sign-up, or address validation (GRLG's app).
- Must not send the welcome email (Phase 3).
- Must not decide which consent source wins (Phase 2, consent).

## Acceptance

Lee completes onboarding in the GRLG app at 10:02am with preferred language Vietnamese. Within the agreed window Priya, a Marketer, sees Lee's record in Data 360 with onboarding complete, the 10:02 timestamp, and Vietnamese as preferred language.

## Success criteria

_none_

## Dependencies

### Internal
- INT-001

### External
- GRLG consumer app backend | signed-off event contract and the server-side calls that send profile and onboarding events (G0005, G0307) | owner: GRLG app team

## Open questions

- Q-016: Which identifiers does each app event carry, and is one stable across web, mobile, and TAMS? (G0304) (Resolver: GRLG app team) — UNANSWERED
- Q-017: What counts as 'identity verification' and does the app send it? (G0406) (Resolver: GRLG app team + loyalty owner) — UNANSWERED

## Grounding

- Source: grlg-discovery-2026#INT-009
