# 0001 — One Data 360 org with a single APAC data space; Australia only in scope

**Adopted-from:** grlg-discovery-2026@fa8f477be5c2:decisions/0001-single-org-apac-data-space.md

**Date:** 2026-10-23 · **Status:** accepted · **Source:** scopezilla-inherited

## Context
GRLG operates across APAC, EMEA, and AMER, with 10 regional operational hubs per region, each running a locally deployed TAMS Commerce instance with customized schema extensions. The scenario brief asks to move ingestion, identity resolution, unification, and activation to Data 360 but does not fix org topology or regional rollout scope. Data 360 supports Data Spaces for domain or regional isolation within one org, and Data Cloud One for multi-org unification [KA-0032, KA-0029].

## Decision
- Implement a single Data 360 org.
- Use the org's default data space as the APAC data space. All in-scope ingestion, identity resolution, segmentation, and activation run there. (Amended 2026-10-23: Marketing Cloud Next campaign segments must use the default data space and the Unified Individual object [KA-2835].)
- Within APAC, only Australia is in scope. Other APAC countries, and all EMEA and AMER hubs, data, and users, are out of scope for this engagement.

## Consequences
- Data volumes, hub count, integrations, and migration scope size to Australia only (Australia's share of the 25M raw records still to be confirmed).
- The governing privacy regime is Australian (Privacy Act 1988 / Australian Privacy Principles; Spam Act 2003 for commercial email and SMS consent), not GDPR/CCPA.
- Other APAC countries can join the same default data space later without restructuring.
- A future EMEA or AMER rollout in a separate, non-default data space could not run Marketing Cloud Next campaigns from that space; that rollout needs its own topology decision.
- A later EMEA/AMER rollout adds data spaces in the same org; the data model, identity ruleset, and consent design should be built region-agnostic so they can be reused.
- Identity resolution rulesets are scoped per data space, so cross-region customer unification is not delivered in this engagement.

## Grounds
- Scoping user decision, discovery session 2026-10-23 (single org with one APAC data space; follow-up narrowed scope to Australia only). Adopted copy replaces the source's quoted lines with this pointer, per the dirty-source rule.
- `grlg-discovery-2026:discovery-notes/data360-scenario-brief.md` — Project Overview (regions, 10 regional hubs) and Current Systems (per-hub TAMS Commerce schema extensions).
