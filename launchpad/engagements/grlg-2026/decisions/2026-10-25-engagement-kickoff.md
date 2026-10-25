# Engagement kickoff — GRLG Data 360 Implementation

**Date:** 2026-10-25
**Source:** grlg-discovery-2026 (Scopezilla project ptsd-lab), reviewed at fa8f477be5c2

## Context

GRLG is moving customer data ingestion, identity resolution, unification, and activation to Data 360, starting with Australia. The engagement runs through six phases. Phase 0 resolves the open discovery questions and runs the spikes. Phase 1 stands up the org, access policies, and masking, and gets all three Australian hubs and the consumer app streaming into a shared data model. Phase 2 delivers one customer and consent: an accepted identity ruleset, consent synced both ways, and suppression proven on a test segment. Phases 3–5 add insights, approval and activation, then partners, migration and go-live, with program, change and enablement running across the whole engagement. Success is measured per phase in the source's phase plans (`source show grlg-discovery-2026 outputs/quantum-leap/10-phase-N.md`).

## Choice

- **Quantum Leap blueprint:** Mixed: Data 360 (primary)
- **Clouds in scope:** Data 360, Experience Cloud, Marketing Cloud
- **Target org:** `GRLG Australia Build Sandbox` (sandbox; build_allowed=true)
- **Phase plan:** 6 phases (Phase 0 + Phases 1–5) over 47 weeks
- **Depth mode:** epic-level

## Consequences (cross-cutting commitments)

- One org; the default data space serves APAC, and Australia is the only country in scope (adopted ADR `decisions/architecture/0001-single-org-apac-data-space.md`).
- Data 360 is the platform for ingestion, unification, and activation; no other customer data platform.
- Personal details are masked by default for every internal role; only the Data Governance Specialist can unmask, and every unmask is audited.
- Card numbers never enter Data 360.
- Every inbound source lands on Data 360's own entry points (cloud-storage files and the ingestion API). No middleware unless TAMS can't produce files or call an API.
- TAMS history arrives later through the migration phase; Phase 1 loads nightly and new data only.
- The loyalty points engine stays where it is; Data 360 reads balance and tier only.
- Consumer sign-up, onboarding screens, and address validation stay in GRLG's app.
- Greenfield sandbox build; nothing is configured directly in production.

These were locked during scoping. Do not re-litigate; surface them as constraints to the build agent.
