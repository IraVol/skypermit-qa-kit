# Inactive zone fails the ZONE gate

> **Exercisability warning (read first).** The rule "an inactive zone fails any flight request against it" (`ZC-2026.1 §4`, gate `ZONE`) **cannot be exercised through `/api/v1` alone**:
> - Zones are reference data with **no create/update endpoint** (03 — API Contract: "Zones have no create/update endpoints in this API"; only `GET /zones`, `GET /zones/{code}`).
> - All six seeded zones are `active = true` (06 — Business Rules §4; `supabase/seed.sql`).
>
> Cases .1–.3 therefore need an **out-of-band precondition** (a direct DB change by whoever owns the test database) and are marked **BLOCKED until that fixture exists**. Do not substitute another zone or another failure for them: a different 422 would not test this rule. Only .4 (the paired passing partition) runs against the stock seed.
>
> **Citation is not confirmed.** 05 — Open Questions row 5 and 07 §4: the rule is settled, `rule_reference: "ZC-2026.1 §4"` is "not fully confirmed". The cases assert `ZC-2026.1 §4` because 06 §6 lists it as the value to hardcode, but a failure on that single field is a documentation question, not necessarily an app bug. The app (`lib/gates/zone-gate.ts`) does return `ZC-2026.1 §4`.
>
> **Recommended fixture (do not flip a seeded zone on a shared deployment):** insert a dedicated row, e.g. `TST-INA-1`, class `OPEN`, `ceiling_metres` 120, `permitted_bands` `{C0,C1,C2,C3}`, `required_authorisation_level` `L1`, no curfew, **`active = false`**. This keeps every other gate passing for an `L1` operator, so `ZONE` (active check) is the only thing that can fail. Whether `POST /flight-requests` accepts a zone that exists but is inactive is not stated in the docs; step 1 of each case assumes it does (`201 DRAFT`) because the rule says the failure happens "against a flight request" at gate time.

### API-OP-004.1: Validate against an inactive zone fails ZONE with ZC-2026.1 §4

**Status:** BLOCKED — needs the inactive-zone fixture `{{inactive_zone_code}}` (out-of-band DB insert/update).

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §4` (§1.3 `ZONE` "Zone active"; §6) · [05 — Open Questions](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66188) row 5 · [07 — Clarifications](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) item 4 · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** EP — invalid partition `zone.active = false`

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); session cookie used below. Operator is `L1` (registration default).
- Pilot with a current certification at `window_start` (`certified_on` well within 18 months before it), any rating (zone is `OPEN`) — `POST /api/v1/pilots`, saved as {{pilot_id}}. `PILOT` passes.
- Aircraft in band `C1` (e.g. `mtom_grams` 2000), permitted by the zone, no other flight request — `POST /api/v1/aircraft`, saved as {{aircraft_id}}. `AIRCRAFT` passes.
- Inactive zone fixture {{inactive_zone_code}}: `OPEN`, ceiling 120 m, bands `C0`–`C3`, auth `L1`, no curfew, `active = false`. Confirm with `GET /api/v1/zones/{{inactive_zone_code}}` that `active` = `false`. Altitude below, and operator level at/above, the zone's limits, so the only failing condition is `active`.
- `TIME_WINDOW` conditions all within limits: `window_start` = now + 24 h, duration 60 min, no overlap.

**Steps:**
1. `GET /api/v1/zones/{{inactive_zone_code}}`. Auth: operator session.
2. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{inactive_zone_code}}, `window_start` = now + 24 h, `window_end` = `window_start` + 60 min, `requested_altitude_metres` = 50.
   Save `id` as {{fr_id}}.
3. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.
4. `GET /api/v1/flight-requests/{{fr_id}}`. Auth: operator session.

**Expected result:**
- Step 1: `200`, `active` = `false`.
- Step 2: `201`, `state` = `DRAFT`.
- Step 3: `422`, body `failing_gate` = `ZONE`, `rule_reference` = `ZC-2026.1 §4`, `message` non-empty.
- Step 4: `200`, `state` = `DRAFT` (validate is a dry run).

**Rationale:** 06 §1.3: an inactive zone fails any flight request against it, under `ZONE`. All other gates and `ZONE` sub-checks pass so the `422` can only come from the active flag. Step 4 proves `validate` never changes state (03 endpoint 13).

### API-OP-004.2: Submit against an inactive zone moves DRAFT → REJECTED

**Status:** BLOCKED — needs {{inactive_zone_code}}.

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §4` (§1.3; §6) · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079) (DRAFT → REJECTED) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/submit`

**Technique:** ST — DRAFT → REJECTED on gate failure

**Role(s):** Operator

**Preconditions:** same as API-OP-004.1 (operator, {{pilot_id}}, {{aircraft_id}}, {{inactive_zone_code}}; `window_start` = now + 24 h).

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session. Body as API-OP-004.1 step 2. Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/submit`. Auth: operator session.
3. `GET /api/v1/flight-requests/{{fr_id}}`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `ZONE`, `rule_reference` = `ZC-2026.1 §4`, `message` non-empty.
- Step 3: `200`, `state` = `REJECTED`, `failing_gate` = `ZONE`, `rule_reference` = `ZC-2026.1 §4`, `rejection_reason` non-empty.

