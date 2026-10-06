# Phase 2A.4 deployment runbook

Current release gate: **BLOCKED**. Do not run a blind `supabase db push` against project `kwacxbapokecpzmmjtwg`.

## 1. Obtain authorized project access and inventory

Install/connect the Supabase plugin to the configured project, or use an authorized Supabase Dashboard/CLI account. The frontend publishable key cannot perform privileged migrations, catalog inspection or Auth configuration. Never put service-role keys, database passwords or test passwords in Vite variables, committed files or chat.

```sh
supabase login
supabase link --project-ref kwacxbapokecpzmmjtwg
supabase migration list
```

Run `supabase/verification/phase_2a4_inventory.sql` in the project's SQL Editor. Save schema-only results and migration history for review. If the migration-history table is absent, history is unknown: run the remaining inventory statements individually; do not mark migrations applied with `migration repair` without evidence.

The public API recognizes existing `seller_applications`, `seller_stores`, `seller_preferences` and `seller_notifications`, while the repository's draft onboarding migration expects a different baseline. Inspect their actual columns, constraints, policies, triggers and functions. Capture the live baseline using a schema-only export or reviewed `supabase db pull`. Reconcile the existing objects and adapt the onboarding RPC/service contract to that schema before deployment. Reuse the existing application/store schema; do not create parallel application tables or duplicate profiles. The current fail-closed preflight deliberately refuses these collisions. Do not remove it merely to force deployment.

## 2. Apply only genuinely pending migrations after reconciliation

Review all four migration files against the verified live history. Preserve their timestamp order. The two August migrations assume an existing baseline; this repository does not contain that original baseline. Confirm the baseline and trusted role helpers first.

```sh
supabase migration list
supabase db push --dry-run
# Execute only once the schema/history review and dry run succeed:
supabase db push
supabase migration list
```

Re-run the inventory SQL. Verify table columns, foreign keys, unique/check constraints, indexes, RLS flags, policies, trigger/function definitions and bucket configuration. Record exact executed migration names and failures. A successful local fixture test is not proof of live migration success.

## 3. Storage and access verification

The prepared backend migration creates only missing bucket IDs and refuses incompatible existing private bucket configuration. Existing `store-logos` and `store-banners` are retained so saved documents remain accessible.

| Bucket               | Intended access                     | Maximum | MIME types      |
| -------------------- | ----------------------------------- | ------- | --------------- |
| buyer-profile-images | Private; own Buyer avatar           | 2 MB    | PNG, JPEG       |
| seller-documents     | Private; owner/trusted review       | 10 MB   | PDF, PNG, JPEG  |
| seller-logos         | Private; owned artwork              | 10 MB   | PNG, JPEG       |
| seller-banners       | Private; owned artwork              | 10 MB   | PNG, JPEG       |
| product-images       | Public read; approved Seller writes | 10 MB   | PNG, JPEG, WebP |
| category-images      | Public read; Admin writes           | 10 MB   | PNG, JPEG, WebP |
| brand-assets         | Public read; Admin writes           | 10 MB   | PNG, JPEG, WebP |

Verify with two designated real accounts that a second account cannot read, sign, replace, delete or attach the first account's private documents/avatar. Verify anonymous private access is denied; supported upload, replacement, deletion and signed preview work; oversized/spoofed/unsupported files fail. Verify draft owners can edit, submitted applications cannot edit, and privileged approval/suspension controls remain trusted. Do not weaken existing policies to make a test pass.

## 4. Auth settings and deployment origin

Public settings confirm email signup is enabled and email confirmation is required. Dashboard-only Site URL, redirect allowlist, SMTP delivery, email templates and reset expiry remain unverified. In Authentication → URL Configuration, set Site URL to the actual `<DEPLOYED_ORIGIN>` and allow its exact `<DEPLOYED_ORIGIN>/auth/callback` URL. Add only required development/preview callback URLs. The real deployed origin was not supplied; replace the placeholder. Ensure the installed Supabase SDK's email verification and recovery redirects reach this callback; test the configured email templates with a controlled inbox. Recovery callbacks route to `/reset-password`; signup preserves the safe Seller continuation.

Reference: https://supabase.com/docs/guides/auth/redirect-urls and https://supabase.com/docs/guides/deployment/database-migrations.

Verify production public environment aliases match `.env.example`. Public Vite variables must contain only URL/project/public keys. Never include a secret/service-role key. Configure the actual hosting target and run the production deployment after these gates pass.

## 5. Controlled live and browser tests

```sh
npm run verify:supabase
npm run verify:migrations
# Set designated confirmed Buyer credentials through secure environment injection:
npm run verify:session
npm run test:seller
npm run test:integration
npm run typecheck
npm run build
```

`verify:session` needs `SUPABASE_TEST_BUYER_EMAIL` and `SUPABASE_TEST_BUYER_PASSWORD`; it signs in to real Supabase, validates own profiles and recovered session, and signs out. It does not create users or send emails and does not replace browser E2E coverage.

In an installed real browser, use an authorized controlled inbox to test signup → verification → Buyer profile creation → login → refresh/session recovery → logout → forgot password → recovery → login. Check unauthenticated Seller entry preserves Login continuation, logged-in Buyer entry starts/resumes the wizard, every required step validates and autosaves, uploads/preview/replacement/deletion work, submission creates linked profiles/store once, pending status displays comments and blocks dashboard, and rejected resubmission works. Exercise approved/suspended/blocked state using the existing trusted operational process; no Admin approval endpoint was implemented here. Check guest and protected routes for redirect loops. Test network interruption and session expiry.

Buyer avatar upload currently has a secured service but no pre-existing Buyer avatar editor was found; there is no new avatar UI in this phase. Test the service with a designated real Buyer and connect it to an approved existing profile editor if required. Full browser E2E cannot be recorded until browser/runtime, designated accounts, inbox and compatible deployed schema are available.
