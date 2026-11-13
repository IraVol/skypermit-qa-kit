# Flight duration range (TSD-4 §3)

Rule: `TIME_WINDOW`, `TSD-4 §3` — duration 15–240 minutes inclusive at both ends; `window_end` strictly after `window_start`. Source: 06 — Business Rules §1.4 and §6 (`rule_reference` = `TSD-4 §3`), 03 — API Contract, 02 — Request Lifecycle, 01 — Data Model (Confluence space SD).

Common setup in every case: `window_start` = request time + 24 h (well inside the 6 h–60 day lead-time limits), zone `DNI-OPN-1` (no curfew), single fresh aircraft (no overlap), pilot current — so the only variable is the duration.

Open points (doc silent):
- Non-positive duration (zero or negative): 06/01 say `window_end` must be strictly after `window_start`, but 03 does not say whether this is `400` at create or `422 TIME_WINDOW / TSD-4 §3` at validate/submit. The current app returns `400` at create. Cases .8–.9 record this and should be settled with the rules owner (add to 05 — Open Questions).
- Granularity: 06 speaks in minutes. Sub-minute values (e.g. 14 min 59 s, 240 min 1 s) are not specified, so no case asserts them.
- Order of checks inside `TIME_WINDOW` (lead time / advance / duration / curfew / overlap): only the gate order is specified; no case combines two TIME_WINDOW violations.

### API-OP-002.1: Duration 14 min fails TIME_WINDOW (1 min under the 15 min minimum (15 − 1))

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §3` (§1.4 `TIME_WINDOW`; §6) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** BV — just past the lower limit on the failing side (14 min)

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default).
- A pilot with rating `R_BASIC` (covers `OPEN`) whose `certified_on` is 6 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes.
- A newly registered aircraft with `mtom_grams` = 500 (band `C0`, permitted in the zone), with no other flight request (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. `AIRCRAFT` passes; no overlap can trigger.
- Zone `DNI-OPN-1` (class `OPEN`, ceiling 120 m, bands C0–C3, no curfew, required level `L1`, active), saved as {{zone_code}}. `ZONE` passes with `requested_altitude_metres` = 50.
- Duration: 14 min, 1 min under the 15 min minimum (15 − 1). Every other `TIME_WINDOW` condition is within limits: `window_start` = request time + 24 h (lead time between 6 h and 60 days), whole-hour aligned, no curfew (zone has none), no overlap.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = request time + 24 h, `window_end` = `window_start` + 14 min, `requested_altitude_metres` = 50.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`. (Creation does not run the duration gate.)
- Step 2: `422`, body `failing_gate` = `TIME_WINDOW`, `rule_reference` = `TSD-4 §3`, `message` non-empty (reference text: "Flight duration must be between 15 and 240 minutes." — do not assert the exact wording, 03 only requires a specific human-readable message).

**Rationale:** TSD-4 §3 allows 15–240 minutes inclusive at both ends. 14 min is 1 min under the 15 min minimum (15 − 1); the closest failing value on this side. Steps run back to back, within seconds, so lead time stays inside 6 h–60 days.

### API-OP-002.2: Duration 15 min passes TIME_WINDOW (exactly the 15 min minimum, inclusive)

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §3` (§1.4 `TIME_WINDOW`; §6) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** BV — on the lower boundary (15 min), inclusive

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default).
- A pilot with rating `R_BASIC` (covers `OPEN`) whose `certified_on` is 6 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes.
- A newly registered aircraft with `mtom_grams` = 500 (band `C0`, permitted in the zone), with no other flight request (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. `AIRCRAFT` passes; no overlap can trigger.
- Zone `DNI-OPN-1` (class `OPEN`, ceiling 120 m, bands C0–C3, no curfew, required level `L1`, active), saved as {{zone_code}}. `ZONE` passes with `requested_altitude_metres` = 50.
- Duration: 15 min, exactly the 15 min minimum, inclusive. Every other `TIME_WINDOW` condition is within limits: `window_start` = request time + 24 h (lead time between 6 h and 60 days), whole-hour aligned, no curfew (zone has none), no overlap.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = request time + 24 h, `window_end` = `window_start` + 15 min, `requested_altitude_metres` = 50.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`. (Creation does not run the duration gate.)
- Step 2: `200`, body `ok` = `true`.

**Rationale:** TSD-4 §3 allows 15–240 minutes inclusive at both ends. 15 min is exactly the 15 min minimum, inclusive; must pass, otherwise the inclusive boundary is off by one. Steps run back to back, within seconds, so lead time stays inside 6 h–60 days.

