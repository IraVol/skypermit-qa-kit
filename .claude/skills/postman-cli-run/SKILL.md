---
name: postman-cli-run
description: Runs ONE Postman collection with its environment through the Postman CLI and returns pass/fail per test case — results grouped by the "<case id>:" request-name prefix — as a JSON report for testomat-sync report mode. Runs only after the user has explicitly said to run in this conversation (e.g. «запускай» at the /story-to-api-tests gate), because a run against a deployed SkyPermit writes permanent data. Use after a collection built by postman-collection-builder has been reviewed ("прожени колекцію SKY-2", "/postman-cli-run"). Not for building or editing collections (postman-collection-builder), fixing failing tests, or pushing results to Testomat itself (testomat-sync).
argument-hint: '{"key": "SKY-2", "collection_id": "<uid>", "environment_id": "<uid>"}'
allowed-tools:
  - mcp__postman__getCollection
  - mcp__postman__getEnvironment
  - Bash(postman collection run:*)
  - Bash(mkdir -p api-automation/runs)
  - Read(api-automation/runs/**)
---

# Run a Postman collection and report per case

Input:

$ARGUMENTS

A JSON object: `key`, `collection_id`, `environment_id` (Postman uids,
`<owner>-<uuid>`). If any is missing, do nothing and return
`{"status": "error", "reason": "<what is missing>"}`.

## Hard limits

- **Only on an explicit go.** Run only if the user, in this conversation,
  explicitly told you to run this collection: a manual `/postman-cli-run`,
  or «запускай» at the /story-to-api-tests gate. Otherwise return
  `{"status": "error", "reason": "no explicit go from the user to run"}`.
  Every run against `skypermit.vercel.app` leaves permanent data.
- One run per invocation. Never retry on failure. Never edit the
  collection, environment or app to make a test pass.
- Never print or copy secret environment values into the report or chat.
- Results come from the CLI output only. A case's status is never inferred
  from its name or from what "should" happen.

## Before the run

1. `getEnvironment`: read `baseUrl`. Its value goes into the report as
   `base_url`.
2. `getCollection` (default map): list the request names. A **case
   request** is one whose name matches `^([A-Z0-9]+(?:-[A-Z0-9]+)*-\d+(?:\.\d+)?):\s`.
   Capture group 1 is the case ID. A name starting with `SETUP: ` is a
   setup request. Anything else is `unmapped`. Keep the IDs in collection
   order.
3. If there is no case request at all, don't run. Return
   `{"status": "error", "reason": "no request named \"<case id>: …\" — nothing to map results to"}`.

## Run

```bash
mkdir -p api-automation/runs
postman collection run <collection_id> -e <environment_id> --disable-unicode -x \
  > api-automation/runs/<key>-<YYYYMMDD-HHMMSS>.log 2>&1
```

`-x` keeps the exit code at 0 when tests fail, so a failing test isn't
mistaken for a broken run. `--output` is Enterprise-only, so the log is
the report. Then `Read` the log.

If the log shows the CLI couldn't start (not logged in, invalid API key,
collection/environment not found), return
`{"status": "error", "reason": "<first error line>"}`. For a login
problem, add `"hint": "! postman login --with-api-key <key>"`.

## Parse the log

With `--disable-unicode` the CLI prints one block per request:

```
<folder path> <request name>

  POST https://… [<code> <text>, <size>, <time>]      ← or [errored] + reason on the next line
  Pass  <assertion name>                               ← passed assertion
  3. <assertion name>                                  ← failed assertion; 3 = row in the failures table
```

After the summary table comes the failures table. Each row is
`<n>.  <AssertionError|Error|…>  <assertion name>`, followed by the detail
lines and `inside "<folder path> / <request name>"` (or just the request
name).

For each request: HTTP code (or `errored`), the passed assertions, and the
failed assertions with their detail from the failures table (match on `n`).

## Per case

Group the case requests by case ID. A case is:

- `passed`: every one of its requests ran (not `errored`), and every
  assertion in them passed.
- `failed`: any of its requests errored, or any assertion failed. The
  `message` names each failure as
  `<request name> — <assertion name>: <detail>`, joined with `; `.
- `skipped`: a case request listed in the collection that never appears
  in the log (the run stopped early). The `message` says so.

Setup requests don't become results. If any of them failed, add their
failures to `setup.failures`. Then prefix every `failed` or `skipped` case
message with `setup failed — ` so the cause is visible in Testomat.

## Return

A single fenced `json` block and nothing else. `results` is the part
testomat-sync reports from. Its `status` values are Testomat's
`passed` / `failed` / `skipped`.

```json
{
  "status": "completed",
  "key": "SKY-2",
  "collection_id": "<uid>",
  "environment_id": "<uid>",
  "base_url": "https://skypermit.vercel.app/api/v1",
  "log": "api-automation/runs/SKY-2-20261103-171500.log",
  "setup": {"status": "passed", "failures": []},
  "results": [
    {"case_id": "API-002.1", "status": "passed", "message": "", "requests": ["API-002.1: Validate", "API-002.1: Get request"]},
    {"case_id": "API-002.2", "status": "failed", "message": "API-002.2: Submit — Status 422: expected response to have status code 422 but got 200", "requests": ["API-002.2: Submit"]}
  ],
  "summary": {"passed": 1, "failed": 1, "skipped": 0},
  "unmapped": ["<request names with no case id or SETUP: prefix>"],
  "errors": []
}
```
