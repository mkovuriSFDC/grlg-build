# INT-005 commerce model: standard objects, engagement category, type reference object, data kits

**Date:** 2026-10-26 · **Deciders:** Madhuri (Trusted Guide) · **Intents:** INT-005, INT-006, INT-007, INT-008

## Context

INT-005 needs one shared model for transactions, line items and carts from three TAMS hubs. Several of the choices can't be undone cheaply once data flows, and they bind the intents that load into the model later. The full approach is in `intents/INT-005/design.md`.

## Options

- Standard Data 360 sales objects with custom fields, or custom data model objects.
- Engagement category or Other category for transactions and carts.
- Categories from a reference object, a formula listing every code, or a batch transform.
- Data 360 setup carried in the repo as a data kit, or as runbook steps only.

## Choice

- **Standard objects:** transactions on `ssot__SalesOrder__dlm`, line items on `ssot__SalesOrderProduct__dlm`, carts on `ssot__ShoppingCart__dlm`, each extended with custom fields. Cart headers only; no cart line object.
- **Engagement category** for all three, with an event time that never changes after the record is created (the transaction or cart creation date-time). This is permanent: an object takes its category from the first stream mapped to it, and a stream's category can't be changed.
- **Custom reference object `GRLG_Transaction_Type__dlm`** (Other category), keyed by hub plus type code, maps each code to a business category.
- **Data kits:** the Data 360 configuration is packaged as a data kit and retrieved into `force-app`, so the PR carries it.
- **Access:** standard Data 360 permission sets only; the Data Engineer persona gets Data Cloud Architect.
- **Loyalty slot:** a `Loyalty_Member_Id__c` field on transactions now, for INT-008 to link to.

## Consequences

- INT-006 and INT-007 streams must be Engagement category, with the same event time and hub-prefix formulas, or they can't map into the model.
- Reversing the category later means new objects and a reload, not an edit.
- Data Cloud Architect also grants Customize Application (Setup access). INT-001 may narrow it.
- Using data kits sets a precedent that INT-003 (release path) can revisit.
