# Lead time too short

### API-OP-001.1: Lead time 1 min under the 6 h minimum fails TIME_WINDOW

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §2.1` (§1.4 `TIME_WINDOW`; §6) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** BV — just past the limit on the failing side (6 h − 1 min)

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default).
- A pilot whose rating covers the zone's class and whose certification is current at `window_start`, i.e. `certified_on` well within 18 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes.
- A newly registered aircraft in a weight band the zone permits, with no other flight request (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. `AIRCRAFT` passes; no overlap condition can trigger.
- An active zone with no curfew whose required authorisation level is `L1`, of class `OPEN` (any pilot rating is accepted), saved as {{zone_code}}. `ZONE` passes.
- Lead time: validation time + 5 h 59 min, 1 min under the 6 h minimum. Every other `TIME_WINDOW` condition is within limits: duration 60 min, `window_start` far less than 60 days ahead, no curfew, no overlap. The window is not on, or next to, a DST change.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = request time + 5 h 59 min, `window_end` = `window_start` + 60 min, `requested_altitude_metres` = within the zone ceiling.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `TIME_WINDOW`, `rule_reference` = `TSD-4 §2.1`, `message` non-empty.

**Rationale:** TSD-4 §2.1 requires at least 6 hours between submission and `window_start`. One minute under is the closest failing value in the rule's minute granularity. Story SKY-2. Steps run back to back, within seconds, so the lead time stays on the same side of the limit.

### API-OP-001.2: Lead time 1 min over the 6 h minimum passes TIME_WINDOW

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §2.1` (§1.4 `TIME_WINDOW`; §6) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** BV — just inside the limit on the passing side (6 h + 1 min)

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default).
- A pilot whose rating covers the zone's class and whose certification is current at `window_start`, i.e. `certified_on` well within 18 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes.
- A newly registered aircraft in a weight band the zone permits, with no other flight request (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. `AIRCRAFT` passes; no overlap condition can trigger.
- An active zone with no curfew whose required authorisation level is `L1`, of class `OPEN` (any pilot rating is accepted), saved as {{zone_code}}. `ZONE` passes.
- Lead time: validation time + 6 h 01 min, 1 min over the 6 h minimum. Every other `TIME_WINDOW` condition is within limits: duration 60 min, `window_start` far less than 60 days ahead, no curfew, no overlap. The window is not on, or next to, a DST change.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = request time + 6 h 01 min, `window_end` = `window_start` + 60 min, `requested_altitude_metres` = within the zone ceiling.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `200`, body `ok` = `true`.

**Rationale:** Pairs with the 5 h 59 min case to pin the threshold from both sides; with all four gates passing, validate must not report a failure. Story SKY-2. Steps run back to back, within seconds, so the lead time stays on the same side of the limit.

### API-OP-001.3: Validate on a request failing lead time returns 422 and leaves it DRAFT

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §2.1` (§1.4 `TIME_WINDOW`; §6) · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** ST — `validate` on a failing request: 422, state stays DRAFT

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default).
- A pilot whose rating covers the zone's class and whose certification is current at `window_start`, i.e. `certified_on` well within 18 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes.
- A newly registered aircraft in a weight band the zone permits, with no other flight request (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. `AIRCRAFT` passes; no overlap condition can trigger.
- An active zone with no curfew whose required authorisation level is `L1`, of class `OPEN` (any pilot rating is accepted), saved as {{zone_code}}. `ZONE` passes.
- Lead time: validation time + 5 h 59 min, 1 min under the 6 h minimum. Every other `TIME_WINDOW` condition is within limits: duration 60 min, `window_start` far less than 60 days ahead, no curfew, no overlap. The window is not on, or next to, a DST change.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = request time + 5 h 59 min, `window_end` = `window_start` + 60 min, `requested_altitude_metres` = within the zone ceiling.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.
3. `GET /api/v1/flight-requests/{{fr_id}}`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `TIME_WINDOW`, `rule_reference` = `TSD-4 §2.1`, `message` non-empty.
- Step 3: `200`, `state` = `DRAFT`.

**Rationale:** `validate` is a dry run: it reports the gate failure but never moves the request (03 endpoint 13; 02, no transition from `validate`). The follow-up `GET` proves no state change. Story SKY-2.

### API-OP-001.4: Submit of a request failing lead time moves it DRAFT → REJECTED

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §2.1` (§1.4 `TIME_WINDOW`; §6) · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079) (DRAFT → REJECTED) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/submit`

**Technique:** ST — DRAFT → REJECTED on gate failure

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default).
- A pilot whose rating covers the zone's class and whose certification is current at `window_start`, i.e. `certified_on` well within 18 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes.
- A newly registered aircraft in a weight band the zone permits, with no other flight request (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. `AIRCRAFT` passes; no overlap condition can trigger.
- An active zone with no curfew whose required authorisation level is `L1`, of class `OPEN` (any pilot rating is accepted), saved as {{zone_code}}. `ZONE` passes.
- Lead time: validation time + 5 h 59 min, 1 min under the 6 h minimum. Every other `TIME_WINDOW` condition is within limits: duration 60 min, `window_start` far less than 60 days ahead, no curfew, no overlap. The window is not on, or next to, a DST change.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = request time + 5 h 59 min, `window_end` = `window_start` + 60 min, `requested_altitude_metres` = within the zone ceiling.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/submit`. Auth: operator session.
3. `GET /api/v1/flight-requests/{{fr_id}}`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `TIME_WINDOW`, `rule_reference` = `TSD-4 §2.1`, `message` non-empty.
- Step 3: `200`, `state` = `REJECTED`, `failing_gate` = `TIME_WINDOW`, `rule_reference` = `TSD-4 §2.1`, `rejection_reason` non-empty.

