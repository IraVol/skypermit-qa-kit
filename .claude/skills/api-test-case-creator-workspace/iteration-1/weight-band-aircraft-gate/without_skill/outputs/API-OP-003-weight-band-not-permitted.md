# Aircraft weight band not permitted in the zone (AIRCRAFT gate)

> Rule: `ZC-2026.1 §2` — the aircraft's derived weight band must be in the zone's `permitted_bands`. Gate `AIRCRAFT` (reassigned from `ZONE` by 07 item 1). Registering an aircraft above 30,000 g (`OH-1 §3`, `422` at `POST /aircraft`) is a registration precondition, not this gate, and is not covered here.

> Note on data: registration always yields an `L1` operator, so the `ZONE` gate (operator level) fails for any CONTROLLED/RESTRICTED zone. Cases that must prove `AIRCRAFT` *passed* in such a zone therefore assert `ZONE` / `OH-1 §4` as the next failure; the only `200` path is the OPEN zone `DNI-OPN-1`. If an `L2`/`L3` operator is seeded out of band, those cases can assert `200` instead.

### API-OP-003.1: 899 g (C0, 1 g under the C0/C1 upper bound 900 g) in ZTM-RST-7: AIRCRAFT passes, request reaches ZONE

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`, §3, §4, §6; corrected by [07](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate` · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079)

