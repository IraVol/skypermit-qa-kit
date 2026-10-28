---
name: testomat-sync
description: Writes the cases from test-cases/ files into Testomat.io — one suite per file under its module folder, one test per case, updating instead of duplicating — and creates one manual run for a story with those tests; cases named as blocked get a pending result with the reason. Step 5 of /story-to-tests, or on its own for files already approved. Not for generating, verifying or editing cases, reading Jira or Confluence, deleting anything in Testomat, or finishing runs.
argument-hint: '{"key": "SKY-1", "title": "...", "files": ["test-cases/..."], "blocked": [{"id": "...", "reason": "..."}]}'
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

A JSON object: `key` and `title` of the story, `files` (paths under
`test-cases/`), `blocked` (case IDs with a one-line reason; may be empty).
If it's missing `key` or `files`, do nothing and return
`{"status": "error", "reason": "<what is missing>"}`.

## Hard limits

- Only the tools above. Never delete or archive a suite, test or run, and
  never finish a run.
- Touch only the suites for the given files and the tests inside them.
- The case text is copied, not rewritten.

## Read the files

For each file: the `# ` heading line, the preamble (text between it and the
first `### `), and each case — a `### <id>: <title>` line and everything up
to the next `### ` or end of file. `<id>` matches `E2E-[A-Z]+-\d+(\.\d+)?`.
The module is the folder under `test-cases/` (`test-cases/flight-request/…`
→ `flight-request`).

## Suites — find before you create

1. **Module folder:** a root suite with `file_type: folder` and title equal
   to the module. List with `suites_list` (`search_text` = module); create
   it (`file_type: "folder"`) only if no exact match exists.
2. **File suite:** a suite under that folder whose `file` equals the file
   path. Create it only if none exists: `file_type: "file"`, `parent_id` =
   the folder, `file` = the path, title `<base ID> — <heading without "# ">`
   (base ID = the shared part of the case IDs, e.g. `E2E-OP-006`),
   description = the preamble plus `Jira: <key>` and `Source: <path>`.

## Tests — update, don't duplicate

List the file suite's tests with `tests_list` (filter by suite with `tql`;
call `tql_help` once if unsure of the syntax). A test matches a case when
its title starts with `<id>:` — the colon matters, so `E2E-OP-006.1:` never
matches `E2E-OP-006.10:`.

For each case:

- **description** — the case body after the `### ` line, verbatim. For a
  blocked case, start it with
  `> **Blocked (pending):** <reason>` and a blank line.
- **match found** → `tests_update` with the `### ` line text as `title` and
  the description.
- **no match** → `tests_create` in the file suite, `title` = the `### `
  line text, `state: "manual"`, `priority: "normal"`.

## Run

One `runs_create` for all synced tests: `kind: "manual"`,
`title: "<key> — <title>"`, `test_ids` = every synced test, description
naming the files and, if any, that blocked cases are `pending` until their
open questions are answered.

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
the rest continues; if the run can't be created, `run` is `null`.