**Rationale:** A gate failure on submit is the path from `DRAFT` straight to `REJECTED` with `failing_gate` and `rejection_reason` populated; the `422` alone does not prove the row moved. Story SKY-2.

### API-OP-001.5: Re-submit of a REJECTED request returns 409

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §2.1` (§1.4 `TIME_WINDOW`; §6) · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079) (REJECTED is terminal) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/submit`

**Technique:** ST — illegal transition REJECTED → submit

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default).
- A pilot whose rating covers the zone's class and whose certification is current at `window_start`, i.e. `certified_on` well within 18 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes.
- A newly registered aircraft in a weight band the zone permits, with no other flight request (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. `AIRCRAFT` passes; no overlap condition can trigger.
- An active zone with no curfew whose required authorisation level is `L1`, of class `OPEN` (any pilot rating is accepted), saved as {{zone_code}}. `ZONE` passes.
- Lead time: validation time + 5 h 59 min, 1 min under the 6 h minimum (used only to reach `REJECTED`). Every other `TIME_WINDOW` condition is within limits: duration 60 min, `window_start` far less than 60 days ahead, no curfew, no overlap. The window is not on, or next to, a DST change.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = request time + 5 h 59 min, `window_end` = `window_start` + 60 min, `requested_altitude_metres` = within the zone ceiling.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/submit`. Auth: operator session.
3. `POST /api/v1/flight-requests/{{fr_id}}/submit`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `TIME_WINDOW`, `rule_reference` = `TSD-4 §2.1`, `message` non-empty.
- Step 3: `409`.

**Rationale:** `REJECTED` is terminal and `(REJECTED, submit)` is not a legal pair, so it returns `409` (cannot be attempted), not `422` (attempted and refused). The first submit only gets the request into `REJECTED` through the lead-time failure. Story SKY-2.

### API-OP-001.6: Submit of a request 1 min over the lead-time minimum moves it DRAFT → UNDER_REVIEW

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §2.1` (§1.4 `TIME_WINDOW`; §6) · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079) (DRAFT → SUBMITTED → UNDER_REVIEW) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/submit`

**Technique:** ST — DRAFT → UNDER_REVIEW on all gates passing

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default).
- A pilot whose rating covers the zone's class and whose certification is current at `window_start`, i.e. `certified_on` well within 18 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes.
- A newly registered aircraft in a weight band the zone permits, with no other flight request (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. `AIRCRAFT` passes; no overlap condition can trigger.
- An active zone with no curfew whose required authorisation level is `L1`, of class `OPEN` (any pilot rating is accepted), saved as {{zone_code}}. `ZONE` passes.
- Lead time: validation time + 6 h 01 min, 1 min over the 6 h minimum. Every other `TIME_WINDOW` condition is within limits: duration 60 min, `window_start` far less than 60 days ahead, no curfew, no overlap. The window is not on, or next to, a DST change.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = request time + 6 h 01 min, `window_end` = `window_start` + 60 min, `requested_altitude_metres` = within the zone ceiling.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/submit`. Auth: operator session.
3. `GET /api/v1/flight-requests/{{fr_id}}`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `200`, `state` = `UNDER_REVIEW`.
- Step 3: `200`, `state` = `UNDER_REVIEW`.

**Rationale:** Just inside the lead-time limit with every other condition passing, submit must not reject on `TIME_WINDOW`; the request leaves `DRAFT` for `UNDER_REVIEW` (02: `SUBMITTED` is never observed at rest). Story SKY-2. Steps run back to back, within seconds, so the lead time stays on the same side of the limit.
