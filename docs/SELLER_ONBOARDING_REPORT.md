# Seller registration and onboarding report

Audit date: 2026-10-06. Repository: `masemohjuma-bot/dukapambe`. Audited baseline: `e6ef049946234410527fe2456d6cc6206743635a`.

The requested feature was not present in the audited checkout. Both seller calls to action sent visitors to `/login` with no continuation; successful sign-in consequently returned them to `/`. There were no seller registration, status, or dashboard routes. Existing generated Supabase types did contain Buyer and Seller profiles and legacy onboarding RPCs.

The implementation is supplied on the feature branch `feat/seller-onboarding`. It is not deployed to production. The live Supabase migration has NOT been applied; this report does not claim that production tables or buckets have been created. Buyer Login, Signup, Supabase client, and authentication handlers are unchanged. The existing landing-page appearance is unchanged; only the two seller CTA destinations changed. No existing functionality was removed. There is no Affiliate onboarding or Admin approval interface/decision endpoint in this change.

**1. Files changed**

| File                                                       | Change                                                                                               |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `src/routes/index.tsx`                                     | Both Seller CTAs now target `/seller/register`.                                                      |
| `src/routes/seller.register.tsx`                           | Authenticated eligibility guard and wizard route.                                                    |
| `src/routes/seller.status.tsx`                             | Application status, IDs, application date, review comments, rejected resubmission, approval polling. |
| `src/routes/seller.dashboard.tsx`                          | Approved-only dashboard entry; no dashboard redesign or invented metrics.                            |
| `src/routeTree.gen.ts`                                     | Generated registration of the three new routes.                                                      |
| `src/routes/__root.tsx`                                    | Error-boundary parameter now accepts `unknown`, matching the router's type contract.                 |
| `src/components/seller/SellerWizard.tsx`                   | Six-step form, review, confirmation, versioned terms, resume and success feedback.                   |
| `src/components/seller/DocumentUpload.tsx`                 | Private preview, upload, replacement, deletion and error feedback.                                   |
| `src/components/seller/SellerLayout.tsx`                   | Layout using the existing design tokens.                                                             |
| `src/hooks/use-seller-onboarding.ts`                       | Debounced autosave, serialized mutations, revision checks, resume and session feedback.              |
| `src/lib/seller/service.ts`                                | Supabase services, route guards, uploads, submission, comments and receipts.                         |
| `src/lib/seller/model.ts`                                  | Field definitions, required-step validation, file validation and status routing.                     |
| `src/lib/seller/database.ts`                               | Types for the added tables and RPCs.                                                                 |
| `src/integrations/supabase/types.ts`                       | Adds those types to the existing schema and adds Suspended/Blocked application states.               |
| `supabase/migrations/20261006110000_seller_onboarding.sql` | Tables, constraints, functions, guards, storage policies and approval-triggered provisioning.        |
| `tests/seller-model.test.ts`                               | Validation, status destinations and file signature/size/type checks.                                 |
| `tests/seller-baseline.sql`                                | Isolated PostgreSQL test fixture; not a production baseline or authentication implementation.        |
| `tests/seller-database.test.mjs`                           | Executes the migration and tests persistence, permissions and lifecycle behavior in PostgreSQL.      |
| `tests/seller-routes.test.mjs`                             | Real Supabase absent-session route guards and CTA/error checks.                                      |
| `package.json`                                             | Adds seller tests, type checking and the development-only PostgreSQL test dependency.                |
| `bun.lock`                                                 | Locks that development dependency, preserving existing package resolutions.                          |
| `docs/SELLER_ONBOARDING_REPORT.md`                         | This report.                                                                                         |

**2. Database tables created/updated**

The migration defines the following; none is confirmed created in the live project.

| Table                                                                   | Purpose                                                                                                                                                 |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `seller_onboarding` (new)                                               | Application UUID, Buyer/Seller user relationship, all business/owner/payment/store fields, six-step progress, revision, terms version, submission date. |
| `seller_documents` (new)                                                | Owned private file references, document kinds, bucket/path, size and MIME constraints.                                                                  |
| `seller_stores` (new)                                                   | Store UUID, owner FK, unique name/slug, description, hours, delivery, pickup, shipping regions, logo/banner paths.                                      |
| `seller_verification` (new)                                             | Seller-specific verification status and badges.                                                                                                         |
| `seller_preferences` (new)                                              | Initial notification preferences following external approval.                                                                                           |
| `seller_notifications` (new)                                            | Idempotent welcome notification following external approval.                                                                                            |
| `seller_application_comments` (new)                                     | Owner-readable review comments; no client/admin-writing interface added.                                                                                |
| `seller_profiles` (existing)                                            | Updated on submission; case-insensitive business-registration uniqueness; approval provisioning trigger.                                                |
| `profiles` (existing)                                                   | Buyer → Seller role promotion only after an approved seller state.                                                                                      |
| `storage.buckets` / `storage.objects` (existing Supabase system tables) | Bucket definitions and restrictive ownership/edit policies.                                                                                             |

