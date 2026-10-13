---
description: Report which skypermit business rules have no test case yet
argument-hint: "[--gaps | --markdown]  (optional)"
allowed-tools: Bash(node scripts/rule-coverage.mjs*)
---

## Coverage report

!`node scripts/rule-coverage.mjs $ARGUMENTS`

## Your task

Interpret the report above for the user.

- Lead with the headline number (how many rules are asserted vs. uncovered).
- Call out anything that needs a decision, not just the counts:
  - **Stale citations** ("Asserted but not in the doc's table") — a case
    asserts a `rule_reference` the business-rules doc no longer lists.
    Either the case is out of date or the doc dropped a citation; say which
    you think it is and why, and flag it rather than glossing over it.
  - **`ref?` rows** — a case mentions the citation in its Doc ref but never
    asserts it in Expected result. These are effectively uncovered; name the
    case so the user can decide whether to strengthen it.
- If there are gaps, group them so the next step is obvious (e.g. "all four
  `TIME_WINDOW` rules except curfew are uncovered") instead of restating
  the table row by row. The user can already read the table.
- Don't write any test cases — that's a separate, explicit step. If asked to
  fill a gap, use the `e2e-test-design` skill and the format in
  `.claude/skills/e2e-test-design/templates.md`.

Note the script exits `1` whenever any rule is uncovered — that is the
expected state while the kit is still being built, not an error. Exit `2`
means it genuinely could not run (business-rules doc missing or its §6
section renamed); if that happens, say so plainly instead of reporting zero
coverage.
