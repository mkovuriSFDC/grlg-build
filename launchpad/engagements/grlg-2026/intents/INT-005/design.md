---
intent: INT-005
scope_hash: 382286216a4f
authored: 2026-10-25
ratified: 2026-10-25 by Madhuri @ 8caa0054bcb3
---

# INT-005 — Design

**Intent:** Commerce data from all three hubs lands in one shared model
**Source intent:** `intents/INT-005/intent.md`
**Rests on:** `decisions/2026-10-25-int-005-provisional-tams-assumptions.md` (Q-008 to Q-010 provisional, sample data, made-up hub extensions)

**Approach in one line:** map all three hubs onto Data 360's standard Sales Order, Sales Order Product and Shopping Cart objects, adding a few custom fields to them. A small custom reference object turns type codes into business categories. Hub-prefixed keys are built by formula fields on each hub's data stream. Proof runs on synthetic sample data loaded through the Ingestion API.

## Data model

All objects live in the `default` data space (ADR 0001). Everything else is standard.

| Concept | Data model object | Standard / custom | Category |
|---|---|---|---|
| Transaction | `ssot__SalesOrder__dlm` | Standard, plus custom fields | Engagement (event time = transaction date-time) |
| Line item | `ssot__SalesOrderProduct__dlm` | Standard, plus custom fields | Engagement (event time = parent transaction date-time) |
| Cart | `ssot__ShoppingCart__dlm` | Standard, plus custom fields | Engagement (event time = cart created date-time) |
| Transaction type → category | `GRLG_Transaction_Type__dlm` | **Custom** | Other (reference data) |

