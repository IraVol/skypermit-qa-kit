# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repositor
## What this is

`skypermit-qa-kit` is the QA/testing companion for **SkyPermit**, the app in
the sibling directory `../skypermit`. This repo is currently empty — no test
framework, dependencies, or structure have been chosen yet. Do not assume
Playwright, Vitest, or any other tool is in use until it actually appears in
this repo's `package.json` or config files; check before relying on anything
below having been scaffolded.

**Do not modify `../skypermit`** from this repo unless explicitly asked —
treat it as the read-only system under test.

## The system under test

Read these in `../skypermit` before writing any test:

1. `../skypermit/CLAUDE.md` — entry point for the app itself: stack, gate
   implementation status, conventions.
2. `../skypermit/docs/01-data-model.md` — entities, fields, enums.
3. `../skypermit/docs/02-state-machine.md` — the seven flight-request states
   and legal transitions (illegal transitions must return `409`).
4. `../skypermit/docs/03-api-contract.md` — all endpoints under `/api/v1`,
   status codes, and the `422` error body shape (`failing_gate`,
   `rule_reference`, `message`).
5. `../skypermit/docs/04-frontend-spec.md` — the two portals (operator,
   reviewer) and, critically, the **`data-testid` contract**: every
   interactive element carries a stable `data-testid` meant to be bound by
   automated suites. This is the primary hook for any E2E testing here.
6. `../skypermit/docs/06-business-rules.md` (and `07-clarifications.md` for
   corrections) — the real gate logic (`PILOT`, `AIRCRAFT`, `ZONE`,
   `TIME_WINDOW`) and their `rule_reference` citations, needed to assert on
   specific `422` responses correctly.

Key facts worth not re-deriving:

- Gates evaluate in a fixed order — `PILOT → AIRCRAFT → ZONE →
  TIME_WINDOW` — and stop at the first failure. A `422` always names the
  *first* failing gate, not every failing gate.
- `POST /flight-requests/{id}/validate` runs the same gate pipeline as
  `submit` but never changes state — safe to call repeatedly in tests as a
  read-only probe of gate outcomes.
- Operators authenticate via real Supabase Auth (session cookie); reviewers
  authenticate via a static `X-Reviewer-Id` header, not a login. These are
  two separate mechanisms — a test acting as "reviewer" never needs a
  session, and a test acting as "operator" never sends `X-Reviewer-Id`.
- `data-testid` values are a stable contract — if a selector seems to be
  missing in the running app, treat that as a bug to report against
  `skypermit`, not a reason to fall back to text/CSS selectors.
- The operator portal's pickers (pilot/aircraft/zone) are deliberately
  **not** pre-filtered by business rules — a test can select an invalid
  combination in the form and must expect the failure to surface at
  validate/submit time, not at selection time.

## Running the app under test

`../skypermit` needs its own `.env.local` and a Supabase instance set up
per `../skypermit/supabase/SETUP.md` before it can serve requests. From
`../skypermit`:

```bash
npm run dev     # serves the app at localhost:3000
```

This QA kit will need that server (or a deployed equivalent) running and
reachable at whatever base URL its own config ends up defining.

## Current state of this repo

Empty scaffold. No package.json, no test framework, no CI config yet. When
scope is decided (e.g. E2E via Playwright against the `data-testid`
contract, and/or API-level tests against `/api/v1`), update this file with:
the actual commands (install, run all tests, run a single test, lint), and
how the suite points at a running `skypermit` instance (base URL, auth
setup for operator vs. reviewer flows).
