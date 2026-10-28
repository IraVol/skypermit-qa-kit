# No part of the window may fall inside the zone's curfew (KBP-CTR-3 / ODS-CTR-5, 23:00–05:00)

Common set-up used by every case below (each case repeats the relevant parts
in its own Preconditions so it can be run alone):

- "Curfew start" = 23:00 and "curfew end" = 05:00, zone-local (Europe/Kyiv),
  the `A-7` §1 value for `KBP-CTR-3`. The curfew crosses midnight and is one
  continuous period.
- The browser running the portal is set to the Europe/Kyiv timezone, so the
  values typed into the `datetime-local` inputs are zone-local times.

### E2E-OP-006.1: TIME_WINDOW fails when the window ends 1 minute after curfew start

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `A-7 §1`
(§1.4 `TIME_WINDOW` curfew row; §4 `KBP-CTR-3` curfew; §6 `rule_reference` table)

**Technique:** BV — `window_end` = curfew start + 1 min (1 minute inside the curfew)

**Role(s):** Operator

**Preconditions:**
- Logged-in operator whose authorisation level meets the zone's required
  level (`L2` or higher).
- Zone `KBP-CTR-3` (curfew 23:00–05:00 zone-local, per `A-7` §1).
- A pilot whose rating covers the zone's class and whose certification is
  current at `window_start`.
- An aircraft whose weight band is in the zone's `permitted_bands`.
- Altitude at or below the zone's ceiling.
- `window_end` is curfew start + 1 min; `window_start` is `window_end` − 120
  min (so the duration is within 15–240 min and `window_start` is before the
  curfew, outside it).
- The window date is later than validation time + 6 h and earlier than
  validation time + 60 days, so lead time and advance booking pass.
- No other `APPROVED`/`UNDER_REVIEW` request for that aircraft shares an
  instant with the window.
- The date is not the day of, or next to, a DST change.
- Browser timezone is Europe/Kyiv.

**Steps:**
1. Open `/operator/requests/new`.
2. Choose the zone, pilot and aircraft in `flight-request-zone-select`,
   `flight-request-pilot-select` and `flight-request-aircraft-select`.
3. Enter the window in `flight-request-window-start-input` and
   `flight-request-window-end-input`, an altitude within the zone's ceiling
   in `flight-request-altitude-input`, and any purpose in
   `flight-request-purpose-textarea`.
4. Click `flight-request-create-submit-button` (the request is created as
   `DRAFT`).
5. Click `flight-request-validate-button`.

**Expected result:**
- `flight-request-gate-result-TIME_WINDOW` has `data-gate-status="FAIL"` and
  shows `rule_reference` `A-7 §1`.

**Rationale:** The curfew starts at 23:00; one minute past it is the first
minute that is inside the curfew, so the rule must reject. The earlier gates
(`PILOT`, `AIRCRAFT`, `ZONE`) and the other `TIME_WINDOW` conditions (lead
time, advance booking, duration, overlap) are pinned to pass, so the failure
can only come from the curfew check.

### E2E-OP-006.2: TIME_WINDOW passes when the window ends 1 minute before curfew start

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `A-7 §1`
(§1.4 `TIME_WINDOW` curfew row; §4 `KBP-CTR-3` curfew)

**Technique:** BV — `window_end` = curfew start − 1 min (1 minute outside the curfew)

**Role(s):** Operator

**Preconditions:**
- Logged-in operator whose authorisation level meets the zone's required
  level (`L2` or higher).
- Zone `KBP-CTR-3` (curfew 23:00–05:00 zone-local, per `A-7` §1).
- A pilot whose rating covers the zone's class and whose certification is
  current at `window_start`.
- An aircraft whose weight band is in the zone's `permitted_bands`.
- Altitude at or below the zone's ceiling.
- `window_end` is curfew start − 1 min; `window_start` is `window_end` − 120
  min (duration within 15–240 min; whole window before the curfew).
- The window date is later than validation time + 6 h and earlier than
  validation time + 60 days.
- No other `APPROVED`/`UNDER_REVIEW` request for that aircraft shares an
  instant with the window.
- The date is not the day of, or next to, a DST change.
- Browser timezone is Europe/Kyiv.