### API-OP-002.3: Duration 16 min passes TIME_WINDOW (1 min over the 15 min minimum (15 + 1))

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §3` (§1.4 `TIME_WINDOW`; §6) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** BV — just inside the lower limit (16 min)

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default).
- A pilot with rating `R_BASIC` (covers `OPEN`) whose `certified_on` is 6 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes.
- A newly registered aircraft with `mtom_grams` = 500 (band `C0`, permitted in the zone), with no other flight request (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. `AIRCRAFT` passes; no overlap can trigger.
- Zone `DNI-OPN-1` (class `OPEN`, ceiling 120 m, bands C0–C3, no curfew, required level `L1`, active), saved as {{zone_code}}. `ZONE` passes with `requested_altitude_metres` = 50.
- Duration: 16 min, 1 min over the 15 min minimum (15 + 1). Every other `TIME_WINDOW` condition is within limits: `window_start` = request time + 24 h (lead time between 6 h and 60 days), whole-hour aligned, no curfew (zone has none), no overlap.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = request time + 24 h, `window_end` = `window_start` + 16 min, `requested_altitude_metres` = 50.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`. (Creation does not run the duration gate.)
- Step 2: `200`, body `ok` = `true`.

**Rationale:** TSD-4 §3 allows 15–240 minutes inclusive at both ends. 16 min is 1 min over the 15 min minimum (15 + 1); must pass, otherwise the inclusive boundary is off by one. Steps run back to back, within seconds, so lead time stays inside 6 h–60 days.

### API-OP-002.4: Duration 239 min passes TIME_WINDOW (1 min under the 240 min maximum (240 − 1))

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §3` (§1.4 `TIME_WINDOW`; §6) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** BV — just inside the upper limit (239 min)

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default).
- A pilot with rating `R_BASIC` (covers `OPEN`) whose `certified_on` is 6 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes.
- A newly registered aircraft with `mtom_grams` = 500 (band `C0`, permitted in the zone), with no other flight request (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. `AIRCRAFT` passes; no overlap can trigger.
- Zone `DNI-OPN-1` (class `OPEN`, ceiling 120 m, bands C0–C3, no curfew, required level `L1`, active), saved as {{zone_code}}. `ZONE` passes with `requested_altitude_metres` = 50.
- Duration: 239 min, 1 min under the 240 min maximum (240 − 1). Every other `TIME_WINDOW` condition is within limits: `window_start` = request time + 24 h (lead time between 6 h and 60 days), whole-hour aligned, no curfew (zone has none), no overlap.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = request time + 24 h, `window_end` = `window_start` + 239 min, `requested_altitude_metres` = 50.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`. (Creation does not run the duration gate.)
- Step 2: `200`, body `ok` = `true`.

**Rationale:** TSD-4 §3 allows 15–240 minutes inclusive at both ends. 239 min is 1 min under the 240 min maximum (240 − 1); must pass, otherwise the inclusive boundary is off by one. Steps run back to back, within seconds, so lead time stays inside 6 h–60 days.

### API-OP-002.5: Duration 240 min passes TIME_WINDOW (exactly the 240 min maximum, inclusive)

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §3` (§1.4 `TIME_WINDOW`; §6) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** BV — on the upper boundary (240 min), inclusive

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default).
- A pilot with rating `R_BASIC` (covers `OPEN`) whose `certified_on` is 6 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes.
- A newly registered aircraft with `mtom_grams` = 500 (band `C0`, permitted in the zone), with no other flight request (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. `AIRCRAFT` passes; no overlap can trigger.
- Zone `DNI-OPN-1` (class `OPEN`, ceiling 120 m, bands C0–C3, no curfew, required level `L1`, active), saved as {{zone_code}}. `ZONE` passes with `requested_altitude_metres` = 50.
- Duration: 240 min, exactly the 240 min maximum, inclusive. Every other `TIME_WINDOW` condition is within limits: `window_start` = request time + 24 h (lead time between 6 h and 60 days), whole-hour aligned, no curfew (zone has none), no overlap.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = request time + 24 h, `window_end` = `window_start` + 240 min, `requested_altitude_metres` = 50.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`. (Creation does not run the duration gate.)
- Step 2: `200`, body `ok` = `true`.

**Rationale:** TSD-4 §3 allows 15–240 minutes inclusive at both ends. 240 min is exactly the 240 min maximum, inclusive; must pass, otherwise the inclusive boundary is off by one. Steps run back to back, within seconds, so lead time stays inside 6 h–60 days.

