# Booked too far in advance (> 60 days before window_start)

### E2E-OP-017: TIME_WINDOW fails when window_start is more than 60 days ahead

**Doc ref:** `skypermit/docs/06-business-rules.md` — `TSD-4 §2.2`
(§1.4 `TIME_WINDOW` table, "Maximum advance booking"; §6 `rule_reference`
table)

**Role(s):** Operator

**Preconditions:**
- Logged-in operator whose authorisation level meets the zone's required
  level.
- An active zone with no curfew, so the curfew check cannot fire.
- A pilot whose rating covers that zone's class and whose certification is
  current at `window_start`.
- An aircraft whose weight band is in that zone's `permitted_bands`.
- `window_start` is 60 days + 1 minute after the moment of validation (the
  threshold is 60 days; this is 1 minute past it). Because the form takes
  time to fill and `datetime-local` has minute granularity, enter
  `window_start` as the time of entry + 60 days + 5 minutes and click
  validate within 4 minutes, so the gap at evaluation is still more than 60
  days.
- Every other `TIME_WINDOW` condition is within limits: lead time is far
  above 6 hours, duration is 60 minutes (within 15-240), and no other
  `APPROVED`/`UNDER_REVIEW` request for that aircraft shares an instant with
  the window.
- Altitude is within the zone's ceiling.
- Neither the validation date nor the `window_start` date is the day of, or
  next to, a DST change (last Sunday of March / October).

**Steps:**
1. Open `/operator/requests/new`.
2. Choose the zone, pilot and aircraft in `flight-request-zone-select`,
   `flight-request-pilot-select` and `flight-request-aircraft-select`.
3. Enter `window_start` (60 days + 5 minutes after now) in
   `flight-request-window-start-input` and `window_end` (60 minutes later)
   in `flight-request-window-end-input`, an altitude within the zone's
   ceiling in `flight-request-altitude-input`, and any purpose in
   `flight-request-purpose-textarea`.
4. Click `flight-request-create-submit-button` (the request is created as
   `DRAFT`).
5. Click `flight-request-validate-button` within 4 minutes of step 3.

**Expected result:**
- `flight-request-gate-result-TIME_WINDOW` has `data-gate-status="FAIL"` and
  shows `rule_reference` `TSD-4 §2.2`.

**Rationale:** `TSD-4 §2.2` (restated in `OH-1 §5`) caps advance booking at
60 days before `window_start`. Sitting 1 minute past the cap with the
`PILOT`, `AIRCRAFT` and `ZONE` gates and the other `TIME_WINDOW` conditions
pinned to pass means the failure can only come from this rule, and the
citation `TSD-4 §2.2` distinguishes it from the lead-time (`TSD-4 §2.1`)
failure.
