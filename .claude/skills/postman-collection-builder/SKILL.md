---
name: postman-collection-builder
description: Builds ONE Postman collection and its environment from SkyPermit API test-case files (test-cases/**) and ../skypermit/public/openapi.yaml through Postman MCP — one or more requests per case, named "<case id>: …", each with status tests and, for 422, failing_gate / rule_reference / message tests; secrets live only as environment variables. Creates, then stops and returns the list of requests and assertions for review. Never runs anything. Use when approved API cases need a Postman collection ("збери колекцію для SKY-2", "/postman-collection-builder"). Not for running the collection (postman-cli-run), writing or verifying the cases themselves, UI/E2E cases, or editing an existing collection.
argument-hint: '{"key": "SKY-2", "title": "...", "files": ["test-cases/..."], "collection_name": "SKY-2 lead time", "base_url": "https://skypermit.vercel.app/api/v1", "workspace_id": "e9513c23-7247-48d5-b2c6-8805970e25f9"}'
model: sonnet
context: fork
agent: general-purpose
allowed-tools:
  - Read(test-cases/**)
  - Read(../skypermit/public/openapi.yaml)
  - Grep(test-cases/**)
  - mcp__postman__getCollections
  - mcp__postman__getEnvironments
  - mcp__postman__createCollection
  - mcp__postman__createEnvironment
  - mcp__postman__getCollection
  - mcp__postman__getEnvironment
---

# Build a Postman collection from API cases

Input:

$ARGUMENTS

A JSON object. Required: `key`, `files`. Defaults:
`collection_name` = `<key>`, `base_url` = `https://skypermit.vercel.app/api/v1`,
`workspace_id` = `e9513c23-7247-48d5-b2c6-8805970e25f9` (workspace "SkyPermit").
If `key` or `files` is missing, do nothing and return
`{"status": "error", "reason": "<what is missing>"}`.

## Hard limits

- **Build, don't run.** Never send a request to the app, never call the
  Postman CLI. Creating the collection and environment is the only write.
- **Only the tools above.** Never update, replace or delete an existing
  collection or environment. If a collection named `collection_name`
  already exists in the workspace, create nothing and return
  `{"status": "exists", "collection_id": "<uid>"}`.
- **The cases are the spec.** Every request and assertion traces to a case
  and to `openapi.yaml`. Don't add cases, don't drop assertions a case
  states, don't invent endpoints, fields or status codes. A case that names
  an endpoint or field missing from `openapi.yaml`, or has no expected
  status, is **skipped** with the reason. Don't work around it.
- **Secrets only as environment variables.** Passwords, tokens, API keys
  and anything in `OperatorSession`/`ReviewerHeader` go in the environment
  as `type: "secret"`. Use an empty value when the user has to fill it in.
  They never appear as literals in the collection JSON (bodies, headers,
  scripts) or as collection variables. A script that generates a one-off
  credential stores it with `pm.environment.set`, never
  `pm.collectionVariables.set`.

## Read

1. `../skypermit/public/openapi.yaml`: paths, request schemas (required
   fields), response codes, `GateFailure`, security schemes.
2. Each file in `files`: every case is a `### <id>: <title>` line plus
   everything up to the next `### ` or end of file. From the body take the
   preconditions, the request(s) (method + path), the inputs, and the
   expected outcome (status, body fields, follow-up state).

## SkyPermit facts the requests must respect

- Operator calls rely on the session cookie that `POST /operators`
  (register) or `POST /auth/login` sets, and the run's cookie jar carries it
  forward. They never send `X-Reviewer-Id`.
- Reviewer calls send `X-Reviewer-Id: {{reviewerId}}` and nothing else for
  auth. `reviewerId` is an environment variable.
- `operator_id` is never sent. The server derives it.
- A new operator is always `L1`. Data that has to pass the earlier gates
  (`PILOT → AIRCRAFT → ZONE → TIME_WINDOW`) must fit L1. If a case's
  preconditions can't be met through the API, skip it with the reason.
- Times are UTC ISO strings computed in a pre-request script relative to
  `Date.now()`, never hard-coded dates.
- Unique fields (`email`, `national_id`, `serial_number`) are generated per
  run: `Date.now()` plus a random suffix.

## Structure

- Environment `<collection_name> env`: `baseUrl` = `base_url` (`default`),
  plus every secret the requests reference (`secret`, empty unless it's
  generated at runtime). Add `reviewerId` (`default`, value `qa-reviewer`)
  only if some request needs it.
- Collection `collection_name`. Its description names `key`, `title`, the
  source files, `openapi.yaml`, and warns that a run against a deployed URL
  leaves permanent data (there's no delete API).
- Folder `00 Setup`: the shared preconditions (register operator, create
  pilot/aircraft…). Request names start with `SETUP: `. Each request still
  tests its own status and saves the IDs the cases need.
- One folder per source file, titled after its `# ` heading. Inside it, the
  requests for each case in file order. **Every request belonging to a case
  is named `<case id>: <short action>`.** The prefix is how `postman-cli-run`
  maps results back to cases, so never omit it and never put two case IDs
  in one name.
- All URLs are `{{baseUrl}}/<path>`. Ids passed between requests go in
  collection variables (non-secret only).

## Tests in every request

Every request gets a `test` event. At minimum:

```js
pm.test('Status <code>', () => pm.response.to.have.status(<code>));
```

Every request that expects `422` also gets all three body assertions, with
the exact values from the case:

```js
const b = pm.response.json();
pm.test('failing_gate = <GATE>', () => pm.expect(b.failing_gate).to.eql('<GATE>'));
pm.test('rule_reference = <ref>', () => pm.expect(b.rule_reference).to.eql('<ref>'));
pm.test('message is a non-empty string', () => {
  pm.expect(b.message).to.be.a('string');
  pm.expect(b.message.trim()).to.not.be.empty;
});
```

Add every other check the case's expected result states (state after the
call, fields filled in, `ok: true`…), one `pm.test` each, named after what
it checks. Don't assert on `message` text. It's for people and may change.

## Create

1. `getCollections` and `getEnvironments` for the workspace. Apply the
   "exists" rule above.
2. `createEnvironment`, then `createCollection` with the whole item tree
   in one call.
3. `getCollection` on the new uid. Confirm the folder and request count
   matches what you built and that no request is missing its `test` event.

## Return, then stop

A single fenced `json` block and nothing else:

```json
{
  "status": "created",
  "collection": {"id": "<uid>", "name": "<collection_name>"},
  "environment": {"id": "<uid>", "name": "<env name>", "variables": [{"key": "baseUrl", "type": "default"}]},
  "requests": [
    {"folder": "00 Setup", "name": "SETUP: Register operator", "method": "POST", "path": "/operators", "case_id": null,
     "assertions": ["Status 201", "Operator has id"]},
    {"folder": "<file heading>", "name": "<case id>: Submit", "method": "POST", "path": "/flight-requests/{{fr_id}}/submit", "case_id": "<case id>",
     "assertions": ["Status 422", "failing_gate = TIME_WINDOW", "rule_reference = TSD-4 §2.1", "message is a non-empty string"]}
  ],
  "skipped": [{"case_id": "<id>", "reason": "<one line>"}],
  "run_hint": "postman collection run <collection uid> -e <environment uid>",
  "errors": []
}
```

This is for review. Don't suggest running it, and don't run it.
