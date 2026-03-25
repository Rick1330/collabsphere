# search/ranking

## Domain
Search ranking rules (weighting, grouping, tie-breakers).

## Canonical Sources
- `docs/spec/04-user-flows/04.10-search.md` — §4.10.9 Ranking Rules (v1)
- `docs/spec/06-nfrs/06.2-performance.md` — relevance/performance expectations

## Included Topics
- Field weighting
- Grouping and ordering strategy
- Tie-breakers
- Optional boosts and future enhancements

## Field weighting (v1)
### Documents
- Title matches: **highest weight** (A)
- Content plaintext: **medium weight** (B)

### Tasks
- Title matches: **highest weight** (A)
- Description matches: **medium weight** (B)
- Status is **not** used for score (display only)

## Grouping behavior (v1)
- Return **grouped results** by entity type:
  1) Documents
  2) Tasks
- Grouping improves readability; mixed-by-score is allowed only if explicitly chosen and documented (not default).

## Tie-breakers (v1)
When scores are equal or near-equal:
- Prefer more recently updated items (updatedAt DESC) if available.
- Then stable deterministic ordering by ID to avoid jitter between requests.

## Optional boosts (P2+)
- Recency boost for documents (e.g., small multiplier based on updatedAt).
- Popularity signals (views, edits) only if available and privacy-safe.

## Notes
- Ranking must never override permission filtering or workspace isolation.
- Snippet highlighting should align with the matched field to avoid misleading users.