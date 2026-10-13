# Curfew boundary cases

### E2E-OP-006: TIME_WINDOW gate failure — window falls inside KBP-CTR-3 amended curfew

**Doc ref:** `skypermit/docs/06-business-rules.md` — `TSD-4 §4` (curfew rule);
curfew value overridden by `A-7 §1` for `KBP-CTR-3` (23:00–05:00, narrower
than the `ZC-2026.1` general 22:00–06:00); `rule_reference` for TIME_WINDOW
curfew failures on this zone is `A-7 §1` per `06-business-rules.md` §6.

**Role(s):** Operator

**Preconditions:**
- Logged-in operator with a pilot (current certification, rated for
  `KBP-CTR-3`'s zone class) and an aircraft (weight band permitted in
  `KBP-CTR-3`).
- No existing `APPROVED`/`UNDER_REVIEW` request for that aircraft
  overlapping the chosen window (so `TIME_WINDOW`'s overlap check doesn't
  fire first and mask the curfew failure).
- Chosen window: `window_start` at 23:30 zone-local time for `KBP-CTR-3`
  (inside the amended 23:00–05:00 curfew, but *outside* the unamended
  `ZC-2026.1` general value of 22:00–06:00 would still also be inside —
  pick a time that specifically falls in the amended range so this case is
  unambiguous either way, e.g. 23:30).

**Steps:**
1. Fill the request creation form with `zone-picker` set to `KBP-CTR-3`,
   valid pilot/aircraft, `window-start-input` at 23:30 zone-local,
   duration within the 15–240 minute range.
2. Click `flight-request-check-button` (validate).

**Expected result:**
- UI shows a per-gate result with `TIME_WINDOW` marked failing, citing
  `rule_reference` `A-7 §1` (not the unamended `ZC-2026.1 §3` value —
  asserting the correct citation here specifically catches a regression
  where the amendment override is dropped and the general zone value is
  cited instead).
- Request state remains `DRAFT` — validate never changes state.

**Rationale:** `06-business-rules.md` flags `KBP-CTR-3`/`ODS-CTR-5` as
"the one place the two documents disagree and the amendment is the one
that wins." A test asserting only "TIME_WINDOW fails" without checking
*which* rule_reference is cited would pass even if the code fell back to
the wrong (unamended) curfew value — this case exists specifically to
catch that failure mode.

---

### E2E-OP-007: TIME_WINDOW gate passes — window just outside KBP-CTR-3 amended curfew

**Doc ref:** `skypermit/docs/06-business-rules.md` — `A-7 §1` (curfew
23:00–05:00 for `KBP-CTR-3`)

**Role(s):** Operator

**Preconditions:**
- Same as `E2E-OP-006`, except the window is chosen to sit just outside
  the amended curfew: `window_start` at 05:01 zone-local (curfew ends
  05:00), duration within bounds, entirely clear of 23:00–05:00.

**Steps:**
1. Fill the request creation form identically to `E2E-OP-006` but with
   `window-start-input` at 05:01 zone-local.
2. Click `flight-request-check-button` (validate).

**Expected result:**
- UI shows all four gates passing, including `TIME_WINDOW` — no curfew
  failure.

**Rationale:** Pairs with `E2E-OP-006` as the boundary's other side. The
curfew is evaluated "minute-by-minute across the whole window, not just
the endpoints," so this also implicitly confirms the window's *end* must
clear 05:00 too, not just its start — worth revisiting if this case is
ever extended to a window that starts after 05:00 but is long enough to
be evaluated near the *next* curfew start at 23:00.