### API-OP-002.6: Duration 241 min fails TIME_WINDOW (1 min over the 240 min maximum (240 + 1))

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §3` (§1.4 `TIME_WINDOW`; §6) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** BV — just past the upper limit on the failing side (241 min)

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default).
- A pilot with rating `R_BASIC` (covers `OPEN`) whose `certified_on` is 6 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes.
- A newly registered aircraft with `mtom_grams` = 500 (band `C0`, permitted in the zone), with no other flight request (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. `AIRCRAFT` passes; no overlap can trigger.
- Zone `DNI-OPN-1` (class `OPEN`, ceiling 120 m, bands C0–C3, no curfew, required level `L1`, active), saved as {{zone_code}}. `ZONE` passes with `requested_altitude_metres` = 50.
- Duration: 241 min, 1 min over the 240 min maximum (240 + 1). Every other `TIME_WINDOW` condition is within limits: `window_start` = request time + 24 h (lead time between 6 h and 60 days), whole-hour aligned, no curfew (zone has none), no overlap.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = request time + 24 h, `window_end` = `window_start` + 241 min, `requested_altitude_metres` = 50.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`. (Creation does not run the duration gate.)
- Step 2: `422`, body `failing_gate` = `TIME_WINDOW`, `rule_reference` = `TSD-4 §3`, `message` non-empty (reference text: "Flight duration must be between 15 and 240 minutes." — do not assert the exact wording, 03 only requires a specific human-readable message).

**Rationale:** TSD-4 §3 allows 15–240 minutes inclusive at both ends. 241 min is 1 min over the 240 min maximum (240 + 1); the closest failing value on this side. Steps run back to back, within seconds, so lead time stays inside 6 h–60 days.

### API-OP-002.7: Duration 60 min (mid-range) passes TIME_WINDOW

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §3` (§1.4 `TIME_WINDOW`; §6) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** EP — valid class: 15 ≤ duration ≤ 240 min (representative 60 min)

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default).
- A pilot with rating `R_BASIC` (covers `OPEN`) whose `certified_on` is 6 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes.
- A newly registered aircraft with `mtom_grams` = 500 (band `C0`, permitted in the zone), with no other flight request (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. `AIRCRAFT` passes; no overlap can trigger.
- Zone `DNI-OPN-1` (class `OPEN`, ceiling 120 m, bands C0–C3, no curfew, required level `L1`, active), saved as {{zone_code}}. `ZONE` passes with `requested_altitude_metres` = 50.
- Duration: 60 min, well inside the valid class. Every other `TIME_WINDOW` condition is within limits: `window_start` = request time + 24 h (lead time between 6 h and 60 days), whole-hour aligned, no curfew (zone has none), no overlap.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = request time + 24 h, `window_end` = `window_start` + 60 min, `requested_altitude_metres` = 50.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `200`, body `ok` = `true`.

**Rationale:** Representative of the valid partition; confirms the happy path is not accidentally rejected away from the boundaries.

### API-OP-002.8: Zero-length window (window_end = window_start) is refused

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §3` (§1.4 `TIME_WINDOW`; §6) (Duration: "`window_end` strictly after `window_start`") · [01 — Data Model](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557058) (`window_end` "must be after `window_start`") · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) (`400`)