**Rationale:** The same pipeline as `validate`, but `submit` persists the outcome. The `422` alone does not prove the row moved, hence the `GET`.

### API-OP-004.3: PILOT failure takes precedence over an inactive zone

**Status:** BLOCKED — needs {{inactive_zone_code}}.

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — evaluation order `PILOT → AIRCRAFT → ZONE → TIME_WINDOW`; `OH-1 §2.3` (§1.1; §6) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — gate pipeline

**Technique:** EP — combination of two failing partitions; gate order

**Role(s):** Operator

**Preconditions:**
- As API-OP-004.1, except the pilot's `certified_on` is more than 18 months before `window_start` (e.g. 20 months before), so certification is not current. `PILOT` fails; the zone is inactive.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session. Body as API-OP-004.1 step 2 with this pilot. Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `PILOT`, `rule_reference` = `OH-1 §2.3`, `message` non-empty (not `ZONE` / `ZC-2026.1 §4`).

**Rationale:** A `422` names only the first failing gate (06, Evaluation order). Ensures the inactive-zone check is not evaluated ahead of `PILOT`.

### API-OP-004.4: Active zone passes the ZONE gate (paired valid partition)

**Status:** RUNNABLE on the stock seed (no fixture).

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §4` (§1.3; §4 catalogue, all zones active) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`, `GET /zones/{code}`

**Technique:** EP — valid partition `zone.active = true`

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in; `L1`.
- Pilot with current certification (any rating, zone is `OPEN`) — {{pilot_id}}.
- Aircraft in band `C1` — {{aircraft_id}}.
- Zone `DNI-OPN-1` (seeded: `OPEN`, 120 m, `C0`–`C3`, `L1`, no curfew, `active` = true).
- `window_start` = now + 24 h, duration 60 min, no overlap.

**Steps:**
1. `GET /api/v1/zones/DNI-OPN-1`. Auth: operator session.
2. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = `DNI-OPN-1`, `window_start` = now + 24 h, `window_end` = `window_start` + 60 min, `requested_altitude_metres` = 50.
   Save `id` as {{fr_id}}.
3. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `200`, `active` = `true`.
- Step 2: `201`, `state` = `DRAFT`.
- Step 3: `200`, body `ok` = `true`.

**Rationale:** Control for 004.1–004.3: the same request shape passes when the zone is active, so the failures there are attributable to the active flag only. Also serves as the check that the stock seed has no inactive zone (why .1–.3 are blocked).

## Open points / not covered

- **Fixture ownership:** who creates `{{inactive_zone_code}}` and how it is cleaned up (no API for it). Needs an answer from the app/DB owner (report against `skypermit`: a test-only way to deactivate a zone, or a seeded inactive zone).
- **Citation `ZC-2026.1 §4`** unconfirmed (05 row 5) — if the owner changes it, update .1–.2.
- **Creating a request on an inactive zone:** the docs do not say whether `POST /flight-requests` rejects it up front; cases assume `201`.
- **Order within the `ZONE` gate** (altitude → auth level → active in code) is not specified in the docs, so no case combines an inactive zone with an over-ceiling altitude or a too-low auth level.
- No BV: `active` is boolean, no boundary.
