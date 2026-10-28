---
name: ui-test-case-creator
description: Writes the UI/E2E test cases for ONE SkyPermit business rule (rule_reference + gate) into test-cases/ — cases driven through the operator/reviewer portal forms and bound to data-testid, never calling /api/v1 directly. Derives the full set with test design techniques — boundary values (BV), equivalence partitions (EP) and state transitions (ST) — each case atomic, in the kit's template format. Use when a specific uncovered rule needs UI cases — called per rule by /cover-gaps, or directly with a rule block from scripts/uncovered-rules.mjs. Not for API-level cases against /api/v1 (a separate API generator skill covers those), reviewing existing cases, or open-ended test design without a rule block.
argument-hint: "<rule block: rule_reference, gate, condition, case_id, file, rule>"
model: sonnet
context: fork
agent: general-purpose
allowed-tools:
  - Read
  - Grep
  - Glob
  - Write(test-cases/**)
  - mcp__atlassian__getConfluencePage
  - mcp__atlassian__searchConfluenceUsingCql
---

# Write the UI test cases for one rule

You get one rule block (the output of `scripts/uncovered-rules.mjs` for a
single rule) and write every case the techniques below yield for it, all in
the one `file` from the block, with IDs `<case_id>.1`, `<case_id>.2`, … The
base ID and path were pre-assigned so parallel runs never collide — use them
as given.

Rule block:

$ARGUMENTS

If the block has no `rule_reference`, `gate`, `case_id` or `file`, write
nothing and return `{"status": "blocked", "reason": "incomplete rule block"}`.

## What "atomic" means here

Each case changes one input from a baseline where everything passes, and
asserts one outcome.

- Break **only** the condition named in the block. Everything else — the
  gates that run earlier (`PILOT → AIRCRAFT → ZONE → TIME_WINDOW`, first
  failure wins) and the *other* conditions of the same gate — must be set
  up to pass, and the Preconditions must say so. Otherwise a different
  check fires first and the case asserts the wrong thing.
- State every value relative to the threshold ("limit + 1 min"), never as
  an absolute.
- A failing case asserts which gate fails and which `rule_reference` is
  shown (or, for REGISTRATION, that registration is refused). A passing
  case asserts that gate shows `PASS`. An ST case asserts the state shown.
  Nothing else — no list contents, no other gates' messages.

## Test design — derive the set

"All cases" means every case these three techniques yield for **this**
rule — not combinations with other gates' conditions (those stay pinned to
pass), and no two cases exercising the same value or partition. Order the
file BV → EP → ST.

- **BV (boundary values)** — for every numeric threshold in the rule: just
  past the limit on the failing side, the limit itself, just inside on the
  passing side, one unit apart (minute, gram, metre, day — the rule's unit).
  Whether the limit itself passes comes from the rule text ("inclusive at
  both ends", "≥", "strictly after"). If the rule doesn't say, don't write
  the at-limit case — list it under `skipped`.
- **EP (equivalence partitions)** — for every categorical input the rule
  depends on (rating × zone class, weight band vs `permitted_bands`,
  authorisation level, zone with / without curfew, an A-7 zone vs another):
  one representative per valid and per invalid partition. Skip a partition
  a BV case already exercises.
- **ST (state transitions)** — only where the rule's outcome shows up as a
  request state in the UI: `validate` leaves it `DRAFT`; `submit` of a
  failing request ends `REJECTED` with the gate and `rule_reference` in the
  detail view; `submit` of a passing one ends `UNDER_REVIEW`. One case per
  transition. `409` cases only if the rule itself is about a transition.

A technique that doesn't fit the rule (no threshold → no BV) is skipped
with a one-line reason under `skipped`.

## Inputs you may read

- `templates/test-case.md` in this skill's directory — the field list and
  order. Follow it exactly.
- `examples/gate-failure.md` and `examples/registration-refusal.md` in this
  skill's directory — the *shape* of a good case. They are templates with
  placeholders, not data to copy.
- Confluence page `262146` ("06 — Business Rules", space `SD`) via
  `mcp__atlassian__getConfluencePage` (cloudId
  `bea84479-f55e-4409-bbc6-af79e0add67a`, `contentFormat: "markdown"`) —
  only if the rule block's `rule` line is missing or you need a threshold it
  doesn't state. Use the `rule_reference`'s §6 row and the gate's §1 table,
  nothing else. Never read `../skypermit/docs` instead.
- `../skypermit/app/**` and `../skypermit/components/**` — to learn the UI
  flow and to confirm selectors. Derive the **expected result from the
  Confluence docs, never from the code**: if code and docs disagree, the case follows the docs
  (that disagreement is what the case is for).

## Selectors

Bind only to `data-testid`. Grep every one you use in `../skypermit/app`
and `../skypermit/components` (e.g. search for `flight-request-validate-button`).
Many are passed as a `testId="..."` prop rather than written as
`data-testid="..."` — grep the bare value. Gate results render as
`flight-request-gate-result-<GATE>` with a `data-gate-status` attribute
(`PASS` / `FAIL` / `NOT_EVALUATED`) — see `components/GateResultsPanel.tsx`.
If a selector you need doesn't exist, don't invent one; return
`blocked` with the reason.

## Test data — describe it, don't invent it

Describe each entity by the property that matters ("a pilot whose rating
covers the zone class and whose certification is current at
`window_start`"), never by concrete values: no emails, names, national IDs,
serial numbers, UUIDs, or calendar dates. This keeps cases from silently
sharing fixtures and makes the one relevant property obvious.

Name a specific zone only when the rule depends on that zone's catalogue
values (its curfew, ceiling, class or permitted bands); otherwise describe
it by property ("a zone with no curfew").

Times: relative to the moment of validation ("`window_start` = validation
time + 5 h 59 min") or in zone-local time (Europe/Kyiv) for curfew rules.
Add a precondition that the chosen date is not the day of, or adjacent to,
a DST change (last Sunday of March / October) — the curfew and lead-time
maths cross a UTC offset change there, and that deserves its own case, not
an accidental one.

## Writing the file

Write all cases to the `file` path from the block: a one-line
`# <condition>` heading, then each case (`### <case_id>.<n>: <Title>` and
the template fields, including **Technique**). Doc ref links the Confluence page by ID (see the
template's link convention). If the block says `citation not yet confirmed`, still assert that citation and say
so in the Rationale.

Write nothing else — no other files, no edits to existing cases.

## Return

Reply with a single line of JSON and nothing else:

```json
{"status": "written", "case_id": "<case_id>", "file": "<file>", "rule_reference": "<rule_reference>", "gate": "<gate>", "cases": [{"id": "<case_id>.1", "technique": "BV", "outcome": "FAIL"}], "skipped": ["<what> — <why>"]}
```

or `{"status": "blocked", "case_id": "<case_id>", "reason": "<one sentence>"}`.