**Steps:**
1. Open `/operator/requests/new`.
2. Choose the zone, pilot and aircraft in `flight-request-zone-select`,
   `flight-request-pilot-select` and `flight-request-aircraft-select`.
3. Enter the window in `flight-request-window-start-input` and
   `flight-request-window-end-input`, an altitude within the zone's ceiling
   in `flight-request-altitude-input`, and any purpose in
   `flight-request-purpose-textarea`.
4. Click `flight-request-create-submit-button`.
5. Click `flight-request-validate-button`.

**Expected result:**
- `flight-request-gate-result-TIME_WINDOW` has `data-gate-status="PASS"`.

**Rationale:** Pairs with E2E-OP-006.1 one minute apart: a window that ends
just before the curfew starts has no minute inside the curfew, so the gate
must pass. Guards against an off-by-one that rejects windows merely adjacent
to the curfew.

### E2E-OP-006.3: TIME_WINDOW fails when the window starts 1 minute before curfew end

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `A-7 §1`
(§1.4 `TIME_WINDOW` curfew row; §4 `KBP-CTR-3` curfew; §6 `rule_reference` table)

**Technique:** BV — `window_start` = curfew end − 1 min (1 minute inside the curfew)

**Role(s):** Operator

**Preconditions:**
- Logged-in operator whose authorisation level meets the zone's required
  level (`L2` or higher).
- Zone `KBP-CTR-3` (curfew 23:00–05:00 zone-local, per `A-7` §1).
- A pilot whose rating covers the zone's class and whose certification is
  current at `window_start`.
- An aircraft whose weight band is in the zone's `permitted_bands`.
- Altitude at or below the zone's ceiling.
- `window_start` is curfew end − 1 min; `window_end` is `window_start` + 120
  min (duration within 15–240 min; the end is after the curfew).
- The window date is later than validation time + 6 h and earlier than
  validation time + 60 days.
- No other `APPROVED`/`UNDER_REVIEW` request for that aircraft shares an
  instant with the window.
- The date is not the day of, or next to, a DST change.
- Browser timezone is Europe/Kyiv.

**Steps:**
1. Open `/operator/requests/new`.
2. Choose the zone, pilot and aircraft in `flight-request-zone-select`,
   `flight-request-pilot-select` and `flight-request-aircraft-select`.
3. Enter the window in `flight-request-window-start-input` and
   `flight-request-window-end-input`, an altitude within the zone's ceiling
   in `flight-request-altitude-input`, and any purpose in
   `flight-request-purpose-textarea`.
4. Click `flight-request-create-submit-button`.
5. Click `flight-request-validate-button`.

**Expected result:**
- `flight-request-gate-result-TIME_WINDOW` has `data-gate-status="FAIL"` and
  shows `rule_reference` `A-7 §1`.

**Rationale:** The curfew ends at 05:00; a window that starts one minute
before that has its first minute inside the curfew, so the rule must reject
even though the window finishes after the curfew. All other gates and
`TIME_WINDOW` conditions are pinned to pass.

### E2E-OP-006.4: TIME_WINDOW passes when the window starts 1 minute after curfew end

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `A-7 §1`
(§1.4 `TIME_WINDOW` curfew row; §4 `KBP-CTR-3` curfew)

**Technique:** BV — `window_start` = curfew end + 1 min (1 minute outside the curfew)

**Role(s):** Operator

**Preconditions:**
- Logged-in operator whose authorisation level meets the zone's required
  level (`L2` or higher).
- Zone `KBP-CTR-3` (curfew 23:00–05:00 zone-local, per `A-7` §1).
- A pilot whose rating covers the zone's class and whose certification is
  current at `window_start`.
- An aircraft whose weight band is in the zone's `permitted_bands`.
- Altitude at or below the zone's ceiling.
- `window_start` is curfew end + 1 min; `window_end` is `window_start` + 120
  min (duration within 15–240 min; whole window after the curfew).
- The window date is later than validation time + 6 h and earlier than
  validation time + 60 days.
- No other `APPROVED`/`UNDER_REVIEW` request for that aircraft shares an
  instant with the window.
- The date is not the day of, or next to, a DST change.
- Browser timezone is Europe/Kyiv.

**Steps:**
1. Open `/operator/requests/new`.
2. Choose the zone, pilot and aircraft in `flight-request-zone-select`,
   `flight-request-pilot-select` and `flight-request-aircraft-select`.
