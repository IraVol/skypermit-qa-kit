---
name: test-design
description: Builds a test design for a specification file — boundary values (BV), equivalence partitions (EP) and state transitions (ST) — and writes it as JSON to <name>.design.json next to the spec. Every class, boundary and transition carries a verbatim quote from the spec; anything the text doesn't say goes into unknowns instead of being guessed. BV are always triples (boundary−1, boundary, boundary+1); ST is the full state × action matrix. A bundled script checks that every quote really is in the file. Works on any spec file (markdown or text), optionally narrowed to one rule or section. Use when asked for a test design / тест-дизайн from a spec file ("зроби тест-дизайн для specs/06-business-rules.md", "BV/EP/ST по специфікації"). Not for writing test cases (api-test-case-creator, ui-test-case-creator), reading Confluence or code, or reviewing an existing design.
argument-hint: '<spec file> [<spec file> …] [focus: <rule or section>] [out: <path>]'
context: fork
agent: general-purpose
allowed-tools:
  - Read
  - Grep
  - Glob
  - Write(**/*.design.json)
  - Bash(node .claude/skills/test-design/scripts/check-design.mjs *)
  - Bash(node .claude/skills/test-design/scripts/render-coverage.mjs *)
---

# Test design from a spec file

Input:

$ARGUMENTS

- One or more spec file paths (required). Missing or unreadable → write
  nothing, return `{"status": "blocked", "reason": "spec file not found: …"}`.
- `focus:` (optional) — a rule, section or parameter to limit the design to,
  e.g. `focus: Duration`. Without it, design everything the files define.
- `out:` (optional) — output path. Default: next to the first spec file,
  `<basename>.design.json`, or `<basename>.<focus-slug>.design.json` when a
  focus is given (slug: lowercase, `[a-z0-9-]`). An existing file is
  overwritten.

## The one rule: the spec is the only source

The given files are the whole world. Not Confluence, not the code, not other
files the spec refers to, not general domain knowledge, not "what APIs
usually do".

- Every BV entry, EP class, state, action and ST cell carries `quotes`:
  text copied **character for character** from the file, with `file` and
  the `line` it starts on. Keep markdown as it is in the file (backticks,
  `**`, `\>`). Quote the shortest fragment that proves the claim; use
  several quotes if the claim rests on several places (e.g. the range in
  one row, the error code in another).
- If the text doesn't say it — an inclusivity, a step, an error code, a
  transition, what happens on violation — it goes into `unknowns`, and the
  item points to it with `"unknown": "U-NN"`. Never fill the gap with a
  plausible guess, and never paraphrase a quote to make it fit.
- References to documents not given as input (e.g. "see
  `docs/07-clarifications.md`") are not followed. If the design depends on
  them, that's an unknown.
- Two places in the given files that contradict each other → one unknown
  with `"kind": "conflict"` and both quotes. Don't pick a side.

## Boundary values (BV)

One BV entry per boundary the text states. A two-sided range ("15–240
minutes") is two entries, lower and upper.

Every entry has **exactly three values, in this order**:
`boundary-1`, `boundary`, `boundary+1`.

- **Step ("one unit")** = the unit the boundary is written in (minutes →
  1 minute, grams → 1 g, days → 1 day), unless the text itself defines a
  finer or coarser granularity — then use that and quote it. Record it in
  `step`.
- **Inclusive or exclusive** must come from the text ("inclusive", "≤",
  "at least", "strictly after", "up to"). If the text doesn't settle it,
  the `boundary` value gets `"expected": "unknown"` with an unknown.
- `expected`: `valid` / `invalid` / `unknown`.
- `outcome`: what the system does with that value (status code, error
  field, resulting state) — **only** if the text says so, with its quote.
  Otherwise `null`, and one unknown per parameter: "what happens on
  violation is not specified".

## Equivalence partitions (EP)

For each constrained parameter, the classes the text defines: the valid
class(es) and each invalid side (below range, above range, each enum value,
each named condition). One class = one entry with a `representative` from
the middle of the class, `valid` (`true` / `false` / `"unknown"`), `outcome`
under the same rule as BV, and quotes.

Don't invent classes the text doesn't define (empty, null, wrong type,
negative, unicode…). If the parameter is an input and the text is silent on
malformed values, add one unknown for it — once, not per class.

## State transitions (ST)

If the text defines no states, write
`"state_transitions": {"not_applicable": "<why, in one line>"}` and move on.

Otherwise:

1. `states` — every state the text names, each with a quote.
2. `actions` — every caller-invoked action **and** every automatic event
   that moves a state (`"kind": "action"` or `"kind": "event"`), each with
   a quote.
3. `matrix` — **one cell for every state × action pair**, no exceptions,
   including obviously pointless ones (`COMPLETED × submit`). Each cell:
   - `legal` — `to` is the target state (or an array, when the text gives
     several outcomes, e.g. gates pass/fail), quote of the transition.
     A condition on it ("only up to 2 hours before…") goes into `guard`,
     covered by the quotes.
   - `illegal` — quote of the text that makes it illegal. A blanket rule
     ("any pair not listed here is illegal and returns 409") is a valid
     quote for every unlisted pair; put its outcome in `outcome`.
   - `unknown` — the pair isn't listed and there is no blanket rule.
     Point to an unknown.

## Output format

```json
{
  "spec": ["specs/06-business-rules.md"],
  "focus": "Duration",
  "boundary_values": [
    {
      "id": "BV-01",
      "parameter": "window duration (window_end − window_start)",
      "boundary": "15 minutes (lower)",
      "inclusive": true,
      "step": "1 minute",
      "quotes": [{"file": "specs/06-business-rules.md", "line": 95, "text": "15–240 minutes, inclusive at both ends."}],
      "values": [
        {"position": "boundary-1", "value": "14 minutes", "expected": "invalid", "outcome": null, "unknown": "U-01"},
        {"position": "boundary",   "value": "15 minutes", "expected": "valid",   "outcome": null},
        {"position": "boundary+1", "value": "16 minutes", "expected": "valid",   "outcome": null}
      ]
    }
  ],
  "equivalence_classes": [
    {
      "id": "EP-01",
      "parameter": "window duration",
      "class": "15–240 minutes",
      "valid": true,
      "representative": "90 minutes",
      "outcome": null,
      "quotes": [{"file": "…", "line": 95, "text": "…"}]
    }
  ],
  "state_transitions": {
    "states":  [{"name": "DRAFT", "quotes": [{"file": "…", "line": 0, "text": "…"}]}],
    "actions": [{"name": "submit", "kind": "action", "quotes": [{"file": "…", "line": 0, "text": "…"}]}],
    "matrix": [
      {"id": "ST-01", "from": "DRAFT", "action": "submit", "result": "legal", "to": ["UNDER_REVIEW", "REJECTED"], "guard": null, "outcome": null, "quotes": [{"file": "…", "line": 0, "text": "…"}]}
    ]
  },
  "unknowns": [
    {
      "id": "U-01",
      "kind": "gap",
      "question": "What does the system return when the duration is out of range?",
      "why_it_matters": "Without it BV-01/BV-02 and EP-02/EP-03 can only assert valid/invalid, not the response.",
      "affects": ["BV-01", "BV-02", "EP-02", "EP-03"],
      "quotes": []
    }
  ]
}
```

- `unknown` on a BV value, EP class or ST cell is only present when its
  result is `unknown`, or when `outcome` is `null` because of a gap
  (as in BV-01 above).
- `kind` is `gap` (the text is silent) or `conflict` (the text says two
  things — both quotes required).
- IDs: `BV-NN`, `EP-NN`, `ST-NN`, `U-NN`, unique within the file.
- Values in the spec's own units and notation.

## Steps

1. Read every spec file in full. With `focus`, find the matching rule or
   section, but still read the whole file — the outcome or a state rule may
   live elsewhere in it.
2. List the parameters with constraints and the states/actions. For each,
   find the quote before writing anything about it. No quote → unknown.
3. Write the JSON to the output path.
4. Run from the repo root:
   `node .claude/skills/test-design/scripts/check-design.mjs <output path>`
5. On `FAIL`, fix each listed problem and run it again (at most 3 rounds).
   A quote "not found" is fixed by copying the real text from the file —
   or, if the text really doesn't say it, by turning the item into an
   unknown. Never fix it by rewording the claim so a vaguer quote fits.
   Still failing after 3 rounds → return `{"status": "failed",
   "file": "…", "problems": […]}` and keep the file for inspection.
6. Once the checker says `OK`, render the coverage page:
   `node .claude/skills/test-design/scripts/render-coverage.mjs <output path>`
   It writes `<name>.coverage.html` next to the JSON: a number line per
   numeric parameter (classes, boundaries, BV points, EP representatives),
   the state × action table, and a quote → element → test table plus the
   unknowns. It only reads the JSON — never edit the HTML by hand; fix the
   JSON and re-render.

## Return

A short summary, nothing else:

- the output path and the checker's `OK` line;
- the path of the `.coverage.html` page;
- the list of unknowns, one line each (`U-NN — question`);
- anything in `focus` that matched nothing in the files.

Don't paste the JSON back.
