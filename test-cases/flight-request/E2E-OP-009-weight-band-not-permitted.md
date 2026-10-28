# Weight band not permitted (ZC-2026.1 §2)

Common set-up used by every case below (each case repeats the relevant parts in its own Preconditions so it can be run alone):

- Weight bands (06 §3) are upper-bound inclusive. "C0 upper bound", "C1 upper bound" and "C2 upper bound" mean the inclusive top of that band; "+ 1 g" / "− 1 g" is one gram above / below it.
- The zones are chosen from the catalogue (06 §4) because their `permitted_bands` set where the pass/fail line falls: C0 only, C0–C1, C0–C2, or all bands.
- Citation `ZC-2026.1 §2` is shared with the `ZONE` altitude check; `failing_gate` (`AIRCRAFT`) is what distinguishes them (06 §1.2). The weight-band check belongs to `AIRCRAFT`, not `ZONE` (clarification 07 item 1, resolved).

### E2E-OP-009.1: AIRCRAFT fails when the aircraft weighs the C0 upper bound + 1 g

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2`
(§1.2 `AIRCRAFT` table; §3 weight bands; §4 zone catalogue; §6 `rule_reference` table)

**Technique:** BV — C0 upper bound + 1 g

**Role(s):** Operator

**Preconditions:**
- Logged-in operator whose `authorisation_level` is L3 or higher (meets the zone's required level).
- Zone `ZTM-RST-7` (RESTRICTED; permitted bands C0 only).
- A pilot with rating `R_BVLOS`, so the rating covers the zone's class, and whose certification is current at `window_start` (`PILOT` passes).
- An aircraft whose `mtom_grams` is the C0 upper bound + 1 g (the lightest weight in C1), so its derived weight band is C1, which is not in the zone's `permitted_bands`. This is the only condition under test for `AIRCRAFT`.
- Requested altitude is at or below the zone's ceiling.
- `window_start` is validation time + 24 h or later (and before validation time + 60 days); the window lasts 60 min and lies entirely between curfew end (06:00) and curfew start (22:00) zone-local (Europe/Kyiv), so lead time, advance booking, duration and curfew all pass.
- No other `APPROVED`/`UNDER_REVIEW` request for that aircraft shares an instant with the window.
- The window date is not the day of, or next to, a DST change.
- Browser timezone is Europe/Kyiv, so the `datetime-local` inputs take zone-local times.

**Steps:**
1. Open `/operator/requests/new`.
2. Choose zone `ZTM-RST-7`, the pilot and the aircraft in `flight-request-zone-select`,
   `flight-request-pilot-select` and `flight-request-aircraft-select`.
3. Enter the window in `flight-request-window-start-input` and
   `flight-request-window-end-input`, an altitude within the zone's ceiling
   in `flight-request-altitude-input`, and any purpose in
   `flight-request-purpose-textarea`.
4. Click `flight-request-create-submit-button` (the request is created as
   `DRAFT`).
5. Click `flight-request-validate-button`.

**Expected result:**
- `flight-request-gate-result-PILOT` has `data-gate-status="PASS"`.
- `flight-request-gate-result-AIRCRAFT` has `data-gate-status="FAIL"` and shows `rule_reference` `ZC-2026.1 §2`.

**Rationale:** Weight bands are upper-bound inclusive (§3), and `ZTM-RST-7` permits C0 only, so C0 is the highest permitted band and C1 the first forbidden one. One gram past the limit must move the aircraft into C1 and fail `AIRCRAFT`. Earlier gate (`PILOT`) is pinned to pass, and the sibling `ZONE`/`TIME_WINDOW` inputs are pinned to pass so nothing else can produce the failure.

### E2E-OP-009.2: AIRCRAFT passes when the aircraft weighs exactly the C0 upper bound

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2`
(§1.2 `AIRCRAFT` table; §3 weight bands; §4 zone catalogue; §6 `rule_reference` table)

**Technique:** BV — C0 upper bound (at the limit)

**Role(s):** Operator

