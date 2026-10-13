# Operator login cases

Cover the `/login` form and the session it creates. The selectors are
`operator-login-form`, `operator-login-email-input`,
`operator-login-password-input`, `operator-login-submit-button` and
`operator-login-error`, plus the header's `operator-login-link`,
`operator-register-link`, `operator-session-info` and
`operator-logout-button`. All of them were checked against
`skypermit/app/login/page.tsx` and `skypermit/components/AppHeader.tsx`.

None of these cases involve the reviewer role. Reviewer identity is the
`X-Reviewer-Id` header, not a login, so it has no place in a login test.

---

### E2E-OP-009: Successful login establishes an operator session

**Doc ref:** `skypermit/docs/04-frontend-spec.md` — "Operator portal"
(**Login** (`/login`) page; "Requires login") and "Two contracts to hold
exactly" (`operator-session-info` / `operator-logout-button` shown when
logged in); `skypermit/docs/03-api-contract.md` — "Authentication &
authorisation" (`POST /auth/login` sets the session cookie)

**Role(s):** Operator

**Preconditions:**
- A registered operator (created via `/register`, so both the Auth user
  and the Operator profile exist) with known email, password and
  `legal_name`.
- Browser has no existing session (fresh context, no cookies).

**Steps:**
1. Open `/login`. Confirm the header shows `operator-login-link` and
   `operator-register-link`.
2. Type the operator's email into `operator-login-email-input`.
3. Type the operator's password into `operator-login-password-input`.
4. Click `operator-login-submit-button`.

**Expected result:**
- Browser navigates to `/operator/pilots`.
- Header shows `operator-session-info` containing the operator's
  `legal_name`, and shows `operator-logout-button`.
- `operator-login-link` and `operator-register-link` are no longer
  rendered.
- `operator-login-error` is not rendered.
- Underlying: `POST /auth/login` succeeded and a session cookie is set.
  `GET /auth/me` now returns this operator.

**Rationale:** This is the baseline for every other operator-portal case.
All operator-scoped data access derives `operator_id` from this session
(`03-api-contract.md`, "Enforcement — server-derived"). If login doesn't
produce a session the header recognises, every downstream operator test
fails for an unrelated reason. Asserting on `operator-session-info`'s
content, not only that it exists, catches a session bound to the wrong
operator profile.

---

### E2E-OP-010: Wrong password is rejected with no session created

**Doc ref:** `skypermit/docs/03-api-contract.md` — "Authentication &
authorisation" (`POST /auth/login`) and the `401` vs `403` note ("`401` is
'who are you'")

**Role(s):** Operator

**Preconditions:**
- A registered operator with known email.
- Browser has no existing session.

**Steps:**
1. Open `/login`.
2. Type the operator's correct email into `operator-login-email-input`.
3. Type a wrong password into `operator-login-password-input`.
4. Click `operator-login-submit-button`.
5. Navigate directly to `/operator/pilots`.

**Expected result:**
- After step 4: still on `/login`. `operator-login-error` is visible with
  the text "Invalid email or password." Header still shows
  `operator-login-link` and does not show `operator-session-info`.
- `operator-login-submit-button` is enabled again, so the operator can
  retry.
- After step 5: redirected back to `/login`. No session was created.
- Underlying: `POST /auth/login` returned `401`.

**Rationale:** Covers the core negative path of the form. Step 5 matters
because a UI that shows an error but still sets a session cookie would
pass a test that checks only the error message. The re-enabled button
checks that the `submitting` state resets on failure.

---

### E2E-OP-011: Unknown email gets the same error as a wrong password

**Doc ref:** `skypermit/docs/03-api-contract.md` — "Authentication &
authorisation" (`POST /auth/login`). The identical-message behavior isn't
stated in the docs. It is implemented behavior in
`skypermit/app/api/v1/auth/login/route.ts`, so this case is
untested-project-behavior.

**Role(s):** Operator

**Preconditions:**
- An email address with no Auth user (e.g. a freshly generated unique
  address).
- Browser has no existing session.

**Steps:**
1. Open `/login`.
2. Type the unregistered email into `operator-login-email-input`.
3. Type any password into `operator-login-password-input`.
4. Click `operator-login-submit-button`.

**Expected result:**
- Still on `/login`. `operator-login-error` shows exactly "Invalid email
  or password.", the same text as `E2E-OP-010`.
- No session: header still shows `operator-login-link`.

**Rationale:** If the unknown-email and wrong-password errors differ,
the login form can be used to check which emails are registered (account
enumeration). Pairing this case with `E2E-OP-010` and asserting identical
text turns any future divergence into a test failure, not a silent change.

---

