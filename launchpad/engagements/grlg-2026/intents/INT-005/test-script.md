---
intent: INT-005
phase: 1
proof_hash: 19aa295a83b9
authored: 2026-10-26
---

# INT-005 — Test script

**Intent:** Commerce data from all three hubs lands in one shared model
**Phase:** 1 · **Source intent:** `intents/INT-005/intent.md` · **Design:** `intents/INT-005/design.md`
**Rests on:** `decisions/2026-10-25-int-005-provisional-tams-assumptions.md`. Every data criterion runs on synthetic sample data, using the made-up hub extensions and the provisional Q-008 to Q-010 answers. When the real dictionaries and answers arrive, re-run every ✅ data row.

## Criteria

> `Type`: ✅ automated · 👁 manual · 🔁 awaiting retest · ⚠️ partial · ⛔ blocked · 📋 accepted gap.
> There's no Apex in this build. Data rows are proven by Data 360 SQL query assertions (run through the Data 360 Query API or the Query Editor). Structural rows are proven by org-probe. Config rows are proven by a recorded inspection.

| ID | Criterion (source) | How proven | Type | Sign-off |
|----|--------------------|------------|------|----------|
| INT-005-C1 | Shared model exists: Sales Order, Sales Order Product and Shopping Cart carry the design's custom fields, and `TAMS_Transaction_Type__dlm` exists (build target 1) | org-probe (see § Org assertions) | ✅ | (verify) |
| INT-005-C2 | Each hub's local extension columns land in the same shared field: `TAMS_Fulfilment_Method__c` is filled for H1, H2 and H3 records from three differently named source columns (build target 2) | Query Q2. Covers the made-up extensions only; the real mapping waits on the hub data dictionaries (external dependency: GRLG TAMS platform team) | ⚠️ | Made-up extensions proven by Q2; real dictionaries open |
| INT-005-C3 | Every transaction, line and cart ID starts with its hub prefix (`H1-`, `H2-`, `H3-`) matching `TAMS_Hub_Code__c` (build target 3) | Query Q3 | ✅ | (query) |
| INT-005-C4 | Records from different hubs never collide: the same raw TAMS ID, seeded in two hubs, lands as two distinct records (build target 3) | Query Q4 | ✅ | (query) |
| INT-005-C5 | Every transaction's type resolves to a business category: no transaction lacks a type, and every type has a category (build target 4) | Query Q5 | ✅ | (query) |
| INT-005-C6 | The real 500+ TAMS type catalog is grouped into the business-approved categories (build target 4) | Blocked: Q-021 (who supplies the code-to-category mapping) and the transaction-type catalog (external dependency) | ⛔ | Blocked on Q-021 + catalog |
| INT-005-C7 | Every transaction, line and cart is tagged with hub, store and channel; zero empty values (build target 5) | Query Q7 | ✅ | (query) |
| INT-005-C8 | No card numbers in the model: no data lake object or model field carries a card-number column, and the sample files have none (guardrail 1) | Config inspection: each INT-005 stream's data lake object field list and the sample file headers, recorded in evidence | ✅ | (inspection) |
| INT-005-C9 | Every amount is in AUD: the currency is `AUD` on every transaction, line and cart (guardrail 2) | Query Q9 | ✅ | (query) |
| INT-005-C10 | An explicit tax flag on every record: `Is_TAMS_Tax_Included__c` is never empty, and is true for all three hubs per the Q-009 assumption (guardrail 2) | Query Q10 | ✅ | (query) |
| INT-005-C11 | No identity resolution ruleset is created or changed by INT-005 (out of scope 1) | Config inspection: identity resolution ruleset list before and after the build; no ruleset uses these objects | ✅ | (inspection) |
| INT-005-C12 | No calculated insight or segment is created by INT-005 (out of scope 2) | Config inspection: calculated insight and segment lists before and after the build; none reference these objects | ✅ | (inspection) |
| INT-005-C13 | A query of all sales in the last 7 days returns transactions from H1, H2 and H3 with the same columns (acceptance) | Query Q13 | ✅ | (query) |
| INT-005-C14 | Mei, the Data Engineer, runs that query herself and sees the three hubs side by side, same fields, each ID with its hub prefix (acceptance) | Manual scene A | 👁 | _pending_ |
| INT-005-C15 | Hub 3's click-and-collect type appears under the Sale category and exists only for Hub 3 (acceptance) | Query Q15 | ✅ | (query) |
| INT-005-C16 | Transactions, lines and carts are Engagement category, with a fixed creation date-time as event time (design) | Config inspection: each object's category and each stream's event-time field, recorded in evidence | ✅ | (inspection) |
| INT-005-C17 | The Data Engineer test user holds the Data Cloud Architect permission set (design, Q-design-3) | SOQL: `SELECT Id FROM PermissionSetAssignment WHERE Assignee.Username = '<mei test user>' AND PermissionSet.Label = 'Data Cloud Architect'` returns 1 row | ✅ | (query) |
| INT-005-C18 | Voids and refunds point back to their original transaction: every seeded void and refund has `ssot__OriginalOrderId__c` set to an existing transaction (design, Q-010 assumption) | Query Q18 | ✅ | (query) |
| INT-005-C19 | `TAMS_Loyalty_Member_Id__c` exists on Sales Order (design, Q-design-4) | org-probe (see § Org assertions) | ✅ | (verify) |
| INT-005-C20 | The Data 360 configuration is in the repo as a data kit under `force-app` (design, Q-design-1) | Repo check: the data kit metadata is present in the PR diff and lists the INT-005 objects, streams and mappings | ✅ | (PR review) |
| INT-005-C21 | Sample data is synthetic and kept apart: every INT-005 record comes from the `GRLG INT005 Sample` connector, and no real TAMS source is connected (decision record) | Query Q21 | ✅ | (query) |

