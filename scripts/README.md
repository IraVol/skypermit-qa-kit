# Scripts

Standalone QA scripts. Plain Node, no dependencies, no install step, no LLM
at runtime — `node scripts/<name>.mjs` is all they need.

## `validate-cases.mjs`

Structural validation of the case files in `test-cases/`: required fields
present and non-empty, ID format (`E2E-<OP|REV|X>-<3 digits>`) and
uniqueness across all modules, Doc ref written repo-rooted rather than
`../skypermit/...`, cited doc paths actually existing, numbered steps that
name at least one `data-testid`, and a few anti-patterns (`Preconditions:
None` instead of omitting the field; "shows an error" without naming the
specific error).

```bash
node scripts/validate-cases.mjs
node scripts/validate-cases.mjs --json     # machine-readable
node scripts/validate-cases.mjs --cases <dir> --app <dir>
```

**Exit codes:** `0` clean · `1` problems found · `2` couldn't run.

This deliberately stops at what a regex can settle. Whether a case is
*logically sound* — do the Steps reach the state the Preconditions promise,
does the Expected result follow, does the cited section actually say what
the case claims, do the selectors exist in the app — needs judgment and the
app's source. That is the `case-reviewer` agent's job
(`.claude/agents/case-reviewer.md`), and its prompt tells it to run this
script first rather than re-checking these by hand.

Note that `Preconditions` is optional by design: `templates.md` says to omit
it entirely when there is nothing beyond a fresh page load, so its absence
is never reported as missing.

## `rule-coverage.mjs`

Cross-references the `rule_reference` table in
`../skypermit/docs/06-business-rules.md` §6 against the cases in
`test-cases/`, and reports which business rules have no test case yet.

```bash
node scripts/rule-coverage.mjs              # table to stdout
node scripts/rule-coverage.mjs --gaps       # uncovered rules only
node scripts/rule-coverage.mjs --markdown   # markdown, for pasting into a ticket
```

If `skypermit` lives somewhere other than `../skypermit`, or cases somewhere
other than `test-cases/`:

```bash
node scripts/rule-coverage.mjs --rules path/to/06-business-rules.md --cases path/to/cases
```

**Exit codes:** `0` all rules covered · `1` at least one gap (so CI can gate
on it) · `2` couldn't run (doc missing, section renamed).

### How coverage is judged

A rule counts as **covered** only when a case *asserts* its citation in its
**Expected result** section. Two deliberate subtleties:

- **Doc ref mentions don't count.** A case often cites a rule for background
  while asserting a different one. Those show as `ref?` — treat them as
  uncovered until something actually asserts the rule.
- **Negated mentions don't count.** `E2E-OP-006` asserts `A-7 §1` and says
  "(not the unamended `ZC-2026.1 §3` value)" — that's the opposite of
  covering `ZC-2026.1 §3`, so the script skips citations sitting behind a
  negation (`not`, `never`, `rather than`, `instead of`, …). Without this it
  over-credits coverage, which is worse than under-reporting it.

It also flags the reverse direction: citations a case asserts that **aren't**
in the doc's table — either a stale case, or a citation the doc dropped.
Worth checking whenever it appears.

### Maintenance

The script anchors on the `## 6. \`rule_reference\` values` heading and
parses the markdown table under it. If that section is renamed or
restructured in `skypermit`, the script exits `2` with a message saying so
rather than silently reporting zero rules — if that happens, read the doc
and update the parser.
