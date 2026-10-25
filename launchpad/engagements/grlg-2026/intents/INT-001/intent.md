---
id: INT-001
phase: 1
epic: E01
confidence: Assumed
surface: security
origin: scopezilla
source: grlg-discovery-2026#INT-001
title: Internal users see Australian customer data with personal details masked by role
---

# INT-001 — Internal users see Australian customer data with personal details masked by role

## Outcome

Every internal role can do its job in Data 360 without seeing unmasked personal details or any card data; only the Data Governance Specialist can unmask, and every unmask is auditable.

## Build target

- One permission bundle per internal role: Data Analyst, Marketer, Regional Operations Manager, Data Engineer, Data Governance Specialist, platform admin, integration user
- Personal details (name, email, phone, billing address) masked by default for every internal role
- A single auditable unmask path for the Data Governance Specialist, used when working identity exceptions
- A country attribute on customer records and access rules so future APAC users can be kept apart from Australian records
- Access rules built on standard classification tags only, so they promote cleanly between sandbox and production

## Guardrails

- Card numbers must never be stored or displayed; if a card field appears in a source, stop and raise it.
- Default to deny: a role sees nothing it isn't explicitly granted.
- Every unmask action must leave an audit record naming the user and time.

## Out of scope

- Must not configure partner (external) user access (Phase 4, partner site).
- Must not configure Marketing Cloud user roles (Phase 3).
- Must not set up single sign-on (handled by INT-002).

## Acceptance

Priya, a Marketer, opens a unified customer profile and sees the customer's preferred store and loyalty tier, with name, email, phone, and address shown masked. Sam, the Data Governance Specialist, opens the same profile from an identity exception, unmasks the email to compare two records, and an audit entry shows Sam's name and the time. Priya cannot find any way to unmask.

## Success criteria

_none_

## Dependencies

### Internal
_none_

### External
- GRLG security and privacy | sign-off on the role-to-access matrix and the single unmask exception (G0101, G0103) | owner: GRLG CISO / privacy officer

## Open questions

- Q-001: Does 'PII history' in the brief mean all historical values or only the current profile? (Resolver: GRLG privacy officer) — UNANSWERED
- Q-002: How many Australian users hold each role? (Resolver: GRLG marketing and operations leads) — UNANSWERED

## Grounding

- decision: ADR 0001 — single org, default data space serves APAC (grlg-discovery-2026:decisions/0001-single-org-apac-data-space.md@fa8f477be5c2)
- Source: grlg-discovery-2026#INT-001
