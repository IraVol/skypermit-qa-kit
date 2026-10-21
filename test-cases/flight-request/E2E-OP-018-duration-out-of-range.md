# Duration out of range

### E2E-OP-018: TIME_WINDOW fails when the window is shorter than 15 minutes

**Doc ref:** `skypermit/docs/06-business-rules.md` — `TSD-4 §3`
(§1.4 `TIME_WINDOW` table, "Duration"; §6 `rule_reference` table)

**Role(s):** Operator

**Preconditions:**
- Logged-in operator whose authorisation level meets the zone's required
  level.
- A zone that is active and has no curfew, so the curfew check cannot fire.
- A pilot whose rating covers that zone's class and whose certification is
  current at `window_start`.
- An aircraft whose weight band is in that zone's `permitted_bands`.
- Altitude within the zone's ceiling.
- Window duration = 14 minutes (`window_end` = `window_start` + 14 min), i.e.
  1 minute short of the 15-minute minimum. `window_end` is strictly after
  `window_start`. The only violated condition is duration.
- `window_start` = validation time + 7 h, comfortably past the 6-hour
  minimum lead time and well within 60 days ahead.
- No other `APPROVED`/`UNDER_REVIEW` request for that aircraft shares an
  instant with the window.
- The chosen date is not the day of, or next to, a DST change (last Sunday
  of March / October), so the lead-time arithmetic does not cross a UTC
  offset change.

**Steps:**
1. Open `/operator/requests/new`.
2. Choose the zone, pilot and aircraft in `flight-request-zone-select`,
   `flight-request-pilot-select` and `flight-request-aircraft-select`.
3. Enter `window_start` (current time + 7 h) in
   `flight-request-window-start-input` and `window_end` (`window_start` +
   14 min) in `flight-request-window-end-input`, an altitude within the
   zone's ceiling in `flight-request-altitude-input`, and any purpose in
   `flight-request-purpose-textarea`.
4. Click `flight-request-create-submit-button` (the request is created as
   `DRAFT`).
5. Click `flight-request-validate-button`.

**Expected result:**
- `flight-request-gate-result-TIME_WINDOW` has `data-gate-status="FAIL"` and
  shows `rule_reference` `TSD-4 §3`.

**Rationale:** `TSD-4 §3` allows durations of 15-240 minutes, inclusive at
both ends; 14 minutes sits one minute past the lower boundary on the failing
side. `PILOT`, `AIRCRAFT` and `ZONE` are pinned to pass, and the other
`TIME_WINDOW` conditions (minimum lead time, maximum advance booking, curfew,
overlap) are pinned within limits, so the first failing gate can only be
duration. Validate is used instead of submit so the case asserts the rule
without involving the state machine.
