Test design written: `.claude/skills/test-design-workspace/iteration-1/duration-focus-06/with_skill/outputs/06-business-rules.duration.design.json`

Checker: `OK — BV 3 (9 values), EP 4, ST n/a, unknowns 5`

Unknowns:
- U-01 — What is the time granularity of window_start/window_end for the duration check (seconds allowed? how is 14 min 59 s or 240 min 30 s judged)?
- U-02 — What does the system return when window_end is equal to or before window_start: the TIME_WINDOW 422 with "TSD-4 §3", or an earlier rejection as malformed?
- U-03 — How are malformed window values handled (missing, null, unparseable, no time zone)?
- U-04 — In what order are the conditions inside TIME_WINDOW evaluated, so which rule_reference wins when duration and another TIME_WINDOW condition both fail?
- U-05 — Which action/endpoint runs the gate pipeline, and what state does a request end in when it fails duration?

Focus: "Duration" matched the `Duration` row of §1.4 `TIME_WINDOW` (line 95) and its `rule_reference` row in §6 (line 188). Nothing in the focus was left unmatched. ST is not applicable: the Duration condition defines no states or transitions.
