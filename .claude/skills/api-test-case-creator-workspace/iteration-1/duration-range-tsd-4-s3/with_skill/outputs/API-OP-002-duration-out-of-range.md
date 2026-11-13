# Duration out of range

### API-OP-002.1: Duration 14 min (just below the lower bound) fails validation

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §3` (§1.4 `TIME_WINDOW`; §6) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** BV — duration = 14 min (boundary − 1, lower)

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below.
- A pilot that passes `PILOT` for the zone: rating covers the zone's class, certification current at `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}.
- An aircraft that passes `AIRCRAFT` for the zone: weight band permitted by the zone (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. It has no `APPROVED` or `UNDER_REVIEW` request, so no overlap.
- An active zone of class `OPEN` with no curfew, required authorisation level `L1`, all weight bands permitted (existing reference data, read via `GET /api/v1/zones`), saved as {{zone_code}}. The operator is `L1`, so `ZONE` passes.
- `window_start` = validation time + 24 h (inside the 6 h minimum lead time and the 60-day maximum advance). The window is not on, or next to, a DST change.
- Only the duration is varied: `window_end` − `window_start` = 14 min. Every other `TIME_WINDOW` condition is within limits.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = validation time + 24 h, `window_end` = `window_start` + 14 min, `requested_altitude_metres` = within the zone ceiling.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, `failing_gate` = `TIME_WINDOW`, `rule_reference` = `TSD-4 §3`, `message` non-empty.

**Rationale:** Lower bound is 15 min inclusive; 1 min below must fail. 06 §1.4 / `TSD-4 §3`. Single read-only probe: `validate` never changes state (03, endpoint 13).

### API-OP-002.2: Duration 15 min (at the lower bound) passes validation

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §3` (§1.4 `TIME_WINDOW`; §6) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** BV — duration = 15 min (boundary, lower)

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below.
- A pilot that passes `PILOT` for the zone: rating covers the zone's class, certification current at `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}.
- An aircraft that passes `AIRCRAFT` for the zone: weight band permitted by the zone (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. It has no `APPROVED` or `UNDER_REVIEW` request, so no overlap.
- An active zone of class `OPEN` with no curfew, required authorisation level `L1`, all weight bands permitted (existing reference data, read via `GET /api/v1/zones`), saved as {{zone_code}}. The operator is `L1`, so `ZONE` passes.
- `window_start` = validation time + 24 h (inside the 6 h minimum lead time and the 60-day maximum advance). The window is not on, or next to, a DST change.
- Only the duration is varied: `window_end` − `window_start` = 15 min. Every other `TIME_WINDOW` condition is within limits.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = validation time + 24 h, `window_end` = `window_start` + 15 min, `requested_altitude_metres` = within the zone ceiling.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `200`.

**Rationale:** Lower bound is inclusive ("15–240 minutes, inclusive at both ends"); the limit itself must pass. Single read-only probe: `validate` never changes state (03, endpoint 13).

### API-OP-002.3: Duration 16 min (just inside the lower bound) passes validation

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §3` (§1.4 `TIME_WINDOW`; §6) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** BV — duration = 16 min (boundary + 1, lower)

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below.
- A pilot that passes `PILOT` for the zone: rating covers the zone's class, certification current at `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}.
- An aircraft that passes `AIRCRAFT` for the zone: weight band permitted by the zone (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. It has no `APPROVED` or `UNDER_REVIEW` request, so no overlap.
- An active zone of class `OPEN` with no curfew, required authorisation level `L1`, all weight bands permitted (existing reference data, read via `GET /api/v1/zones`), saved as {{zone_code}}. The operator is `L1`, so `ZONE` passes.
- `window_start` = validation time + 24 h (inside the 6 h minimum lead time and the 60-day maximum advance). The window is not on, or next to, a DST change.
- Only the duration is varied: `window_end` − `window_start` = 16 min. Every other `TIME_WINDOW` condition is within limits.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = validation time + 24 h, `window_end` = `window_start` + 16 min, `requested_altitude_metres` = within the zone ceiling.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `200`.

**Rationale:** 1 min inside the lower bound passes; completes the BV triple (14, 15, 16). Single read-only probe: `validate` never changes state (03, endpoint 13).

### API-OP-002.4: Duration 239 min (just inside the upper bound) passes validation

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §3` (§1.4 `TIME_WINDOW`; §6) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** BV — duration = 239 min (boundary − 1, upper)

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below.
- A pilot that passes `PILOT` for the zone: rating covers the zone's class, certification current at `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}.
- An aircraft that passes `AIRCRAFT` for the zone: weight band permitted by the zone (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. It has no `APPROVED` or `UNDER_REVIEW` request, so no overlap.
- An active zone of class `OPEN` with no curfew, required authorisation level `L1`, all weight bands permitted (existing reference data, read via `GET /api/v1/zones`), saved as {{zone_code}}. The operator is `L1`, so `ZONE` passes.
- `window_start` = validation time + 24 h (inside the 6 h minimum lead time and the 60-day maximum advance). The window is not on, or next to, a DST change.
- Only the duration is varied: `window_end` − `window_start` = 239 min. Every other `TIME_WINDOW` condition is within limits.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = validation time + 24 h, `window_end` = `window_start` + 239 min, `requested_altitude_metres` = within the zone ceiling.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `200`.

**Rationale:** 1 min inside the upper bound passes; first of the upper BV triple (239, 240, 241). Single read-only probe: `validate` never changes state (03, endpoint 13).

### API-OP-002.5: Duration 240 min (at the upper bound) passes validation

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §3` (§1.4 `TIME_WINDOW`; §6) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** BV — duration = 240 min (boundary, upper)

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below.
- A pilot that passes `PILOT` for the zone: rating covers the zone's class, certification current at `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}.
- An aircraft that passes `AIRCRAFT` for the zone: weight band permitted by the zone (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. It has no `APPROVED` or `UNDER_REVIEW` request, so no overlap.
- An active zone of class `OPEN` with no curfew, required authorisation level `L1`, all weight bands permitted (existing reference data, read via `GET /api/v1/zones`), saved as {{zone_code}}. The operator is `L1`, so `ZONE` passes.
- `window_start` = validation time + 24 h (inside the 6 h minimum lead time and the 60-day maximum advance). The window is not on, or next to, a DST change.
- Only the duration is varied: `window_end` − `window_start` = 240 min. Every other `TIME_WINDOW` condition is within limits.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = validation time + 24 h, `window_end` = `window_start` + 240 min, `requested_altitude_metres` = within the zone ceiling.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `200`.

**Rationale:** Upper bound is inclusive; the limit itself must pass. Single read-only probe: `validate` never changes state (03, endpoint 13).

### API-OP-002.6: Duration 241 min (just above the upper bound) fails validation

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §3` (§1.4 `TIME_WINDOW`; §6) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** BV — duration = 241 min (boundary + 1, upper)

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below.
- A pilot that passes `PILOT` for the zone: rating covers the zone's class, certification current at `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}.
- An aircraft that passes `AIRCRAFT` for the zone: weight band permitted by the zone (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. It has no `APPROVED` or `UNDER_REVIEW` request, so no overlap.
- An active zone of class `OPEN` with no curfew, required authorisation level `L1`, all weight bands permitted (existing reference data, read via `GET /api/v1/zones`), saved as {{zone_code}}. The operator is `L1`, so `ZONE` passes.
- `window_start` = validation time + 24 h (inside the 6 h minimum lead time and the 60-day maximum advance). The window is not on, or next to, a DST change.
- Only the duration is varied: `window_end` − `window_start` = 241 min. Every other `TIME_WINDOW` condition is within limits.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = validation time + 24 h, `window_end` = `window_start` + 241 min, `requested_altitude_metres` = within the zone ceiling.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, `failing_gate` = `TIME_WINDOW`, `rule_reference` = `TSD-4 §3`, `message` non-empty.

**Rationale:** Upper bound is 240 min inclusive; 1 min above must fail. Single read-only probe: `validate` never changes state (03, endpoint 13).

### API-OP-002.7: Validate of a request with duration below the minimum returns 422 and leaves it DRAFT

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §3` (§1.4 `TIME_WINDOW`; §6) · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079) (validate causes no transition) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** ST — DRAFT → DRAFT (validate is read-only)

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below.
- A pilot that passes `PILOT` for the zone: rating covers the zone's class, certification current at `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}.
- An aircraft that passes `AIRCRAFT` for the zone: weight band permitted by the zone (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. It has no `APPROVED` or `UNDER_REVIEW` request, so no overlap.
- An active zone of class `OPEN` with no curfew, required authorisation level `L1`, all weight bands permitted (existing reference data, read via `GET /api/v1/zones`), saved as {{zone_code}}. The operator is `L1`, so `ZONE` passes.
- `window_start` = validation time + 24 h (inside the 6 h minimum lead time and the 60-day maximum advance). The window is not on, or next to, a DST change.
- Only the duration is varied: `window_end` − `window_start` = 5 min. Every other `TIME_WINDOW` condition is within limits.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = validation time + 24 h, `window_end` = `window_start` + 5 min, `requested_altitude_metres` = within the zone ceiling.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.
3. `GET /api/v1/flight-requests/{{fr_id}}`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, `failing_gate` = `TIME_WINDOW`, `rule_reference` = `TSD-4 §3`, `message` non-empty.
- Step 3: `200`, `state` = `DRAFT`.

**Rationale:** A failing `validate` must not move the request; the 422 alone doesn't prove state is unchanged (03 endpoint 13; 02 — no transition without submit).

### API-OP-002.8: Submit of a request with duration above the maximum moves it DRAFT → REJECTED

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §3` (§1.4 `TIME_WINDOW`; §6) · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079) (DRAFT → REJECTED) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/submit`

**Technique:** ST — DRAFT → REJECTED on gate failure

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below.
- A pilot that passes `PILOT` for the zone: rating covers the zone's class, certification current at `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}.
- An aircraft that passes `AIRCRAFT` for the zone: weight band permitted by the zone (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. It has no `APPROVED` or `UNDER_REVIEW` request, so no overlap.
- An active zone of class `OPEN` with no curfew, required authorisation level `L1`, all weight bands permitted (existing reference data, read via `GET /api/v1/zones`), saved as {{zone_code}}. The operator is `L1`, so `ZONE` passes.
- `window_start` = validation time + 24 h (inside the 6 h minimum lead time and the 60-day maximum advance). The window is not on, or next to, a DST change.
- Only the duration is varied: `window_end` − `window_start` = 300 min. Every other `TIME_WINDOW` condition is within limits.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = validation time + 24 h, `window_end` = `window_start` + 300 min, `requested_altitude_metres` = within the zone ceiling.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/submit`. Auth: operator session.
3. `GET /api/v1/flight-requests/{{fr_id}}`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, `failing_gate` = `TIME_WINDOW`, `rule_reference` = `TSD-4 §3`, `message` non-empty.
- Step 3: `200`, `state` = `REJECTED`, `failing_gate` = `TIME_WINDOW`, `rule_reference` = `TSD-4 §3`, `rejection_reason` non-empty.

**Rationale:** A gate failure on submit is the one path from DRAFT straight to REJECTED; the 422 alone doesn't prove the row moved.

### API-OP-002.9: Re-submit of a request rejected for duration returns 409

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §3` (§1.4 `TIME_WINDOW`; §6) · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079) (REJECTED terminal; illegal pair → 409) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/submit`

**Technique:** ST — REJECTED → submit is illegal

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below.
- A pilot that passes `PILOT` for the zone: rating covers the zone's class, certification current at `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}.
- An aircraft that passes `AIRCRAFT` for the zone: weight band permitted by the zone (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. It has no `APPROVED` or `UNDER_REVIEW` request, so no overlap.
- An active zone of class `OPEN` with no curfew, required authorisation level `L1`, all weight bands permitted (existing reference data, read via `GET /api/v1/zones`), saved as {{zone_code}}. The operator is `L1`, so `ZONE` passes.
- `window_start` = validation time + 24 h (inside the 6 h minimum lead time and the 60-day maximum advance). The window is not on, or next to, a DST change.
- Only the duration is varied: `window_end` − `window_start` = 10 min. Every other `TIME_WINDOW` condition is within limits.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = validation time + 24 h, `window_end` = `window_start` + 10 min, `requested_altitude_metres` = within the zone ceiling.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/submit`. Auth: operator session.
3. `POST /api/v1/flight-requests/{{fr_id}}/submit`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, `failing_gate` = `TIME_WINDOW`, `rule_reference` = `TSD-4 §3`, `message` non-empty.
- Step 3: `409`.

**Rationale:** `REJECTED` is terminal; any further `submit` is an illegal transition and must return `409`, not a repeated gate `422` (03 error semantics: 409 = cannot be attempted, 422 = attempted and refused).

### API-OP-002.10: Submit of a request with duration at the lower limit moves it DRAFT → UNDER_REVIEW

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `TSD-4 §3` (§1.4 `TIME_WINDOW`; §6) · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079) (DRAFT → SUBMITTED → UNDER_REVIEW) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/submit`

**Technique:** ST — DRAFT → UNDER_REVIEW on gate pass

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below.
- A pilot that passes `PILOT` for the zone: rating covers the zone's class, certification current at `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}.
- An aircraft that passes `AIRCRAFT` for the zone: weight band permitted by the zone (`POST /api/v1/aircraft`), saved as {{aircraft_id}}. It has no `APPROVED` or `UNDER_REVIEW` request, so no overlap.
- An active zone of class `OPEN` with no curfew, required authorisation level `L1`, all weight bands permitted (existing reference data, read via `GET /api/v1/zones`), saved as {{zone_code}}. The operator is `L1`, so `ZONE` passes.
- `window_start` = validation time + 24 h (inside the 6 h minimum lead time and the 60-day maximum advance). The window is not on, or next to, a DST change.
- Only the duration is varied: `window_end` − `window_start` = 15 min. Every other `TIME_WINDOW` condition is within limits.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start` = validation time + 24 h, `window_end` = `window_start` + 15 min, `requested_altitude_metres` = within the zone ceiling.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/submit`. Auth: operator session.
3. `GET /api/v1/flight-requests/{{fr_id}}`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `200`.
- Step 3: `200`, `state` = `UNDER_REVIEW`.

**Rationale:** A duration exactly at the inclusive lower limit passes `TIME_WINDOW` on submit and the request leaves DRAFT for UNDER_REVIEW. Case .2 only probes with `validate`; this asserts the transition.
