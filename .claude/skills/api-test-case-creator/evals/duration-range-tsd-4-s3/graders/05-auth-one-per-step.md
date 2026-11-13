---
type: llm
focus: trace
weight: 1
---

Every HTTP step names exactly one auth (operator session, X-Reviewer-Id or none); no operator step sends X-Reviewer-Id and no step sends operator_id in the body.
