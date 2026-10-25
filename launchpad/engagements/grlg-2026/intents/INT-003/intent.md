---
id: INT-003
phase: 1
epic: E01
confidence: Assumed
surface: devops
origin: scopezilla
source: grlg-discovery-2026#INT-003
title: Changes move from sandbox to production through a repeatable release path
---

# INT-003 — Changes move from sandbox to production through a repeatable release path

## Outcome

Every Data 360 configuration change, access rule, and platform change can be promoted from build sandbox to production the same way every time, with a checklist for the parts that can't be automated.

## Build target

- A Git-backed release path from build sandbox through test and user acceptance sandboxes to production
- Data 360 configuration packaged for promotion between orgs
- A documented manual step and checklist for access-rule deployment, which can't go through the command-line tooling
- A step to re-enter connector credentials in each environment, since connectors arrive inactive
- A synthetic test dataset loaded into sandboxes, because sandboxes copy no production data

## Guardrails

- Nothing is changed directly in production.
- The synthetic test dataset contains no real customer data.

## Out of scope

- Must not build Marketing Cloud release steps (Phase 3).
- Must not migrate real customer data (Phase 4, data migration).

## Acceptance

Jordan, the release manager, promotes a new data stream and an access rule from the build sandbox to the test sandbox by following the release path and its checklist. Both arrive working, and the access rule masks email for a Marketer test user exactly as it did in the build sandbox.

## Success criteria

_none_

## Dependencies

### Internal
_none_

### External
- GRLG release management | agreed sandbox set, Git host, and release owner (G0105) | owner: GRLG platform lead

## Open questions

- Q-005: Does GRLG already use a Salesforce release tool or Git host we must fit into? (Resolver: GRLG platform lead) — UNANSWERED

## Grounding

- Source: grlg-discovery-2026#INT-003