3. Enter the window in `flight-request-window-start-input` and
   `flight-request-window-end-input`, an altitude within the zone's ceiling
   in `flight-request-altitude-input`, and any purpose in
   `flight-request-purpose-textarea`.
4. Click `flight-request-create-submit-button`.
5. Click `flight-request-validate-button`.

**Expected result:**
- `flight-request-gate-result-TIME_WINDOW` has `data-gate-status="PASS"`.

**Rationale:** Pairs with E2E-OP-006.3 one minute apart: a window that
starts just after the curfew ends has no minute inside it and must pass.

### E2E-OP-006.5: TIME_WINDOW fails when the whole window lies inside the curfew after midnight

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `A-7 §1`
(§1.4 `TIME_WINDOW` curfew row; §4 `KBP-CTR-3` curfew; §6 `rule_reference` table)

**Technique:** EP — window entirely inside the curfew, on the after-midnight side (neither endpoint at a curfew boundary)

**Role(s):** Operator

**Preconditions:**
- Logged-in operator whose authorisation level meets the zone's required
  level (`L2` or higher).
- Zone `KBP-CTR-3` (curfew 23:00–05:00 zone-local, per `A-7` §1).
- A pilot whose rating covers the zone's class and whose certification is
  current at `window_start`.
- An aircraft whose weight band is in the zone's `permitted_bands`.
- Altitude at or below the zone's ceiling.
- `window_start` and `window_end` both fall between local midnight and
  curfew end, at least 1 h from each, with a duration of 60 min (within
  15–240 min).
- The window date is later than validation time + 6 h and earlier than
  validation time + 60 days.
- No other `APPROVED`/`UNDER_REVIEW` request for that aircraft shares an
  instant with the window.
- The date is not the day of, or next to, a DST change.
- Browser timezone is Europe/Kyiv.

**Steps:**
1. Open `/operator/requests/new`.
2. Choose the zone, pilot and aircraft in `flight-request-zone-select`,
   `flight-request-pilot-select` and `flight-request-aircraft-select`.
3. Enter the window in `flight-request-window-start-input` and
   `flight-request-window-end-input`, an altitude within the zone's ceiling
   in `flight-request-altitude-input`, and any purpose in
   `flight-request-purpose-textarea`.
4. Click `flight-request-create-submit-button`.
5. Click `flight-request-validate-button`.

**Expected result:**
- `flight-request-gate-result-TIME_WINDOW` has `data-gate-status="FAIL"` and
  shows `rule_reference` `A-7 §1`.

**Rationale:** The BV cases straddle a curfew boundary; this one has the
window wholly inside the curfew, away from both boundaries, which is a
distinct partition (the curfew part that lies after midnight).

### E2E-OP-006.6: TIME_WINDOW fails when the window crosses local midnight inside the curfew

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `A-7 §1`
(§1.4 `TIME_WINDOW` curfew row, "Curfews crossing midnight are one continuous period"; §6 `rule_reference` table)

**Technique:** EP — window entirely inside the curfew and spanning local midnight

**Role(s):** Operator

**Preconditions:**
- Logged-in operator whose authorisation level meets the zone's required
  level (`L2` or higher).
- Zone `KBP-CTR-3` (curfew 23:00–05:00 zone-local, per `A-7` §1).
- A pilot whose rating covers the zone's class and whose certification is
  current at `window_start`.
- An aircraft whose weight band is in the zone's `permitted_bands`.
- Altitude at or below the zone's ceiling.
- `window_start` is after curfew start and before local midnight;
  `window_end` is after local midnight and before curfew end; each is at
  least 15 min from midnight and the duration is 60 min (within 15–240 min).
- The window date is later than validation time + 6 h and earlier than
  validation time + 60 days.
- No other `APPROVED`/`UNDER_REVIEW` request for that aircraft shares an
  instant with the window.
- The date is not the day of, or next to, a DST change.
- Browser timezone is Europe/Kyiv.

**Steps:**
1. Open `/operator/requests/new`.
2. Choose the zone, pilot and aircraft in `flight-request-zone-select`,
   `flight-request-pilot-select` and `flight-request-aircraft-select`.
