---
name: api-test-case-creator
description: Writes the API test cases for ONE SkyPermit business rule (rule_reference + gate) into test-cases/api/. The cases are HTTP requests to /api/v1, each step naming the method, path, body and auth (operator session or X-Reviewer-Id, never both). Expected result is the status code and, for 422, the body (failing_gate, rule_reference, message). Endpoints and codes come from Confluence 03 — API Contract and rules from 06 — Business Rules. No data-testid. The set is derived with boundary values (BV) and equivalence partitions (EP) as single validate probes, plus state transitions (ST) as end-to-end request chains through the lifecycle, shaped so postman-collection-builder can turn them into a collection. IDs API-OP-NNN.N, template format shared with the UI kit. Use when a rule or an api-labelled story needs API cases ("напиши API-кейси на TSD-4 §2.1"). For UI/E2E cases through the portal and data-testid, use ui-test-case-creator instead. Not for building or running Postman collections, reviewing existing cases, or test design without a rule.
argument-hint: '{"gate": "TIME_WINDOW", "rule_reference": "TSD-4 §2.1", "condition": "Lead time too short", "story": "SKY-2", "case_id": "API-OP-001", "file": "test-cases/api/..."}'
model: sonnet
context: fork
agent: general-purpose
allowed-tools:
  - Read(test-cases/**)
  - Read(.claude/skills/api-test-case-creator/**)
  - Grep(test-cases/**)
  - Glob(test-cases/**)
  - Write(test-cases/api/**)
  - mcp__atlassian__getConfluencePage
  - mcp__atlassian__searchConfluenceUsingCql
---

# Write the API test cases for one rule

Input:

$ARGUMENTS

A JSON object or a rule block from `scripts/uncovered-rules.mjs`.
Required: `gate`, `rule_reference`. Optional: `condition`, `rule` (rule
text), `story` (Jira key, goes into Rationale), `case_id`, `file`.

If `gate` or `rule_reference` is missing, write nothing and return
`{"status": "blocked", "reason": "incomplete input"}`.

## IDs and file

- A `case_id` that matches `API-OP-\d{3}` is used as given. The caller
  pre-assigned it so parallel runs don't collide. Ignore an `E2E-…`
  `case_id` or `file` from a script block. Those belong to the UI kit.
- Otherwise allocate one: the highest `API-OP-NNN` found anywhere under
  `test-cases/` (grep `\bAPI-OP-\d{3}\b`) plus 1, starting at `API-OP-001`.
  IDs are never reused, even when a case is deleted.
- `file` = given, or `test-cases/api/<case_id>-<slug of condition>.md`
  (lowercase, `[a-z0-9-]`, ≤ 48 chars). It must be under `test-cases/api/`.
  If it already exists, write nothing and return `blocked`. Never edit or
  overwrite an existing case.
- Cases in the file: `<case_id>.1`, `<case_id>.2`, … in order BV → EP → ST.

## Sources — Confluence only

Space `SD`, cloudId `bea84479-f55e-4409-bbc6-af79e0add67a`,
`getConfluencePage` with `contentFormat: "markdown"`, by page ID:

| Page | ID | Take from it |
|---|---|---|
| 03 — API Contract | `66147` | endpoints, methods, request fields, auth per endpoint, status codes, the `422` body shape |
| 06 — Business Rules | `262146` | the rule: §1 gate table for the condition, §6 for the `rule_reference` |
| 07 — Clarifications | `66208` | corrections to 06. Where they conflict, 07 governs |
| 02 — Request Lifecycle | `557079` | legal transitions, for ST cases (illegal → `409`) |

If an ID stops resolving, find the page with `searchConfluenceUsingCql`
(`space = SD AND title ~ "03"`). Never read `../skypermit/docs`,
`openapi.yaml` or app code. The expected result follows the docs. A case
exists to catch the code disagreeing with them.

An endpoint, field or status code that 03 doesn't document isn't used. If
the rule can't be exercised without one, return `blocked` with the reason.

## What "atomic" means here

Each case breaks one input from a baseline where everything passes and
asserts one outcome.

- Break **only** the condition named in the input. Pin the earlier gates
  (`PILOT → AIRCRAFT → ZONE → TIME_WINDOW`, first failure wins) and the
  other conditions of the same gate to pass, and say so in the
  Preconditions.
- A self-registered operator is always `L1` (03: `authorisation_level` is
  not a registration field). A baseline that needs `L2`/`L3` can't be built
  through the API. Say so in the Preconditions as data that has to exist
  already, or skip the case with the reason.
- State every value relative to the threshold ("validation time + 5 h
  59 min"), never as an absolute.

## Test design — derive the set

Every case these techniques yield for **this** rule. No combinations with
other gates' conditions, no two cases on the same value or partition.

- **BV (boundary values)**, for every numeric threshold: just past the
  limit on the failing side, the limit itself, just inside on the passing
  side, one unit apart in the rule's unit. Whether the limit passes comes
  from the rule text ("≥", "inclusive", "strictly after"). If the text
  doesn't say, list the at-limit case under `skipped`. Each BV case is a
  single probe: create the request, then `POST …/validate`.
- **EP (equivalence partitions)**, for every categorical input the rule
  depends on: one representative per valid and per invalid partition, as
  a validate probe. Skip a partition a BV case already covers.
- **ST (state transitions): the end-to-end chains.** These become a
  Postman collection run in order, so each ST case is one complete request
  chain from a fresh `DRAFT` that ends by asserting one transition from 02:
  - `validate` on a failing request → `422`, then `GET` → still `DRAFT`;
  - `submit` on a failing request → `422`, then `GET` → `REJECTED` with
    `failing_gate`, `rule_reference` and `rejection_reason` filled;
  - `submit` again on that `REJECTED` request → `409`;
  - `submit` on a request just inside the limit → `200`, state
    `UNDER_REVIEW`.

  One transition per case. Repeat the chain's setup steps inside the case
  instead of pointing at another case, so it runs on its own.

A technique that doesn't fit the rule (no threshold → no BV) goes under
`skipped` with a one-line reason.

## Steps — HTTP requests, nothing else

Follow `templates/api-test-case.md` in this skill's directory exactly. Each
step is one request to `/api/v1`:

```
1. `POST /api/v1/flight-requests`. Auth: operator session.
   Body: `pilot_id` = {{pilot_id}}, `aircraft_id` = {{aircraft_id}}, `zone_code` = <zone>,
   `window_start` = <relative value>, `window_end` = `window_start` + 60 min, `requested_altitude_metres` = <within ceiling>.
   Save `id` as {{fr_id}}.
```

- **Auth** is exactly one of: `operator session`, `X-Reviewer-Id`, `none`.
  Never both on one request. Operator requests never send
  `X-Reviewer-Id`. Reviewer requests never rely on a session.
  `operator_id` is never sent (03: server-derived).
- **Body** lists the fields 03 requires, each by property or relative
  value. **Save** names any id a later step uses, as `{{name}}`.
- No UI, no `data-testid`, no browser actions.

## Preconditions and test data

Describe each entity by the property that matters, and name the API call
that creates it so postman-collection-builder can put it in its Setup
folder: "A pilot whose rating covers the zone's class and whose
certification is current at `window_start` (`POST /api/v1/pilots`)". Also
state the operator session ("Operator registered and signed in via
`POST /api/v1/operators`; the session cookie is used below").

No emails, names, national IDs, serial numbers, UUIDs or calendar dates.
Name a zone only when the rule depends on its catalogue values. Otherwise
describe it ("a zone with no curfew whose required level is L1"). For
time-based rules add: the window is not on, or next to, a DST change.

## Expected result

- The status code, from 03.
- For `422`, the body: `failing_gate` = `<GATE>`, `rule_reference` =
  `<rule_reference>` (from 06 §6, corrected by 07), `message` a non-empty
  string. Never its exact text.
- For an ST case, the state (and filled fields) the follow-up `GET`
  returns.
- Nothing else: no other gates, no list contents, no headers.

## Writing the file

A one-line `# <condition>` heading, then each case as in the template
(`### <case_id>.<n>: <Title>` plus every field, including **Technique**).
Doc ref links the Confluence pages by ID. If 07 or 06 says the citation is
not yet confirmed, still assert it and say so in the Rationale. If `story`
was given, name it in each Rationale.

Write nothing else. No other files, no edits to existing cases.

## Return

A single line of JSON and nothing else:

```json
{"status": "written", "case_id": "API-OP-001", "file": "test-cases/api/...", "rule_reference": "<ref>", "gate": "<GATE>", "cases": [{"id": "API-OP-001.1", "technique": "BV", "outcome": "422"}, {"id": "API-OP-001.4", "technique": "ST", "outcome": "DRAFT → REJECTED"}], "skipped": ["<what> — <why>"]}
```

or `{"status": "blocked", "case_id": "<id or null>", "reason": "<one sentence>"}`.
