# Test cases

Manual test-case definitions for this kit, organized by module:

```
test-cases/<module>/<file>.md
```

Each file holds one or more cases in the format defined by
`.claude/skills/ui-test-case-creator/templates/test-case.md` (ID, Title, Doc
ref, Role(s), Preconditions, Steps, Expected result, Rationale). This
directory is the live, growing registry of cases to actually implement and
track — not teaching material. Worked examples that teach the format live
in `.claude/skills/ui-test-case-creator/examples/` instead; don't move those
here, and don't treat this directory's cases as duplicates of them even if
a case here covers the same scenario.

## Modules

- `flight-request/` — operator-portal and reviewer-queue cases covering
  the flight-request state machine and gate pipeline.
- `auth/` — operator login, logout and session handling on the operator
  portal.

Add a new module directory as new areas of the app get covered (e.g. a
`registry/` module for pilot/aircraft CRUD, once that's in scope).

## ID numbering

IDs are `E2E-<portal>-<seq>` per `test-case.md` (`OP` operator, `REV`
reviewer, `X` cross-role). Sequence numbers are global across this
directory, not per-module — check existing files across all modules
before assigning the next number in a prefix, so two modules never
collide on the same ID.