3. Enter the window in `flight-request-window-start-input` and
   `flight-request-window-end-input` (start on one calendar day, end on the
   next), an altitude within the zone's ceiling in
   `flight-request-altitude-input`, and any purpose in
   `flight-request-purpose-textarea`.
4. Click `flight-request-create-submit-button`.
5. Click `flight-request-validate-button`.

**Expected result:**
- `flight-request-gate-result-TIME_WINDOW` has `data-gate-status="FAIL"` and
  shows `rule_reference` `A-7 §1`.

**Rationale:** The rule states a curfew crossing midnight is one continuous
period. An implementation that models the curfew as two same-day ranges, or
compares only times of day with start < end, can miss a window that spans
midnight; this case targets that.

### E2E-OP-006.7: TIME_WINDOW passes for a window inside 23:00–05:00 when the zone has no curfew

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `A-7 §1`
(§1.4 `TIME_WINDOW` curfew row, "if it has one"; §4 zone table)

**Technique:** EP — zone without a curfew

**Role(s):** Operator

**Preconditions:**
- Logged-in operator whose authorisation level meets the zone's required
  level.
- A zone with no curfew (per the §4 zone catalogue).
- A pilot whose rating covers that zone's class and whose certification is
  current at `window_start`.
- An aircraft whose weight band is in that zone's `permitted_bands`.
- Altitude at or below that zone's ceiling.
- The window lies entirely between 23:00 and 05:00 zone-local (the hours
  that are a curfew for `KBP-CTR-3`), at least 1 h from each of those
  times, with a duration of 60 min (within 15–240 min).
- The window date is later than validation time + 6 h and earlier than
  validation time + 60 days.
- No other `APPROVED`/`UNDER_REVIEW` request for that aircraft shares an
  instant with the window.
- The date is not the day of, or next to, a DST change.
- Browser timezone is Europe/Kyiv.

**Steps:**
1. Open `/operator/requests/new`.
2. Choose the zone, pilot and aircraft in `flight-request-zone-select`,
   `flight-request-pilot-select` and `flight-request-aircraft-select`.
3. Enter the window in `flight-request-window-start-input` and
   `flight-request-window-end-input`, an altitude within the zone's ceiling
   in `flight-request-altitude-input`, and any purpose in
   `flight-request-purpose-textarea`.
4. Click `flight-request-create-submit-button`.
5. Click `flight-request-validate-button`.

**Expected result:**
- `flight-request-gate-result-TIME_WINDOW` has `data-gate-status="PASS"`.

**Rationale:** The rule applies only "if it has one". The same hours that are
rejected for `KBP-CTR-3` must pass for a zone with no curfew, so the curfew
check is driven by the zone's own curfew value and is not a global
night-time ban.

### E2E-OP-006.8: Validate of a request inside the curfew leaves it in DRAFT

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `A-7 §1`
(§1.4 `TIME_WINDOW` curfew row; §6 `rule_reference` table)

**Technique:** ST — `DRAFT` → validate (failing) → `DRAFT`

**Role(s):** Operator

**Preconditions:**
- Logged-in operator whose authorisation level meets the zone's required
  level (`L2` or higher).
- Zone `KBP-CTR-3` (curfew 23:00–05:00 zone-local, per `A-7` §1).
- A pilot whose rating covers the zone's class and whose certification is
  current at `window_start`.
- An aircraft whose weight band is in the zone's `permitted_bands`.
- Altitude at or below the zone's ceiling.
- The window lies entirely inside the curfew (at least 1 h from each curfew
  boundary), with a duration of 60 min (within 15–240 min).
- The window date is later than validation time + 6 h and earlier than
  validation time + 60 days.
- No other `APPROVED`/`UNDER_REVIEW` request for that aircraft shares an
  instant with the window.
- The date is not the day of, or next to, a DST change.
- Browser timezone is Europe/Kyiv.

**Steps:**
1. Open `/operator/requests/new`.
2. Choose the zone, pilot and aircraft in `flight-request-zone-select`,
   `flight-request-pilot-select` and `flight-request-aircraft-select`.
3. Enter the window in `flight-request-window-start-input` and
   `flight-request-window-end-input`, an altitude within the zone's ceiling
   in `flight-request-altitude-input`, and any purpose in
   `flight-request-purpose-textarea`.
