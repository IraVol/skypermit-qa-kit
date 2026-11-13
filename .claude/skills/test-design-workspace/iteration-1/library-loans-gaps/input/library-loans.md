# Library loans — spec v0.3

## Borrowing limits

- A member may have at most 5 books on loan at a time.
- Loan period is 14 days. A loan can be renewed up to 2 times.
- Members under 12 years old may borrow between 1 and 3 books.

## Fines

- Fine is 0.50 EUR per day overdue, capped at 10 EUR.
- Members with fines over 5 EUR cannot borrow.

## Loan states

A loan is RESERVED, ACTIVE, OVERDUE or RETURNED.

- RESERVED → ACTIVE when the book is picked up.
- ACTIVE → RETURNED when the book is returned.
- ACTIVE → OVERDUE automatically when the loan period ends.
- OVERDUE → RETURNED when the book is returned.
- A reservation expires after 3 days.

## Notes for the front desk

Overdue fine: 1 EUR per day.