### Deliberately not tested (out of scope)

- Identity matching (Phase 2) and calculated insights and segments (Phase 3) are deferred work. C11 and C12 only prove INT-005 didn't create them.
- Nightly and streaming loads (INT-006, INT-007) and the loyalty feed (INT-008) aren't tested here.
- Masking of personal fields by role is INT-001's.

## Automated proofs to write

> No Apex. Each query below runs against the `default` data space after the sample load, and its result is saved to evidence. Object API names are as in the design. Cart and line variants of a query repeat it on `ssot__ShoppingCart__dlm` and `ssot__SalesOrderProduct__dlm`.

- **Q2** — `SELECT TAMS_Hub_Code__c, COUNT(*) FROM ssot__SalesOrder__dlm WHERE TAMS_Fulfilment_Method__c IS NOT NULL GROUP BY TAMS_Hub_Code__c`. Assert H1, H2 and H3 all appear, and their counts equal the seeded rows that carry an extension value.
- **Q3** — for each object: `SELECT COUNT(*) FROM <obj> WHERE ssot__Id__c NOT LIKE CONCAT(TAMS_Hub_Code__c, '-%')`. Assert 0. Also `SELECT DISTINCT TAMS_Hub_Code__c` returns exactly H1, H2 and H3.
- **Q4** — `SELECT ssot__ExternalRecordId__c, COUNT(DISTINCT ssot__Id__c) FROM ssot__SalesOrder__dlm WHERE ssot__ExternalRecordId__c = '<seeded shared raw ID>' GROUP BY 1`. Assert 2 distinct IDs (one per seeded hub).
- **Q5** — `SELECT COUNT(*) FROM ssot__SalesOrder__dlm o LEFT JOIN TAMS_Transaction_Type__dlm t ON o.TAMS_Transaction_Type_Key__c = t.ssot__Id__c WHERE t.ssot__Id__c IS NULL OR t.Business_Category__c IS NULL`. Assert 0.
- **Q7** — for each object: count of rows where hub, store or channel is empty. Assert 0.
- **Q9** — for each object: count of rows where the currency is not `AUD`. Assert 0.
- **Q10** — for each object: count of rows where `Is_TAMS_Tax_Included__c` is empty. Assert 0. Grouped by hub, every hub is all true.
- **Q13** — `SELECT o.TAMS_Hub_Code__c, COUNT(*) FROM ssot__SalesOrder__dlm o JOIN TAMS_Transaction_Type__dlm t ON o.TAMS_Transaction_Type_Key__c = t.ssot__Id__c WHERE t.Business_Category__c = 'Sale' AND o.<event time> >= <now - 7 days> GROUP BY o.TAMS_Hub_Code__c`. Assert 3 rows with counts above 0. The shared columns come from one object, so every hub has the same fields by construction.
- **Q15** — `SELECT ssot__Id__c, TAMS_Hub_Code__c, Business_Category__c FROM TAMS_Transaction_Type__dlm WHERE Type_Label__c = 'Click and Collect'`. Assert exactly one row: `H3`, `Sale`. Q13 restricted to that type returns only H3 transactions.
- **Q18** — count of void and refund transactions whose `ssot__OriginalOrderId__c` is empty or matches no transaction. Assert 0.
- **Q21** — for each object: `SELECT DISTINCT ssot__DataSourceId__c`. Assert it's only the `GRLG INT005 Sample` source.