**Category is permanent and set by the first mapping.** An object takes its category from the first data stream mapped to it. A data stream's category can't be changed after it's saved, and engagement-category streams map only to engagement objects [docs:https://help.salesforce.com/s/articleView?id=data.c360_a_category.htm&release=264.0.0&type=5]. INT-005's sample streams are the first mappings, so they fix the category for INT-006 and INT-007. They use Engagement because transactions and carts are time-series data and segments need date filters. The event time must be a date that never changes. That holds under the Q-010 assumption (edits arrive as new records). If Q-010 comes back as in-place updates, the event-time choice still holds (the transaction date-time doesn't move), but see Consequences in the decision record.

**Fields on the standard objects** (reuse standard fields first; add custom ones only to fill gaps, per [docs:https://help.salesforce.com/s/articleView?id=data.c360_a_data_mapping_best_practices.htm&release=264.0.0&type=5]):

| Need (intent clause) | Sales Order | Sales Order Product | Shopping Cart |
|---|---|---|---|
| Hub-prefixed ID | `ssot__Id__c` ← formula `'H1-' + id` | `ssot__Id__c` ← prefixed line ID; `ssot__SalesOrderId__c` ← prefixed parent ID | `ssot__Id__c` ← prefixed cart ID |
| Raw TAMS ID (traceability) | `ssot__ExternalRecordId__c` | `ssot__ExternalRecordId__c` | custom `Source_Record_Id__c` |
| Hub tag | custom `Hub_Code__c` (`H1`/`H2`/`H3`) | custom `Hub_Code__c` | custom `Hub_Code__c` |
| Store tag | `ssot__SalesStoreId__c` (hub-prefixed) | custom `Store_Id__c` | custom `Store_Id__c` |
| Channel tag | `ssot__SalesChannelId__c` | custom `Channel_Code__c` | custom `Channel_Code__c` |
| Transaction type | custom `Transaction_Type_Key__c` (hub + code) → `GRLG_Transaction_Type__dlm` | — | — |
| Amounts in AUD | `ssot__TotalAmount__c`, `ssot__TotalTaxAmount__c`; `ssot__CurrencyCode__c` = `AUD` | standard amount fields; custom `Currency_Code__c` = `AUD` | `ssot__TotalProductAmount__c`; custom `Currency_Code__c` = `AUD` |
| Tax-included flag | custom `Tax_Included__c` (Boolean) | custom `Tax_Included__c` | custom `Tax_Included__c` |
| Void / refund / edit link (Q-010) | `ssot__OriginalOrderId__c` (standard, hub-prefixed) | — | — |
| Event time | `ssot__OrderStartDate__c`, or custom `Transaction_DateTime__c` if the standard field's meaning doesn't fit (ruled at build) | custom `Transaction_DateTime__c` | custom `Cart_Created_DateTime__c` |

**`GRLG_Transaction_Type__dlm`** (custom, Other): `Id` (key = `Hub_Code` + `-` + type code, because Hub 3 has codes the others don't), `Hub_Code__c`, `Type_Code__c`, `Type_Label__c`, `Business_Category__c` (Sale, Return, Void, Loyalty Accrual, Redemption until Q-021 is answered). Relationship: Sales Order `Transaction_Type_Key__c` → `GRLG_Transaction_Type__dlm.Id`, many-to-one.

**Hub schema extensions (made-up, per the decision record):** each hub's sample schema carries two or three local extension columns with hub-specific names. Each hub's stream maps them onto the same shared custom field. For example, Hub 1 `click_collect_flag`, Hub 3 `fulfilment_mode`, and Hub 2 `collect_store` all map to Sales Order `Fulfilment_Method__c`. The real list arrives with the hub data dictionaries.

**Card numbers (guardrail):** no stream schema contains a card-number column, so card data never enters a data lake object. Sales Order Payment Summary isn't mapped in INT-005. If a later hub extract carries card data, the stream schema leaves that column out; at most a token or last-4 maps into a custom field.

**Component descriptions** (the Setup `description` for each custom field and object): one plain sentence plus `INT-005`. For example: `GRLG_Transaction_Type__dlm`: "Maps each hub's TAMS transaction-type code to a business category so one segment can span all hubs. INT-005." `Tax_Included__c`: "True when the amount includes GST. Set per hub at ingestion. INT-005."

## Sharing & security

- **Who can query:** Mei (Data Engineer) needs to query the model. The supported route is a standard Data 360 permission set; Salesforce recommends against custom ones because standard sets pick up new features each release [docs:https://help.salesforce.com/s/articleView?id=data.c360_a_userpermissions.htm&release=264.0.0&type=5]. **Data Cloud User** gives view-only access to the data model objects and the Query Editor. **Data Cloud Architect** gives full access, including Setup and Customize Application. The Data Engineer persona gets Data Cloud Architect (Q-design-3).
- **Personal data:** the transaction and cart objects carry customer links (`ssot__SoldToCustomerId__c`, bill-to and ship-to contact fields, `ssot__PartyId__c`). INT-005 maps only the customer and loyalty identifiers the sample schema carries, and no names, emails or phone numbers. Masking by role is INT-001's job. This design hands INT-001 the list of personal fields above.
- **The default "Allow All" data governance policy** lets System Admin profiles query every data model object (same docs page). That's INT-001's concern; it's flagged so INT-001 doesn't assume a locked-down starting point.
- **Ripple items:**
  - **Field-level security on custom permission sets:** n/a. No custom permission set is created, and the standard Data 360 sets pick up new objects automatically.
  - **App slot, page layout, list view:** n/a. Data model objects are viewed in Data 360's own Data Explorer and Query Editor, not in Lightning record pages.
  - **Permission-set assignment for Mei's test user:** done in the build (Data Cloud Architect). Tracked as a runbook step.
  - **Tests for Flows or Apex:** n/a. There are none.

## Automation approach

All declarative; there's no Apex and no Flow.
- **Hub-prefixed keys, AUD and the tax flag:** data stream formula fields, computed at ingestion and recalculated on each refresh [docs:https://help.salesforce.com/s/articleView?id=data.c360_a_formula_expression_library.htm&release=264.0.0&type=5]. Boolean formula fields aren't supported on Salesforce connectors (same page). INT-005 uses the Ingestion API and INT-006 uses cloud storage, so that limit doesn't apply.
- **Categories:** a relationship to the reference object, not a formula. A formula would need a 500-branch CASE expression per hub.

## Integration

- **Sample data:** one Ingestion API connector, `GRLG INT005 Sample`, with one schema object per hub per entity (nine streams: three hubs × transaction, line, cart) plus one for the transaction-type reference data. Loaded with bulk CSV jobs. Synthetic only.
- **Real feeds:** INT-006 (nightly, cloud storage) and INT-007 (streaming) bring their own streams and map them into this same model. INT-005 doesn't build them.
- **External dependency:** hub data dictionaries, sample extracts and the transaction-type catalog (already declared in the intent). They replace the made-up schemas when they arrive.
- **Not metadata:** permission-set assignment and the sample-data load are runbook and demo steps. The sample data stays out of `launchpad/deploy-runbook.md` (demo data rule).

## Alternatives considered

- **Custom transaction, line and cart objects instead of the standard ones:** rejected. The standard objects cover order, line, store, channel, amounts and original-order links, and they come with standard relationships to Individual and Product that later segments (Phase 3) rely on. Standard-first.
- **Category via formula CASE or a batch transform:** rejected. A 500-code CASE per hub is unmaintainable. A batch transform adds a scheduled job and lag. The reference object can be reloaded from one file when Q-021 is answered.
- **Profile or Other category for transactions:** rejected. Transactions are time-series data; Engagement gives event-time filtering. Other is Salesforce's fallback only when there's no fixed date [docs:https://help.salesforce.com/s/articleView?id=data.c360_a_category.htm&release=264.0.0&type=5].
- **`ssot__TaxPolicy__c` instead of a custom tax flag:** not chosen. Its meaning isn't confirmed as "amounts include tax", and the guardrail asks for an explicit flag.
- **One sample stream per entity with a hub column:** rejected. It wouldn't exercise each hub's own schema extensions, which is the point of the build target.
- **Traps that apply** (`salesforce-traps.md`): deploy results come from `sf project deploy report`, and a failed component rolls back the whole deploy. These matter once Data 360 config is retrieved into `force-app` (Q-design-1).

## Architecture conformance

- **ADR 0001 (one org, default data space as APAC, Australia only):** conforms. Every object, stream and mapping is in `default`. The model isn't Australia-specific: `Hub_Code__c` and the hub-keyed type reference let other APAC hubs join later without restructuring, as the ADR's consequences ask.
- **Kickoff commitments:** card numbers never enter Data 360 (conforms: no card columns). Inbound data lands on Data 360's own entry points (conforms: Ingestion API now, cloud storage in INT-006). Nightly and new data only (conforms: no history load).

## Neighboring & future scope

- **Depends on:** none.
- **INT-006 (nightly loads):** reuses this model. Its streams must be Engagement category with the same immutable event time, plus the same prefix formulas. Its "corrections and deletions applied, not appended" needs upsert on the hub-prefixed primary key, which this key design supports. Before INT-006's first real load, the sample streams are deleted and their data lake objects dropped (decision record).
- **INT-007 (streaming):** lands in the same model. It must also be Engagement category. If it streams cart activity, it may also use the standard `ssot__ShoppingCartProductEngagement__dlm`. Nothing here blocks that.
- **INT-008 (loyalty balance linked to commerce records):** needs a loyalty member ID on the transactions. The design adds a `Loyalty_Member_Id__c` field on Sales Order, filled from whichever hub extension carries it. It's a field slot, not INT-008's feed (Q-design-4).
- **INT-001 (masking):** gets the list of personal fields above. No dependency is declared either way. If INT-001 lands first, its policies cover these objects; if it lands later, the objects hold only synthetic data until then.
- **Same-epic intents:** none.

**Existing org:**
- **Local repo:** `force-app/**` is empty, so nothing to reuse or collide with.
- **Data 360** (read through the Data 360 MCP server): the standard objects above exist, unmapped and unused. The only custom data model objects are the system-generated `GenAI*__dlm` set; nothing named for transactions, carts or types. Disposition: clean reuse of the standard objects; the custom type object is genuinely new.
- **Same org:** the Data 360 MCP server and `grlg-build-sandbox` are the same org, per the Trusted Guide (Q-design-0).
- **Core platform** (`sf` against `grlg-build-sandbox`): Enterprise Edition, not a sandbox. It has the `default` data space. The ~1,700 objects are the demo org's own, and none touches commerce transactions.

## Build sequence

1. Create the custom fields on the three standard objects, plus the custom type object and its relationship.
2. Create the sample Ingestion API connector and schemas, then the ten streams. **Engagement category and event time are set here and can't be changed afterwards**, so check them before saving.
3. Map each stream to its object, including the per-hub extension mappings.
4. Load the type reference file first, then the sample transactions, lines and carts.
5. Assign Data Cloud Architect to the Data Engineer test user and run the acceptance query.
6. Package the configuration as a data kit and retrieve it into `force-app`.

## Open design questions

- **Q-design-0:** Which org does the Data 360 MCP server point at? ANSWERED (Madhuri, 2026-10-26): the same org as `grlg-build-sandbox` (org ID `00Daj00000rYyCvEAK`), working in its `default` data space. The Trusted Guide confirmed it; the agent couldn't check independently.
- **Q-design-1:** How does the Data 360 configuration reach the repo? ANSWERED (Madhuri, 2026-10-26): as a data kit retrieved into `force-app`. The recommendation is to build it in the org, package the objects, fields, streams and mappings as a data kit, and retrieve that into `force-app`, so the PR carries it. The alternative is runbook steps only. INT-003 (release path) isn't delivered yet, so this sets a precedent it may revisit.
- **Q-design-2:** Do carts need line items in INT-005? ANSWERED (Madhuri, 2026-10-26): cart headers only. Data 360 has no standard cart-line object. The recommendation is cart headers only for now (the acceptance doesn't need cart lines), with INT-007 using the standard cart-product engagement object if abandonment needs products.
- **Q-design-3:** ANSWERED (Madhuri, 2026-10-26): Data Cloud Architect. It also grants Customize Application; INT-001 may narrow it. The question was which standard permission set the Data Engineer persona gets: Data Cloud User (view-only, enough to query) or Data Cloud Architect (full, including Setup)? This overlaps INT-001's access model.
- **Q-design-4:** Keep `Loyalty_Member_Id__c` on Sales Order now, or leave it to INT-008? ANSWERED (Madhuri, 2026-10-26): add it now.
