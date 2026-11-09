---
name: testomat-sync
description: Two modes. upsert (default) writes the cases from test-cases/ files (E2E-… UI cases or API-… API cases) into Testomat.io — one suite per file under its module folder, one test per case, updating instead of duplicating — and creates one manual run for a story with those tests; cases named as blocked get a pending result with the reason. report adds passed / failed / skipped results (e.g. from postman-cli-run) to an existing run. Step 5 of /story-to-tests, Steps 5–6 of /story-to-api-tests, or on its own. Not for generating, verifying or editing cases, reading Jira or Confluence, running tests, deleting anything in Testomat, or finishing runs.
argument-hint: '{"mode": "upsert", "key": "SKY-1", "title": "...", "run_title": "...", "files": ["test-cases/..."], "blocked": [{"id": "...", "reason": "..."}]} | {"mode": "report", "key": "SKY-2", "run_id": "...", "results": [{"case_id": "...", "test_id": "...", "status": "passed", "message": ""}]}'
model: sonnet
context: fork
agent: general-purpose
allowed-tools:
  - Read(test-cases/**)
  - mcp__testomatio__tql_help
  - mcp__testomatio__suites_list
  - mcp__testomatio__suites_create
  - mcp__testomatio__tests_list
  - mcp__testomatio__tests_create
  - mcp__testomatio__tests_update
  - mcp__testomatio__runs_create
  - mcp__testomatio__testruns_create
---

# Sync cases to Testomat

Input:

$ARGUMENTS

A JSON object. `mode` is `upsert` (also when absent) or `report`. Any other
value → `{"status": "error", "reason": "unknown mode"}`.

## Hard limits

- Only the tools above. Never delete or archive a suite, test or run, and
  never finish a run.
- Touch only the suites for the given files and the tests inside them
  (upsert), or only the given run (report).
- The case text is copied, not rewritten.

A **case ID** matches `(E2E|API)-[A-Z]+-\d+(\.\d+)?`.

# Mode `upsert`

Input: `key` and `title` of the story, `files` (paths under `test-cases/`),
`blocked` (case IDs with a one-line reason; may be empty), optional
`run_title`. If it's missing `key` or `files`, do nothing and return
`{"status": "error", "reason": "<what is missing>"}`.

## Read the files

For each file: the `# ` heading line, the preamble (text between it and the
first `### `), and each case: a `### <id>: <title>` line and everything up
to the next `### ` or end of file, where `<id>` is a case ID.
The module is the folder under `test-cases/` (`test-cases/flight-request/…`
→ `flight-request`, `test-cases/api/…` → `api`).

## Suites — find before you create

1. **Module folder:** a root suite with `file_type: folder` and title equal
   to the module. List with `suites_list` (`search_text` = module); create
   it (`file_type: "folder"`) only if no exact match exists.
2. **File suite:** a suite under that folder whose `file` equals the file
   path. Create it only if none exists: `file_type: "file"`, `parent_id` =
   the folder, `file` = the path, title `<base ID> — <heading without "# ">`
   (base ID = the shared part of the case IDs, e.g. `E2E-OP-006`,
   `API-OP-001`), description = the preamble plus `Jira: <key>` and
   `Source: <path>`.

## Tests — update, don't duplicate

List the file suite's tests with `tests_list` (filter by suite with `tql`;
call `tql_help` once if unsure of the syntax). A test matches a case when
its title starts with `<id>:`. The colon matters, so `E2E-OP-006.1:` never
matches `E2E-OP-006.10:`.

For each case:

- **description**: the case body after the `### ` line, verbatim. For a
  blocked case, start it with
  `> **Blocked (pending):** <reason>` and a blank line.
- **match found** → `tests_update` with the `### ` line text as `title` and
  the description.
- **no match** → `tests_create` in the file suite, `title` = the `### `
  line text, `state: "manual"`, `priority: "normal"`.

## Run

One `runs_create` for all synced tests: `kind: "manual"`,
`title` = `run_title` if given, else `"<key> — <title>"`, `test_ids` =
every synced test, description naming the files and, if any, that blocked
cases are `pending` until their open questions are answered.

Then one `testruns_create` per blocked case: `status: "pending"`,
`message` = its reason.

## Return

A single fenced `json` block and nothing else:

```json
{
  "status": "synced",
  "suites": [{"file": "test-cases/...", "id": "<suite id>", "url": "<url>", "created": false}],
  "tests": [{"case_id": "E2E-OP-006.1", "id": "<test id>", "url": "<url>", "action": "created | updated", "pending": true}],
  "run": {"id": "<run id>", "url": "<url>"},
  "errors": []
}
```

A call that fails goes into `errors` (`"<case or step> — <message>"`) and
the rest continues. If the run can't be created, `run` is `null`.

# Mode `report`

Input: `key`, `run_id` (an existing run, e.g. from an earlier upsert),
`results`: a list of `{case_id, test_id?, status, message}` where `status`
is `passed`, `failed` or `skipped` (e.g. postman-cli-run's `results` as
is). If `run_id` or `results` is missing, or `results` is empty, do
nothing and return `{"status": "error", "reason": "<what is missing>"}`.

Never create a test or a run here. Only results go into the given run.

For each result:

1. **Test id.** Use `test_id` if given. Otherwise find the test with
   `tests_list` whose title starts with `<case_id>:` (same colon rule as
   upsert). None, or more than one → an `errors` entry and skip that
   result.
2. **Status.** `passed`, `failed` or `skipped` as given. Anything else →
   an `errors` entry and skip.
3. `testruns_create` in `run_id` with the test, the status, and `message`
   (for `failed`/`skipped`, the message as given; for `passed`, empty).

## Return

A single fenced `json` block and nothing else:

```json
{
  "status": "reported",
  "run": {"id": "<run id>", "url": "<url if known>"},
  "reported": [{"case_id": "API-OP-001.1", "test_id": "<id>", "status": "passed"}],
  "summary": {"passed": 1, "failed": 0, "skipped": 0},
  "errors": []
}
```
