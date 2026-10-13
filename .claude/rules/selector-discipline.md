---
description: Every data-testid in Steps must actually exist in skypermit
globs: "test-cases/**/*.md"
---

Before writing or editing Steps, grep every data-testid you plan to use
against ../skypermit (app/, components/). If a selector isn't found,
that's a bug to report against skypermit — not a reason to invent one.