4. Click `flight-request-create-submit-button`.
5. Click `flight-request-validate-button`.

**Expected result:**
- `flight-request-detail-state` shows `DRAFT`.

**Rationale:** `validate` runs the gate pipeline but never changes state, so
even a curfew failure must not move the request out of `DRAFT`.

### E2E-OP-006.9: Submit of a request inside the curfew ends REJECTED with the curfew citation

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `A-7 §1`
(§1.4 `TIME_WINDOW` curfew row; §6 `rule_reference` table)

**Technique:** ST — `DRAFT` → submit (failing) → `REJECTED`

**Role(s):** Operator

**Preconditions:**
- Logged-in operator whose authorisation level meets the zone's required
  level (`L2` or higher).
- Zone `KBP-CTR-3` (curfew 23:00–05:00 zone-local, per `A-7` §1).
- A pilot whose rating covers the zone's class and whose certification is
  current at `window_start`.
- An aircraft whose weight band is in the zone's `permitted_bands`.
- Altitude at or below the zone's ceiling.
- The window lies entirely inside the curfew (at least 1 h from each curfew
  boundary), with a duration of 60 min (within 15–240 min).
- The window date is later than validation time + 6 h and earlier than
  validation time + 60 days.
- No other `APPROVED`/`UNDER_REVIEW` request for that aircraft shares an
  instant with the window.
- The date is not the day of, or next to, a DST change.
- Browser timezone is Europe/Kyiv.

**Steps:**
1. Open `/operator/requests/new`.
2. Choose the zone, pilot and aircraft in `flight-request-zone-select`,
   `flight-request-pilot-select` and `flight-request-aircraft-select`.
3. Enter the window in `flight-request-window-start-input` and
   `flight-request-window-end-input`, an altitude within the zone's ceiling
   in `flight-request-altitude-input`, and any purpose in
   `flight-request-purpose-textarea`.
4. Click `flight-request-create-submit-button`.
5. Click `flight-request-submit-button`.

**Expected result:**
- `flight-request-detail-state` shows `REJECTED`.
- `flight-request-detail-rule-reference` shows `A-7 §1`.

**Rationale:** Submitting a request that fails a gate moves it
`DRAFT` → `REJECTED` and records the citation of the first failing gate; the
curfew is the only failing condition here, so the citation must be the
curfew one.

### E2E-OP-006.10: Submit of a request outside the curfew ends UNDER_REVIEW

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `A-7 §1`
(§1.4 `TIME_WINDOW` curfew row; state machine for the submit transition is covered on the State Machine page)

**Technique:** ST — `DRAFT` → submit (passing) → `UNDER_REVIEW`

**Role(s):** Operator

**Preconditions:**
- Logged-in operator whose authorisation level meets the zone's required
  level (`L2` or higher).
- Zone `KBP-CTR-3` (curfew 23:00–05:00 zone-local, per `A-7` §1).
- A pilot whose rating covers the zone's class and whose certification is
  current at `window_start`.
- An aircraft whose weight band is in the zone's `permitted_bands`.
- Altitude at or below the zone's ceiling.
- The window lies entirely outside the curfew (at least 1 h from each curfew
  boundary), with a duration of 60 min (within 15–240 min).
- The window date is later than validation time + 6 h and earlier than
  validation time + 60 days.
- No other `APPROVED`/`UNDER_REVIEW` request for that aircraft shares an
  instant with the window.
- The date is not the day of, or next to, a DST change.
- Browser timezone is Europe/Kyiv.

**Steps:**
1. Open `/operator/requests/new`.
2. Choose the zone, pilot and aircraft in `flight-request-zone-select`,
   `flight-request-pilot-select` and `flight-request-aircraft-select`.
3. Enter the window in `flight-request-window-start-input` and
   `flight-request-window-end-input`, an altitude within the zone's ceiling
   in `flight-request-altitude-input`, and any purpose in
   `flight-request-purpose-textarea`.
4. Click `flight-request-create-submit-button`.
5. Click `flight-request-submit-button`.

**Expected result:**
- `flight-request-detail-state` shows `UNDER_REVIEW`.

**Rationale:** With every gate passing, including the curfew check,
submitting moves the request `DRAFT` → `UNDER_REVIEW`; it confirms the
curfew rule does not reject a request that is entirely outside the curfew.