**Preconditions:**
- Logged-in operator whose `authorisation_level` is L3 or higher (meets the zone's required level).
- Zone `ZTM-RST-7` (RESTRICTED; permitted bands C0 only).
- A pilot with rating `R_BVLOS`, so the rating covers the zone's class, and whose certification is current at `window_start` (`PILOT` passes).
- An aircraft whose `mtom_grams` is exactly the C0 upper bound, so its derived weight band is C0, which is in the zone's `permitted_bands`. This is the only condition under test for `AIRCRAFT`.
- Requested altitude is at or below the zone's ceiling.
- `window_start` is validation time + 24 h or later (and before validation time + 60 days); the window lasts 60 min and lies entirely between curfew end (06:00) and curfew start (22:00) zone-local (Europe/Kyiv), so lead time, advance booking, duration and curfew all pass.
- No other `APPROVED`/`UNDER_REVIEW` request for that aircraft shares an instant with the window.
- The window date is not the day of, or next to, a DST change.
- Browser timezone is Europe/Kyiv, so the `datetime-local` inputs take zone-local times.

**Steps:**
1. Open `/operator/requests/new`.
2. Choose zone `ZTM-RST-7`, the pilot and the aircraft in `flight-request-zone-select`,
   `flight-request-pilot-select` and `flight-request-aircraft-select`.
3. Enter the window in `flight-request-window-start-input` and
   `flight-request-window-end-input`, an altitude within the zone's ceiling
   in `flight-request-altitude-input`, and any purpose in
   `flight-request-purpose-textarea`.
4. Click `flight-request-create-submit-button` (the request is created as
   `DRAFT`).
5. Click `flight-request-validate-button`.

**Expected result:**
- `flight-request-gate-result-AIRCRAFT` has `data-gate-status="PASS"`.

**Rationale:** Weight bands are upper-bound inclusive (§3), and `ZTM-RST-7` permits C0 only, so C0 is the highest permitted band and C1 the first forbidden one. Per §3 an aircraft exactly at the upper bound still belongs to C0 ("exactly ... is C0"), so it must pass; this catches an off-by-one using `<` instead of `≤`.

### E2E-OP-009.3: AIRCRAFT passes when the aircraft weighs the C0 upper bound − 1 g

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2`
(§1.2 `AIRCRAFT` table; §3 weight bands; §4 zone catalogue; §6 `rule_reference` table)

**Technique:** BV — C0 upper bound − 1 g

**Role(s):** Operator

**Preconditions:**
- Logged-in operator whose `authorisation_level` is L3 or higher (meets the zone's required level).
- Zone `ZTM-RST-7` (RESTRICTED; permitted bands C0 only).
- A pilot with rating `R_BVLOS`, so the rating covers the zone's class, and whose certification is current at `window_start` (`PILOT` passes).
- An aircraft whose `mtom_grams` is the C0 upper bound − 1 g, so its derived weight band is C0, which is in the zone's `permitted_bands`. This is the only condition under test for `AIRCRAFT`.
- Requested altitude is at or below the zone's ceiling.
- `window_start` is validation time + 24 h or later (and before validation time + 60 days); the window lasts 60 min and lies entirely between curfew end (06:00) and curfew start (22:00) zone-local (Europe/Kyiv), so lead time, advance booking, duration and curfew all pass.
- No other `APPROVED`/`UNDER_REVIEW` request for that aircraft shares an instant with the window.
- The window date is not the day of, or next to, a DST change.
- Browser timezone is Europe/Kyiv, so the `datetime-local` inputs take zone-local times.

**Steps:**
1. Open `/operator/requests/new`.
2. Choose zone `ZTM-RST-7`, the pilot and the aircraft in `flight-request-zone-select`,
   `flight-request-pilot-select` and `flight-request-aircraft-select`.
3. Enter the window in `flight-request-window-start-input` and
   `flight-request-window-end-input`, an altitude within the zone's ceiling
   in `flight-request-altitude-input`, and any purpose in
   `flight-request-purpose-textarea`.
4. Click `flight-request-create-submit-button` (the request is created as
   `DRAFT`).
5. Click `flight-request-validate-button`.

**Expected result:**
- `flight-request-gate-result-AIRCRAFT` has `data-gate-status="PASS"`.

**Rationale:** Weight bands are upper-bound inclusive (§3), and `ZTM-RST-7` permits C0 only, so C0 is the highest permitted band and C1 the first forbidden one. One gram inside the limit stays in C0 and passes; together with the at-limit case it pins the boundary from the passing side.

### E2E-OP-009.4: AIRCRAFT fails when the aircraft weighs the C1 upper bound + 1 g

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2`
(§1.2 `AIRCRAFT` table; §3 weight bands; §4 zone catalogue; §6 `rule_reference` table)

**Technique:** BV — C1 upper bound + 1 g

**Role(s):** Operator

**Preconditions:**
- Logged-in operator whose `authorisation_level` is L3 or higher (meets the zone's required level).
- Zone `LVV-RST-2` (RESTRICTED; permitted bands C0–C1).
- A pilot with rating `R_BVLOS`, so the rating covers the zone's class, and whose certification is current at `window_start` (`PILOT` passes).
- An aircraft whose `mtom_grams` is the C1 upper bound + 1 g (the lightest weight in C2), so its derived weight band is C2, which is not in the zone's `permitted_bands`. This is the only condition under test for `AIRCRAFT`.
- Requested altitude is at or below the zone's ceiling.
- `window_start` is validation time + 24 h or later (and before validation time + 60 days); the window lasts 60 min and lies entirely between curfew end (06:00) and curfew start (22:00) zone-local (Europe/Kyiv), so lead time, advance booking, duration and curfew all pass.
- No other `APPROVED`/`UNDER_REVIEW` request for that aircraft shares an instant with the window.
- The window date is not the day of, or next to, a DST change.
- Browser timezone is Europe/Kyiv, so the `datetime-local` inputs take zone-local times.

**Steps:**
1. Open `/operator/requests/new`.
2. Choose zone `LVV-RST-2`, the pilot and the aircraft in `flight-request-zone-select`,
   `flight-request-pilot-select` and `flight-request-aircraft-select`.
3. Enter the window in `flight-request-window-start-input` and
   `flight-request-window-end-input`, an altitude within the zone's ceiling
   in `flight-request-altitude-input`, and any purpose in
   `flight-request-purpose-textarea`.
4. Click `flight-request-create-submit-button` (the request is created as
   `DRAFT`).
5. Click `flight-request-validate-button`.

**Expected result:**
- `flight-request-gate-result-PILOT` has `data-gate-status="PASS"`.
- `flight-request-gate-result-AIRCRAFT` has `data-gate-status="FAIL"` and shows `rule_reference` `ZC-2026.1 §2`.

**Rationale:** Weight bands are upper-bound inclusive (§3), and `LVV-RST-2` permits C0–C1, so C1 is the highest permitted band and C2 the first forbidden one. One gram past the limit must move the aircraft into C2 and fail `AIRCRAFT`. Earlier gate (`PILOT`) is pinned to pass, and the sibling `ZONE`/`TIME_WINDOW` inputs are pinned to pass so nothing else can produce the failure.

### E2E-OP-009.5: AIRCRAFT passes when the aircraft weighs exactly the C1 upper bound

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2`
(§1.2 `AIRCRAFT` table; §3 weight bands; §4 zone catalogue; §6 `rule_reference` table)

**Technique:** BV — C1 upper bound (at the limit)

**Role(s):** Operator

**Preconditions:**
- Logged-in operator whose `authorisation_level` is L3 or higher (meets the zone's required level).
- Zone `LVV-RST-2` (RESTRICTED; permitted bands C0–C1).
- A pilot with rating `R_BVLOS`, so the rating covers the zone's class, and whose certification is current at `window_start` (`PILOT` passes).
- An aircraft whose `mtom_grams` is exactly the C1 upper bound, so its derived weight band is C1, which is in the zone's `permitted_bands`. This is the only condition under test for `AIRCRAFT`.
- Requested altitude is at or below the zone's ceiling.
- `window_start` is validation time + 24 h or later (and before validation time + 60 days); the window lasts 60 min and lies entirely between curfew end (06:00) and curfew start (22:00) zone-local (Europe/Kyiv), so lead time, advance booking, duration and curfew all pass.
- No other `APPROVED`/`UNDER_REVIEW` request for that aircraft shares an instant with the window.
- The window date is not the day of, or next to, a DST change.
- Browser timezone is Europe/Kyiv, so the `datetime-local` inputs take zone-local times.

**Steps:**
1. Open `/operator/requests/new`.
2. Choose zone `LVV-RST-2`, the pilot and the aircraft in `flight-request-zone-select`,
   `flight-request-pilot-select` and `flight-request-aircraft-select`.
3. Enter the window in `flight-request-window-start-input` and
   `flight-request-window-end-input`, an altitude within the zone's ceiling
   in `flight-request-altitude-input`, and any purpose in
   `flight-request-purpose-textarea`.
4. Click `flight-request-create-submit-button` (the request is created as
   `DRAFT`).
5. Click `flight-request-validate-button`.

**Expected result:**
- `flight-request-gate-result-AIRCRAFT` has `data-gate-status="PASS"`.

**Rationale:** Weight bands are upper-bound inclusive (§3), and `LVV-RST-2` permits C0–C1, so C1 is the highest permitted band and C2 the first forbidden one. Per §3 an aircraft exactly at the upper bound still belongs to C1 ("exactly ... is C1"), so it must pass; this catches an off-by-one using `<` instead of `≤`.

### E2E-OP-009.6: AIRCRAFT passes when the aircraft weighs the C1 upper bound − 1 g

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2`
(§1.2 `AIRCRAFT` table; §3 weight bands; §4 zone catalogue; §6 `rule_reference` table)

**Technique:** BV — C1 upper bound − 1 g

**Role(s):** Operator

**Preconditions:**
- Logged-in operator whose `authorisation_level` is L3 or higher (meets the zone's required level).
- Zone `LVV-RST-2` (RESTRICTED; permitted bands C0–C1).
- A pilot with rating `R_BVLOS`, so the rating covers the zone's class, and whose certification is current at `window_start` (`PILOT` passes).
- An aircraft whose `mtom_grams` is the C1 upper bound − 1 g, so its derived weight band is C1, which is in the zone's `permitted_bands`. This is the only condition under test for `AIRCRAFT`.
- Requested altitude is at or below the zone's ceiling.
- `window_start` is validation time + 24 h or later (and before validation time + 60 days); the window lasts 60 min and lies entirely between curfew end (06:00) and curfew start (22:00) zone-local (Europe/Kyiv), so lead time, advance booking, duration and curfew all pass.
- No other `APPROVED`/`UNDER_REVIEW` request for that aircraft shares an instant with the window.
- The window date is not the day of, or next to, a DST change.
- Browser timezone is Europe/Kyiv, so the `datetime-local` inputs take zone-local times.

**Steps:**
1. Open `/operator/requests/new`.
2. Choose zone `LVV-RST-2`, the pilot and the aircraft in `flight-request-zone-select`,
   `flight-request-pilot-select` and `flight-request-aircraft-select`.
3. Enter the window in `flight-request-window-start-input` and
   `flight-request-window-end-input`, an altitude within the zone's ceiling
   in `flight-request-altitude-input`, and any purpose in
   `flight-request-purpose-textarea`.
4. Click `flight-request-create-submit-button` (the request is created as
   `DRAFT`).
5. Click `flight-request-validate-button`.

**Expected result:**
- `flight-request-gate-result-AIRCRAFT` has `data-gate-status="PASS"`.

**Rationale:** Weight bands are upper-bound inclusive (§3), and `LVV-RST-2` permits C0–C1, so C1 is the highest permitted band and C2 the first forbidden one. One gram inside the limit stays in C1 and passes; together with the at-limit case it pins the boundary from the passing side.

### E2E-OP-009.7: AIRCRAFT fails when the aircraft weighs the C2 upper bound + 1 g

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2`
(§1.2 `AIRCRAFT` table; §3 weight bands; §4 zone catalogue; §6 `rule_reference` table)

**Technique:** BV — C2 upper bound + 1 g

**Role(s):** Operator

**Preconditions:**
- Logged-in operator whose `authorisation_level` is L2 or higher (meets the zone's required level).
- Zone `KBP-CTR-3` (CONTROLLED; permitted bands C0–C2).
- A pilot with rating `R_ADVANCED` or `R_BVLOS`, so the rating covers the zone's class, and whose certification is current at `window_start` (`PILOT` passes).
- An aircraft whose `mtom_grams` is the C2 upper bound + 1 g (the lightest weight in C3), so its derived weight band is C3, which is not in the zone's `permitted_bands`. This is the only condition under test for `AIRCRAFT`.
- Requested altitude is at or below the zone's ceiling.
- `window_start` is validation time + 24 h or later (and before validation time + 60 days); the window lasts 60 min and lies entirely between curfew end (05:00) and curfew start (23:00) zone-local (Europe/Kyiv), so lead time, advance booking, duration and curfew all pass.
- No other `APPROVED`/`UNDER_REVIEW` request for that aircraft shares an instant with the window.
- The window date is not the day of, or next to, a DST change.
- Browser timezone is Europe/Kyiv, so the `datetime-local` inputs take zone-local times.

**Steps:**
1. Open `/operator/requests/new`.
2. Choose zone `KBP-CTR-3`, the pilot and the aircraft in `flight-request-zone-select`,
   `flight-request-pilot-select` and `flight-request-aircraft-select`.
3. Enter the window in `flight-request-window-start-input` and
   `flight-request-window-end-input`, an altitude within the zone's ceiling
   in `flight-request-altitude-input`, and any purpose in
   `flight-request-purpose-textarea`.
4. Click `flight-request-create-submit-button` (the request is created as
   `DRAFT`).
5. Click `flight-request-validate-button`.

**Expected result:**
- `flight-request-gate-result-PILOT` has `data-gate-status="PASS"`.
- `flight-request-gate-result-AIRCRAFT` has `data-gate-status="FAIL"` and shows `rule_reference` `ZC-2026.1 §2`.

**Rationale:** Weight bands are upper-bound inclusive (§3), and `KBP-CTR-3` permits C0–C2, so C2 is the highest permitted band and C3 the first forbidden one. One gram past the limit must move the aircraft into C3 and fail `AIRCRAFT`. Earlier gate (`PILOT`) is pinned to pass, and the sibling `ZONE`/`TIME_WINDOW` inputs are pinned to pass so nothing else can produce the failure.

### E2E-OP-009.8: AIRCRAFT passes when the aircraft weighs exactly the C2 upper bound

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2`
(§1.2 `AIRCRAFT` table; §3 weight bands; §4 zone catalogue; §6 `rule_reference` table)

**Technique:** BV — C2 upper bound (at the limit)

**Role(s):** Operator

**Preconditions:**
- Logged-in operator whose `authorisation_level` is L2 or higher (meets the zone's required level).
- Zone `KBP-CTR-3` (CONTROLLED; permitted bands C0–C2).
- A pilot with rating `R_ADVANCED` or `R_BVLOS`, so the rating covers the zone's class, and whose certification is current at `window_start` (`PILOT` passes).
- An aircraft whose `mtom_grams` is exactly the C2 upper bound, so its derived weight band is C2, which is in the zone's `permitted_bands`. This is the only condition under test for `AIRCRAFT`.
- Requested altitude is at or below the zone's ceiling.
- `window_start` is validation time + 24 h or later (and before validation time + 60 days); the window lasts 60 min and lies entirely between curfew end (05:00) and curfew start (23:00) zone-local (Europe/Kyiv), so lead time, advance booking, duration and curfew all pass.
- No other `APPROVED`/`UNDER_REVIEW` request for that aircraft shares an instant with the window.
- The window date is not the day of, or next to, a DST change.
- Browser timezone is Europe/Kyiv, so the `datetime-local` inputs take zone-local times.

**Steps:**
1. Open `/operator/requests/new`.
2. Choose zone `KBP-CTR-3`, the pilot and the aircraft in `flight-request-zone-select`,
   `flight-request-pilot-select` and `flight-request-aircraft-select`.
3. Enter the window in `flight-request-window-start-input` and
   `flight-request-window-end-input`, an altitude within the zone's ceiling
   in `flight-request-altitude-input`, and any purpose in
   `flight-request-purpose-textarea`.
4. Click `flight-request-create-submit-button` (the request is created as
   `DRAFT`).
5. Click `flight-request-validate-button`.

**Expected result:**
- `flight-request-gate-result-AIRCRAFT` has `data-gate-status="PASS"`.

**Rationale:** Weight bands are upper-bound inclusive (§3), and `KBP-CTR-3` permits C0–C2, so C2 is the highest permitted band and C3 the first forbidden one. Per §3 an aircraft exactly at the upper bound still belongs to C2 ("exactly ... is C2"), so it must pass; this catches an off-by-one using `<` instead of `≤`.

### E2E-OP-009.9: AIRCRAFT passes when the aircraft weighs the C2 upper bound − 1 g

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2`
(§1.2 `AIRCRAFT` table; §3 weight bands; §4 zone catalogue; §6 `rule_reference` table)

**Technique:** BV — C2 upper bound − 1 g

**Role(s):** Operator

**Preconditions:**
- Logged-in operator whose `authorisation_level` is L2 or higher (meets the zone's required level).
- Zone `KBP-CTR-3` (CONTROLLED; permitted bands C0–C2).
- A pilot with rating `R_ADVANCED` or `R_BVLOS`, so the rating covers the zone's class, and whose certification is current at `window_start` (`PILOT` passes).
- An aircraft whose `mtom_grams` is the C2 upper bound − 1 g, so its derived weight band is C2, which is in the zone's `permitted_bands`. This is the only condition under test for `AIRCRAFT`.
- Requested altitude is at or below the zone's ceiling.
- `window_start` is validation time + 24 h or later (and before validation time + 60 days); the window lasts 60 min and lies entirely between curfew end (05:00) and curfew start (23:00) zone-local (Europe/Kyiv), so lead time, advance booking, duration and curfew all pass.
- No other `APPROVED`/`UNDER_REVIEW` request for that aircraft shares an instant with the window.
- The window date is not the day of, or next to, a DST change.
- Browser timezone is Europe/Kyiv, so the `datetime-local` inputs take zone-local times.

**Steps:**
1. Open `/operator/requests/new`.
2. Choose zone `KBP-CTR-3`, the pilot and the aircraft in `flight-request-zone-select`,
   `flight-request-pilot-select` and `flight-request-aircraft-select`.
3. Enter the window in `flight-request-window-start-input` and
   `flight-request-window-end-input`, an altitude within the zone's ceiling
   in `flight-request-altitude-input`, and any purpose in
   `flight-request-purpose-textarea`.
4. Click `flight-request-create-submit-button` (the request is created as
   `DRAFT`).
5. Click `flight-request-validate-button`.

**Expected result:**
- `flight-request-gate-result-AIRCRAFT` has `data-gate-status="PASS"`.

**Rationale:** Weight bands are upper-bound inclusive (§3), and `KBP-CTR-3` permits C0–C2, so C2 is the highest permitted band and C3 the first forbidden one. One gram inside the limit stays in C2 and passes; together with the at-limit case it pins the boundary from the passing side.

### E2E-OP-009.10: AIRCRAFT passes for a C3 aircraft in a zone that permits C3

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2`
(§1.2 `AIRCRAFT` table; §3 weight bands; §4 zone catalogue; §6 `rule_reference` table)

**Technique:** EP — band C3 is in the zone's `permitted_bands` (zone permitting every band)

**Role(s):** Operator

**Preconditions:**
- Logged-in operator whose `authorisation_level` is L1 or higher (meets the zone's required level).
- Zone `DNI-OPN-1` (OPEN; permitted bands C0–C3).
- A pilot with any rating, so the rating covers the zone's class, and whose certification is current at `window_start` (`PILOT` passes).
- An aircraft whose `mtom_grams` lies strictly inside C3 (above the C2 upper bound and below the C3 upper bound), so its derived band is C3, which is in the zone's `permitted_bands`.
- Requested altitude is at or below the zone's ceiling.
- `window_start` is validation time + 24 h or later (and before validation time + 60 days) and the window lasts 60 min, so lead time, advance booking and duration pass (the zone has no curfew).
- No other `APPROVED`/`UNDER_REVIEW` request for that aircraft shares an instant with the window.
- The window date is not the day of, or next to, a DST change.

**Steps:**
1. Open `/operator/requests/new`.
2. Choose zone `DNI-OPN-1`, the pilot and the aircraft in `flight-request-zone-select`,
   `flight-request-pilot-select` and `flight-request-aircraft-select`.
3. Enter the window in `flight-request-window-start-input` and
   `flight-request-window-end-input`, an altitude within the zone's ceiling
   in `flight-request-altitude-input`, and any purpose in
   `flight-request-purpose-textarea`.
4. Click `flight-request-create-submit-button` (the request is created as
   `DRAFT`).
5. Click `flight-request-validate-button`.

**Expected result:**
- `flight-request-gate-result-AIRCRAFT` has `data-gate-status="PASS"`.

**Rationale:** The three BV boundaries only exercise C0–C2 as permitted bands and C1–C3 as forbidden ones. C3 as a *permitted* band appears only in zones that allow every band, so this partition needs its own representative. A mid-band weight is used so no boundary is re-tested.

### E2E-OP-009.11: Validate of a request failing AIRCRAFT leaves it DRAFT

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2`
(§1.2 `AIRCRAFT` table; §3 weight bands; §4 zone catalogue; §6 `rule_reference` table)

**Technique:** ST — `validate` on a failing request: `DRAFT` → `DRAFT`

**Role(s):** Operator

**Preconditions:**
- Logged-in operator whose `authorisation_level` is L3 or higher (meets the zone's required level).
- Zone `ZTM-RST-7` (RESTRICTED; permitted bands C0 only).
- A pilot with rating `R_BVLOS`, so the rating covers the zone's class, and whose certification is current at `window_start` (`PILOT` passes).
- An aircraft whose `mtom_grams` lies strictly inside C2 (above the C1 upper bound and below the C2 upper bound), so its derived band is C2, which is not in the zone's `permitted_bands`. This is the only violated condition.
- Requested altitude is at or below the zone's ceiling.
- `window_start` is validation time + 24 h or later (and before validation time + 60 days); the window lasts 60 min and lies entirely between curfew end (06:00) and curfew start (22:00) zone-local (Europe/Kyiv), so lead time, advance booking, duration and curfew all pass.
- No other `APPROVED`/`UNDER_REVIEW` request for that aircraft shares an instant with the window.
- The window date is not the day of, or next to, a DST change.
- Browser timezone is Europe/Kyiv, so the `datetime-local` inputs take zone-local times.

**Steps:**
1. Open `/operator/requests/new`.
2. Choose zone `ZTM-RST-7`, the pilot and the aircraft in `flight-request-zone-select`,
   `flight-request-pilot-select` and `flight-request-aircraft-select`.
3. Enter the window in `flight-request-window-start-input` and
   `flight-request-window-end-input`, an altitude within the zone's ceiling
   in `flight-request-altitude-input`, and any purpose in
   `flight-request-purpose-textarea`.
4. Click `flight-request-create-submit-button` (the request is created as
   `DRAFT`).
5. Click `flight-request-validate-button`.

**Expected result:**
- `flight-request-gate-result-AIRCRAFT` has `data-gate-status="FAIL"` and shows `rule_reference` `ZC-2026.1 §2`.
- `flight-request-detail-state` still shows `DRAFT`; `flight-request-submit-button` is still available.

**Rationale:** Per the lifecycle, `validate` runs the gate pipeline but never changes state. A mid-band weight is used so the case differs from the BV cases in value and only the unchanged state is the new assertion.

### E2E-OP-009.12: Submit of a request failing AIRCRAFT ends REJECTED with ZC-2026.1 §2

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2`
(§1.2 `AIRCRAFT` table; §3 weight bands; §4 zone catalogue; §6 `rule_reference` table)

**Technique:** ST — `submit` of a failing request: `DRAFT` → `REJECTED`

**Role(s):** Operator

**Preconditions:**
- Logged-in operator whose `authorisation_level` is L3 or higher (meets the zone's required level).
- Zone `LVV-RST-2` (RESTRICTED; permitted bands C0–C1).
- A pilot with rating `R_BVLOS`, so the rating covers the zone's class, and whose certification is current at `window_start` (`PILOT` passes).
- An aircraft whose `mtom_grams` lies strictly inside C3 (above the C2 upper bound and below the C3 upper bound), so its derived band is C3, which is not in the zone's `permitted_bands`. This is the only violated condition.
- Requested altitude is at or below the zone's ceiling.
- `window_start` is validation time + 24 h or later (and before validation time + 60 days); the window lasts 60 min and lies entirely between curfew end (06:00) and curfew start (22:00) zone-local (Europe/Kyiv), so lead time, advance booking, duration and curfew all pass.
- No other `APPROVED`/`UNDER_REVIEW` request for that aircraft shares an instant with the window.
- The window date is not the day of, or next to, a DST change.
- Browser timezone is Europe/Kyiv, so the `datetime-local` inputs take zone-local times.

**Steps:**
1. Open `/operator/requests/new`.
2. Choose zone `LVV-RST-2`, the pilot and the aircraft in `flight-request-zone-select`,
   `flight-request-pilot-select` and `flight-request-aircraft-select`.
3. Enter the window in `flight-request-window-start-input` and
   `flight-request-window-end-input`, an altitude within the zone's ceiling
   in `flight-request-altitude-input`, and any purpose in
   `flight-request-purpose-textarea`.
4. Click `flight-request-create-submit-button` (the request is created as
   `DRAFT`).
5. Click `flight-request-submit-button`.

**Expected result:**
- `flight-request-detail-state` shows `REJECTED` and `rejection-callout` is visible.
- `flight-request-detail-rule-reference` shows `ZC-2026.1 §2`.

**Rationale:** Submitting a request that fails a gate moves it `DRAFT` → `REJECTED` with the failing gate's citation recorded. Because `AIRCRAFT` is the first (and only) failing gate, the citation must be the weight-band one.

### E2E-OP-009.13: Submit of a request passing AIRCRAFT ends UNDER_REVIEW

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `ZC-2026.1 §2`
(§1.2 `AIRCRAFT` table; §3 weight bands; §4 zone catalogue; §6 `rule_reference` table)

**Technique:** ST — `submit` of a passing request: `DRAFT` → `UNDER_REVIEW`

**Role(s):** Operator

**Preconditions:**
- Logged-in operator whose `authorisation_level` is L2 or higher (meets the zone's required level).
- Zone `KBP-CTR-3` (CONTROLLED; permitted bands C0–C2).
- A pilot with rating `R_ADVANCED` or `R_BVLOS`, so the rating covers the zone's class, and whose certification is current at `window_start` (`PILOT` passes).
- An aircraft whose `mtom_grams` lies strictly inside C1 (above the C0 upper bound and below the C1 upper bound), so its derived band is C1, which is in the zone's `permitted_bands`.
- Requested altitude is at or below the zone's ceiling.
- `window_start` is validation time + 24 h or later (and before validation time + 60 days); the window lasts 60 min and lies entirely between curfew end (05:00) and curfew start (23:00) zone-local (Europe/Kyiv), so lead time, advance booking, duration and curfew all pass.
- No other `APPROVED`/`UNDER_REVIEW` request for that aircraft shares an instant with the window.
- The window date is not the day of, or next to, a DST change.
- Browser timezone is Europe/Kyiv, so the `datetime-local` inputs take zone-local times.

**Steps:**
1. Open `/operator/requests/new`.
2. Choose zone `KBP-CTR-3`, the pilot and the aircraft in `flight-request-zone-select`,
   `flight-request-pilot-select` and `flight-request-aircraft-select`.
3. Enter the window in `flight-request-window-start-input` and
   `flight-request-window-end-input`, an altitude within the zone's ceiling
   in `flight-request-altitude-input`, and any purpose in
   `flight-request-purpose-textarea`.
4. Click `flight-request-create-submit-button` (the request is created as
   `DRAFT`).
5. Click `flight-request-submit-button`.

**Expected result:**
- `flight-request-detail-state` shows `UNDER_REVIEW`.
- No `rejection-callout` is shown.

**Rationale:** With every gate pinned to pass, including the weight-band check, `submit` must move the request `DRAFT` → `UNDER_REVIEW`; a wrongly failing `AIRCRAFT` gate would show up here as `REJECTED`.
