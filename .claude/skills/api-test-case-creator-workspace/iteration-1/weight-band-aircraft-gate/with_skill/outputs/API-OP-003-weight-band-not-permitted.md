# Weight band not permitted

### API-OP-003.1: Aircraft 1 g below the C0 upper bound is accepted in a zone permitting C0 only

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`; §3; §6) · [07 — Clarifications](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) (item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** BV — boundary − 1 (just inside the permitted band)

**Role(s):** Operator

**Preconditions:**
- Operator whose `authorisation_level` is `L3` or higher. Registration always creates `L1` (03), so this operator cannot be created through the API: it has to exist already and is signed in via `POST /api/v1/auth/login`; the session cookie is used below.
- A pilot whose rating is R_BVLOS (covers the zone's class `RESTRICTED`) and whose certification is current at `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}.
- Zone with `permitted_bands` = C0 only, class `RESTRICTED`, required authorisation level `L3`, zone active (catalogue: `ZTM-RST-7`, ceiling 45 m). Window below is outside the zone's curfew, 24 h or more after creation (inside 60 days), 60 min long, not on or next to a DST change; no other `APPROVED`/`UNDER_REVIEW` request exists for the aircraft.
- The aircraft is created in step 1 because its weight is the tested input. Weight band is within the zone's `permitted_bands`; every other condition of every gate is within limits.

**Steps:**
1. `POST /api/v1/aircraft`. Auth: operator session.
   Body: `mtom_grams` = C0 upper bound − 1 g (inside the highest permitted band); other required fields valid.
   Save `id` as {{aircraft_id}}.
2. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = `ZTM-RST-7`, `window_start` = the next zone-local 12:00 that is at least 24 h after the request is created, `window_end` = `window_start` + 60 min, `requested_altitude_metres` = below the zone's ceiling.
   Save `id` as {{fr_id}}.
3. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`. Step 2: `201`, `state` = `DRAFT`.
- Step 3: `200`.

**Rationale:** `ZC-2026.1 §2` (`AIRCRAFT`, §1.2/§3 of 06: bands are upper-bound inclusive, so the C0 upper bound still belongs to its band). Proves the gate does not over-reject at/inside the limit.

### API-OP-003.2: Aircraft exactly at the C0 upper bound is accepted in a zone permitting C0 only

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`; §3; §6) · [07 — Clarifications](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) (item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** BV — boundary (limit itself, inclusive)

**Role(s):** Operator

**Preconditions:**
- Operator whose `authorisation_level` is `L3` or higher. Registration always creates `L1` (03), so this operator cannot be created through the API: it has to exist already and is signed in via `POST /api/v1/auth/login`; the session cookie is used below.
- A pilot whose rating is R_BVLOS (covers the zone's class `RESTRICTED`) and whose certification is current at `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}.
- Zone with `permitted_bands` = C0 only, class `RESTRICTED`, required authorisation level `L3`, zone active (catalogue: `ZTM-RST-7`, ceiling 45 m). Window below is outside the zone's curfew, 24 h or more after creation (inside 60 days), 60 min long, not on or next to a DST change; no other `APPROVED`/`UNDER_REVIEW` request exists for the aircraft.
- The aircraft is created in step 1 because its weight is the tested input. Weight band is within the zone's `permitted_bands`; every other condition of every gate is within limits.

**Steps:**
1. `POST /api/v1/aircraft`. Auth: operator session.
   Body: `mtom_grams` = exactly the C0 upper bound (upper bounds are inclusive); other required fields valid.
   Save `id` as {{aircraft_id}}.
2. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = `ZTM-RST-7`, `window_start` = the next zone-local 12:00 that is at least 24 h after the request is created, `window_end` = `window_start` + 60 min, `requested_altitude_metres` = below the zone's ceiling.
   Save `id` as {{fr_id}}.
3. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`. Step 2: `201`, `state` = `DRAFT`.
- Step 3: `200`.

**Rationale:** `ZC-2026.1 §2` (`AIRCRAFT`, §1.2/§3 of 06: bands are upper-bound inclusive, so the C0 upper bound still belongs to its band). Proves the gate does not over-reject at/inside the limit.

### API-OP-003.3: Aircraft 1 g above the C0 upper bound is refused in a zone permitting C0 only

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`; §3; §6) · [07 — Clarifications](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) (item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** BV — boundary + 1 (just past the limit, band not permitted)

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. Its level (`L1`) is irrelevant here: `AIRCRAFT` is evaluated before `ZONE`.
- A pilot whose rating is R_BVLOS (covers the zone's class `RESTRICTED`) and whose certification is current at `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}.
- Zone with `permitted_bands` = C0 only, class `RESTRICTED`, required authorisation level `L3`, zone active (catalogue: `ZTM-RST-7`, ceiling 45 m). Window below is outside the zone's curfew, 24 h or more after creation (inside 60 days), 60 min long, not on or next to a DST change; no other `APPROVED`/`UNDER_REVIEW` request exists for the aircraft.
- The aircraft is created in step 1 because its weight is the tested input. The single violated condition: the aircraft's derived weight band is not in the zone's `permitted_bands`; the pilot's rating, certification currency, and everything else are within limits.

**Steps:**
1. `POST /api/v1/aircraft`. Auth: operator session.
   Body: `mtom_grams` = C0 upper bound + 1 g (first gram of the next band, not permitted); other required fields valid.
   Save `id` as {{aircraft_id}}.
2. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = `ZTM-RST-7`, `window_start` = the next zone-local 12:00 that is at least 24 h after the request is created, `window_end` = `window_start` + 60 min, `requested_altitude_metres` = below the zone's ceiling.
   Save `id` as {{fr_id}}.
3. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`. Step 2: `201`, `state` = `DRAFT`.
- Step 3: `422`, body `failing_gate` = `AIRCRAFT`, `rule_reference` = `ZC-2026.1 §2`, `message` non-empty.

**Rationale:** `ZC-2026.1 §2` (`AIRCRAFT`, §1.2/§3 of 06: bands are upper-bound inclusive, so the C0 upper bound still belongs to its band). Proves the gate refuses the first weight outside the permitted bands, and names `AIRCRAFT` (not `ZONE`) per 07 item 1.

### API-OP-003.4: Aircraft 1 g below the C1 upper bound is accepted in a zone permitting C0–C1

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`; §3; §6) · [07 — Clarifications](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) (item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** BV — boundary − 1 (just inside the permitted band)

**Role(s):** Operator

**Preconditions:**
- Operator whose `authorisation_level` is `L3` or higher. Registration always creates `L1` (03), so this operator cannot be created through the API: it has to exist already and is signed in via `POST /api/v1/auth/login`; the session cookie is used below.
- A pilot whose rating is R_BVLOS (covers the zone's class `RESTRICTED`) and whose certification is current at `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}.
- Zone with `permitted_bands` = C0–C1, class `RESTRICTED`, required authorisation level `L3`, zone active (catalogue: `LVV-RST-2`, ceiling 60 m). Window below is outside the zone's curfew, 24 h or more after creation (inside 60 days), 60 min long, not on or next to a DST change; no other `APPROVED`/`UNDER_REVIEW` request exists for the aircraft.
- The aircraft is created in step 1 because its weight is the tested input. Weight band is within the zone's `permitted_bands`; every other condition of every gate is within limits.

**Steps:**
1. `POST /api/v1/aircraft`. Auth: operator session.
   Body: `mtom_grams` = C1 upper bound − 1 g (inside the highest permitted band); other required fields valid.
   Save `id` as {{aircraft_id}}.
2. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = `LVV-RST-2`, `window_start` = the next zone-local 12:00 that is at least 24 h after the request is created, `window_end` = `window_start` + 60 min, `requested_altitude_metres` = below the zone's ceiling.
   Save `id` as {{fr_id}}.
3. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`. Step 2: `201`, `state` = `DRAFT`.
- Step 3: `200`.

**Rationale:** `ZC-2026.1 §2` (`AIRCRAFT`, §1.2/§3 of 06: bands are upper-bound inclusive, so the C1 upper bound still belongs to its band). Proves the gate does not over-reject at/inside the limit.

### API-OP-003.5: Aircraft exactly at the C1 upper bound is accepted in a zone permitting C0–C1

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`; §3; §6) · [07 — Clarifications](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) (item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** BV — boundary (limit itself, inclusive)

**Role(s):** Operator

**Preconditions:**
- Operator whose `authorisation_level` is `L3` or higher. Registration always creates `L1` (03), so this operator cannot be created through the API: it has to exist already and is signed in via `POST /api/v1/auth/login`; the session cookie is used below.
- A pilot whose rating is R_BVLOS (covers the zone's class `RESTRICTED`) and whose certification is current at `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}.
- Zone with `permitted_bands` = C0–C1, class `RESTRICTED`, required authorisation level `L3`, zone active (catalogue: `LVV-RST-2`, ceiling 60 m). Window below is outside the zone's curfew, 24 h or more after creation (inside 60 days), 60 min long, not on or next to a DST change; no other `APPROVED`/`UNDER_REVIEW` request exists for the aircraft.
- The aircraft is created in step 1 because its weight is the tested input. Weight band is within the zone's `permitted_bands`; every other condition of every gate is within limits.

**Steps:**
1. `POST /api/v1/aircraft`. Auth: operator session.
   Body: `mtom_grams` = exactly the C1 upper bound (upper bounds are inclusive); other required fields valid.
   Save `id` as {{aircraft_id}}.
2. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = `LVV-RST-2`, `window_start` = the next zone-local 12:00 that is at least 24 h after the request is created, `window_end` = `window_start` + 60 min, `requested_altitude_metres` = below the zone's ceiling.
   Save `id` as {{fr_id}}.
3. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`. Step 2: `201`, `state` = `DRAFT`.
- Step 3: `200`.

**Rationale:** `ZC-2026.1 §2` (`AIRCRAFT`, §1.2/§3 of 06: bands are upper-bound inclusive, so the C1 upper bound still belongs to its band). Proves the gate does not over-reject at/inside the limit.

### API-OP-003.6: Aircraft 1 g above the C1 upper bound is refused in a zone permitting C0–C1

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`; §3; §6) · [07 — Clarifications](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) (item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** BV — boundary + 1 (just past the limit, band not permitted)

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. Its level (`L1`) is irrelevant here: `AIRCRAFT` is evaluated before `ZONE`.
- A pilot whose rating is R_BVLOS (covers the zone's class `RESTRICTED`) and whose certification is current at `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}.
- Zone with `permitted_bands` = C0–C1, class `RESTRICTED`, required authorisation level `L3`, zone active (catalogue: `LVV-RST-2`, ceiling 60 m). Window below is outside the zone's curfew, 24 h or more after creation (inside 60 days), 60 min long, not on or next to a DST change; no other `APPROVED`/`UNDER_REVIEW` request exists for the aircraft.
- The aircraft is created in step 1 because its weight is the tested input. The single violated condition: the aircraft's derived weight band is not in the zone's `permitted_bands`; the pilot's rating, certification currency, and everything else are within limits.

**Steps:**
1. `POST /api/v1/aircraft`. Auth: operator session.
   Body: `mtom_grams` = C1 upper bound + 1 g (first gram of the next band, not permitted); other required fields valid.
   Save `id` as {{aircraft_id}}.
2. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = `LVV-RST-2`, `window_start` = the next zone-local 12:00 that is at least 24 h after the request is created, `window_end` = `window_start` + 60 min, `requested_altitude_metres` = below the zone's ceiling.
   Save `id` as {{fr_id}}.
3. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`. Step 2: `201`, `state` = `DRAFT`.
- Step 3: `422`, body `failing_gate` = `AIRCRAFT`, `rule_reference` = `ZC-2026.1 §2`, `message` non-empty.

**Rationale:** `ZC-2026.1 §2` (`AIRCRAFT`, §1.2/§3 of 06: bands are upper-bound inclusive, so the C1 upper bound still belongs to its band). Proves the gate refuses the first weight outside the permitted bands, and names `AIRCRAFT` (not `ZONE`) per 07 item 1.

### API-OP-003.7: Aircraft 1 g below the C2 upper bound is accepted in a zone permitting C0–C2

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`; §3; §6) · [07 — Clarifications](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) (item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** BV — boundary − 1 (just inside the permitted band)

**Role(s):** Operator

**Preconditions:**
- Operator whose `authorisation_level` is `L2` or higher. Registration always creates `L1` (03), so this operator cannot be created through the API: it has to exist already and is signed in via `POST /api/v1/auth/login`; the session cookie is used below.
- A pilot whose rating is R_ADVANCED (or R_BVLOS) (covers the zone's class `CONTROLLED`) and whose certification is current at `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}.
- Zone with `permitted_bands` = C0–C2, class `CONTROLLED`, required authorisation level `L2`, zone active (catalogue: `KBP-CTR-3`, ceiling 120 m). Window below is outside the zone's curfew, 24 h or more after creation (inside 60 days), 60 min long, not on or next to a DST change; no other `APPROVED`/`UNDER_REVIEW` request exists for the aircraft.
- The aircraft is created in step 1 because its weight is the tested input. Weight band is within the zone's `permitted_bands`; every other condition of every gate is within limits.

**Steps:**
1. `POST /api/v1/aircraft`. Auth: operator session.
   Body: `mtom_grams` = C2 upper bound − 1 g (inside the highest permitted band); other required fields valid.
   Save `id` as {{aircraft_id}}.
2. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = `KBP-CTR-3`, `window_start` = the next zone-local 12:00 that is at least 24 h after the request is created, `window_end` = `window_start` + 60 min, `requested_altitude_metres` = below the zone's ceiling.
   Save `id` as {{fr_id}}.
3. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`. Step 2: `201`, `state` = `DRAFT`.
- Step 3: `200`.

**Rationale:** `ZC-2026.1 §2` (`AIRCRAFT`, §1.2/§3 of 06: bands are upper-bound inclusive, so the C2 upper bound still belongs to its band). Proves the gate does not over-reject at/inside the limit.

### API-OP-003.8: Aircraft exactly at the C2 upper bound is accepted in a zone permitting C0–C2

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`; §3; §6) · [07 — Clarifications](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) (item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** BV — boundary (limit itself, inclusive)

**Role(s):** Operator

**Preconditions:**
- Operator whose `authorisation_level` is `L2` or higher. Registration always creates `L1` (03), so this operator cannot be created through the API: it has to exist already and is signed in via `POST /api/v1/auth/login`; the session cookie is used below.
- A pilot whose rating is R_ADVANCED (or R_BVLOS) (covers the zone's class `CONTROLLED`) and whose certification is current at `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}.
- Zone with `permitted_bands` = C0–C2, class `CONTROLLED`, required authorisation level `L2`, zone active (catalogue: `KBP-CTR-3`, ceiling 120 m). Window below is outside the zone's curfew, 24 h or more after creation (inside 60 days), 60 min long, not on or next to a DST change; no other `APPROVED`/`UNDER_REVIEW` request exists for the aircraft.
- The aircraft is created in step 1 because its weight is the tested input. Weight band is within the zone's `permitted_bands`; every other condition of every gate is within limits.

**Steps:**
1. `POST /api/v1/aircraft`. Auth: operator session.
   Body: `mtom_grams` = exactly the C2 upper bound (upper bounds are inclusive); other required fields valid.
   Save `id` as {{aircraft_id}}.
2. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = `KBP-CTR-3`, `window_start` = the next zone-local 12:00 that is at least 24 h after the request is created, `window_end` = `window_start` + 60 min, `requested_altitude_metres` = below the zone's ceiling.
   Save `id` as {{fr_id}}.
3. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`. Step 2: `201`, `state` = `DRAFT`.
- Step 3: `200`.

**Rationale:** `ZC-2026.1 §2` (`AIRCRAFT`, §1.2/§3 of 06: bands are upper-bound inclusive, so the C2 upper bound still belongs to its band). Proves the gate does not over-reject at/inside the limit.

### API-OP-003.9: Aircraft 1 g above the C2 upper bound is refused in a zone permitting C0–C2

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`; §3; §6) · [07 — Clarifications](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66208) (item 1) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** BV — boundary + 1 (just past the limit, band not permitted)

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. Its level (`L1`) is irrelevant here: `AIRCRAFT` is evaluated before `ZONE`.
- A pilot whose rating is R_ADVANCED (or R_BVLOS) (covers the zone's class `CONTROLLED`) and whose certification is current at `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}.
- Zone with `permitted_bands` = C0–C2, class `CONTROLLED`, required authorisation level `L2`, zone active (catalogue: `KBP-CTR-3`, ceiling 120 m). Window below is outside the zone's curfew, 24 h or more after creation (inside 60 days), 60 min long, not on or next to a DST change; no other `APPROVED`/`UNDER_REVIEW` request exists for the aircraft.
- The aircraft is created in step 1 because its weight is the tested input. The single violated condition: the aircraft's derived weight band is not in the zone's `permitted_bands`; the pilot's rating, certification currency, and everything else are within limits.

**Steps:**
1. `POST /api/v1/aircraft`. Auth: operator session.
   Body: `mtom_grams` = C2 upper bound + 1 g (first gram of the next band, not permitted); other required fields valid.
   Save `id` as {{aircraft_id}}.
2. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = `KBP-CTR-3`, `window_start` = the next zone-local 12:00 that is at least 24 h after the request is created, `window_end` = `window_start` + 60 min, `requested_altitude_metres` = below the zone's ceiling.
   Save `id` as {{fr_id}}.
3. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`. Step 2: `201`, `state` = `DRAFT`.
- Step 3: `422`, body `failing_gate` = `AIRCRAFT`, `rule_reference` = `ZC-2026.1 §2`, `message` non-empty.

**Rationale:** `ZC-2026.1 §2` (`AIRCRAFT`, §1.2/§3 of 06: bands are upper-bound inclusive, so the C2 upper bound still belongs to its band). Proves the gate refuses the first weight outside the permitted bands, and names `AIRCRAFT` (not `ZONE`) per 07 item 1.

### API-OP-003.10: Aircraft in the heaviest band is accepted in a zone permitting all four bands

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`; §3; §6) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** EP — valid partition: zone permits every band, aircraft in C3 (above the C2 upper bound, up to 30,000 g)

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. `L1` is enough for this zone.
- A pilot with any rating (covers class `OPEN`) whose certification is current at `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}.
- Zone with `permitted_bands` = C0–C3, class `OPEN`, required authorisation level `L1`, no curfew (catalogue: `DNI-OPN-1`, ceiling 120 m). Window below is 24 h or more after creation (inside 60 days), 60 min long, not on or next to a DST change; no other `APPROVED`/`UNDER_REVIEW` request exists for the aircraft.
- The aircraft is created in step 1 because its weight is the tested input. Weight band is in the zone's `permitted_bands`; every other condition of every gate is within limits.

**Steps:**
1. `POST /api/v1/aircraft`. Auth: operator session.
   Body: `mtom_grams` = a weight strictly inside C3, away from both ends (above the C2 upper bound, below 30,000 g); other required fields valid.
   Save `id` as {{aircraft_id}}.
2. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = `DNI-OPN-1`, `window_start` = any time at least 24 h after the request is created, `window_end` = `window_start` + 60 min, `requested_altitude_metres` = below the zone's ceiling.
   Save `id` as {{fr_id}}.
3. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.

**Expected result:**
- Step 1: `201`. Step 2: `201`, `state` = `DRAFT`.
- Step 3: `200`.

**Rationale:** The BV cases only reach C3 as a refused band. This is the one valid partition they don't cover: the heaviest band is accepted where the zone's `permitted_bands` lists it, so the gate is not simply "reject above some weight".

### API-OP-003.11: Validate of a request failing the weight band returns 422 and leaves it in DRAFT

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`; §6) · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079) (validate never changes state) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/validate`

**Technique:** ST — DRAFT stays DRAFT on a failing validate

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. Its level (`L1`) is irrelevant here: `AIRCRAFT` is evaluated before `ZONE`.
- A pilot whose rating is R_ADVANCED (or R_BVLOS) (covers the zone's class `CONTROLLED`) and whose certification is current at `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}.
- Zone with `permitted_bands` = C0–C2, class `CONTROLLED`, required authorisation level `L2`, zone active (catalogue: `KBP-CTR-3`, ceiling 120 m). Window below is outside the zone's curfew, 24 h or more after creation (inside 60 days), 60 min long, not on or next to a DST change; no other `APPROVED`/`UNDER_REVIEW` request exists for the aircraft.
- The aircraft is created in step 1 so the chain runs on its own. The single violated condition: the aircraft's weight band (C3) is not in the zone's `permitted_bands`; all other conditions within limits.

**Steps:**
1. `POST /api/v1/aircraft`. Auth: operator session.
   Body: `mtom_grams` = the C2 upper bound + 1 g (first gram of C3, not permitted in this zone); other required fields valid.
   Save `id` as {{aircraft_id}}.
2. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = `KBP-CTR-3`, `window_start` = the next zone-local 12:00 that is at least 24 h after the request is created, `window_end` = `window_start` + 60 min, `requested_altitude_metres` = below the zone's ceiling.
   Save `id` as {{fr_id}}.
3. `POST /api/v1/flight-requests/{{fr_id}}/validate`. Auth: operator session.
4. `GET /api/v1/flight-requests/{{fr_id}}`. Auth: operator session.

**Expected result:**
- Step 1: `201`. Step 2: `201`, `state` = `DRAFT`.
- Step 3: `422`, `failing_gate` = `AIRCRAFT`, `rule_reference` = `ZC-2026.1 §2`, `message` non-empty.
- Step 4: `200`, `state` = `DRAFT` (validate is a dry run).

**Rationale:** `validate` runs the same pipeline as `submit` but must not move the row (03 endpoint 13; 02). A `422` alone doesn't prove the state was untouched.

### API-OP-003.12: Submit of a request failing the weight band moves it DRAFT → REJECTED

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`; §6) · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079) (DRAFT → REJECTED) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/submit`

**Technique:** ST — DRAFT → REJECTED on gate failure

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. Its level (`L1`) is irrelevant here: `AIRCRAFT` is evaluated before `ZONE`.
- A pilot whose rating is R_ADVANCED (or R_BVLOS) (covers the zone's class `CONTROLLED`) and whose certification is current at `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}.
- Zone with `permitted_bands` = C0–C2, class `CONTROLLED`, required authorisation level `L2`, zone active (catalogue: `KBP-CTR-3`, ceiling 120 m). Window below is outside the zone's curfew, 24 h or more after creation (inside 60 days), 60 min long, not on or next to a DST change; no other `APPROVED`/`UNDER_REVIEW` request exists for the aircraft.
- The aircraft is created in step 1 so the chain runs on its own. The single violated condition: the aircraft's weight band (C3) is not in the zone's `permitted_bands`; all other conditions within limits.

**Steps:**
1. `POST /api/v1/aircraft`. Auth: operator session.
   Body: `mtom_grams` = the C2 upper bound + 1 g (first gram of C3, not permitted in this zone); other required fields valid.
   Save `id` as {{aircraft_id}}.
2. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = `KBP-CTR-3`, `window_start` = the next zone-local 12:00 that is at least 24 h after the request is created, `window_end` = `window_start` + 60 min, `requested_altitude_metres` = below the zone's ceiling.
   Save `id` as {{fr_id}}.
3. `POST /api/v1/flight-requests/{{fr_id}}/submit`. Auth: operator session.
4. `GET /api/v1/flight-requests/{{fr_id}}`. Auth: operator session.

**Expected result:**
- Step 1: `201`. Step 2: `201`, `state` = `DRAFT`.
- Step 3: `422`, `failing_gate` = `AIRCRAFT`, `rule_reference` = `ZC-2026.1 §2`, `message` non-empty.
- Step 4: `200`, `state` = `REJECTED`, `failing_gate` = `AIRCRAFT`, `rule_reference` = `ZC-2026.1 §2`, `rejection_reason` non-empty.

**Rationale:** A gate failure on submit is the one path from DRAFT straight to REJECTED; the 422 alone doesn't prove the row moved. Also checks the stored `failing_gate` is `AIRCRAFT`, not the `ZONE` the source text literally says (07 item 1).

### API-OP-003.13: Second submit of a request rejected on the weight band returns 409

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`; §6) · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079) (REJECTED is terminal; any other pair is `409`) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/submit`

**Technique:** ST — REJECTED + submit → illegal transition

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below. Its level (`L1`) is irrelevant here: `AIRCRAFT` is evaluated before `ZONE`.
- A pilot whose rating is R_ADVANCED (or R_BVLOS) (covers the zone's class `CONTROLLED`) and whose certification is current at `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}.
- Zone with `permitted_bands` = C0–C2, class `CONTROLLED`, required authorisation level `L2`, zone active (catalogue: `KBP-CTR-3`, ceiling 120 m). Window below is outside the zone's curfew, 24 h or more after creation (inside 60 days), 60 min long, not on or next to a DST change; no other `APPROVED`/`UNDER_REVIEW` request exists for the aircraft.
- The aircraft is created in step 1 so the chain runs on its own. The single violated condition: the aircraft's weight band (C3) is not in the zone's `permitted_bands`; all other conditions within limits.

**Steps:**
1. `POST /api/v1/aircraft`. Auth: operator session.
   Body: `mtom_grams` = the C2 upper bound + 1 g (first gram of C3, not permitted in this zone); other required fields valid.
   Save `id` as {{aircraft_id}}.
2. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = `KBP-CTR-3`, `window_start` = the next zone-local 12:00 that is at least 24 h after the request is created, `window_end` = `window_start` + 60 min, `requested_altitude_metres` = below the zone's ceiling.
   Save `id` as {{fr_id}}.
3. `POST /api/v1/flight-requests/{{fr_id}}/submit`. Auth: operator session.
4. `POST /api/v1/flight-requests/{{fr_id}}/submit`. Auth: operator session.

**Expected result:**
- Step 1: `201`. Step 2: `201`, `state` = `DRAFT`.
- Step 3: `422`, `failing_gate` = `AIRCRAFT`, `rule_reference` = `ZC-2026.1 §2`, `message` non-empty (request is now `REJECTED`).
- Step 4: `409`.

**Rationale:** `REJECTED` is terminal; re-submitting must be refused as a state error (`409`), not re-evaluated as a gate failure (`422`). Reaching `REJECTED` through this rule's own failure makes the chain self-contained.

### API-OP-003.14: Submit of a request with the aircraft at the permitted limit moves it DRAFT → UNDER_REVIEW

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2` (§1.2 `AIRCRAFT`; §3; §6) · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079) (DRAFT → SUBMITTED → UNDER_REVIEW) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/submit`

**Technique:** ST — DRAFT → UNDER_REVIEW when all gates pass (weight at the C2 upper bound)

**Role(s):** Operator

**Preconditions:**
- Operator whose `authorisation_level` is `L2` or higher. Registration always creates `L1` (03), so this operator cannot be created through the API: it has to exist already and is signed in via `POST /api/v1/auth/login`; the session cookie is used below.
- A pilot whose rating is R_ADVANCED (or R_BVLOS) (covers the zone's class `CONTROLLED`) and whose certification is current at `window_start` (`POST /api/v1/pilots`), saved as {{pilot_id}}.
- Zone with `permitted_bands` = C0–C2, class `CONTROLLED`, required authorisation level `L2`, zone active (catalogue: `KBP-CTR-3`, ceiling 120 m). Window below is outside the zone's curfew, 24 h or more after creation (inside 60 days), 60 min long, not on or next to a DST change; no other `APPROVED`/`UNDER_REVIEW` request exists for the aircraft.
- The aircraft is created in step 1 so the chain runs on its own. Weight band is within the zone's `permitted_bands`; every other condition of every gate is within limits.

**Steps:**
1. `POST /api/v1/aircraft`. Auth: operator session.
   Body: `mtom_grams` = exactly the C2 upper bound (inclusive, permitted); other required fields valid.
   Save `id` as {{aircraft_id}}.
2. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = `KBP-CTR-3`, `window_start` = the next zone-local 12:00 that is at least 24 h after the request is created, `window_end` = `window_start` + 60 min, `requested_altitude_metres` = below the zone's ceiling.
   Save `id` as {{fr_id}}.
3. `POST /api/v1/flight-requests/{{fr_id}}/submit`. Auth: operator session.
4. `GET /api/v1/flight-requests/{{fr_id}}`. Auth: operator session.

**Expected result:**
- Step 1: `201`. Step 2: `201`, `state` = `DRAFT`.
- Step 3: `200`.
- Step 4: `200`, `state` = `UNDER_REVIEW`.

**Rationale:** The success side of the transition at the limit itself: the heaviest permitted aircraft must not be rejected by the `AIRCRAFT` gate.
