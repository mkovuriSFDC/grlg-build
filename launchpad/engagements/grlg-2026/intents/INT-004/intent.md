---
id: INT-004
phase: 1
epic: E01
confidence: Assumed
surface: automation
origin: scopezilla
source: grlg-discovery-2026#INT-004
title: The data team is alerted when a feed or processing job fails
---

# INT-004 — The data team is alerted when a feed or processing job fails

## Outcome

When a data feed lands late or fails, someone named is told within the working day, before a marketer finds out from a broken segment.

## Build target

- A failure log recording each failed or late data feed and processing job, with source, time, and error
- Alerts to a named queue or channel when a feed fails or misses its expected window
- A daily summary of feed health for the data team

## Guardrails

- Alerts must name the failing source (which hub or app feed), not just 'a job failed'.
- Repeated failures of the same feed group into one alert thread, not a flood.

## Out of scope

- Must not alert on identity, segment, or activation jobs yet (added in later phases as those exist).
- Must not integrate with GRLG's enterprise monitoring tool unless Q-006 says so.

## Acceptance

Mei, a Data Engineer, sees an alert in the data-team channel at 7:10am saying the Hub 2's nightly transaction file didn't arrive, with the expected time and the last successful run. The daily feed-health summary shows the other two hubs green.

## Success criteria

_none_

## Dependencies

### Internal
_none_

### External
_none_

## Open questions

- Q-006: Should alerts go to GRLG's existing monitoring tool, a Salesforce queue, or Slack? (Resolver: GRLG platform operations lead) — UNANSWERED
- Q-007: Does Data 360 offer native configurable failure notifications that make the custom log unnecessary? (G0018) (Resolver: Solution Architect) — UNANSWERED

## Grounding

- Source: grlg-discovery-2026#INT-004
