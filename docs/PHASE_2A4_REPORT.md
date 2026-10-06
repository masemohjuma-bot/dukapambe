# DUKAPAMBE — Milestone E, Phase 2A.4

**Release status: BLOCKED for live deployment.** Local implementation/build checks pass. No privileged Supabase write was performed. Existing UI styling and Buyer Supabase authentication were retained; no production mock authentication, Affiliate onboarding or Admin approval endpoint was introduced.

## Deliverables

| #   | Deliverable            | Actual result                                                                                                                                                                                                                                                              |
| --- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Files changed          | Listed below; changes only in the existing DUKAPAMBE repository.                                                                                                                                                                                                           |
| 2   | Migrations applied     | **0 live**. Four migration files inventoried; live migration history unavailable. Existing onboarding migration now refuses schema collisions; new backend integration migration prepared and tested locally only.                                                         |
| 3   | Tables created         | **0 live**. Prepared `seller_status_history` and `buyer_profiles.avatar_path`, plus prior onboarding objects, require reconciliation with live baseline before application.                                                                                                |
| 4   | Buckets created        | **0 live**. Seven canonical bucket definitions prepared; two legacy artwork buckets preserved. Anonymous empty bucket list does not prove buckets absent.                                                                                                                  |
| 5   | RLS policies created   | **0 live**. Prepared ownership/status-history/avatar/artwork/storage restrictions pass isolated PostgreSQL fixture tests. Live policy/catalog inspection remains blocked.                                                                                                  |
| 6   | Configuration verified | Public URL/project/key aliases match; Auth health/settings reachable; signup enabled; email confirmation required. Privileged redirect URLs, SMTP, templates, migration history and bucket settings unverified.                                                            |
| 7   | Tests executed         | 16 Seller test groups, 8 integration/navigation groups, TypeScript check, targeted ESLint, production build, read-only live public probes, migration preflight and credential-presence session check.                                                                      |
| 8   | Tests passed           | 24 local test groups; TypeScript, targeted lint and production build. Live public Auth health/settings requests succeeded. These are not live authenticated/browser E2E results.                                                                                           |
| 9   | Tests blocked          | Migration gate intentionally BLOCKED by live schema collisions; live session script BLOCKED without designated credentials. Privileged migrations/RLS/catalog/storage tests, actual uploads, signup/email/reset and browser onboarding E2E remain blocked.                 |
| 10  | Manual steps           | Connect authorized Supabase access, inventory/reconcile existing schema and history, apply only verified pending migrations, verify storage/RLS, configure deployed callback origin/email, execute controlled real-account and browser tests. See runbook for exact steps. |
| 11  | Production build       | PASS — Vite client/SSR and Nitro production output generated. Build success does not establish backend readiness. Existing dependency/build warnings remain; frozen Bun installation was not verified.                                                                     |
| 12  | Commit hash            | Exact delivered commit supplied with the delivery message/PR; obtain locally with `git rev-parse HEAD`. Prior onboarding base is `da9c03bfb014d90059f9f2297b3523ab2a1e236b`.                                                                                               |

## Live evidence, 6 October 2026

`PHASE_2A4_PUBLIC_EVIDENCE.json` records sanitized read-only requests. No user rows, credentials or tokens were logged. Public Auth health/settings returned 200. With `limit=0`, `profiles`, `buyer_profiles`, `seller_profiles`, `seller_applications`, `seller_preferences` and `seller_notifications` returned 200. `seller_stores` returned 401/42501: recognized but permission denied. `seller_onboarding`, `seller_documents`, `seller_status_history`, `seller_verification`, `stores`, `notifications` and `user_roles` were not found in the exposed API schema cache (404/PGRST205). This does not prove physical catalog absence. The public Storage bucket request returned an empty visible list; bucket existence, privacy and upload permissions require privileged/account verification.

Existing seller application/store/preferences/notification objects conflict with assumptions in the pending onboarding migration. It now fails before DDL instead of duplicating or silently adopting incompatible schema. We cannot safely resolve this without actual live definitions and migration history. The current repository's onboarding flow therefore cannot be claimed operational against this project.

## Implementation

Added safe verification/recovery callback handling, forgot/reset-password routes, preserved Buyer→Seller continuation, email-confirmation-aware signup, stale-session guest handling and real logout in the existing header. Added own-account session/role loading and a secured Buyer avatar upload service. Seller artwork now targets `seller-logos`/`seller-banners`; saved legacy bucket references remain supported.

Prepared migration adds avatar ownership constraints, private status history, canonical buckets and restrictive Storage safeguards alongside existing policies. It does not approve applications. Read-only inventory and public/live-session verification scripts make unresolved configuration and migration risks reviewable.

## Files changed

- `.env.example`, `package.json`
- `src/integrations/supabase/types.ts`, `src/lib/seller/database.ts`, `src/lib/seller/service.ts`, `src/routeTree.gen.ts`
- `src/lib/auth/navigation.ts`, `src/lib/auth/service.ts`, `src/lib/auth/avatar.ts`
- `src/hooks/use-account-session.ts`, `src/components/auth/SessionControl.tsx`
- `src/routes/index.tsx`, `src/routes/login.tsx`, `src/routes/signup.tsx`, `src/routes/auth.callback.tsx`, `src/routes/forgot-password.tsx`, `src/routes/reset-password.tsx`
- `supabase/migrations/20261006110000_seller_onboarding.sql`, `supabase/migrations/20261006175100_backend_integration.sql`
- `supabase/verification/phase_2a4_inventory.sql`
- `scripts/verify-supabase-public.mjs`, `scripts/check-migration-preflight.mjs`, `scripts/verify-live-session.mjs`
- `tests/seller-baseline.sql`, `tests/seller-routes.test.mjs`, `tests/auth-navigation.test.ts`, `tests/backend-integration.test.mjs`
- `docs/PHASE_2A4_REPORT.md`, `docs/PHASE_2A4_DEPLOYMENT_RUNBOOK.md`, `docs/PHASE_2A4_PUBLIC_EVIDENCE.json`

## Deployment checklist

| State                         | Item                                                                                                                                                     |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| READY locally                 | Supabase-backed Auth code, safe continuation, local Seller validation/RLS fixture tests, production build                                                |
| REQUIRES MANUAL CONFIGURATION | Actual deployed origin/callback allowlist, controlled inbox and real test accounts, SMTP/templates, authorized Supabase connection                       |
| BLOCKED                       | Live schema reconciliation, verified migration history/application, bucket/RLS verification, authenticated uploads, live/browser end-to-end verification |

Remaining limitations: no privileged Supabase connection; live schema drift; no controlled test credentials/inbox; browser executable unavailable; no Buyer avatar editor existed to exercise the new service through UI; no full authenticated E2E evidence. Main branch was not deployed or merged. The work is reviewable on a feature branch; do not treat this phase as completed live deployment.
