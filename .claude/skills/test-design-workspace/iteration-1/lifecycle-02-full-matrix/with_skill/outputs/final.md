Output: `.claude/skills/test-design-workspace/iteration-1/lifecycle-02-full-matrix/with_skill/outputs/02-request-lifecycle.design.json`

Checker: `OK — BV 1 (3 values), EP 18, ST 7×7 = 49 cells, unknowns 12`

Unknowns:
- U-01 (conflict) — `SUBMITTED` × cancel is listed as legal, but gates run synchronously and `SUBMITTED` is never observed at rest. Can cancel from `SUBMITTED` be reached, and how does a test set up a request in `SUBMITTED`?
- U-02 — What does submit return (status code, body) when gates pass or fail?
- U-03 — Which are the "four gates" and what order do they run in? Only `AIRCRAFT` and `TIME_WINDOW` are named.
- U-04 — On a reviewer reject, what goes into `failing_gate`, and is `rejection_reason` the `note`?
- U-05 — What does reject return when `note` is missing, and does an empty note count as provided?
- U-06 — What happens on approve/reject by a non-reviewer, on cancel by a non-operator, or on complete outside the maintenance endpoint?
- U-07 — Does reject also write a `ReviewAction` row? The spec only says approve does.
- U-08 — For the cancellation deadline: how precise is the 2-hour check (is 1 h 59 min rejected?), which clock is used, and is cancel after `window_start` also `409`? The source (`docs/06-business-rules.md` §5) is not an input.
- U-09 — Is a `SUBMITTED` request counted by the overlap check? It is in neither list.
- U-10 — What counts as an overlap, and which gate (`AIRCRAFT` or `TIME_WINDOW`) is reported as `failing_gate`?
- U-11 — `validate` is mentioned but not defined. Does it change state, and does the blanket 409 rule apply to it?
- U-12 — How does an illegal automatic event (gates pass/fail outside `SUBMITTED`) show up, when the `409` rule is for caller requests?

Focus: none given (the whole file was designed).