**Technique:** BV — just inside the inclusive upper bound of `C0`, the last band ZTM-RST-7 permits

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default; authorisation level is not self-service).
- A pilot with rating `R_BVLOS` and `certified_on` well within 18 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes (an `R_BVLOS` pilot covers every zone class).
- An aircraft with a unique `serial_number` and `mtom_grams` = 899 g, i.e. derived weight band `C0` (`POST /api/v1/aircraft`, `201`), saved as {{aircraft_id}}. No other flight request exists for it.
- Zone `ZTM-RST-7` from the seeded catalogue (`GET /api/v1/zones/ZTM-RST-7`): `RESTRICTED`, ceiling 45 m, `permitted_bands` C0, required authorisation level `L3`, active. Saved as {{zone_code}}.
- Window: `window_start` = request time + 2 days, `window_end` = `window_start` + 60 min (valid lead time, duration, no overlap; the zone's curfew is avoided by choosing a midday start in zone-local time). `requested_altitude_metres` = 30 (within the 45 m ceiling). The `L1` operator is below the zone's required level, so the pipeline is expected to stop at `ZONE` — that proves `AIRCRAFT` passed.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start`, `window_end` and `requested_altitude_metres` as in the preconditions.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `ZONE`, `rule_reference` = `OH-1 §4`, `message` non-empty. Not `AIRCRAFT`.

**Rationale:** Upper bounds are inclusive (06 §3): 899 g is `C0`, which ZTM-RST-7 permits, so `AIRCRAFT` must pass. Because registration always creates an `L1` operator and the zone needs `L3`, the first failure is the next gate, `ZONE` (`OH-1 §4`). A `422` naming `AIRCRAFT` here would be a boundary bug (off-by-one on `<=`/`<`).

### API-OP-003.2: 900 g (C0, on the C0/C1 upper bound 900 g) in ZTM-RST-7: AIRCRAFT passes, request reaches ZONE

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`, §3, §4, §6; corrected by [07](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate` · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079)

**Technique:** BV — exactly on the inclusive upper bound of `C0`, the last band ZTM-RST-7 permits

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default; authorisation level is not self-service).
- A pilot with rating `R_BVLOS` and `certified_on` well within 18 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes (an `R_BVLOS` pilot covers every zone class).
- An aircraft with a unique `serial_number` and `mtom_grams` = 900 g, i.e. derived weight band `C0` (`POST /api/v1/aircraft`, `201`), saved as {{aircraft_id}}. No other flight request exists for it.
- Zone `ZTM-RST-7` from the seeded catalogue (`GET /api/v1/zones/ZTM-RST-7`): `RESTRICTED`, ceiling 45 m, `permitted_bands` C0, required authorisation level `L3`, active. Saved as {{zone_code}}.
- Window: `window_start` = request time + 2 days, `window_end` = `window_start` + 60 min (valid lead time, duration, no overlap; the zone's curfew is avoided by choosing a midday start in zone-local time). `requested_altitude_metres` = 30 (within the 45 m ceiling). The `L1` operator is below the zone's required level, so the pipeline is expected to stop at `ZONE` — that proves `AIRCRAFT` passed.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start`, `window_end` and `requested_altitude_metres` as in the preconditions.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `ZONE`, `rule_reference` = `OH-1 §4`, `message` non-empty. Not `AIRCRAFT`.

**Rationale:** Upper bounds are inclusive (06 §3): 900 g is `C0`, which ZTM-RST-7 permits, so `AIRCRAFT` must pass. Because registration always creates an `L1` operator and the zone needs `L3`, the first failure is the next gate, `ZONE` (`OH-1 §4`). A `422` naming `AIRCRAFT` here would be a boundary bug (off-by-one on `<=`/`<`).

### API-OP-003.3: 901 g (C1, 1 g over the C0/C1 upper bound 900 g) in ZTM-RST-7: fails AIRCRAFT

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`, §3, §4, §6; corrected by [07](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate` · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079)

**Technique:** BV — just past the limit on the failing side (first gram of the next band)

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default; authorisation level is not self-service).
- A pilot with rating `R_BVLOS` and `certified_on` well within 18 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes (an `R_BVLOS` pilot covers every zone class).
- An aircraft with a unique `serial_number` and `mtom_grams` = 901 g, i.e. derived weight band `C1` (`POST /api/v1/aircraft`, `201`), saved as {{aircraft_id}}. No other flight request exists for it.
- Zone `ZTM-RST-7` from the seeded catalogue (`GET /api/v1/zones/ZTM-RST-7`): `RESTRICTED`, ceiling 45 m, `permitted_bands` C0, required authorisation level `L3`, active. Saved as {{zone_code}}.
- Window: `window_start` = request time + 2 days, `window_end` = `window_start` + 60 min (valid lead time, duration, no overlap; the zone's curfew is avoided by choosing a midday start in zone-local time). `requested_altitude_metres` = 30 (within the 45 m ceiling).

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start`, `window_end` and `requested_altitude_metres` as in the preconditions.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `AIRCRAFT`, `rule_reference` = `ZC-2026.1 §2`, `message` non-empty (names the band and the zone).

**Rationale:** 901 g is `C1`, outside ZTM-RST-7's `permitted_bands` (C0). The check belongs to `AIRCRAFT`, not `ZONE`, despite the literal wording of ZC-2026.1 §2 (07 item 1). `rule_reference` is the shared citation `ZC-2026.1 §2`; `failing_gate` is what distinguishes it from the altitude check.

### API-OP-003.4: 3499 g (C1, 1 g under the C1/C2 upper bound 3500 g) in LVV-RST-2: AIRCRAFT passes, request reaches ZONE

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`, §3, §4, §6; corrected by [07](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate` · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079)

**Technique:** BV — just inside the inclusive upper bound of `C1`, the last band LVV-RST-2 permits

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default; authorisation level is not self-service).
- A pilot with rating `R_BVLOS` and `certified_on` well within 18 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes (an `R_BVLOS` pilot covers every zone class).
- An aircraft with a unique `serial_number` and `mtom_grams` = 3499 g, i.e. derived weight band `C1` (`POST /api/v1/aircraft`, `201`), saved as {{aircraft_id}}. No other flight request exists for it.
- Zone `LVV-RST-2` from the seeded catalogue (`GET /api/v1/zones/LVV-RST-2`): `RESTRICTED`, ceiling 60 m, `permitted_bands` C0–C1, required authorisation level `L3`, active. Saved as {{zone_code}}.
- Window: `window_start` = request time + 2 days, `window_end` = `window_start` + 60 min (valid lead time, duration, no overlap; the zone's curfew is avoided by choosing a midday start in zone-local time). `requested_altitude_metres` = 40 (within the 60 m ceiling). The `L1` operator is below the zone's required level, so the pipeline is expected to stop at `ZONE` — that proves `AIRCRAFT` passed.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start`, `window_end` and `requested_altitude_metres` as in the preconditions.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `ZONE`, `rule_reference` = `OH-1 §4`, `message` non-empty. Not `AIRCRAFT`.

**Rationale:** Upper bounds are inclusive (06 §3): 3499 g is `C1`, which LVV-RST-2 permits, so `AIRCRAFT` must pass. Because registration always creates an `L1` operator and the zone needs `L3`, the first failure is the next gate, `ZONE` (`OH-1 §4`). A `422` naming `AIRCRAFT` here would be a boundary bug (off-by-one on `<=`/`<`).

### API-OP-003.5: 3500 g (C1, on the C1/C2 upper bound 3500 g) in LVV-RST-2: AIRCRAFT passes, request reaches ZONE

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`, §3, §4, §6; corrected by [07](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate` · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079)

**Technique:** BV — exactly on the inclusive upper bound of `C1`, the last band LVV-RST-2 permits

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default; authorisation level is not self-service).
- A pilot with rating `R_BVLOS` and `certified_on` well within 18 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes (an `R_BVLOS` pilot covers every zone class).
- An aircraft with a unique `serial_number` and `mtom_grams` = 3500 g, i.e. derived weight band `C1` (`POST /api/v1/aircraft`, `201`), saved as {{aircraft_id}}. No other flight request exists for it.
- Zone `LVV-RST-2` from the seeded catalogue (`GET /api/v1/zones/LVV-RST-2`): `RESTRICTED`, ceiling 60 m, `permitted_bands` C0–C1, required authorisation level `L3`, active. Saved as {{zone_code}}.
- Window: `window_start` = request time + 2 days, `window_end` = `window_start` + 60 min (valid lead time, duration, no overlap; the zone's curfew is avoided by choosing a midday start in zone-local time). `requested_altitude_metres` = 40 (within the 60 m ceiling). The `L1` operator is below the zone's required level, so the pipeline is expected to stop at `ZONE` — that proves `AIRCRAFT` passed.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start`, `window_end` and `requested_altitude_metres` as in the preconditions.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `ZONE`, `rule_reference` = `OH-1 §4`, `message` non-empty. Not `AIRCRAFT`.

**Rationale:** Upper bounds are inclusive (06 §3): 3500 g is `C1`, which LVV-RST-2 permits, so `AIRCRAFT` must pass. Because registration always creates an `L1` operator and the zone needs `L3`, the first failure is the next gate, `ZONE` (`OH-1 §4`). A `422` naming `AIRCRAFT` here would be a boundary bug (off-by-one on `<=`/`<`).

### API-OP-003.6: 3501 g (C2, 1 g over the C1/C2 upper bound 3500 g) in LVV-RST-2: fails AIRCRAFT

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`, §3, §4, §6; corrected by [07](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate` · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079)

**Technique:** BV — just past the limit on the failing side (first gram of the next band)

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default; authorisation level is not self-service).
- A pilot with rating `R_BVLOS` and `certified_on` well within 18 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes (an `R_BVLOS` pilot covers every zone class).
- An aircraft with a unique `serial_number` and `mtom_grams` = 3501 g, i.e. derived weight band `C2` (`POST /api/v1/aircraft`, `201`), saved as {{aircraft_id}}. No other flight request exists for it.
- Zone `LVV-RST-2` from the seeded catalogue (`GET /api/v1/zones/LVV-RST-2`): `RESTRICTED`, ceiling 60 m, `permitted_bands` C0–C1, required authorisation level `L3`, active. Saved as {{zone_code}}.
- Window: `window_start` = request time + 2 days, `window_end` = `window_start` + 60 min (valid lead time, duration, no overlap; the zone's curfew is avoided by choosing a midday start in zone-local time). `requested_altitude_metres` = 40 (within the 60 m ceiling).

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start`, `window_end` and `requested_altitude_metres` as in the preconditions.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `AIRCRAFT`, `rule_reference` = `ZC-2026.1 §2`, `message` non-empty (names the band and the zone).

**Rationale:** 3501 g is `C2`, outside LVV-RST-2's `permitted_bands` (C0–C1). The check belongs to `AIRCRAFT`, not `ZONE`, despite the literal wording of ZC-2026.1 §2 (07 item 1). `rule_reference` is the shared citation `ZC-2026.1 §2`; `failing_gate` is what distinguishes it from the altitude check.

### API-OP-003.7: 11999 g (C2, 1 g under the C2/C3 upper bound 12000 g) in KBP-CTR-3: AIRCRAFT passes, request reaches ZONE

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`, §3, §4, §6; corrected by [07](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate` · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079)

**Technique:** BV — just inside the inclusive upper bound of `C2`, the last band KBP-CTR-3 permits

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default; authorisation level is not self-service).
- A pilot with rating `R_BVLOS` and `certified_on` well within 18 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes (an `R_BVLOS` pilot covers every zone class).
- An aircraft with a unique `serial_number` and `mtom_grams` = 11999 g, i.e. derived weight band `C2` (`POST /api/v1/aircraft`, `201`), saved as {{aircraft_id}}. No other flight request exists for it.
- Zone `KBP-CTR-3` from the seeded catalogue (`GET /api/v1/zones/KBP-CTR-3`): `CONTROLLED`, ceiling 120 m, `permitted_bands` C0–C2, required authorisation level `L2`, active. Saved as {{zone_code}}.
- Window: `window_start` = request time + 2 days, `window_end` = `window_start` + 60 min (valid lead time, duration, no overlap; the zone's curfew is avoided by choosing a midday start in zone-local time). `requested_altitude_metres` = 80 (within the 120 m ceiling). The `L1` operator is below the zone's required level, so the pipeline is expected to stop at `ZONE` — that proves `AIRCRAFT` passed.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start`, `window_end` and `requested_altitude_metres` as in the preconditions.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `ZONE`, `rule_reference` = `OH-1 §4`, `message` non-empty. Not `AIRCRAFT`.

**Rationale:** Upper bounds are inclusive (06 §3): 11999 g is `C2`, which KBP-CTR-3 permits, so `AIRCRAFT` must pass. Because registration always creates an `L1` operator and the zone needs `L2`, the first failure is the next gate, `ZONE` (`OH-1 §4`). A `422` naming `AIRCRAFT` here would be a boundary bug (off-by-one on `<=`/`<`).

### API-OP-003.8: 12000 g (C2, on the C2/C3 upper bound 12000 g) in KBP-CTR-3: AIRCRAFT passes, request reaches ZONE

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`, §3, §4, §6; corrected by [07](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate` · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079)

**Technique:** BV — exactly on the inclusive upper bound of `C2`, the last band KBP-CTR-3 permits

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default; authorisation level is not self-service).
- A pilot with rating `R_BVLOS` and `certified_on` well within 18 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes (an `R_BVLOS` pilot covers every zone class).
- An aircraft with a unique `serial_number` and `mtom_grams` = 12000 g, i.e. derived weight band `C2` (`POST /api/v1/aircraft`, `201`), saved as {{aircraft_id}}. No other flight request exists for it.
- Zone `KBP-CTR-3` from the seeded catalogue (`GET /api/v1/zones/KBP-CTR-3`): `CONTROLLED`, ceiling 120 m, `permitted_bands` C0–C2, required authorisation level `L2`, active. Saved as {{zone_code}}.
- Window: `window_start` = request time + 2 days, `window_end` = `window_start` + 60 min (valid lead time, duration, no overlap; the zone's curfew is avoided by choosing a midday start in zone-local time). `requested_altitude_metres` = 80 (within the 120 m ceiling). The `L1` operator is below the zone's required level, so the pipeline is expected to stop at `ZONE` — that proves `AIRCRAFT` passed.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start`, `window_end` and `requested_altitude_metres` as in the preconditions.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `ZONE`, `rule_reference` = `OH-1 §4`, `message` non-empty. Not `AIRCRAFT`.

**Rationale:** Upper bounds are inclusive (06 §3): 12000 g is `C2`, which KBP-CTR-3 permits, so `AIRCRAFT` must pass. Because registration always creates an `L1` operator and the zone needs `L2`, the first failure is the next gate, `ZONE` (`OH-1 §4`). A `422` naming `AIRCRAFT` here would be a boundary bug (off-by-one on `<=`/`<`).

### API-OP-003.9: 12001 g (C3, 1 g over the C2/C3 upper bound 12000 g) in KBP-CTR-3: fails AIRCRAFT

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`, §3, §4, §6; corrected by [07](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate` · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079)

**Technique:** BV — just past the limit on the failing side (first gram of the next band)

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default; authorisation level is not self-service).
- A pilot with rating `R_BVLOS` and `certified_on` well within 18 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes (an `R_BVLOS` pilot covers every zone class).
- An aircraft with a unique `serial_number` and `mtom_grams` = 12001 g, i.e. derived weight band `C3` (`POST /api/v1/aircraft`, `201`), saved as {{aircraft_id}}. No other flight request exists for it.
- Zone `KBP-CTR-3` from the seeded catalogue (`GET /api/v1/zones/KBP-CTR-3`): `CONTROLLED`, ceiling 120 m, `permitted_bands` C0–C2, required authorisation level `L2`, active. Saved as {{zone_code}}.
- Window: `window_start` = request time + 2 days, `window_end` = `window_start` + 60 min (valid lead time, duration, no overlap; the zone's curfew is avoided by choosing a midday start in zone-local time). `requested_altitude_metres` = 80 (within the 120 m ceiling).

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start`, `window_end` and `requested_altitude_metres` as in the preconditions.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `AIRCRAFT`, `rule_reference` = `ZC-2026.1 §2`, `message` non-empty (names the band and the zone).

**Rationale:** 12001 g is `C3`, outside KBP-CTR-3's `permitted_bands` (C0–C2). The check belongs to `AIRCRAFT`, not `ZONE`, despite the literal wording of ZC-2026.1 §2 (07 item 1). `rule_reference` is the shared citation `ZC-2026.1 §2`; `failing_gate` is what distinguishes it from the altitude check.

### API-OP-003.10: 20000 g (C3) in ZTM-RST-7: fails AIRCRAFT

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`, §3, §4, §6; corrected by [07](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate` · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079)

**Technique:** EP — band not in the zone's `permitted_bands` (C3, far from any boundary, in the most restrictive zone (C0 only))

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default; authorisation level is not self-service).
- A pilot with rating `R_BVLOS` and `certified_on` well within 18 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes (an `R_BVLOS` pilot covers every zone class).
- An aircraft with a unique `serial_number` and `mtom_grams` = 20000 g, i.e. derived weight band `C3` (`POST /api/v1/aircraft`, `201`), saved as {{aircraft_id}}. No other flight request exists for it.
- Zone `ZTM-RST-7` from the seeded catalogue (`GET /api/v1/zones/ZTM-RST-7`): `RESTRICTED`, ceiling 45 m, `permitted_bands` C0, required authorisation level `L3`, active. Saved as {{zone_code}}.
- Window: `window_start` = request time + 2 days, `window_end` = `window_start` + 60 min (valid lead time, duration, no overlap; the zone's curfew is avoided by choosing a midday start in zone-local time). `requested_altitude_metres` = 30 (within the 45 m ceiling).

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start`, `window_end` and `requested_altitude_metres` as in the preconditions.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `AIRCRAFT`, `rule_reference` = `ZC-2026.1 §2`, `message` non-empty (names the band and the zone).

**Rationale:** Representative of the partition 'aircraft band not permitted by the zone'. Covers the ZTM-RST-7 catalogue row (06 §4).

### API-OP-003.11: 8000 g (C2) in LVV-RST-2: fails AIRCRAFT

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`, §3, §4, §6; corrected by [07](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate` · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079)

**Technique:** EP — band not in the zone's `permitted_bands` (C2, mid-band, in a C0–C1 zone)

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default; authorisation level is not self-service).
- A pilot with rating `R_BVLOS` and `certified_on` well within 18 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes (an `R_BVLOS` pilot covers every zone class).
- An aircraft with a unique `serial_number` and `mtom_grams` = 8000 g, i.e. derived weight band `C2` (`POST /api/v1/aircraft`, `201`), saved as {{aircraft_id}}. No other flight request exists for it.
- Zone `LVV-RST-2` from the seeded catalogue (`GET /api/v1/zones/LVV-RST-2`): `RESTRICTED`, ceiling 60 m, `permitted_bands` C0–C1, required authorisation level `L3`, active. Saved as {{zone_code}}.
- Window: `window_start` = request time + 2 days, `window_end` = `window_start` + 60 min (valid lead time, duration, no overlap; the zone's curfew is avoided by choosing a midday start in zone-local time). `requested_altitude_metres` = 40 (within the 60 m ceiling).

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start`, `window_end` and `requested_altitude_metres` as in the preconditions.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `AIRCRAFT`, `rule_reference` = `ZC-2026.1 §2`, `message` non-empty (names the band and the zone).

**Rationale:** Representative of the partition 'aircraft band not permitted by the zone'. Covers the LVV-RST-2 catalogue row (06 §4).

### API-OP-003.12: 20000 g (C3) in KBP-CTR-3: fails AIRCRAFT

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`, §3, §4, §6; corrected by [07](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate` · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079)

**Technique:** EP — band not in the zone's `permitted_bands` (C3, mid-band, in a C0–C2 controlled zone)

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default; authorisation level is not self-service).
- A pilot with rating `R_BVLOS` and `certified_on` well within 18 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes (an `R_BVLOS` pilot covers every zone class).
- An aircraft with a unique `serial_number` and `mtom_grams` = 20000 g, i.e. derived weight band `C3` (`POST /api/v1/aircraft`, `201`), saved as {{aircraft_id}}. No other flight request exists for it.
- Zone `KBP-CTR-3` from the seeded catalogue (`GET /api/v1/zones/KBP-CTR-3`): `CONTROLLED`, ceiling 120 m, `permitted_bands` C0–C2, required authorisation level `L2`, active. Saved as {{zone_code}}.
- Window: `window_start` = request time + 2 days, `window_end` = `window_start` + 60 min (valid lead time, duration, no overlap; the zone's curfew is avoided by choosing a midday start in zone-local time). `requested_altitude_metres` = 80 (within the 120 m ceiling).

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start`, `window_end` and `requested_altitude_metres` as in the preconditions.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `AIRCRAFT`, `rule_reference` = `ZC-2026.1 §2`, `message` non-empty (names the band and the zone).

**Rationale:** Representative of the partition 'aircraft band not permitted by the zone'. Covers the KBP-CTR-3 catalogue row (06 §4).

### API-OP-003.13: 12001 g (C3) in ODS-CTR-5: fails AIRCRAFT

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`, §3, §4, §6; corrected by [07](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate` · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079)

**Technique:** EP — band not in the zone's `permitted_bands` (C3 on its lower edge, in the second C0–C2 controlled zone (zone-row coverage))

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default; authorisation level is not self-service).
- A pilot with rating `R_BVLOS` and `certified_on` well within 18 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes (an `R_BVLOS` pilot covers every zone class).
- An aircraft with a unique `serial_number` and `mtom_grams` = 12001 g, i.e. derived weight band `C3` (`POST /api/v1/aircraft`, `201`), saved as {{aircraft_id}}. No other flight request exists for it.
- Zone `ODS-CTR-5` from the seeded catalogue (`GET /api/v1/zones/ODS-CTR-5`): `CONTROLLED`, ceiling 90 m, `permitted_bands` C0–C2, required authorisation level `L2`, active. Saved as {{zone_code}}.
- Window: `window_start` = request time + 2 days, `window_end` = `window_start` + 60 min (valid lead time, duration, no overlap; the zone's curfew is avoided by choosing a midday start in zone-local time). `requested_altitude_metres` = 60 (within the 90 m ceiling).

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start`, `window_end` and `requested_altitude_metres` as in the preconditions.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `AIRCRAFT`, `rule_reference` = `ZC-2026.1 §2`, `message` non-empty (names the band and the zone).

**Rationale:** Representative of the partition 'aircraft band not permitted by the zone'. Covers the ODS-CTR-5 catalogue row (06 §4).

### API-OP-003.14: 500 g (C0) in ZTM-RST-7: AIRCRAFT passes

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`, §3, §4, §6; corrected by [07](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate` · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079)

**Technique:** EP — band in the zone's `permitted_bands` (mid-band C0 in the strictest zone)

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default; authorisation level is not self-service).
- A pilot with rating `R_BVLOS` and `certified_on` well within 18 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes (an `R_BVLOS` pilot covers every zone class).
- An aircraft with a unique `serial_number` and `mtom_grams` = 500 g, i.e. derived weight band `C0` (`POST /api/v1/aircraft`, `201`), saved as {{aircraft_id}}. No other flight request exists for it.
- Zone `ZTM-RST-7` from the seeded catalogue (`GET /api/v1/zones/ZTM-RST-7`): `RESTRICTED`, ceiling 45 m, `permitted_bands` C0, required authorisation level `L3`, active. Saved as {{zone_code}}.
- Window: `window_start` = request time + 2 days, `window_end` = `window_start` + 60 min (valid lead time, duration, no overlap; the zone's curfew is avoided by choosing a midday start in zone-local time). `requested_altitude_metres` = 30 (within the 45 m ceiling). The `L1` operator is below the zone's required level `L3`, so the pipeline stops at `ZONE`.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start`, `window_end` and `requested_altitude_metres` as in the preconditions.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `ZONE`, `rule_reference` = `OH-1 §4`, `message` non-empty. Not `AIRCRAFT`.

**Rationale:** Permitted partition: C0 is in every zone's band list, so `AIRCRAFT` passes and the first failure is `ZONE`.

### API-OP-003.15: 30000 g (C3) in DNI-OPN-1: all four gates pass

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`, §3, §4, §6; corrected by [07](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate` · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079)

**Technique:** EP — band permitted; heaviest legal aircraft in the only band set that includes C3 (OPEN zones)

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default; authorisation level is not self-service).
- A pilot with rating `R_BVLOS` and `certified_on` well within 18 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes (an `R_BVLOS` pilot covers every zone class).
- An aircraft with a unique `serial_number` and `mtom_grams` = 30000 g, i.e. derived weight band `C3` (`POST /api/v1/aircraft`, `201`), saved as {{aircraft_id}}. No other flight request exists for it.
- Zone `DNI-OPN-1` from the seeded catalogue (`GET /api/v1/zones/DNI-OPN-1`): `OPEN`, ceiling 120 m, `permitted_bands` C0–C3, required authorisation level `L1`, active. Saved as {{zone_code}}.
- Window: `window_start` = request time + 2 days, `window_end` = `window_start` + 60 min (valid lead time, duration, no overlap; the zone's curfew is avoided by choosing a midday start in zone-local time). `requested_altitude_metres` = 80 (within the 120 m ceiling).

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start`, `window_end` and `requested_altitude_metres` as in the preconditions.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `200`, body `ok` = `true`.

**Rationale:** `DNI-OPN-1` permits C0–C3, is `OPEN` (any pilot rating), needs `L1`, has no curfew. 30,000 g is the registration ceiling (06 §3), so this is the heaviest aircraft that can ever be validated. This is the only `200` path reachable with a freshly registered `L1` operator.

### API-OP-003.16: Overweight aircraft with a R_BASIC pilot in LVV-RST-2: PILOT wins over AIRCRAFT

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`, §3, §4, §6; corrected by [07](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate` · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079)

**Technique:** EP — gate precedence (`PILOT` before `AIRCRAFT`)

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default; authorisation level is not self-service).
- A pilot with rating `R_BASIC` and `certified_on` well within 18 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` is expected to fail here (see Rationale).
- An aircraft with a unique `serial_number` and `mtom_grams` = 12000 g, i.e. derived weight band `C2` (`POST /api/v1/aircraft`, `201`), saved as {{aircraft_id}}. No other flight request exists for it.
- Zone `LVV-RST-2` from the seeded catalogue (`GET /api/v1/zones/LVV-RST-2`): `RESTRICTED`, ceiling 60 m, `permitted_bands` C0–C1, required authorisation level `L3`, active. Saved as {{zone_code}}.
- Window: `window_start` = request time + 2 days, `window_end` = `window_start` + 60 min (valid lead time, duration, no overlap; the zone's curfew is avoided by choosing a midday start in zone-local time). `requested_altitude_metres` = 40 (within the 60 m ceiling).

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start`, `window_end` and `requested_altitude_metres` as in the preconditions.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `PILOT`, `rule_reference` = `OH-1 §2.1`, `message` non-empty. Not `AIRCRAFT`.

**Rationale:** The aircraft (C2) would fail `AIRCRAFT` in LVV-RST-2 (C0–C1), but `R_BASIC` does not cover a `RESTRICTED` zone. Gates stop at the first failure in order PILOT → AIRCRAFT → ZONE → TIME_WINDOW (06 evaluation order).

### API-OP-003.17: Overweight aircraft with altitude above the ceiling in ZTM-RST-7: AIRCRAFT wins over ZONE

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`, §3, §4, §6; corrected by [07](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate` · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079)

**Technique:** EP — gate precedence (`AIRCRAFT` before `ZONE`)

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default; authorisation level is not self-service).
- A pilot with rating `R_BVLOS` and `certified_on` well within 18 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes (an `R_BVLOS` pilot covers every zone class).
- An aircraft with a unique `serial_number` and `mtom_grams` = 3000 g, i.e. derived weight band `C1` (`POST /api/v1/aircraft`, `201`), saved as {{aircraft_id}}. No other flight request exists for it.
- Zone `ZTM-RST-7` from the seeded catalogue (`GET /api/v1/zones/ZTM-RST-7`): `RESTRICTED`, ceiling 45 m, `permitted_bands` C0, required authorisation level `L3`, active. Saved as {{zone_code}}.
- Window: `window_start` = request time + 2 days, `window_end` = `window_start` + 60 min (valid lead time, duration, no overlap; the zone's curfew is avoided by choosing a midday start in zone-local time). `requested_altitude_metres` = 46 (within the 45 m ceiling). Altitude 46 m is above the 45 m ceiling, and the `L1` operator is also below `L3`: two `ZONE` failures are present on purpose.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start`, `window_end` and `requested_altitude_metres` as in the preconditions.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `AIRCRAFT`, `rule_reference` = `ZC-2026.1 §2`, `message` non-empty (names the band and the zone). Not `ZONE`.

**Rationale:** Both weight band (C1 in a C0-only zone) and altitude fail, but the response names only the first failing gate, `AIRCRAFT`. Both the weight-band and altitude rules cite `ZC-2026.1 §2`; only `failing_gate` tells them apart (06 §1.2 note).

### API-OP-003.18: Submit of an unpermitted-band request moves it DRAFT → REJECTED with AIRCRAFT recorded

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`, §3, §4, §6; corrected by [07](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate` · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079)

**Technique:** ST — DRAFT → REJECTED on gate failure

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default; authorisation level is not self-service).
- A pilot with rating `R_BVLOS` and `certified_on` well within 18 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes (an `R_BVLOS` pilot covers every zone class).
- An aircraft with a unique `serial_number` and `mtom_grams` = 3501 g, i.e. derived weight band `C2` (`POST /api/v1/aircraft`, `201`), saved as {{aircraft_id}}. No other flight request exists for it.
- Zone `LVV-RST-2` from the seeded catalogue (`GET /api/v1/zones/LVV-RST-2`): `RESTRICTED`, ceiling 60 m, `permitted_bands` C0–C1, required authorisation level `L3`, active. Saved as {{zone_code}}.
- Window: `window_start` = request time + 2 days, `window_end` = `window_start` + 60 min (valid lead time, duration, no overlap; the zone's curfew is avoided by choosing a midday start in zone-local time). `requested_altitude_metres` = 40 (within the 60 m ceiling).

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start`, `window_end` and `requested_altitude_metres` as in the preconditions.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/submit`. Auth: operator session.
3. `GET /api/v1/flight-requests/{{fr_id}}`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `AIRCRAFT`, `rule_reference` = `ZC-2026.1 §2`, `message` non-empty (names the band and the zone).
- Step 3: `200`, `state` = `REJECTED`, `failing_gate` = `AIRCRAFT`, `rule_reference` = `ZC-2026.1 §2`, `rejection_reason` non-empty.

**Rationale:** A gate failure on submit takes the request straight to `REJECTED` and persists `failing_gate`/`rule_reference` (01 Data Model, 02). The follow-up `GET` proves the stored values, not just the `422`.

### API-OP-003.19: Validate on an unpermitted-band request returns 422 and leaves it DRAFT

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`, §3, §4, §6; corrected by [07](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate` · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079)

**Technique:** ST — `validate` has no transition

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default; authorisation level is not self-service).
- A pilot with rating `R_BVLOS` and `certified_on` well within 18 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes (an `R_BVLOS` pilot covers every zone class).
- An aircraft with a unique `serial_number` and `mtom_grams` = 901 g, i.e. derived weight band `C1` (`POST /api/v1/aircraft`, `201`), saved as {{aircraft_id}}. No other flight request exists for it.
- Zone `ZTM-RST-7` from the seeded catalogue (`GET /api/v1/zones/ZTM-RST-7`): `RESTRICTED`, ceiling 45 m, `permitted_bands` C0, required authorisation level `L3`, active. Saved as {{zone_code}}.
- Window: `window_start` = request time + 2 days, `window_end` = `window_start` + 60 min (valid lead time, duration, no overlap; the zone's curfew is avoided by choosing a midday start in zone-local time). `requested_altitude_metres` = 30 (within the 45 m ceiling).

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start`, `window_end` and `requested_altitude_metres` as in the preconditions.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.
3. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.
4. `GET /api/v1/flight-requests/{{fr_id}}`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `AIRCRAFT`, `rule_reference` = `ZC-2026.1 §2`, `message` non-empty (names the band and the zone).
- Step 3: the same `422` body as step 2 (repeatable, idempotent).
- Step 4: `200`, `state` = `DRAFT`, `failing_gate` = `null`, `rule_reference` = `null`.

**Rationale:** `validate` runs the same pipeline as `submit` but never changes state (03 endpoint 13). The second call and the final `GET` show nothing was persisted.

### API-OP-003.20: Re-submit of a request REJECTED by AIRCRAFT returns 409

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`, §3, §4, §6; corrected by [07](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate` · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079)

**Technique:** ST — illegal transition REJECTED → submit

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default; authorisation level is not self-service).
- A pilot with rating `R_BVLOS` and `certified_on` well within 18 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes (an `R_BVLOS` pilot covers every zone class).
- An aircraft with a unique `serial_number` and `mtom_grams` = 3501 g, i.e. derived weight band `C2` (`POST /api/v1/aircraft`, `201`), saved as {{aircraft_id}}. No other flight request exists for it.
- Zone `LVV-RST-2` from the seeded catalogue (`GET /api/v1/zones/LVV-RST-2`): `RESTRICTED`, ceiling 60 m, `permitted_bands` C0–C1, required authorisation level `L3`, active. Saved as {{zone_code}}.
- Window: `window_start` = request time + 2 days, `window_end` = `window_start` + 60 min (valid lead time, duration, no overlap; the zone's curfew is avoided by choosing a midday start in zone-local time). `requested_altitude_metres` = 40 (within the 60 m ceiling).

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start`, `window_end` and `requested_altitude_metres` as in the preconditions.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/submit`. Auth: operator session.
3. `POST /api/v1/flight-requests/{{fr_id}}/submit`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `AIRCRAFT`, `rule_reference` = `ZC-2026.1 §2`, `message` non-empty (names the band and the zone).
- Step 3: `409`.

**Rationale:** `REJECTED` is terminal; a second submit cannot be attempted (`409`), as opposed to being attempted and refused (`422`). The first submit is only used to reach `REJECTED` through the `AIRCRAFT` gate.

### API-OP-003.21: Submit of a permitted-band request moves it DRAFT → UNDER_REVIEW

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`, §3, §4, §6; corrected by [07](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate` · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079)

**Technique:** ST — DRAFT → UNDER_REVIEW on all gates passing

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default; authorisation level is not self-service).
- A pilot with rating `R_BVLOS` and `certified_on` well within 18 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes (an `R_BVLOS` pilot covers every zone class).
- An aircraft with a unique `serial_number` and `mtom_grams` = 12001 g, i.e. derived weight band `C3` (`POST /api/v1/aircraft`, `201`), saved as {{aircraft_id}}. No other flight request exists for it.
- Zone `DNI-OPN-1` from the seeded catalogue (`GET /api/v1/zones/DNI-OPN-1`): `OPEN`, ceiling 120 m, `permitted_bands` C0–C3, required authorisation level `L1`, active. Saved as {{zone_code}}.
- Window: `window_start` = request time + 2 days, `window_end` = `window_start` + 60 min (valid lead time, duration, no overlap; the zone's curfew is avoided by choosing a midday start in zone-local time). `requested_altitude_metres` = 80 (within the 120 m ceiling).

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start`, `window_end` and `requested_altitude_metres` as in the preconditions.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/submit`. Auth: operator session.
3. `GET /api/v1/flight-requests/{{fr_id}}`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `200`, `state` = `UNDER_REVIEW`.
- Step 3: `200`, `state` = `UNDER_REVIEW`, `failing_gate` = `null`.

**Rationale:** The aircraft is `C3` (12,001 g), which an OPEN zone permits, so `AIRCRAFT` passes, and the same band that fails in KBP-CTR-3 does not fail here. Contrast with the 12001 g `KBP-CTR-3` case: the verdict depends on the zone's `permitted_bands`, not on the aircraft alone.

### API-OP-003.22: Reviewer validate on an unpermitted-band request returns the same AIRCRAFT 422

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`, §3, §4, §6; corrected by [07](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate` · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079)

**Technique:** ST — reviewer-or-owner read of `validate`

**Role(s):** Operator (setup), Reviewer (steps 2–3)

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. The operator is `L1` (registration default; authorisation level is not self-service).
- A pilot with rating `R_BVLOS` and `certified_on` well within 18 months before `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}. `PILOT` passes (an `R_BVLOS` pilot covers every zone class).
- An aircraft with a unique `serial_number` and `mtom_grams` = 901 g, i.e. derived weight band `C1` (`POST /api/v1/aircraft`, `201`), saved as {{aircraft_id}}. No other flight request exists for it.
- Zone `ZTM-RST-7` from the seeded catalogue (`GET /api/v1/zones/ZTM-RST-7`): `RESTRICTED`, ceiling 45 m, `permitted_bands` C0, required authorisation level `L3`, active. Saved as {{zone_code}}.
- Window: `window_start` = request time + 2 days, `window_end` = `window_start` + 60 min (valid lead time, duration, no overlap; the zone's curfew is avoided by choosing a midday start in zone-local time). `requested_altitude_metres` = 30 (within the 45 m ceiling). Reviewer id for step 2: any non-empty string, e.g. `rev-1`; no session is used in step 2.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = {{zone_code}}, `window_start`, `window_end` and `requested_altitude_metres` as in the preconditions.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: `X-Reviewer-Id: rev-1` only (no session cookie).
3. `GET /api/v1/flight-requests/{{fr_id}}`. Auth: `X-Reviewer-Id: rev-1` only.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, body `failing_gate` = `AIRCRAFT`, `rule_reference` = `ZC-2026.1 §2`, `message` non-empty (names the band and the zone).
- Step 3: `200`, `state` = `DRAFT`.

**Rationale:** `validate` accepts either the owning operator's session or any `X-Reviewer-Id` (03). The reviewer detail view shows all gate results through it, so the weight-band outcome must be identical and side-effect free.
