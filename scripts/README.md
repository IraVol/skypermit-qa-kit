# Scripts

Standalone QA scripts. Plain Node, no dependencies, no install step, no LLM
at runtime — `node scripts/<name>.mjs` is all they need.

## `uncovered-rules.mjs`

Step 1 of the `/cover-gaps` skill: the list of rules no case asserts yet,
grouped by gate, with what a generator needs to cover each one — the rule
text from `06-business-rules.md` §1, the `07-clarifications.md` item that
touches it, the zones a curfew citation governs, and a pre-assigned case ID
and target file. The skill injects this output into its prompt, so the
model never reads the business-rules doc itself.

```bash
node scripts/uncovered-rules.mjs                   # all gaps
node scripts/uncovered-rules.mjs 3 TIME_WINDOW     # at most 3, one gate (any order)
node scripts/uncovered-rules.mjs ZONE --json       # machine-readable
```

Gates: `PILOT`, `AIRCRAFT`, `ZONE`, `TIME_WINDOW`, and `REGISTRATION` for
`OH-1 §3` (checked at `/aircraft`, not by a gate).

Rules are keyed by **(gate, rule_reference)**: `ZC-2026.1 §2` is shared by
the `AIRCRAFT` weight-band and `ZONE` altitude rules, so a case covers only
the one whose gate its Expected result names. Case IDs continue after the
highest `E2E-OP-NNN` found in `test-cases/` and the skills' worked examples.

**Exit codes:** `0` report printed (including "no gaps" and an `ERROR:`
line for an unknown gate, so prompt injection always gets readable text) ·
`2` docs unreadable.
