# INT-005 field naming, and `grlg-build-sandbox` as the stand-in build org

**Date:** 2026-10-26 · **Deciders:** Madhuri (Trusted Guide) · **Intents:** INT-005 (the org ruling holds for every intent built in this org)

## Context

The tied Scopezilla source's naming file (`outputs/quantum-leap/03-glossary-and-naming.md`) says to use only names it lists and to ask before inventing others. It also says custom fields on a standard object carry a team or feature prefix, and Boolean fields start with `Is_` or `Has_`. INT-005's ratified design used unprefixed names. The source's org rules (`outputs/quantum-leap/04-org-rules.md`) name a greenfield sandbox as the target and tell a build agent to stop and report any existing customizations. The org in use, `grlg-build-sandbox`, is an Enterprise Edition org preloaded with demo packages.

## Options

- Naming: keep the design's names, or apply a prefix per the conventions.
- Org: stand up the named greenfield sandbox, or rule the current org a stand-in.

## Choice

- **Naming:** custom fields that INT-005 adds to standard Data 360 objects use the `TAMS_` prefix (for example `TAMS_Hub_Code__c`). Booleans are `Is_TAMS_…` (`Is_TAMS_Tax_Included__c`). The custom object is `TAMS_Transaction_Type__dlm`; its own fields (`Type_Code__c`, `Type_Label__c`, `Business_Category__c`) take no prefix. The category values are the intent's examples: Sale, Return, Void, Loyalty Accrual, Redemption (provisional until Q-021). The full list is in `intents/INT-005/design.md`.
- **Org:** `grlg-build-sandbox` (org ID `00Daj00000rYyCvEAK`) stands in for the "GRLG Australia Build Sandbox". Its existing demo customizations are known and left untouched. A build agent doesn't stop on them, and adds only its intent's own components.

## Consequences

- Later intents that extend these objects follow the same `TAMS_` and `Is_` conventions.
- The stand-in isn't a sandbox and isn't greenfield. A collision with an existing component still stops the build. Before go-live, the build is repeated in the real target org through the release path (INT-003).
