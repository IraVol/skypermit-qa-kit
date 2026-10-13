# Curfew failure with a lapsed pilot

### E2E-OP-008: TIME_WINDOW curfew failure on KBP-CTR-3

**Doc ref:** `skypermit/docs/06-business-rules.md` — `A-7 §1` (curfew
23:00–05:00 for `KBP-CTR-3`, narrowing the `ZC-2026.1` general value)

**Role(s):** Operator

**Preconditions:**
- Logged-in operator with a pilot whose certification lapsed (certified
  more than 18 months before the chosen `window_start`).
- An aircraft whose weight band is permitted in `KBP-CTR-3`.
- No other `APPROVED`/`UNDER_REVIEW` request for that aircraft in the
  chosen window.

**Steps:**
1. Fill the request creation form with `zone-picker` set to `KBP-CTR-3`,
   the lapsed pilot in `pilot-picker`, the permitted aircraft in
   `aircraft-picker`, and `window-start-input` at 23:30 zone-local.
2. Click `flight-request-check-button` (validate).

**Expected result:**
- UI shows a per-gate result with `TIME_WINDOW` marked failing, citing
  `rule_reference` `A-7 §1`.
- Request state remains `DRAFT`.

**Rationale:** Covers the amended curfew window for `KBP-CTR-3`, which
`06-business-rules.md` flags as one of the two zones where the `A-7`
amendment overrides the general `ZC-2026.1` curfew value.