Foreign keys use the existing profile relationship and cascade dependent seller data. Business, owner and payment details are kept in an owner-readable application row, not a public store record. Store-name, slug and registration uniqueness is enforced in PostgreSQL, and submission rolls back atomically on conflicts.

The migration preserves the bodies of the existing `protect_profile_security_fields` and `protect_seller_application_state` trigger functions, adding narrow exceptions for approval-backed role promotion and a submission certified by the same transaction's validated application record. The existing Buyer authentication functions are untouched. Legacy `begin_seller_onboarding` and `submit_seller_application` RPC execution is revoked from client roles to prevent bypassing the new required-step validation; trusted database functions retain access. Original function definitions must be reviewed against the connected project before deployment, since this repository lacks its baseline schema.

**3. Storage buckets created**

Configured by the migration, not yet applied live:

| Bucket             | Visibility | Formats        | Limit / path                                               |
| ------------------ | ---------- | -------------- | ---------------------------------------------------------- |
| `seller-documents` | Private    | PDF, PNG, JPEG | 10 MB; `<user-id>/<document-kind>/<random-id>.<extension>` |
| `store-logos`      | Private    | PNG, JPEG      | 10 MB; `<user-id>/logo/<random-id>.<extension>`            |
| `store-banners`    | Private    | PNG, JPEG      | 10 MB; `<user-id>/banner/<random-id>.<extension>`          |

Bucket restrictions enforce size and declared MIME type. The application also checks file signatures before uploading. Metadata is linked only after the stored object is verified. Document previews use 60-second signed URLs. Restrictive policies constrain other permissive storage policies for these buckets; another user or anonymous visitor cannot read the files even with a deliberately broad preexisting policy. In-place updates are forbidden. Referenced objects cannot be deleted until their application reference is removed. Replacement uploads use new random paths.

**4. Components created**

`SellerWizard`, `DocumentUpload`, `SellerLayout`, route-level `SellerStatus`, and `SellerDashboardEntry`. The wizard contains Business Information, Owner Information, Business Documents, Bank & Payment, Store Setup, and Review. All fields requested are collected. Business registration/license number is also collected to enforce duplicate-registration protection. Website, GPS, alternative phone, SWIFT, TIN, passport, and store artwork are optional; company registration is required for a Company. Bank/mobile-money destination fields are conditionally required by the preferred method.

**5. Services created**

`src/lib/seller/service.ts`: eligibility, registration/status/dashboard guards, starting/loading applications, saving steps, listing/uploading/replacing/deleting/previewing documents, submitting applications, reading comments and displaying IDs/receipts, plus friendly duplicate, network, session and database errors.

Database functions: `seller_start`, `seller_save_step`, `seller_set_document`, `seller_submit`, `seller_can_edit`, `seller_is_approved`, `seller_step_errors`, `seller_activate`, `seller_initialize_dashboard`, and trigger-only `seller_approval_provision`. Trigger-only/internal validation functions are not callable by clients. Approval provisioning reacts to an external approval; it cannot approve an account.

**6. Routes created**

