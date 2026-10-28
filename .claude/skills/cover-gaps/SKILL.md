---
name: cover-gaps
description: Знаходить бізнес-правила SkyPermit без тест-кейсів, генерує UI-кейси через ui-test-case-creator і пропускає лише перевірені tc-verifier.
argument-hint: "[max-rules] [gate]"
disable-model-invocation: true   # дорогий пайплайн — лише ручний /виклик
allowed-tools:
  - Read
  - Grep
  - Glob
  - Write(test-cases/**)
  - Bash(node scripts/uncovered-rules.mjs:*)
  - Bash(rm test-cases/:*)
  - Write(.notes/open-questions.md)
  - Edit(.notes/open-questions.md)
---

# Cover gaps

A fixed three-step chain. You are the orchestrator: you pass rule blocks to
the generator, case paths to the verifier, and act on verdicts. Don't read
the business-rules docs or the generated case files yourself — the script
already extracted what the generator needs, and the verifier reads the
cases in its own context. Keeping this context small is the point of the
design.

## Step 1 — uncovered rules (script, no model)

!`node scripts/uncovered-rules.mjs $ARGUMENTS`

If the output above starts with `ERROR:` or says `No uncovered rules`,
skip to the summary with an empty `results` list (for `ERROR:`, put the
message in `open_questions` so the user sees it).

Each `### <rule_reference> — <condition>` block above is one rule to cover.
`case_id` and `file` are pre-assigned — never change them.

## Step 2 — generate (ui-test-case-creator, Sonnet)

For every rule block, invoke the `ui-test-case-creator` skill with the block
text verbatim as its argument (heading line plus all its `- ` lines, and the
`## <GATE>` it sits under). Issue the calls for all blocks in one message so
they run side by side; each writes its own file, so they don't collide.

Each returns one JSON line: `written` or `blocked` with a reason. A
`blocked` rule gets no verifier run; record it as described in Step 4.

## Step 3 — gate (tc-verifier, Haiku)

For every `written` file, launch the `tc-verifier` agent with
`file`, `rule_reference` and `gate`. Again, all in one message.

## Step 4 — act on verdicts

The file's verdict is the verifier's `verdict` (the worst of its cases);
reasons and questions are listed per case ID.

| Verdict | Case file | Result entry | Also |
|---|---|---|---|
| `відповідає` | keep | `file` = path | — |
| `не відповідає` | `rm` it | `file` = `null` | list under "Не покрито" with the reasons |
| `документація мовчить` | `rm` it | `file` = `null` | add the verifier's `question` to `open_questions` |
| creator `blocked` | nothing was written (if a file exists, `rm` it) | `verdict` = `не створено`, `file` = `null` | list under "Не покрито" with the reason |

Independently of the verdict, a rule the script marked `⚠ citation not yet
confirmed` adds one open question: "Підтвердити цитату `<rule_reference>`
для «<condition>» (05-open-questions.md, рядок 5)".

Only remove files this run created — paths from Step 1's `file` lines.

If there are open questions, append them to `.notes/open-questions.md`
(create it with a `# Open questions` heading if missing) under a dated
`## /cover-gaps <YYYY-MM-DD>` subheading, one bullet each, so they outlive
this session.

## Step 5 — summary

Reply in Ukrainian, in this order and nothing else:

1. If any rule ended without a kept case: a heading **Не покрито** and one
   bullet per rule — `<rule_reference>` (`<gate>`) — <condition>: <reasons,
   one line>.
2. The summary, exactly in this shape, as a fenced `json` block. This is
   an interface for the next step, so don't add, rename or drop keys:

```json
{
  "rules_checked": 0,
  "gaps_found": 0,
  "results": [
    { "rule_reference": "<з 06-business-rules.md>", "gate": "<GATE>", "case_id": "E2E-OP-0XX", "verdict": "відповідає", "file": "test-cases/..." }
  ],
  "open_questions": []
}
```

`rules_checked` and `gaps_found` come from Step 1's header line.
`results` has one entry per rule processed this run, in Step 1's order.
`open_questions` is a list of strings, each starting with the
`rule_reference` it concerns.
