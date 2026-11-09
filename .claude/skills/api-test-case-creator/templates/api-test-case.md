# API test case template

The same fields, in the same order, as the UI kit's
`ui-test-case-creator/templates/test-case.md`. Only **Steps** and
**Expected result** differ: HTTP requests and responses instead of
`data-testid` actions and rendered UI.

## Fields

- **ID**: `API-OP-<seq>.<n>`. Cases generated together for one rule share
  the base ID. Sequential, never reused.
- **Title**: one line stating the scenario, not the mechanics.
- **Doc ref**: links to Confluence pages in space `SD` by page ID, each
  with the most stable anchor (a `rule_reference`, then a § number):
  `[06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — \`TSD-4 §2.1\``
  plus `[03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147)`
  for the endpoint and code. ST cases also cite
  `[02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079)`.
  Never a file path.
- **Technique**: `BV`, `EP` or `ST`, plus the one value, partition or
  transition the case exercises.
- **Role(s)**: Operator, Reviewer, or Operator → Reviewer.
- **Preconditions**: entities by property, each with the API call that
  creates it, plus the session/header the steps use.
- **Steps**: numbered HTTP requests. Each has method + path, `Auth:`
  (`operator session` | `X-Reviewer-Id` | `none`, never two), `Body:`
  when there is one, `Save:` for ids later steps use.
- **Expected result**: status code per step that asserts something, and
  for `422` the body (`failing_gate`, `rule_reference`, non-empty
  `message`). For ST, the state the follow-up `GET` returns.
- **Rationale**: why this case exists, tied to the rule or transition (and
  the Jira story, if given).

## Template

```markdown
### API-OP-<seq>.<n>: <Title>

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `<rule_reference>` (§1.<n> `<GATE>`; §6) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `<endpoint>`

**Technique:** <BV | EP | ST> — <value / partition / transition>

**Role(s):** <Operator | Reviewer | Operator → Reviewer>

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below.
- <entity by property> (`POST /api/v1/<resource>`).
- <the single violated condition against the threshold; every other condition of the gate within limits>

**Steps:**
1. `<METHOD> /api/v1/<path>`. Auth: <operator session | X-Reviewer-Id | none>.
   Body: <field> = <property / relative value>, …
   Save `id` as {{<name>}}.
2. `<METHOD> /api/v1/<path with {{<name>}}>`. Auth: <…>.

**Expected result:**
- Step <n>: `<code>`<, body `failing_gate` = `<GATE>`, `rule_reference` = `<ref>`, `message` non-empty>.
- <ST only: step <m> `GET` → `200`, `state` = `<STATE>`, <fields filled>.>

**Rationale:** <why this case, tied to the doc-backed rule or transition>
```

## Filled shape: an ST chain

*(Placeholders in angle brackets. The structure is the point, not the values.)*

```markdown
### API-OP-<seq>.<n>: Submit of a request failing <condition> moves it DRAFT → REJECTED

**Doc ref:** [06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146) — `<ref>` · [02 — Request Lifecycle](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/557079) (DRAFT → REJECTED) · [03 — API Contract](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/66147) — `POST /flight-requests/{id}/submit`

**Technique:** ST — DRAFT → REJECTED on gate failure

**Role(s):** Operator

**Preconditions:**
- Operator registered and signed in (`POST /api/v1/operators`); the session cookie is used below.
- A pilot that passes `PILOT` for the zone (`POST /api/v1/pilots`), saved as {{pilot_id}}.
- An aircraft that passes `AIRCRAFT` for the zone (`POST /api/v1/aircraft`), saved as {{aircraft_id}}.
- <zone by property>; every other `<GATE>` condition within limits.

**Steps:**
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = <zone>, `window_start` = <relative, breaks the condition>, `window_end` = `window_start` + 60 min, `requested_altitude_metres` = <within ceiling>.
   Save `id` as {{fr_id}}.
2. `POST /api/v1/flight-requests/{{fr_id}}/submit`. Auth: operator session.
3. `GET /api/v1/flight-requests/{{fr_id}}`. Auth: operator session.

**Expected result:**
- Step 1: `201`, `state` = `DRAFT`.
- Step 2: `422`, `failing_gate` = `<GATE>`, `rule_reference` = `<ref>`, `message` non-empty.
- Step 3: `200`, `state` = `REJECTED`, `failing_gate` = `<GATE>`, `rule_reference` = `<ref>`, `rejection_reason` non-empty.

**Rationale:** <A gate failure on submit is the one path from DRAFT straight to REJECTED; the 422 alone doesn't prove the row moved.>
```
