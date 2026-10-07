# DUKAPAMBE — Milestone E — Phase 2B.0, Gate 1

## 1. Files changed

Changes are confined to the existing DUKAPAMBE repository. Supabase authentication, Seller onboarding, branding and UI layout are preserved. No schema or migration DDL was added or executed. The changes include route/session stabilization, validation, verification scripts, tests, and formatting required by the existing ESLint configuration.

- `src/components/seller/SellerWizard.tsx`
- `src/hooks/use-seller-onboarding.ts`
- `docs/PHASE_2B0_GATE1_REPORT.md`
- `docs/PHASE_2B0_PUBLIC_EVIDENCE.json`
- `package.json`
- `scripts/check-migration-preflight.mjs`
- `scripts/format-generated-routes.mjs`
- `src/hooks/use-auth-route-refresh.ts`
- `src/integrations/supabase/auth-attacher.ts`
- `src/integrations/supabase/auth-middleware.ts`
- `src/integrations/supabase/client.server.ts`
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/previewAuthStorage.ts`
- `src/integrations/supabase/types.ts`
- `src/lib/auth/navigation.ts`
- `src/lib/auth/service.ts`
- `src/lib/mcp/index.ts`
- `src/lib/mcp/supabase.ts`
- `src/lib/mcp/tools/echo.ts`
- `src/lib/mcp/tools/project-info.ts`
- `src/lib/seller/model.ts`
- `src/lib/seller/service.ts`
- `src/routes/[.]lovable.oauth.consent.tsx`
- `src/routes/[.mcp]/invoke-tool/$tool.ts`
- `src/routes/[.mcp]/list-tools.ts`
- `src/routes/[.well-known]/oauth-protected-resource.ts`
- `src/routes/__root.tsx`
- `src/routes/auth.callback.tsx`
- `src/routes/forgot-password.tsx`
- `src/routes/index.tsx`
- `src/routes/mcp.ts`
- `src/routes/reset-password.tsx`
- `src/routes/seller.status.tsx`
- `src/start.ts`
- `supabase/verification/phase_2a4_inventory.sql`
- `tests/auth-navigation.test.ts`
- `tests/backend-integration.test.mjs`
- `tests/seller-model.test.ts`
- `tests/seller-routes.test.mjs`
- `vite.config.ts`

Most Supabase-generated types/integration, MCP transport and build files have formatting-only changes. The preview session broker additionally uses a constant timeout initialized before message dispatch; its storage/authentication contract is preserved. The post-build formatter changes formatting only in four regenerated transport routes so production builds no longer reintroduce lint errors.

## 2. Problems discovered

- Auth continuation rejected lowercase guest paths but allowed uppercase variants. The installed router defaults to case-insensitive matching; an authenticated `/login?next=/LOGIN` could redirect to the same guest route. Repeated-slash and encoded variants also needed normalization/rejection.
- Recovery/callback error links dropped the requested Seller destination.
- Guards ran on navigation but were not centrally rechecked on auth events/window focus. Seller guards and guest guards handled invalid sessions differently; a Seller session failure could lose its original status/dashboard continuation.
- If initial application loading failed, Retry attempted to save an unloaded application rather than restarting loading. Initialization could also display the form before documents finished loading.
- Frontend owner validation accepted impossible dates, such as 1990-02-31, which the database validation rejects.
- Initial full ESLint run failed with 491 errors (490 formatting errors and one prefer-const error) plus six existing UI Fast Refresh warnings. Production builds regenerated four transport routes with four formatting errors after a clean lint run.
- Live schema remains divergent. Public API probes recognize `seller_applications`, `seller_stores`, `seller_preferences` and `seller_notifications`; the pending onboarding migration expects a different baseline. `seller_onboarding`/`seller_documents` are not found in the exposed API schema cache. This does not prove physical catalog absence.
- The repository has a protected Seller dashboard entry, not a complete Seller dashboard. No separate Buyer dashboard or Admin dashboard route exists in this checkout. Existing home navigation explicitly uses `/`; no new dashboard was built.

### Migration reconciliation review

All four migration files were inspected; none was changed or applied live in this phase.

| Migration                                               | Finding                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 20260825003236_c3253637-4e08-46b4-9b1f-04db291788f3.sql | Adds Admin write policies and revokes helper/trigger function permissions. Requires the existing live baseline, which is not in the repository. Reapplying policy creation blindly risks duplicate policies.                                                                                            |
| 20260825003251_80e2a665-1a9e-43bb-b58b-4b44f607f285.sql | Revokes legacy onboarding RPC permissions. Depends on existing functions. Applied history is unknown.                                                                                                                                                                                                   |
| 20261006110000_seller_onboarding.sql                    | Bare CREATE TABLE/index/function/policy/trigger statements require a verified pending history. Preflight deliberately stops for existing seller application/store/preferences/notification schemas. Dynamic guard augmentation and legacy bucket upsert require review against actual live definitions. |
| 20261006175100_backend_integration.sql                  | Existing-column/table/index checks and history policy/trigger guards are present. Canonical Storage policies and document constraints are created once; rerunning without correct history can collide. Existing constraint/bucket definitions must be inspected, not assumed compatible.                |

`owner_read` reused on different tables is not a same-table duplicate. Legacy artwork constraints are deliberately replaced with canonical-plus-legacy constraints; this is not evidence of duplicated live constraints. Local fixture migrations compile and security tests pass. Live duplicate columns, constraints, indexes, policies, triggers and migration application cannot be confirmed without privileged catalog/history access. The readonly inventory now includes verification/comments and all relevant Seller/role/Storage helper definitions. No forced deployment or migration-history repair was performed.

## 3. Problems fixed

- Normalized guest route targets for case and repeated slashes; blocked ambiguous encoded separators/double encoding and control characters. Added regression cases for case-insensitive self redirects, encoded paths and safe Seller continuation.
- Preserved `next` on callback failures, recovery return links and expired reset links.
- Centralized real-session user validation and stale-session cleanup; Seller redirects preserve the actual requested registration/status/dashboard page.
- Recheck guest/protected routes after sign-in, sign-out, token refresh, account updates and window focus. Auth methods run outside the SDK event callback to avoid waiting on its Auth lock. Callback recovery is excluded from rechecks so one-use codes are not interrupted. Runtime browser verification remains blocked.
- Restart application/document loading on initial Retry; publish the loaded form only after both reads succeed. Ignore obsolete initialization attempts and avoid post-unmount initialization updates. Mounted browser retry behavior remains unverified.
- Reject impossible/present/future owner dates before advancing.
- Fixed repository lint errors without disabling checks. Added a post-build formatting step for regenerated transport routes.
- Expanded local ownership/replacement/delete tests for canonical Seller artwork and Buyer avatars. Migration preflight can reference the current Gate 1 evidence snapshot and reports its timestamp.

## 4. Remaining blockers

- No privileged Supabase project connection, database credentials or administrative tools are available. The publishable key cannot supply catalog/history, migration deployment, bucket configuration or trusted Auth settings.
- Reconcile actual live seller schema before applying the existing pending migrations. Do not create parallel application tables, overwrite existing objects, or force migration history.
- No designated confirmed Buyer credentials or controlled email inbox were supplied. Live signup, login/logout, email delivery/verification, recovery/reset, session persistence/refresh and complete Seller onboarding have not been executed.
- The installed browser automation package has no browser executable. Browser E2E remains blocked.
- Actual deployed origin, Site URL, callback/recovery allowlist, SMTP and email templates are unverified.
- Actual upload, signed preview, delete/replace and cross-account production RLS tests are unverified for all seven requested buckets. Anonymous empty bucket visibility is not a bucket inventory.
- Buyer avatar service has no existing avatar editing UI. Product/category/brand upload UI/services are outside this stabilization scope. Existing Admin approval and dashboard operations cannot be verified from this checkout; no Admin approval was implemented.

Exact remaining steps: obtain an authorized connection to project `kwacxbapokecpzmmjtwg`; run `supabase/verification/phase_2a4_inventory.sql` and inspect migration history; reconcile existing schema/contracts; review `supabase db push --dry-run`; apply only verified pending migrations; re-run catalog/storage/RLS inventory; configure the real deployed `/auth/callback` allowlist and email delivery; provide designated accounts through secure environment injection; install an available browser runtime and run controlled authentication/onboarding/role tests. Full commands and safeguards are in `docs/PHASE_2A4_DEPLOYMENT_RUNBOOK.md`. Never put privileged credentials in Vite variables, committed files or chat.

## 5. Validation results

| Check                                       | Classification | Verified result                                                                                                                                                |
| ------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing Seller tests                       | PASS           | `npm run test:seller`: 17/17. Includes six PostgreSQL fixture groups, seven model/upload groups, four real absent-session route/service groups.                |
| Authentication/navigation/integration tests | PASS           | `npm run test:integration`: 12/12, including four navigation groups and eight PostgreSQL Storage/history/preflight groups.                                     |
| TypeScript                                  | PASS           | `npm run typecheck`: exit 0.                                                                                                                                   |
| Repository ESLint after production build    | PASS           | `npm run lint`: exit 0, zero errors, six pre-existing UI Fast Refresh warnings.                                                                                |
| Production build and post-build formatting  | PASS           | `npm run build`: exit 0; Vite client/SSR and Nitro production output generated. Existing build/dependency warnings remain.                                     |
| Whitespace integrity                        | PASS           | `git diff --check`: exit 0.                                                                                                                                    |
| Public live Auth/environment probes         | PASS           | On 2026-10-07: health/settings 200; signup enabled; email confirmation required; public URL/key aliases and project host match. No key/token/user rows logged. |
| Current evidence migration preflight        | BLOCKED        | `node scripts/check-migration-preflight.mjs --evidence docs/PHASE_2B0_PUBLIC_EVIDENCE.json`: intentional exit 1; four collisions and unverified history.       |
| Live session verification                   | BLOCKED        | `npm run verify:session`: exit 2, designated credentials absent; no test user/email created.                                                                   |
| Browser/live authenticated E2E              | BLOCKED        | No browser executable, controlled inbox/accounts or compatible verified deployed schema.                                                                       |

Total local tests: **29 passed, 0 failed**. PostgreSQL tests use an isolated fixture and never bypass production Supabase authentication. Decision/absent-session tests are not proof of successful real-account authentication or mounted browser event behavior. Nothing above claims live migration, Storage policy or upload success.

Public evidence is saved in `docs/PHASE_2B0_PUBLIC_EVIDENCE.json`; the previous phase evidence was preserved. Public `limit=0` reads returned 200 for profiles, Buyer/Seller profiles, seller applications/preferences/notifications; seller stores returned 401/42501; several expected onboarding objects returned 404/PGRST205. Those observations do not verify RLS, ownership or physical catalog definitions.

## 6. Production readiness

| Area                                                        | Classification | Reason                                                                                                                                                                                                                                      |
| ----------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source type/lint/build/local tests                          | PASS           | Checks actually executed and passed.                                                                                                                                                                                                        |
| Signup/login/logout/verification/recovery/session lifecycle | PARTIAL        | Existing real Supabase implementation inspected/stabilized; live account and browser execution blocked.                                                                                                                                     |
| Buyer → Seller navigation and guards                        | PARTIAL        | Known routing decisions and absent-session continuations tested; mounted browser/live states not verified. Explicit home/resume-later/logout navigation can use the existing `/` home; Seller protected guards do not fall back to Landing. |
| Wizard validation/autosave/draft/submission/profile/store   | PARTIAL        | Existing hook/RPC/step flow inspected; isolated PostgreSQL required-step/revision/submission tests pass. Live deployed flow is blocked.                                                                                                     |
| Approved roles/preferences/notifications/dashboard entry    | PARTIAL        | Local controlled SQL transitions verify provisioning once and restricted access. Only the existing protected dashboard entry is present.                                                                                                    |
| Live schema, migrations, indexes/constraints/triggers       | BLOCKED        | Divergent exposed schema and no privileged inventory/history.                                                                                                                                                                               |
| Seven storage buckets and production RLS                    | BLOCKED        | Definitions and isolated ownership tests exist; live settings, actual files and cross-account access unverified.                                                                                                                            |
| Callback/recovery URLs, SMTP/templates                      | BLOCKED        | Administrative configuration and actual deployed origin unavailable.                                                                                                                                                                        |
| Admin routing/permissions                                   | BLOCKED        | No applicable dashboard route or authorized live Admin test account; no new Admin functionality added.                                                                                                                                      |
| End-to-end deployment gate                                  | BLOCKED        | Critical live/backend/browser checks incomplete.                                                                                                                                                                                            |

Live changes in this phase: **0 migrations applied, 0 tables created, 0 buckets created, 0 RLS policies deployed**. No deployment or merge was performed. Main branch and prior Seller onboarding history are preserved.

## 7. Commit hash

The exact delivered commit is included in the final delivery and draft PR; `git rev-parse HEAD` returns it in the delivered checkout. This phase is based on `1bf4aa09464143a03b589c9973db3c72a74a6b02` and does not rewrite published history.

## 8. Exact Gate Status

GATE STATUS: BLOCKED