### E2E-OP-012: Auth account with no operator profile is refused and signed out

**Doc ref:** `skypermit/docs/03-api-contract.md` — "Authentication &
authorisation" (register creates the Auth user *and* the Operator profile
together). The orphan-account branch isn't in the docs. It is implemented
in `skypermit/app/api/v1/auth/login/route.ts` ("No operator profile is
linked to this account."), so this case is untested-project-behavior.

**Role(s):** Operator

**Preconditions:**
- A Supabase Auth user with a known email and password but **no**
  `operators` row. This can't be created through the UI, because
  `/register` always creates both. Seed it directly via the Supabase
  admin API or by deleting the `operators` row of a test account.
- Browser has no existing session.

**Steps:**
1. Open `/login`.
2. Type the orphan account's email into `operator-login-email-input`.
3. Type its correct password into `operator-login-password-input`.
4. Click `operator-login-submit-button`.
5. Navigate directly to `/operator/pilots`.

**Expected result:**
- After step 4: still on `/login`. `operator-login-error` shows "No
  operator profile is linked to this account."
- After step 5: redirected back to `/login`. The Supabase session that
  briefly existed was signed out server-side, so no session remains.
- Underlying: `POST /auth/login` returned `401`.

**Rationale:** Here the Supabase credentials are valid, but the app has
no operator to bind them to. `operators.id` *is* `auth.users(id)`, so a
leftover Supabase session would be a half-authenticated state that every
operator-scoped endpoint would mishandle. Step 5 is the point of the case:
it checks that the route really calls `signOut()` and doesn't only return
an error.

---

### E2E-OP-013: Unauthenticated access to an operator page redirects to login

**Doc ref:** `skypermit/docs/04-frontend-spec.md` — "Operator portal"
("Requires login")

**Role(s):** Operator

**Preconditions:**
- Browser has no existing session.

**Steps:**
1. Navigate directly to `/operator/requests` and wait for
   `operator-login-form` to appear.
2. Repeat for `/operator/pilots`, `/operator/aircraft` and
   `/operator/requests/new`.

**Expected result:**
- Each navigation lands on `/login` with `operator-login-form` visible.
- None of the operator nav selectors (`operator-nav-pilots`,
  `operator-nav-requests`, …) or `operator-session-info` are rendered at
  any point after the session check resolves.

**Rationale:** The gate is client-side (`OperatorGate`). It redirects
only after `/auth/me` resolves as logged out. This case checks that every
operator route sits behind it, so a new page added outside
`app/operator/` or a broken layout is caught. API-level `401` enforcement
is `api-automation`'s job, not this case's.

---

### E2E-OP-014: Logout ends the session

**Doc ref:** `skypermit/docs/04-frontend-spec.md` — "Two contracts to hold
exactly" (`operator-logout-button` shown when logged in);
`skypermit/docs/03-api-contract.md` — "Authentication & authorisation"
(`POST /auth/logout` clears the session)

**Role(s):** Operator

**Preconditions:**
- Logged-in operator (via `E2E-OP-009`'s steps), currently on
  `/operator/pilots`.

**Steps:**
1. Click `operator-logout-button`.
2. Navigate directly to `/operator/requests`.
3. Reload the page.

**Expected result:**
- After step 1: on `/login`. Header shows `operator-login-link` and
  `operator-register-link`. `operator-session-info` is gone.
- After steps 2–3: redirected to `/login` each time. The session cookie
  was actually cleared, not just hidden in client state.

**Rationale:** `logout()` clears the React session state *and* calls
`POST /auth/logout`. If the API call silently fails, the header would
still look logged out while the cookie survives. Steps 2 and 3 force a
fresh `/auth/me` check, which tells those two outcomes apart.

---

### E2E-OP-015: Session survives a page reload

**Doc ref:** `skypermit/docs/03-api-contract.md` — "Authentication &
authorisation" (`POST /auth/login` sets the session cookie; `GET /auth/me`
returns the logged-in operator)

**Role(s):** Operator

**Preconditions:**
- Logged-in operator (via `E2E-OP-009`'s steps), currently on
  `/operator/pilots`.

**Steps:**
1. Reload the page.
2. Click `operator-nav-requests`.

**Expected result:**
- After step 1: still on `/operator/pilots`, not redirected to `/login`.
  `operator-session-info` shows the same `legal_name`.
- After step 2: "My requests" loads for this operator. No login prompt.

**Rationale:** Right after login, the client session comes from
`setOperator(res.data)` in memory, not from the cookie. Only a reload
proves the cookie works and that `/auth/me` restores identity. Without
this case, a broken cookie would go unnoticed until some later test
happened to reload.
