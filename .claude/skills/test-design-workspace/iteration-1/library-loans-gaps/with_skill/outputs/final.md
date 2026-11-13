Output: `.claude/skills/test-design-workspace/iteration-1/library-loans-gaps/with_skill/outputs/library-loans.design.json`

Checker: `OK — BV 9 (27 values), EP 17, ST 4×5 = 20 cells, unknowns 16`

Unknowns:
- U-01 — What happens when borrowing would take a member above 5 books on loan?
- U-02 — Is "between 1 and 3 books" inclusive at both ends (exactly 1, exactly 3)?
- U-03 — For under-12 members, is 1–3 counted as books on loan at a time or per single borrowing; what does the lower bound 1 restrict?
- U-04 — What happens when an under-12 member goes outside 1–3 books?
- U-05 — What happens on a 3rd (or later) renewal attempt?
- U-06 — In which states can a loan be renewed, what state results, and how does renewal change the loan period?
- U-07 — When does the 14-day loan period start, and is day 14 still ACTIVE or already OVERDUE?
- U-08 — When a reservation expires, what state does the loan go to (none of the 4 states fits), counted from when, and is it still RESERVED at exactly 3 days?
- U-09 — (conflict) Is the overdue fine 0.50 EUR/day (Fines, line 11) or 1 EUR/day (Notes for the front desk, line 26)?
- U-10 — Is the 10 EUR cap per loan or per member total?
- U-11 — Does "fines over 5 EUR" mean total outstanding fines or a single loan's fine; do paid fines count?
- U-12 — How is a blocked borrow (fines over 5 EUR) reported?
- U-13 — Are state/action pairs not listed in "Loan states" illegal, and what happens? (no blanket rule; RETURNED not stated as final)
- U-14 — How does a loan come into existence — always via RESERVED, or straight to ACTIVE; is "borrow" the same as "pick up"?
- U-15 — Do RESERVED and OVERDUE loans count toward the 5-book / 1–3-book limits?
- U-16 — How is a member's age determined (and when), and what if it is missing or malformed?

Focus: none given — the whole file was designed.