**Technique:** EP — invalid class: duration = 0 (not strictly after)

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default).
- A pilot with rating `R_BASIC` (covers `OPEN`) whose `certified_on` is 6 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes.
- A newly registered aircraft with `mtom_grams` = 500 (band `C0`, permitted in the zone), with no other flight request (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. `AIRCRAFT` passes; no overlap can trigger.
- Zone `DNI-OPN-1` (class `OPEN`, ceiling 120 m, bands C0–C3, no curfew, required level `L1`, active), saved as {{zone_code}}. `ZONE` passes with `requested_altitude_metres` = 50.
- Duration: 0 min — `window_end` equals `window_start`. Every other `TIME_WINDOW` condition is within limits: `window_start` = request time + 24 h (lead time between 6 h and 60 days), whole-hour aligned, no curfew (zone has none), no overlap.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = request time + 24 h, `window_end` = `window_start` (same instant), `requested_altitude_metres` = 50.
   Save `id` as {{fr_id}}.

**Expected result:**
- Step 1: request is refused and no `DRAFT` is created. Status per current implementation: `400` (malformed body; message "window_end must be after window_start."). 03 — API Contract does not say whether a non-positive window is `400` at create or `422 TIME_WINDOW` at validate/submit — see Open points; if the status differs from `400`, report against docs, not as a silent pass.
- If the implementation instead accepts the create (`201`), then a follow-up `validate` MUST return `422` `TIME_WINDOW` / `TSD-4 §3` — never `200`.

**Rationale:** 06 says the window must end strictly after it starts, so 0 min is invalid even before the 15 min minimum applies. This is the boundary between 'duration out of range' and 'malformed window'.

### API-OP-002.9: Negative-length window (window_end before window_start) is refused

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §3` (§1.4 `TIME_WINDOW`; §6) (Duration: "`window_end` strictly after `window_start`") · [01 — Data Model](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557058) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) (`400`)

**Technique:** EP — invalid class: duration < 0

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default).
- A pilot with rating `R_BASIC` (covers `OPEN`) whose `certified_on` is 6 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes.
- A newly registered aircraft with `mtom_grams` = 500 (band `C0`, permitted in the zone), with no other flight request (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. `AIRCRAFT` passes; no overlap can trigger.
- Zone `DNI-OPN-1` (class `OPEN`, ceiling 120 m, bands C0–C3, no curfew, required level `L1`, active), saved as {{zone_code}}. `ZONE` passes with `requested_altitude_metres` = 50.
- Duration: −30 min — `window_end` is 30 min before `window_start`. Every other `TIME_WINDOW` condition is within limits: `window_start` = request time + 24 h (lead time between 6 h and 60 days), whole-hour aligned, no curfew (zone has none), no overlap.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = request time + 24 h, `window_end` = `window_start` − 30 min, `requested_altitude_metres` = 50.
   Save `id` as {{fr_id}}.

**Expected result:**
- Step 1: request is refused, no `DRAFT` created. Status per current implementation: `400` ("window_end must be after window_start."). Same open point as API-OP-002.8; if accepted with `201`, a follow-up `validate` MUST return `422` `TIME_WINDOW`, never `200`.

**Rationale:** Second invalid partition: inverted window. Shows the guard is not just an equality check.

### API-OP-002.10: Out-of-range duration is reported as TIME_WINDOW only after earlier gates pass (gate order)

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §3` (§1.4 `TIME_WINDOW`; §6) (Evaluation order; §1.1 `PILOT` `OH-1 §2.3`) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) (gate pipeline)