| Route               | Access/behavior                                                                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/seller/register`  | Signed-out visitors go to Login with `next`; Buyer drafts/rejections resume the wizard; pending accounts go to status; approved accounts go to dashboard. |
| `/seller/status`    | Owner status and comments, progress receipt, rejected edit/resubmission; checks approval every 15 seconds and automatically redirects approved accounts.  |
| `/seller/dashboard` | Requires approved application and unrestricted account; activates the approved Seller role and idempotently initializes preferences/notification.         |

Draft, Submitted, Pending Review, Approved, Rejected, Suspended and Blocked are supported, alongside existing Under Review/More Information Required states. Account Disabled/Suspended/Blocked takes precedence over application approval. Rejected applications can edit and submit again without an Admin interface in this feature.

**7. Hooks created**

`useSellerOnboarding`: 900 ms debounce, save-after-step completion, database resume, sequential save/upload operations, optimistic revision checking, save/error/loading indicators, session-expiration feedback and warning before leaving with unsaved edits. Sensitive application data is not written to browser local storage.

**8. Validation results**

`npm run test:seller`: **14 test groups passed, 0 failed**.

| Coverage                                                          | Result / scope                                                                                                                                  |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Buyer → Seller application creation                               | Passed against isolated PostgreSQL baseline fixture.                                                                                            |
| Required fields, step ordering and resume                         | Passed frontend validation and database checks, including incomplete draft persistence.                                                         |
| Stale save revision                                               | Passed; stale writes are rejected.                                                                                                              |
| Upload type, size and signature checks                            | Passed application file validation.                                                                                                             |
| Document ownership, replace/delete and referenced-file protection | Passed PostgreSQL/storage-policy tests, including a deliberately broad old storage policy.                                                      |
| Confirmation and terms requirement                                | Passed; submission fails without acceptance.                                                                                                    |
| Submission and Store Profile creation                             | Passed; submission is atomic, creates store and records dates/terms/progress.                                                                   |
| Duplicate business, store name and slug                           | Passed; conflicts roll back submission.                                                                                                         |
| Rejection and resubmission                                        | Passed against PostgreSQL fixture.                                                                                                              |
| External approval and role assignment                             | Passed; role, badges, preferences and welcome notification are provisioned; repeated activation is idempotent.                                  |
| Suspended access                                                  | Passed; seller-only reads and activation are denied.                                                                                            |
| Signed-out protected routes                                       | Passed actual Supabase-client absent-session guard execution; all three preserve Login continuation. No auth method/token/user response mocked. |
| Seller CTA destinations / friendly errors                         | Passed.                                                                                                                                         |
| `npm run typecheck`                                               | Passed.                                                                                                                                         |
| ESLint for new seller components/services/routes/hook             | Passed, no warnings.                                                                                                                            |
| Full repository lint                                              | Fails on repository-wide existing formatting/lint debt; no broad cleanup was performed. The audited run reported 495 errors and 6 warnings.     |
| Live Buyer login/upgrade and real Supabase uploads                | Not executed: no Supabase administration connection or test Buyer credentials available.                                                        |
| Browser/responsive interaction                                    | Not executed: Chromium download returned an invalid archive in this environment.                                                                |

PostgreSQL tests run the actual migration in PGlite with an isolated fixture of the existing database contracts. They do not establish compatibility with the unseen live baseline, live Storage API behavior, browser behavior, or production deployment. The application uses existing Supabase authentication throughout; there is no mock authentication implementation.

**9. Production build result**

`npm run build`: **passed**, including Vite client, SSR and Nitro/Cloudflare output. Existing bundler warnings about dependency `use client` directives and `vite-tsconfig-paths` remain. Direct dependency versions used for the final build were checked against the existing Bun lock resolutions and matched. Bun's installer could not run in this environment; the new single-package lock entry was added using the installed registry integrity value, and a frozen Bun install remains unverified. No website deployment was attempted.

**10. Commit hash**

The exact delivered commit hash and draft pull-request URL are provided in the delivery message. The report is included in that commit; it does not embed its own hash. All code changes are confined to the existing `dukapambe` repository. The separate `DUKAPAMBE-DOCUMENTS` repository is untouched.

**11. Remaining limitations**

- The live Supabase migration must be applied and checked before merging/deploying the frontend. This session cannot create live tables/buckets or inspect the original security-function definitions. The migration targets the existing connected schema, not an empty database. Existing duplicate registrations must be reconciled before its unique index can be created.
- A real Buyer account is needed to verify sign-in continuation, cross-session resume, real uploads/signed previews, submission, review comments, external approval and dashboard redirect in staging. Browser/device interaction testing remains outstanding.
- No Seller Dashboard implementation existed in the audited checkout. The new route is a protected entry confirming account readiness; product/order management, analytics and a full dashboard are outside this onboarding change.
- The visible versioned Seller Terms are a basic agreement supplied with the flow. Business owners must review them and provide their approved policy/terms before rollout.
- Upload cleanup failures are reported. Failed metadata linking attempts cleanup; replacement/delete failures may leave unreferenced private objects requiring support cleanup. No scheduled storage-cleanup worker is included.
- Admin approval decisions/comment-writing UI and Affiliate onboarding were intentionally not added. Comments/status changes require the existing trusted operational process; this feature only reads them and provisions an externally approved account.
- The full repository lint and frozen Bun installation are not passing/verified gates for this delivery; targeted seller lint, TypeScript, tests and production build are passing.

This is a locally validated implementation ready for review and staging integration, not a claim that the live seller flow is already operational.
