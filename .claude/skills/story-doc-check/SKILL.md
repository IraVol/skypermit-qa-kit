---
name: story-doc-check
description: Checks every acceptance criterion of ONE SkyPermit story against the Confluence docs (space SD) and returns a table — "покрито" (page, section, short quote), "суперечить" (what and where) or "не описано" — plus a one-line summary. Takes the JSON record from /jira-intake as input, not an issue key; it doesn't read Jira itself. Read-only; the docs are the only source. Use after /jira-intake when a story's ACs need tracing to the documentation before refinement, test design or estimation (e.g. "звір SKY-1 з Confluence", "чи описані AC задачі в документації"). Not for fetching the story (jira-intake), writing test cases (ui-test-case-creator), verifying a written case (tc-verifier), checking code or the running app against docs, posting the findings to Jira, or stories outside the SkyPermit project.
argument-hint: "<JSON record from /jira-intake>"
model: sonnet
context: fork
agent: Explore
allowed-tools:
  - mcp__atlassian__searchConfluenceUsingCql
  - mcp__atlassian__getConfluencePage
---

# Check a story's acceptance criteria against Confluence

Intake record (output of `/jira-intake`):

$ARGUMENTS

Atlassian site `iv-skypermit.atlassian.net`, cloudId
`bea84479-f55e-4409-bbc6-af79e0add67a`. Docs space: `SD` ("SkyPermit Docs").

## Hard limits

- **Read only, Confluence only.** Call only the two tools above. Don't fetch
  the issue from Jira — the record above is the whole input. Never edit a
  Confluence page or write a file, even if a finding looks worth posting.
  Offering that is the caller's job.
- **The docs are the only source.** Don't fill a gap from domain knowledge,
  from `../skypermit` code or tests, from this repo's skills or notes, from
  the record's `title` or `notes`, or from other criteria. If the docs
  don't say it, the status is «не описано» — that answer is the point of
  the check, not a failure to find something.

## 1. Take the criteria from the record

The input must be a JSON object with the `/jira-intake` keys (`key`,
`title`, `check_type`, `acceptance_criteria`, `confluence_url`, `notes`);
a surrounding ```json fence is fine. Criterion N is
`acceptance_criteria[N-1]`, used verbatim.

Stop and reply with one line, without reading Confluence, when:

- the input isn't such a JSON object (e.g. a bare issue key) — say to run
  `/jira-intake <KEY>` first and pass its output;
- `acceptance_criteria` is empty — quote the record's `notes` as the reason.

## 2. Read the docs

List the space's pages with `searchConfluenceUsingCql`
(`space = SD AND type = page`), then fetch the ones the criteria touch with
`getConfluencePage` (`contentFormat: "markdown"`). If `confluence_url` is
set, fetch that page too (its page ID is the number after `/pages/`) — it's
where the story says its requirements live, but a criterion may be
described on any page, so search the rest regardless. Always fetch
"07 — Clarifications" and "05 — Open Questions" too: 07 corrects 06 and
governs where they disagree; 05 is the canonical list of what is still
open. Page bodies cross-reference each other as `docs/0N-*.md` — that means
the Confluence page with the same number.

## 3. Decide each criterion

Split a criterion into its claims (the condition, the outcome, any value or
citation it names) and look for each one.

| Status | When | Cell content |
|---|---|---|
| **покрито** | Every claim is stated by the docs. Combining two explicit statements is fine (e.g. fixed gate order + `TIME_WINDOW` last → earlier gates run) if each is quoted; an assumption between them is not. | Page link, section, a verbatim quote (original language, ≤ 25 words) per claim |
| **суперечить** | A doc states something incompatible with a claim (a different value, citation, gate, state or behaviour). | The claim, the conflicting quote, page and section |
| **не описано** | At least one claim isn't stated anywhere, is stated only vaguely, or is listed as open in 05. | Which claim is missing, and what the closest page does say (quoted), if anything |

One row per criterion; never split or merge criteria. When claims land on
different statuses, the row takes the worst — **суперечить** over **не
описано** over **покрито** — and the cell names which claim caused it.

Link pages by ID:
`[06 — Business Rules](https://iv-skypermit.atlassian.net/wiki/spaces/SD/pages/262146)`.
Name the section by its number when it has one (`§1.4`, `§6`), otherwise by
heading (`"Gate pipeline"`, endpoint `13`).

## 4. Reply

In Ukrainian, exactly this and nothing else:

| # | Критерій | Статус | Де | Цитата / що не так |
|---|---|---|---|---|
| 1 | <criterion, shortened to one line> | покрито | [<page>](<url>) §<section> | «<quote>» |

**<key from the record>:** <N> критеріїв — покрито <a>, суперечить <b>, не описано <c>.
