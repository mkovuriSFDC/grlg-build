---
id: INT-002
phase: 1
epic: E01
confidence: Assumed
surface: security
origin: scopezilla
source: grlg-discovery-2026#INT-002
title: Australian staff sign in with their Active Directory credentials
---

# INT-002 — Australian staff sign in with their Active Directory credentials

## Outcome

Australian internal users sign in with their existing Active Directory credentials, get the right role on first sign-in, and lose access promptly when they leave.

## Build target

- Single sign-on for internal users through GRLG's identity provider, trusting the Australian Active Directory
- User accounts created on first sign-in, with the role assigned from the user's Active Directory group
- Access removed when a user is disabled or removed from the group

## Guardrails

- No local Salesforce passwords for internal users once single sign-on is live, except one break-glass admin.
- Group-to-role mapping must match the role bundles in INT-001 exactly.

## Out of scope

- Must not configure consumer sign-up or social sign-on (stays in GRLG's app).
- Must not configure partner user sign-in (Phase 4).

## Acceptance

Alex, a Regional Operations Manager in Hub 1, clicks the Salesforce link, signs in with their usual Active Directory password, and lands in the org with the Regional Operations Manager role already applied. When GRLG IT disables Alex's directory account, Alex can no longer sign in.

## Success criteria

_none_

## Dependencies

### Internal
- INT-001

### External
- GRLG identity provider / Australian Active Directory | SAML federation and group claims for the Salesforce app (G0013, G0107) | owner: GRLG identity team

## Open questions

- Q-003: Which identity provider brokers sign-on to the Australian Active Directory, and does it support just-in-time provisioning or SCIM? (Resolver: GRLG identity team) — UNANSWERED
- Q-004: How fast must leavers lose access? (Resolver: GRLG security) — UNANSWERED

## Grounding

- Source: grlg-discovery-2026#INT-002
