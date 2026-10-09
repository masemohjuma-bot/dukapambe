# Buyer login and Seller entry verification — 2026-10-09

## Root cause
The deployed Seller buttons linked to `/login` without a continuation. The validated guest-route guard redirected a signed-in Buyer to its default `/`. The deployed main branch contained no Seller routes. Existing Seller code on an unmerged branch also depended on tables/RPCs absent from the live Supabase catalog, so simply merging that branch would not fix the workflow.

## Verified before repair
The live preview showed its authenticated Logout (`Toka`) control. After a browser refresh, the control returned when session restoration completed. Clicking `Uza Bidhaa` navigated through `/login?next=%2F` to `/`, preserving the session but failing to open onboarding. Signup, email inbox confirmation, logout and password recovery were not independently completed in this test.

## Repair
Restore the existing Seller wizard/components/routes without redesigning them. Both landing Seller links now target `/seller/register`; guests preserve this destination through login. Reuse the existing Supabase client and authentication. Adapt services to the catalog-verified flattened `seller_applications` and `seller_application_documents` tables, one-based completion steps, timestamp concurrency checks, uppercase document types and owned application folders. Use existing `store-logos`, `store-banners` and private `seller-documents` buckets. Require the artwork/company documents and limits enforced by the live backend. Never call the legacy onboarding RPC that deletes a Buyer profile. Application status takes precedence for route authorization. Preserve existing external approval/provisioning; do not grant roles or approve an application from the frontend.

No migrations, tables, buckets, RLS policies or approval logic were created or modified. The Supabase trigger definitions were inspected read-only again before adapting submission.

## Validation
Production build: PASS.
TypeScript: PASS.
Changed source/test ESLint: PASS.
Authentication/guest-route/Seller contract tests: 12/12 PASS (real absent-session guards and pure contract/validation tests; no simulated authenticated success).
Full repository ESLint: FAIL — 486 existing errors and 6 warnings outside changed source/test files.

## Remaining verification
Live preview was explicitly updated after merging PR #5. Verified in the signed-in browser: Become Seller opens `/seller/register`; a real Buyer-owned draft loads with Saved status; Save & resume later completes and returns to landing intentionally; Become Seller resumes the saved draft; later required steps are disabled; requesting `/seller/dashboard` as this unapproved Buyer redirects to onboarding, without a landing fallback. Completing the application requires the user's business/owner/payment information and real document uploads; no invented documents or business records are submitted. Email confirmation, recovery inbox delivery, logout/login, file replacement/deletion, submission and externally approved Seller access remain unverified until actually exercised. The existing backend provisions Seller profile/store/preferences/notifications on APPROVAL, not submission. No approval action is part of this phase. Some requested bucket names differ from existing backend bucket names; this repair uses the verified existing configuration rather than creating duplicates.

WORKFLOW STATUS: PARTIAL

## Commits
Implementation: `4b3105e02f3800a877831f0375698154a331c76e`.
Merged into connected main: `f9ed0b7560b4823466d57e622f3176350d16beb6` (PR #5).

## Next manual step
The existing authenticated browser is left on Business information. Enter your actual business details and choose Save & continue. Owner/payment data, documents and acceptance must be provided by the account holder. Full submission and the rest of the journey remain unverified; no claim of a fully production-ready workflow is made.