**Technique:** ST — fixed gate order PILOT → AIRCRAFT → ZONE → TIME_WINDOW; first failure wins

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default).
- A pilot with rating `R_BASIC` whose `certified_on` is 24 months before `window_start` (certification lapsed, 18-month rule `OH-1 §2.3`) (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` FAILS — deliberate, this case checks gate order.
- A newly registered aircraft with `mtom_grams` = 500 (band `C0`, permitted in the zone), with no other flight request (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. `AIRCRAFT` passes; no overlap can trigger.
- Zone `DNI-OPN-1` (class `OPEN`, ceiling 120 m, bands C0–C3, no curfew, required level `L1`, active), saved as {{zone_code}}. `ZONE` passes with `requested_altitude_metres` = 50.
- Duration: 300 min, over the 240 min maximum (would fail `TIME_WINDOW`). Every other `TIME_WINDOW` condition is within limits: `window_start` = request time + 24 h (lead time between 6 h and 60 days), whole-hour aligned, no curfew (zone has none), no overlap.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = request time + 24 h, `window_end` = `window_start` + 300 min, `requested_altitude_metres` = 50.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `PILOT`, `rule_reference` = `OH-1 §2.3` (NOT `TIME_WINDOW` / `TSD-4 §3`), `message` non-empty.

**Rationale:** A 422 names only the first failing gate. The duration violation is real but masked by the earlier PILOT failure; guards against a pipeline that evaluates TIME_WINDOW first or reports all failures.

### API-OP-002.11: Reviewer validate on a 241 min request returns the same 422

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §3` (§1.4 `TIME_WINDOW`; §6) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate` · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) (reviewer-or-owner reads)

**Technique:** EP — role: reviewer probe of an invalid-duration request

**Role(s):** Operator (creates), Reviewer (validates)

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default).
- A pilot with rating `R_BASIC` whose `certified_on` is 24 months before `window_start` (certification lapsed, 18-month rule `OH-1 §2.3`) (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` FAILS — deliberate, this case checks gate order.
- A newly registered aircraft with `mtom_grams` = 500 (band `C0`, permitted in the zone), with no other flight request (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. `AIRCRAFT` passes; no overlap can trigger.
- Zone `DNI-OPN-1` (class `OPEN`, ceiling 120 m, bands C0–C3, no curfew, required level `L1`, active), saved as {{zone_code}}. `ZONE` passes with `requested_altitude_metres` = 50.
- Duration: 241 min, 1 min over the maximum. Every other `TIME_WINDOW` condition is within limits: `window_start` = request time + 24 h (lead time between 6 h and 60 days), whole-hour aligned, no curfew (zone has none), no overlap.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = request time + 24 h, `window_end` = `window_start` + 241 min, `requested_altitude_metres` = 50.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: `X-Reviewer-Id: qa-reviewer-1` header only (no session cookie).

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `TIME_WINDOW`, `rule_reference` = `TSD-4 §3`, `message` non-empty (reference text: "Flight duration must be between 15 and 240 minutes." — do not assert the exact wording, 03 only requires a specific human-readable message).

**Rationale:** Per 03, `validate` accepts the owner's session or any reviewer header, and runs the same pipeline; the duration gate must not depend on who asks.

### API-OP-002.12: Submit with 241 min duration is rejected: 422, request ends REJECTED with TSD-4 §3

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §3` (§1.4 `TIME_WINDOW`; §6) · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079) (DRAFT → submit → REJECTED) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) (`submit`, `422` body) · [01 — Data Model](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557058) (`failing_gate`, `rule_reference`)

**Technique:** ST — DRAFT --submit(gate fails)--> REJECTED

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default).
- A pilot with rating `R_BASIC` (covers `OPEN`) whose `certified_on` is 6 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes.
- A newly registered aircraft with `mtom_grams` = 500 (band `C0`, permitted in the zone), with no other flight request (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. `AIRCRAFT` passes; no overlap can trigger.
- Zone `DNI-OPN-1` (class `OPEN`, ceiling 120 m, bands C0–C3, no curfew, required level `L1`, active), saved as {{zone_code}}. `ZONE` passes with `requested_altitude_metres` = 50.
- Duration: 241 min, 1 min over the maximum. Every other `TIME_WINDOW` condition is within limits: `window_start` = request time + 24 h (lead time between 6 h and 60 days), whole-hour aligned, no curfew (zone has none), no overlap.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = request time + 24 h, `window_end` = `window_start` + 241 min, `requested_altitude_metres` = 50.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/submit`. Auth: operator session.
3. `GET /api/v1/flight-requests/{{fr_id}}`. Auth: operator session.
4. `POST /api/v1/flight-requests/{{fr_id}}/submit`. Auth: operator session. (Repeat on the now-terminal request.)

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `TIME_WINDOW`, `rule_reference` = `TSD-4 §3`, `message` non-empty (reference text: "Flight duration must be between 15 and 240 minutes." — do not assert the exact wording, 03 only requires a specific human-readable message).
- Step 3: `200`, `state` = `REJECTED`, `failing_gate` = `TIME_WINDOW`, `rule_reference` = `TSD-4 §3`, `rejection_reason` populated.
- Step 4: `409` (illegal transition: `REJECTED` is terminal).

**Rationale:** A failed gate on submit moves the request to REJECTED and persists failing_gate and rule_reference (01 — Data Model). Step 4 confirms the terminal state; 02 says re-submitting from a non-DRAFT state is 409.

### API-OP-002.13: Submit with 240 min duration passes the gate: request moves to UNDER_REVIEW

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §3` (§1.4 `TIME_WINDOW`; §6) · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079) (DRAFT → submit → UNDER_REVIEW) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) (`submit`)

**Technique:** ST — DRAFT --submit(gates pass)--> UNDER_REVIEW, at the upper boundary

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default).
- A pilot with rating `R_BASIC` (covers `OPEN`) whose `certified_on` is 6 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes.
- A newly registered aircraft with `mtom_grams` = 500 (band `C0`, permitted in the zone), with no other flight request (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. `AIRCRAFT` passes; no overlap can trigger.
- Zone `DNI-OPN-1` (class `OPEN`, ceiling 120 m, bands C0–C3, no curfew, required level `L1`, active), saved as {{zone_code}}. `ZONE` passes with `requested_altitude_metres` = 50.
- Duration: 240 min, exactly the maximum. Every other `TIME_WINDOW` condition is within limits: `window_start` = request time + 24 h (lead time between 6 h and 60 days), whole-hour aligned, no curfew (zone has none), no overlap.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = request time + 24 h, `window_end` = `window_start` + 240 min, `requested_altitude_metres` = 50.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/submit`. Auth: operator session.
3. `GET /api/v1/flight-requests/{{fr_id}}`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `200`, `state` = `UNDER_REVIEW`.
- Step 3: `200`, `state` = `UNDER_REVIEW`, `failing_gate` and `rule_reference` empty.

**Rationale:** Confirms the inclusive upper boundary also holds on the state-changing path, not only on the dry-run.
