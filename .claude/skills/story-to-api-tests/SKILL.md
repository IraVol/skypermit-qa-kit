---
name: story-to-api-tests
description: Веде ОДНУ API-задачу SkyPermit з Jira до прогнаних API-тестів — jira-intake → story-doc-check + implementation-check → api-test-case-creator + tc-verifier (mode api) → гейт схвалення → testomat-sync upsert (ран «<KEY> · API») → postman-collection-builder → гейт перегляду колекції → postman-cli-run → testomat-sync report, з трьома зупинками на рішення користувача. Use when a Jira story labelled api needs API cases, a Postman collection and a run end to end ("доведи SKY-2 до API-тестів", "/story-to-api-tests SKY-2"). Not for UI stories (/story-to-tests), for one step on its own (call that skill or agent directly), or for covering rules without a story.
argument-hint: "<Jira issue key, e.g. SKY-2>"
disable-model-invocation: true   # дорогий багатокроковий флоу з гейтами і записом у staging — лише ручний /виклик
allowed-tools:
  - Skill
  - Agent
  - AskUserQuestion
  - Read(test-cases/**)
  - Grep(test-cases/**)
  - Glob(test-cases/**)
  - Edit(test-cases/**)
  - Bash(rm test-cases/api/:*)
  - Write(.notes/open-questions.md)
  - Edit(.notes/open-questions.md)
---

# Story to API tests

Issue key: $ARGUMENTS

You are the orchestrator. Each step hands its output to the next as is.
Don't redo a step's work yourself: don't read Jira, Confluence or
`../skypermit` code, don't call Postman or Testomat directly. Talk to the
user in Ukrainian. Three stops need the user's answer: after Step 2, at
Step 4, and at the collection gate in Step 6. Never pass a stop on your
own, and never treat a subagent's report as the user's answer.

Wait for every launched skill or agent to report before using its result.

## Step 1 — intake

Invoke the `jira-intake` skill with the key. Keep its JSON record verbatim.
It is the input to Step 2.

- `check_type` is `"ui"` → stop with one line: «<KEY> — UI-задача
  (`check_type`: ui). Для неї є /story-to-tests.»
- `check_type` is `null` → stop, quote the record's `notes`, and say that
  the story needs an `api` label.
- `acceptance_criteria` is empty → stop and quote `notes`.

## Step 2 — analysis, then stop

In one message, invoke the `story-doc-check` skill with the JSON record as
its argument and launch the `implementation-check` agent with the same
record.

From the story-doc-check table, take the **rules to cover**: every
`rule_reference` the criteria rely on, as cited from 06 §6 in the
«покрито»/«суперечить» rows or named in the criteria themselves, each with
its gate and its §6 condition (e.g. "Lead time too short"). `ZC-2026.1 §2`
belongs to `AIRCRAFT` or `ZONE` depending on the criterion's wording. If
it's unclear, say so instead of picking one.

Report, in this order:

1. The story-doc-check table as returned, and its summary line.
2. implementation-check: the verdict and one line per criterion that isn't
   `implemented` (status + what is missing). If the verdict is
   `not_implemented`, say plainly that the run in Step 6 will fail.
3. **Правила для покриття:** one bullet per rule — `<rule_reference>`
   (`<GATE>`) — <condition>.

Then ask with `AskUserQuestion`: continue with these rules / stop. The user
may correct the rule list in their answer. Use the corrected list. Stop if
the answer is anything but continue.

## Step 3 — generate and verify

**Already covered?** For each rule, grep `test-cases/api/` for its
`rule_reference` in backticks. If a file asserts it, name the file(s) and
ask whether to take the existing file to Step 4 as is or skip the rule.

**Pre-assign IDs** for the rules left, so parallel runs never collide:
find the highest `API-OP-NNN` under `test-cases/` (grep
`\bAPI-OP-\d{3}\b`; none → 0) and give the rules `+1`, `+2`, … in list
order. `file` = `test-cases/api/<case_id>-<slug of condition>.md`
(lowercase, `[a-z0-9-]`, ≤ 48 chars).

In one message, invoke `api-test-case-creator` once per rule with one JSON
argument:

```json
{"gate": "<GATE>", "rule_reference": "<ref>", "condition": "<condition>", "story": "<KEY>", "case_id": "API-OP-NNN", "file": "test-cases/api/..."}
```

Each returns `written` (with `cases` and `skipped`) or `blocked`.

Then, in one message, launch the `tc-verifier` agent for every `written`
file with `file`, `rule_reference`, `gate` and `"mode": "api"`. Its
verdicts don't delete anything here. They go to the gate.

Remember which files this run created. Only those may be removed later.

## Step 4 — approval gate, then stop

Read each file and show, per file: the path, then a table

| ID | Техніка | Ключове значення | Очікування | Вердикт | Причина |
|---|---|---|---|---|---|

then the creator's `skipped` list and any `blocked` rule with its reason.

Proposed default per verdict:

| Verdict | Default |
|---|---|
| відповідає | approve |
| документація мовчить | approve as **blocked**: `pending` in the run, the verifier's question goes to open questions |
| не відповідає | cut from the file, or fix it per the reason if the fix is a clear edit |

Ask with `AskUserQuestion`: approve with the defaults / approve some (the
user names which) / mark some blocked / reject all. Then apply exactly what
was chosen:

- Cut a case: delete its `### <id>: …` section up to the next `### ` (or
  end of file) with `Edit`.
- Fix a case: the minimal `Edit` the verifier's reason calls for. Say what
  changed.
- Reject all: `rm` the files this run created (an existing file from Step 3
  is left alone) and stop.
- Blocked cases: append each question to `.notes/open-questions.md`
  (create it with `# Open questions` if missing) under
  `## /story-to-api-tests <KEY> <YYYY-MM-DD>`, one bullet, starting with
  the `rule_reference`.

If nothing is approved, stop.

## Step 5 — Testomat upsert

Invoke the `testomat-sync` skill once, with one JSON argument:

```json
{"mode": "upsert", "key": "<KEY>", "title": "<title from the record>", "run_title": "<KEY> · API", "files": ["test-cases/api/..."], "blocked": [{"id": "API-OP-001.2", "reason": "<one line>"}]}
```

Keep its `run.id` and its `tests` list (`case_id` → `id`) for Step 6. If
`run` is `null`, report the errors and stop before Postman: without a run
there is nowhere to report results.

## Step 6 — collection, gate, run, report

**Build.** Invoke `postman-collection-builder` with:

```json
{"key": "<KEY>", "title": "<title>", "files": ["test-cases/api/..."], "collection_name": "<KEY> · API"}
```

- `created` → show a table of its `requests` (folder, name, method + path,
  assertions), its `skipped` list, and the collection and environment ids.
- `exists` → say so and ask with `AskUserQuestion`: run the existing
  collection / stop. For "run", ask the user for the environment id too,
  since the builder didn't return one.
- `error` → report it and stop.

**Gate.** Tell the user to open the collection in Postman (workspace
SkyPermit) and review it, and say two things plainly:

- a run against `skypermit.vercel.app` leaves permanent data (operator,
  pilot, aircraft, requests). There's no delete API;
- if they edit requests by hand, every case request's name must keep its
  `<case id>: ` prefix, because results are mapped back to cases by it.

Ask with `AskUserQuestion`: «запускай» / стоп. Anything but «запускай»
stops here. The cases stay in Testomat with the run open.

**Run.** Invoke `postman-cli-run` with
`{"key": "<KEY>", "collection_id": "<uid>", "environment_id": "<uid>"}`.
On `error`, report the reason (and `hint`, if any) and stop.

**Report.** Drop every blocked case from its `results`, so they stay
`pending`. Fill each remaining result's `test_id` from Step 5's `tests`.
Then invoke `testomat-sync` with:

```json
{"mode": "report", "key": "<KEY>", "run_id": "<run id from Step 5>", "results": [{"case_id": "API-OP-001.1", "test_id": "<id>", "status": "passed", "message": ""}]}
```

## Summary

In Ukrainian:

1. Testomat: the suite, the run «<KEY> · API» and the number of tests
   created / updated / `pending`, then results passed / failed / skipped,
   with links from testomat-sync.
2. Failed cases: one line each with the message from postman-cli-run.
   Blocked cases that still ran in Postman: their actual result, marked as
   not reported.
3. Postman: collection and environment ids, and the run log path.
4. Criteria the cases don't cover (from Step 2, the creator's `skipped`
   and the builder's `skipped`).
5. Open questions added this run.
6. Files written or changed in `test-cases/`. Nothing is committed.
