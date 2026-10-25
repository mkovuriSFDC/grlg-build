# INT-005 provisional working assumptions for the TAMS commerce model (Q-008, Q-009, Q-010)

**Date:** 2026-10-25 · **Deciders:** Madhuri (Trusted Guide) · **Intents:** INT-005 · **Status:** provisional — revisit when the GRLG TAMS platform team and GRLG finance answer

## Context

Every phase-1 intent was blocked on unanswered discovery questions (the phase-0 work). The Trusted Guide chose to rule working assumptions so INT-005 can be built against them. These are not customer answers. Each one stays open with the resolver named in `intents/INT-005/intent.md` until it's confirmed or corrected.

## Options

For each question: get the customer's answer first (the build waits), or rule a provisional assumption and build to it (rework if it's wrong). The Trusted Guide chose to rule provisionally.

## Choice

- **Q-008, transaction types:** the 500+ TAMS transaction types are values of one type field on a single transaction shape, not distinct record structures. Business categories (sale, return, void, loyalty accrual, redemption, …) come from a mapping of type codes to categories.
- **Q-009, GST:** all three Australian hubs send amounts GST-inclusive. The tax-included flag is set to true for every hub.
- **Q-010, ID uniqueness:** transaction and cart IDs are unique only within a hub. The hub prefix is what makes them unique across hubs.
- **Q-010, voids, refunds and edits:** each arrives as its own new transaction record with its own type code and a reference to the original transaction. Nothing is updated in place.

## Consequences

- The INT-005 build models one transaction object with a type field plus a category mapping, a tax-included flag, hub-prefixed keys, and a reference from each transaction to its original.
- If Q-008 turns out to mean distinct record structures, the shared model gains per-type objects or extension fields, and the type-to-category mapping is reworked.
- If any hub sends GST-exclusive amounts (Q-009), the flag becomes a per-hub value in the mapping, and amounts may need normalising before any cross-hub totals.
- If IDs turn out to be unique across hubs, the prefix stays (INT-005 requires it) and nothing breaks.
- If edits arrive as in-place updates or as reversal-plus-repost (Q-010), the nightly load (INT-006) and reversal handling change; INT-005's reference field may become unused or need a reversal type.
- INT-005's proof criteria for these behaviours rest on these assumptions. When the customer answers, re-check each criterion and refine the intent if the answer differs.

## Follow-on rulings (same day, after the readiness check)

The readiness check left three gaps. The Trusted Guide ruled on each:

- **Proving the acceptance before INT-006:** INT-005 loads its own synthetic sample data (transactions, line items and carts for all three hubs, including a Hub 3-only click-and-collect type) so the acceptance walkthrough can run before INT-006's nightly loads exist. The sample data is test data, not a load path: no real customer data, no card numbers, and none of it carries into INT-006.
- **Hub schema extensions (provisional):** until the hub data dictionaries arrive, the build maps a small set of made-up extension fields per hub into the shared fields. When the real dictionaries arrive, they replace the made-up fields and the mapping is re-proven.
- **Transaction-type categories:** who supplies the code-to-category mapping is now an open question, Q-021, on INT-005. Until it's answered, the build uses the example categories the intent names (sale, return, void, loyalty accrual, redemption) on the sample codes.

Consequences: the proof criteria for the extension mapping and the category grouping rest on made-up data, and get re-run against the real dictionaries and catalog when they arrive. Before INT-006's first real load, the sample data is removed or kept apart from the real data.
