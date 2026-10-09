# Buyer account entry and redirect repair

## Verified root causes

Lovable's project metadata and the preview identify the deployed commit as
`e6ef049946234410527fe2456d6cc6206743635a`. Later authentication and Seller
work exists on separate branches and was not in that preview.

At that commit:

- Signup checks only the Supabase error, then unconditionally navigates to
  `next`, defaulting to `/`. An email-confirmation-required signup returns no
  session, so the user lands on the homepage without being authenticated and
  without a confirmation instruction.
- Login and signup guest guards trust a locally cached `getSession()` result
  without validating the user with Supabase Auth.
- Both Seller buttons link to `/login` without a Seller continuation. Login
  defaults to `/`, so this is an intentional code path back to the landing page,
  not evidence that Seller onboarding has opened.
- The landing header always displays Sign in. It gives no indication that a
  successful login established a session, and has no direct signup entry.
- Signup's confirmation URL targets `/login`; no dedicated auth callback or
  password recovery routes exist in that deployed version.

A reachable signup form was observed in the browser. The observed login error
"Email not confirmed" is an explicit Supabase rejection, not silent success.
Successful login, an infinite redirect loop, and an authenticated Buyer session
have not been established by the previous screenshots.

## Implemented authentication repair

- Preserve the existing Supabase client, real password authentication, session
  storage, token refresh, branding and layout.
- Keep sessionless signup on the form and show email confirmation instructions.
- Add the existing callback/recovery implementation from the integration branch
  to the main-compatible repair; support PKCE, implicit sessions and token hashes,
  sanitize continuation URLs and show invalid/expired-link errors.
- Validate restored sessions with the Auth server; clear rejected local sessions.
- Verify that password login actually yields a valid session before navigating.
- Expose Signup in the existing header and show Logout for a session.
- Refresh guest-route guards on auth changes outside the Supabase callback lock.
- Add credential autocomplete metadata and trim email input.

## Scope and deployment limitations

No database, Storage, Auth project settings or role data were changed. No account
was created by the agent. Existing Seller onboarding branches remain intact.

This authentication-only patch does not deploy Seller onboarding or rewrite its
schema. The main version still has the old Seller buttons until the separate
Seller implementation is safely reconciled with the live backend. Merging the
entire pending stack would introduce calls to absent Seller relations/RPCs; that
is not safe. Seller routing and backend reconciliation remain unresolved.

## Validation at preparation

- Production build: PASS.
- TypeScript after route generation: PASS.
- ESLint for every changed source/test file: PASS.
- Authentication/navigation tests: 7/7 PASS. These exercise the actual routes and
  Supabase client with an absent session plus redirect/callback URL handling.
  They do not simulate a successful login or constitute live authenticated E2E.
- Full repository ESLint: FAIL, 486 errors and 6 warnings outside the repaired
  source/test files, predominantly baseline formatting. Unrelated files were
  not refactored.
- Live signup, confirmation email, login, refresh, logout and recovery:
  NOT VERIFIED. Private credential entry and inbox confirmation remain needed.
- Deployment/sync of this repair: must be checked separately after the commit;
  this preparation report is not deployment evidence.

## Executed deployment and live public-route verification

PR #4 was merged normally into `main`, preserving published history.
Implementation commit: `8c3ce1e3dabe24a50543adf18f4917ca4fad6673`.
Merge commit: `76dc5bb5b7c28620b39e9d4764971b25333c6727`.

Lovable received both commits but initially showed "Preview is out of date".
The editor's Update preview action was executed. Project metadata subsequently
reported the merge commit, and the refreshed live preview showed the new
Jisajili (Signup) link.

Actual browser checks passed:

1. Landing header exposes Signup and Sign in.
2. Clicking Signup reaches `/signup?next=%2F` and displays Create account.
3. Signup's sign-in link reaches `/login?next=%2F` and remains there as a guest.
4. Forgot password reaches its form without a landing redirect.
5. Visiting the callback without a valid link shows an explicit invalid/expired
   link error with recovery links, and stays on the callback page.

These are live public-route checks, not authenticated end-to-end tests.
The earlier "no usable signup entry" defect is repaired in the preview.
Successful account creation, inbox confirmation, login, persistence, logout,
password recovery and Seller onboarding remain unverified.

Production readiness remains PARTIAL. Full-repository lint and the separate
Seller routing/live-schema incompatibilities remain unresolved. The published
production site was not republished; only the development preview was updated.

WORKFLOW STATUS: PARTIAL
