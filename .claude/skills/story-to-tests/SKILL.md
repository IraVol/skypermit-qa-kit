---
name: story-to-tests
description: Веде ОДНУ UI-задачу SkyPermit з Jira до схвалених тест-кейсів у Testomat.io — jira-intake → story-doc-check + implementation-check → ui-test-case-creator + tc-verifier → гейт схвалення → testomat-sync, з двома зупинками на рішення користувача. Use when a Jira story labelled ui needs test cases end to end ("доведи SKY-1 до тестів", "/story-to-tests SKY-1"). Not for API stories (окремий флоу), for covering rules without a story (/cover-gaps), for one step on its own (call that skill or agent directly), or for running tests.
argument-hint: "<Jira issue key, e.g. SKY-1>"
disable-model-invocation: true   # дорогий багатокроковий флоу з гейтами — лише ручний /виклик
allowed-tools:
  - Skill
  - Agent
  - AskUserQuestion
  - Read(test-cases/**)
  - Grep(test-cases/**)
  - Edit(test-cases/**)
  - Bash(node scripts/uncovered-rules.mjs:*)
  - Bash(rm test-cases/:*)
  - Write(.notes/open-questions.md)
  - Edit(.notes/open-questions.md)
---

# Story to tests

Issue key: $ARGUMENTS

You are the orchestrator. Each step hands its output to the next as is;
don't redo a step's work yourself (don't read Jira, Confluence or
`../skypermit` code). Talk to the user in Ukrainian. Two stops need the
user's answer — after Step 2 and at Step 4. Never pass a stop on your own,
and never treat a subagent's report as the user's answer.

Wait for every launched skill or agent to report before using its result.

## Step 1 — intake

Invoke the `jira-intake` skill with the key. Keep its JSON record verbatim —
it is the input to Step 2.

- `check_type` is not `"ui"` → stop with one line: «<KEY> — не UI-задача
  (`check_type`: <value>). Для API-задач буде окремий флоу.»
- `check_type` is `null` → stop the same way and quote the record's `notes`.
- `acceptance_criteria` is empty → stop and quote `notes`.

## Step 2 — analysis, then stop

In one message, invoke the `story-doc-check` skill with the JSON record as
its argument and launch the `implementation-check` agent with the same
record.

From the story-doc-check table, take the **rules to cover**: every
`rule_reference` the criteria rely on, as cited from 06 §6 in the
«покрито»/«суперечить» rows or named in the criteria themselves, each with
its gate. `ZC-2026.1 §2` belongs to `AIRCRAFT` or `ZONE` depending on the
criterion's wording — if it's unclear, say so instead of picking one.

Report, in this order:

1. The story-doc-check table as returned, and its summary line.
2. implementation-check: the verdict and one line per criterion that isn't
   `implemented` (status + what is missing). If the verdict is
   `not_implemented`, say plainly that the cases can't be run yet.
3. **Правила для покриття:** one bullet per rule — `<rule_reference>`
   (`<GATE>`).

Then ask with `AskUserQuestion`: continue with these rules / stop. The user
may correct the rule list in their answer — use the corrected list. Stop if
the answer is anything but continue.

## Step 3 — generate and verify

Run `node scripts/uncovered-rules.mjs` once (no arguments, so case IDs are
allocated across all gaps in one pass). For each rule, take its block — the
`### <rule_reference> — <condition>` heading under `## <GATE>` and all its
`- ` lines — and **drop the `- rule:` line**, so the generator reads the
rule from Confluence instead of the script's local copy.

A rule with no block is already covered. Grep `test-cases/` for its
citation, name the file(s), and ask whether to take the existing file to
Step 4 as is or skip the rule.

In one message, invoke `ui-test-case-creator` once per block, with
`## <GATE>` followed by the edited block as its argument. Each returns
`written` (with `cases` and `skipped`) or `blocked`.

Then, in one message, launch the `tc-verifier` agent for every `written`
file with `file`, `rule_reference` and `gate`. Its verdicts don't delete
anything here — they go to the gate.

Remember which files this run created: only those may be removed later.

## Step 4 — approval gate, then stop

Read each file and show, per file: the path, then a table

| ID | Техніка | Ключове значення | Очікування | Вердикт | Причина |
|---|---|---|---|---|---|

then the creator's `skipped` list and any `blocked` rule with its reason.

Proposed default per verdict:

| Verdict | Default |
|---|---|
| відповідає | approve |
| документація мовчить | approve as **blocked** — `pending` in the run, the verifier's question goes to open questions |
| не відповідає | cut from the file, or fix it per the reason if the fix is a clear edit |

Ask with `AskUserQuestion`: approve with the defaults / approve some (the
user names which) / mark some blocked / reject all. Then apply exactly what
was chosen:

- Cut a case: delete its `### <id>: …` section up to the next `### ` (or
  end of file) with `Edit`.
- Fix a case: the minimal `Edit` the verifier's reason calls for; say what
  changed.
- Reject all: `rm` the files this run created (an existing file from Step 3
  is left alone) and stop.
- Blocked cases: append each question to `.notes/open-questions.md`
  (create it with `# Open questions` if missing) under
  `## /story-to-tests <KEY> <YYYY-MM-DD>`, one bullet, starting with the
  `rule_reference`.

If nothing is approved, stop.

## Step 5 — sync to Testomat

Invoke the `testomat-sync` skill once, with one JSON argument:

```json
{"key": "<KEY>", "title": "<title from the record>", "files": ["test-cases/..."], "blocked": [{"id": "E2E-OP-006.1", "reason": "<one line>"}]}
```

## Summary

In Ukrainian:

1. What landed in Testomat — suite, run and the number of tests created /
   updated / `pending`, with links from testomat-sync.
2. Criteria the cases don't cover (from Step 2 and the creator's `skipped`).
3. Open questions added this run.
4. Files written or changed in `test-cases/`. Nothing is committed.
