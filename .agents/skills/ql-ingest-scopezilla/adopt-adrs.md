# Adopting the source's architecture ADRs

Reached from `/ql-ingest-scopezilla` Step 4c, only when the source's `decisions/` holds architecture ADRs.

In a grounded / ARB-governed engagement, Scopezilla authors the **load-bearing architecture premises** the scope was built on (single-org, LWR-over-Aura, PII-residency) as ADRs in the project's `decisions/` (see Scopezilla's `DECISION-HANDOFF-CONTRACT.md`).

When it has some, list them as of the cursor (`source show <name> decisions/ --at cursor` lists the folder in a git project; `ls` it in a folder-only one), read each with `source show <name> decisions/<file> --at cursor`, and ask the Trusted Guide which to **adopt** — the premises this engagement will build on. They're pre-selected on a first ingest, since the scope was built on them. Each adopted ADR is copied verbatim, once, into `launchpad/decisions/architecture/` (or the engagement's own `decisions/architecture/` when it holds for this engagement only), with a provenance line added under its title and its `Source:` re-stamped to `scopezilla-inherited`:

```markdown
**Adopted-from:** <name>@<cursor sha, 12 chars>:decisions/<file>
```

From then on it's the engagement's record: a deviation supersedes it with a `BLD-NNNN` ADR marked `Deviation: pending-ARB` (`/ql-design-intent`), and nobody edits the adopted copy. An ADR left unadopted stays in the source, read as context only. On a re-ingest, an ADR that changed upstream since its `Adopted-from` sha is reported to the human; they decide whether to supersede the adopted copy. Report the count adopted in Step 8.
