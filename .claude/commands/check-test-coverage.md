---
description: Check whether a test case's underlying business logic actually exists (and matches) in the skypermit app code
argument-hint: <test-case-id>  (e.g. E2E-OP-006)
---

Check whether the test case **$ARGUMENTS** is **valid** against the
`skypermit` app's actual code — i.e. whether the functionality it
describes really exists, really behaves as the case expects, and is cited
correctly. This checks the app's *code*, not this kit's test coverage —
there may be no automated test for this case yet, and that's out of scope
here.

## Step 1 — find the test case definition

Search `test-cases/**` for a case whose ID matches `$ARGUMENTS`
(definitions are organized as `test-cases/{module}/*.md`, so the module
isn't known up front — search all of them). Also check
`.claude/skills/e2e-test-design/examples.md` and `templates.md`, since some
worked examples live there instead.

- If no argument was given, stop and ask for a test-case ID.
- If the ID isn't found anywhere, say so plainly and stop — don't guess at
  what the case might have meant.
- Note the case's **Doc ref**, **Preconditions**, **Steps**, and
  **Expected result** in full — every claim in them needs to be checked
  against code, not just the headline scenario.

## Step 2 — check the underlying business logic in `../skypermit`

For each concrete claim the case makes, find the actual implementation and
confirm it matches:

- **Gate/rule logic** — if the case exercises a gate (`PILOT`, `AIRCRAFT`,
  `ZONE`, `TIME_WINDOW`), read the corresponding file under
  `../skypermit/lib/gates/` and confirm the rule described in the case's
  Doc ref is actually implemented there, not just documented. A rule that
  exists in `docs/06-business-rules.md` but isn't wired into the gate code
  yet means the case describes intended, not current, behavior.
- **State-machine transitions** — if the case asserts a transition or a
  `409` on an illegal one, check the route handler(s) enforcing it (search
  for where `FlightRequest.state` is read/written) against
  `../skypermit/docs/02-state-machine.md`.
- **`rule_reference` / error shape** — if the case's Expected result names
  a specific `rule_reference` string (e.g. `A-7 §1`) or `422` body shape,
  grep the code for that literal string. Confirm the code returns exactly
  that citation for that condition — not a different one, not the general
  zone value when an amendment should override it, etc. This is the most
  likely place for a case to silently go stale.
- **`data-testid` selectors** — if the case's Steps name specific
  `data-testid` values, grep the frontend code under `../skypermit` for
  each one and confirm it exists and is attached to the element the case
  assumes (e.g. `flight-request-check-button` really triggers `validate`,
  not `submit`).
- **Endpoints** — if the case implies a specific API call (e.g. `validate`
  vs `submit`), confirm that route exists and does what the case assumes.

Treat `../skypermit` as read-only — this command never edits app code.

## Step 3 — report

Report one of these outcomes clearly, citing the specific file(s) and
line(s) checked:

- **Valid** — the functionality exists and matches the case exactly
  (logic, citation, selectors, endpoint all line up). Name the file(s)
  that confirm each part.
- **Invalid / stale** — something in the case no longer matches the code:
  wrong `rule_reference`, a selector that doesn't exist or was renamed, a
  transition the code doesn't actually enforce, gate logic not yet wired
  up, etc. Name exactly what's wrong and where, so the case can be
  corrected or the code gap can be flagged back to `skypermit`.
- **Not yet implemented** — the case describes documented behavior
  (`docs/06-business-rules.md` etc.) that isn't in the code yet at all —
  distinct from "stale," since here the case is *correct* about intended
  behavior but nothing exists to test against yet.
- **Can't determine** — the case is ambiguous or the relevant code can't
  be located confidently; say what's unclear rather than guessing.

This command does not check whether an automated test exists for this case
in `skypermit-qa-kit` — that's a separate question. It also does not write
or modify any code or test-case files; it only reports.
