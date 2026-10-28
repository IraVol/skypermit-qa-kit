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

Start with `../skypermit/CLAUDE.md` — entry point for the app itself: stack,
gate implementation status, conventions.

The product docs live in **Confluence**, space `SD` ("SkyPermit Docs") on
`iv-skypermit.atlassian.net` (cloudId `bea84479-f55e-4409-bbc6-af79e0add67a`).
Read them before writing any test with `mcp__atlassian__getConfluencePage`
(`contentFormat: "markdown"`), by page ID — not from `../skypermit/docs`:

| Page | ID | What it gives you |
|---|---|---|
| 01 — Data Model | `557058` | entities, fields, enums |
| 02 — Request Lifecycle (State Machine) | `557079` | the seven flight-request states and legal transitions (illegal transitions must return `409`) |
| 03 — API Contract | `66147` | all endpoints under `/api/v1`, status codes, and the `422` error body shape (`failing_gate`, `rule_reference`, `message`) |
| 04 — Frontend Scope | `66168` | the two portals (operator, reviewer) and, critically, the **`data-testid` contract** — the primary hook for any E2E testing here |
| 05 — Open Questions (Canonical Status) | `66188` | what is still unresolved |
| 06 — Business Rules | `262146` | the real gate logic (`PILOT`, `AIRCRAFT`, `ZONE`, `TIME_WINDOW`) and their `rule_reference` citations (§1, §6) |
| 07 — Clarifications From the Business Rules Owner | `66208` | corrections to 06 — where they conflict, 07 governs |

Page bodies still cross-reference each other as `docs/0N-*.md` — read that as
the Confluence page with the same number. Page IDs are stable, titles may
change; if an ID stops resolving, find the page with
`mcp__atlassian__searchConfluenceUsingCql` (`space = SD AND title ~ "06"`)
and fix this table.

**Selectors are not looked up in Confluence.** The frontend page describes
the `data-testid` contract; whether a selector exists is confirmed by
grepping `../skypermit/app` and `../skypermit/components`
(`.claude/rules/selector-discipline.md`).

**Exception — `scripts/uncovered-rules.mjs`.** It is plain Node with no MCP
access, so it still parses the local `../skypermit/docs/06-business-rules.md`
and `07-clarifications.md`. That keeps the local copy load-bearing for
`/cover-gaps` Step 1 (which rules are uncovered, their rule text, case IDs);
ui-test-case-creator and tc-verifier read Confluence. If the rule block and
Confluence disagree, Confluence governs — the verifier judges against it,
and the drift means the local docs need re-syncing (report it against
`skypermit`; don't work around it in a case).

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
