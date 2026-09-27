# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this directory.

## What this is

`api-automation` is the API-level test suite inside `skypermit-qa-kit`
(itself the QA companion to the sibling app `../../skypermit`). This
directory is currently **empty** — no test framework, dependencies, or
structure have been chosen yet. Do not assume Playwright, Vitest, Jest,
Supertest, or any other tool is in use until it actually appears in a
`package.json` or config file here; check before relying on anything below
having been scaffolded.

Scope: tests here talk to `/api/v1` directly (HTTP requests in, JSON
assertions out) — no browser, no `data-testid`, no rendered UI. If this kit
grows an E2E/UI suite, that's a separate concern (see the parent
`../CLAUDE.md`); don't blur the two into one directory.

**Do not modify `../../skypermit`** unless explicitly asked — treat it as
the read-only system under test.

## The system under test

Read these in `../../skypermit` before writing any test:

1. `../../skypermit/CLAUDE.md` — entry point for the app itself: stack,
   gate implementation status, conventions.
2. `../../skypermit/docs/01-data-model.md` — entities, fields, enums.
3. `../../skypermit/docs/02-state-machine.md` — the seven flight-request
   states and legal transitions (illegal transitions must return `409`).
4. `../../skypermit/docs/03-api-contract.md` — the authoritative source for
   every endpoint under `/api/v1`, auth rules, and status codes. Everything
   below is a summary of it; if this file and that doc ever disagree, the
   doc wins and this file is stale.
5. `../../skypermit/docs/06-business-rules.md` (and
   `07-clarifications.md` for corrections) — the real gate logic (`PILOT`,
   `AIRCRAFT`, `ZONE`, `TIME_WINDOW`) and their `rule_reference` citations,
   needed to assert on specific `422` responses correctly.

## Endpoint map (from `03-api-contract.md`)

Base path `/api/v1`, JSON in/out. Auth endpoints are deliberately
unnumbered in the source contract (added after "the original 16" was
closed) — don't renumber anything if you regenerate a table from that doc.

| Area | Endpoints |
|---|---|
| Auth | `POST /operators` (register + creates session), `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Registry | `POST /pilots`, `GET /pilots`, `GET /pilots/{id}`, `POST /aircraft`, `GET /aircraft`, `GET /aircraft/{id}`, `GET /operators/{id}` |
| Reference data | `GET /zones`, `GET /zones/{code}` (read-only, no create/update) |
| Flight requests | `POST /flight-requests`, `POST /flight-requests/{id}/submit`, `GET /flight-requests/{id}`, `GET /flight-requests`, `POST /flight-requests/{id}/validate`, `POST /flight-requests/{id}/cancel` |
| Reviewer (`X-Reviewer-Id` required) | `POST /flight-requests/{id}/approve`, `POST /flight-requests/{id}/reject` |

## Key facts worth not re-deriving

- **Two separate auth mechanisms.** Operators authenticate via real
  Supabase Auth (session cookie from `/auth/login` or `/operators`
  register). Reviewers authenticate via a static `X-Reviewer-Id` header —
  not a login, just an identity label. A test acting as "reviewer" never
  needs a session; a test acting as "operator" never sends
  `X-Reviewer-Id`. Don't mix them in one request.
- **`operator_id` is server-derived, never client-supplied.** Every
  operator-scoped endpoint reads the operator from the session. Don't
  write tests that pass `operator_id` as a body field or query param
  expecting it to matter — it won't, and if it changes behavior that's a
  bug to report against `skypermit`, not a contract to test against.
- **Reviewer-or-owner reads.** Single-entity `GET`s on
  pilot/aircraft/operator/flight-request, plus `POST .../validate`, accept
  *either* the owning operator's session *or* any `X-Reviewer-Id` header.
  `GET /flight-requests` (list) is forced to the caller's own
  `operator_id` with no reviewer header, and unscoped (optionally filtered
  by `operator_id`) with one.
- **Gates evaluate in a fixed order** — `PILOT → AIRCRAFT → ZONE →
  TIME_WINDOW` — stopping at the first failure. A `422` always names the
  *first* failing gate, never every failing gate that would apply.
- **`validate` is a safe, repeatable probe.** `POST
  /flight-requests/{id}/validate` runs the identical gate pipeline as
  `submit` but never changes state — call it as often as needed in setup
  or assertions without side effects.
- **Six meaningful status codes:** `400` malformed body, `401` no
  session/no reviewer header, `403` authenticated but wrong resource (or
  `SUSPENDED` operator), `404` not found, `409` illegal state transition or
  scheduling conflict, `422` business rule violation. `409` vs `422`
  matters: `409` means the request couldn't be attempted at all; `422`
  means it was attempted and a gate refused it.
- **The `422` body is structured** — assert on all three fields, using
  real citations from `06-business-rules.md` §6, not the illustrative
  `TSD-4 §3.2` example from the contract doc:
  ```json
  { "failing_gate": "TIME_WINDOW", "rule_reference": "...", "message": "..." }
  ```
- **`authorisation_level` is not a registration field.** New operators are
  always created at `L1`; there's no way to self-elevate through the API,
  so don't write a test expecting one.
- Reviewer endpoints (`approve`, `reject`) return `400` if
  `X-Reviewer-Id` is missing — not `401`, despite being an auth-shaped
  omission.

## Running the app under test

`../../skypermit` needs its own `.env.local` and a Supabase instance set up
per `../../skypermit/supabase/SETUP.md` before it can serve requests. From
`../../skypermit`:

```bash
npm run dev     # serves the app at localhost:3000
```

This suite will need that server (or a deployed equivalent) running and
reachable at whatever base URL its own config ends up defining. Because
most endpoints are session- or header-scoped, expect setup here to include
helpers for: registering/logging in a throwaway operator per test run, and
attaching a fixed `X-Reviewer-Id` for reviewer-flow tests.

## Current state of this directory

Empty scaffold. No package.json, no test framework, no CI config yet. When
scope is decided (e.g. Vitest + a fetch-based client, or Supertest-style
requests against a running `skypermit` instance), update this file with:
the actual commands (install, run all tests, run a single test, lint), the
base-URL config, and the operator/reviewer auth helpers tests are expected
to use.