**Seed data the queries depend on** (part of the sample load): at least 5 transactions per hub, dated within the 7 days before the load. One raw transaction ID repeated in H1 and H2 (for Q4). One H3-only click-and-collect type (for Q15). At least one void and one refund linked to an original (for Q18). Each hub's extension column filled (for Q2). Re-date the seed relative to the load day, or Q13 and scene A fail after a week.

## Org assertions

- **INT-005-C1** (shared model exists with the design's custom fields):
  - `object-exists(TAMS_Transaction_Type__dlm)`
  - `field-exists(ssot__SalesOrder__dlm.TAMS_Hub_Code__c)`
  - `field-exists(ssot__SalesOrder__dlm.TAMS_Transaction_Type_Key__c)`
  - `field-exists(ssot__SalesOrder__dlm.Is_TAMS_Tax_Included__c)`
  - `field-exists(ssot__SalesOrder__dlm.TAMS_Fulfilment_Method__c)`
  - `field-exists(ssot__SalesOrderProduct__dlm.TAMS_Hub_Code__c)`
  - `field-exists(ssot__SalesOrderProduct__dlm.Is_TAMS_Tax_Included__c)`
  - `field-exists(ssot__ShoppingCart__dlm.TAMS_Hub_Code__c)`
  - `field-exists(ssot__ShoppingCart__dlm.Is_TAMS_Tax_Included__c)`
  - `field-exists(TAMS_Transaction_Type__dlm.Business_Category__c)`
- **INT-005-C19** (loyalty slot on Sales Order):
  - `field-exists(ssot__SalesOrder__dlm.TAMS_Loyalty_Member_Id__c)`

> These are Data 360 data model objects, not core custom objects. If `/ql-verify-build` can't resolve the predicates through `sf`, it reads them through the Data 360 MCP server's model-object read (`d360_dmo_get`). If neither works, it records `⚠ org not verified`.

## Manual validation scenes

### Scene A — Mei sees all three hubs side by side (criterion C14)
**Persona:** the Data Engineer test user (holds Data Cloud Architect, per C17). **Before you start:** the sample load ran within the last 7 days.
1. Log in as the Data Engineer test user.
2. Open the App Launcher, then **Data 360**, then **Query Editor**. Choose the `default` data space.
3. Run the Q13 query, but select columns instead of counts: `ssot__Id__c, TAMS_Hub_Code__c, Store/Channel, Business_Category__c, ssot__TotalAmount__c, Is_TAMS_Tax_Included__c` for sales in the last 7 days.
4. Check the results contain rows from **H1, H2 and H3**, with **the same columns filled the same way** for every hub.
5. Check every ID **starts with its hub prefix** (`H1-…`, `H2-…`, `H3-…`).
6. Filter to the click-and-collect type. Check it shows **only H3 rows**, under **Sale**.

**Expected:** one result set spans all three hubs, with the same fields and a hub-prefixed ID on every row. Click and collect appears only for Hub 3, under Sale. **Sign-off:** _name / date / pass·fail_.
