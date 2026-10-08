# DUKAPAMBE — Milestone E — Phase 2B.1

**GATE STATUS: BLOCKED. Backend operations stopped when the integration rejected further queries. No live changes were applied.**

This phase performed real read-only discovery through the configured repository's Lovable integration. Unlike prior phases, PostgreSQL catalog access succeeded. Inspection then stopped at the free-plan MCP database action limit. The remaining rejected queries were not executed. No feature development, placeholder fix, migration application, data deletion, history repair or production object overwrite was performed.

## 1. Current live schema

Configured Supabase ref: `kwacxbapokecpzmmjtwg`. The repository README links Lovable project `603c4c27-62ea-43d2-ad97-aeb31370c72e`; the integration returned its name as **Dukapambe**, database enabled, stack Supabase. SQL health returned database `postgres`, role `postgres`, and Auth/Storage schemas present. The SQL project's ref/URL settings returned NULL: project mapping is established by repository configuration and its linked integration, not independently attested by those SQL settings. Administrative project lifecycle status was not available.

Completed discovery: **11 non-pg schemas, 10 public tables, 165 public columns, 62 public/Storage constraints, 35 public/Storage policies, 7 buckets and 5 extensions**. All ten public tables have RLS enabled. All 62 returned constraints are validated. No public views appeared in the completed relation inventory. Views across other schemas, functions, triggers, indexes, enums and grants remain unverified because their queries were rejected.

| Public table                 | Observed contract                                                                                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| profiles                     | Existing Buyer/Seller account identity, role and status                                                                                                          |
| buyer_profiles               | Uses `profile_image_path`; there is no `avatar_path` column                                                                                                      |
| seller_profiles              | Existing seller identity, application status, seller number, badges and application date                                                                         |
| seller_applications          | Flattened business/owner/payment/store fields; `status`, `current_step`, `completed_steps`, `progress_percent`; no repository-style `data` or `revision` columns |
| seller_application_documents | `application_id`, `user_id`, `document_type`, `bucket_name`, `storage_path`, file metadata                                                                       |
| seller_stores                | Ownership column `seller_user_id`; JSON business hours and array delivery options                                                                                |
| seller_preferences           | Ownership column `seller_user_id`; individual notification flags                                                                                                 |
| seller_notifications         | Ownership column `seller_user_id`; notification type, title, message, read flag                                                                                  |
| admin_profiles               | Existing Admin profile; preserved                                                                                                                                |
| affiliate_profiles           | Existing Affiliate profile; preserved                                                                                                                            |

There are no physical public `seller_onboarding`, `seller_documents`, `seller_status_history` or `seller_verification` tables in the completed relation inventory. The current repository's sidecar assumptions therefore conflict with the real schema. Existing objects must be reused, not duplicated.

Schemas: auth, extensions, graphql, graphql_public, information_schema, private, public, realtime, storage, supabase_migrations, vault. Extensions: pg_stat_statements 1.11, pgcrypto 1.3, plpgsql 1.0, supabase_vault 0.3.1, uuid-ossp 1.1. Full sanitized columns, relation flags, constraint definitions and policy expressions are saved in `PHASE_2B1_LIVE_INVENTORY.json`. No application/user rows or stored documents were read.

## 2. Migration status

The actual live `supabase_migrations.schema_migrations` ledger contains **two rows**:

| Repository migration                                    | Verified classification                                                                                        | Action                                            |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 20260825003236_c3253637-4e08-46b4-9b1f-04db291788f3.sql | Already applied; stored statement MD5 matches repository bytes: `55c22dbe5ba438bcc7ce3cdb1b683f56`             | Skip; do not reapply                              |
| 20260825003251_80e2a665-1a9e-43bb-b58b-4b44f607f285.sql | Already applied; stored statement MD5 matches repository bytes: `4914af408dd01ca25a2209c9ba7c8c8f`             | Skip; do not reapply                              |
| 20261006110000_seller_onboarding.sql                    | Unrecorded/pending; conflicts with existing application/store/preferences/notification objects                 | Requires reconciliation; must not apply unchanged |
| 20261006175100_backend_integration.sql                  | Unrecorded/pending; requires absent sidecar tables; mismatched avatar column and existing bucket configuration | Requires reconciliation; must not apply unchanged |

No unknown or duplicate version appears among the two recorded migration rows. Provenance of the original baseline and existing seller schema is not represented in this ledger; its creation/history remains unknown. This does not justify resetting or repairing history. No new migration is currently proven safe to apply.

## 3. Storage status

The privileged bucket inventory returned seven existing buckets. Only **two of the seven requested canonical bucket IDs exist**.

| Requested bucket     | Actual status     | Configuration / conflict                                                                                                                                                                                                                               |
| -------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| seller-documents     | EXISTS            | Private; 10 MB; PDF/PNG/JPEG. Policies require `user_id/application_id/...` paths and an editable owned application. Repository uploads use `user_id/kind/...`, which does not satisfy that application folder predicate. Actual upload not attempted. |
| seller-logos         | EXISTS / CONFLICT | Public; 5 MB; JPEG/PNG/WebP/SVG. Current pending migration expects private PNG/JPEG artwork. Do not overwrite existing public storefront media settings.                                                                                               |
| seller-banners       | MISSING           | Existing `store-banners` and `seller-cover-images` are public; they are not the requested ID.                                                                                                                                                          |
| buyer-profile-images | MISSING           | Existing `profile-photos` is public, 5 MB, JPEG/PNG/WebP. Existing Buyer column is `profile_image_path`.                                                                                                                                               |
| product-images       | MISSING           | No bucket with this ID was returned.                                                                                                                                                                                                                   |
| category-images      | MISSING           | No bucket with this ID was returned.                                                                                                                                                                                                                   |
| brand-assets         | MISSING           | No bucket with this ID was returned.                                                                                                                                                                                                                   |

Other existing IDs: `profile-photos`, `seller-cover-images`, `store-banners`, `store-logos`, `verification-documents`. Existing verification documents are private; the other listed legacy image buckets are public. Preserve their files, references and visibility until usage is reviewed. Upload/delete/replace/signed-preview and production cross-account tests remain unexecuted; bucket metadata alone does not prove permissions.

## 4. Authentication status

Real public requests on 2026-10-08 returned Auth health/settings 200. Email provider and signup are enabled; email confirmation is required. Public URL/key aliases match, and configured URL host matches the repository project ref. No keys, tokens or passwords were exposed.

**Unverified:** Site URL, redirect allowlist, recovery configuration, password reset delivery, remaining provider administrative settings, JWT signing/expiry configuration, SMTP/templates and real user session/email flows. The available SQL connection does not expose these administrative Auth settings. No Supabase Management token or Auth-management tool is available in this session. No designated Buyer credentials or controlled inbox were supplied.

## 5. RLS status

Actual policy inventory: **35 policies**; ownership/Admin predicates are present on the ten public tables and Storage objects. RLS is enabled on these public tables and on Storage objects. No exact duplicate policy definition or exact duplicate constraint definition was found in the returned sets; this is not a complete semantic/index/trigger duplication audit.

The following require review before any security classification can be marked PASS:

- Profile update policies depend on security triggers/helpers to protect role/status fields. Those definitions and table grants were not inspected because the queries were rejected.
- Application updates similarly depend on state/validation guards whose implementation remains unread.
- `seller_stores_public_read` exists for anon/authenticated with an active-or-owner-or-Admin predicate, but the anonymous API request returns 401/42501. The grant inventory is required; do not grant access blindly.
- `users_update_own_media` restricts the existing object's owner/bucket in USING, but WITH CHECK only checks the destination folder owner. It lacks a destination bucket allowlist. This is a potential cross-bucket authorization gap requiring grant/helper review and a controlled negative test; no exploit was executed or claimed.
- Seller document writes use the application ID as the second Storage folder. The current repository's upload path contract differs.
- Canonical policies for the five missing requested buckets are not in this inventory. Creating buckets alone would not establish safe upload access.
- Existing preferences/notifications use owner/Admin predicates rather than the pending repository's approved-only sidecar contract.

Overall RLS verification is **BLOCKED**, not PASS. Reading catalog metadata as postgres is not an authenticated ownership test.

## 6. Changes applied

**None to the live backend.**

- Migrations applied: 0
- Tables/columns created or altered: 0
- Buckets created or changed: 0
- Policies/triggers/functions changed: 0
- Data deleted: 0
- Migration history reset/repaired: 0
- Application code changes: 0

Only this report and the sanitized inventory were saved inside the existing repository.

## 7. Changes skipped

Both October migrations were skipped. No baseline objects were recreated, no canonical buckets were provisioned, and no existing public bucket was made private. Role/grant/policy changes and frontend-to-live-schema adaptation were not attempted because inspection is incomplete. No signup, login/logout, reset email, verification email, onboarding submission, role transition or upload was executed with a real test account.

The smallest reconciliation plan remains on hold: finish inspection, then adopt the actual `seller_applications`, `seller_application_documents`, `seller_user_id` ownership and `profile_image_path` contracts. Inspect the existing RPC/trigger implementations before deciding whether a service adapter or a narrowly additive migration is necessary. Preserve existing rows, storefront references and original migration history. Do not deploy the current sidecar migrations unchanged.

## 8. Remaining conflicts and exact owner actions

### A. SQL inspection quota — not a PostgreSQL permission denial

Postgres read access succeeded. The integration then returned:

> Your free-plan MCP database action limit was reached. This query wasn't executed.

The tool reported retry availability in approximately **57–58 minutes** at the time of rejection. Queries for indexes, triggers, functions, views, enums and grants were rejected; they were not executed.

**Required operation:** remaining read-only catalog queries and subsequent verified deployment.

**Exact owner action and location:** the Lovable workspace owner can restore the plan's database action allowance at **https://lovable.dev/settings/billing**, or wait until the reported quota resets and resume inspection through the same linked project. No new database should be provisioned. We did not wait, retry past the limit, or use an alternative write channel.

If the owner already has direct access to the configured Supabase project, open its **SQL Editor** and run the existing readonly `supabase/verification/phase_2a4_inventory.sql`. Complete the blocked function/grant/view inventory with these read-only queries:

```sql
SELECT schemaname,tablename,indexname,indexdef
FROM pg_indexes WHERE schemaname IN ('public','storage')
ORDER BY 1,2,3;

SELECT n.nspname,c.relname,t.tgname,t.tgenabled,pg_get_triggerdef(t.oid)
FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE NOT t.tgisinternal AND n.nspname IN ('public','auth','storage')
ORDER BY 1,2,3;

SELECT n.nspname,p.proname,pg_get_function_identity_arguments(p.oid),
       p.prosecdef,p.proconfig,p.proacl
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname NOT IN ('pg_catalog','information_schema')
ORDER BY 1,2,3;

-- Review application/security helper definitions locally; redact embedded
-- credentials before sharing or committing any definition.
SELECT n.nspname,p.proname,pg_get_functiondef(p.oid)
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname IN ('public','private') ORDER BY 1,2;

SELECT schemaname,viewname,definition FROM pg_views
WHERE schemaname NOT IN ('pg_catalog','information_schema') ORDER BY 1,2;

SELECT n.nspname,t.typname,e.enumlabel,e.enumsortorder
FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid
JOIN pg_namespace n ON n.oid=t.typnamespace
WHERE n.nspname='public' ORDER BY t.typname,e.enumsortorder;

SELECT table_schema,table_name,grantee,privilege_type
FROM information_schema.role_table_grants
WHERE table_schema IN ('public','storage')
AND grantee IN ('anon','authenticated','service_role') ORDER BY 1,2,3,4;
```

### B. Administrative Auth access

**Missing capability:** an authenticated project connection permitted to read administrative Auth configuration. No Management token or corresponding configuration reader is available here; no permission grant was tested or denied through that API.

**Required operation:** inspect Site URL, redirect URLs, email/recovery settings, providers and JWT configuration.

**Exact owner action and location:** connect a Supabase integration authorized for project `kwacxbapokecpzmmjtwg`, or inspect the existing project in the owner's Supabase Dashboard under **Authentication → URL Configuration**, email/provider settings, and JWT settings. If this is a Lovable-managed Cloud project without direct Supabase Dashboard access, use that project's Cloud authentication administration and restore the Lovable connection allowance. Supply the non-secret settings for verification; never share signing secrets, access tokens or passwords in chat or commit them.

An owner with a direct Supabase CLI/account connection can verify history from the existing repository in their own secure terminal:

```sh
supabase login
supabase link --project-ref kwacxbapokecpzmmjtwg
supabase migration list
```

These commands connect/read history. **Do not run db push, migration repair or reset while the conflicts above remain unresolved.**

### C. Controlled live verification

After compatible schema/configuration is verified, supply designated confirmed Buyer test credentials through secure environment injection and a controlled email inbox. Use the existing real-session verification script, then execute actual signup/verification/recovery/onboarding/Storage and cross-account tests. Account creation and emails were not performed in this phase.

## 9. Deployment readiness

| Area                                                         | Status                                                                |
| ------------------------------------------------------------ | --------------------------------------------------------------------- |
| Linked SQL connection and completed catalog/bucket discovery | PASS for the specific successful reads                                |
| Two August migration versions/content checksums              | PASS — actually verified in live history                              |
| Full live schema/function/trigger/index/grant inventory      | PARTIAL — remaining queries blocked                                   |
| Auth health/signup/confirmation flags                        | PASS for public flags only                                            |
| Administrative Auth and real email/session behavior          | BLOCKED                                                               |
| Storage metadata inventory                                   | PASS for existence/visibility/limits; upload permissions not verified |
| RLS security verification                                    | BLOCKED                                                               |
| October migration reconciliation/deployment                  | BLOCKED                                                               |
| Authenticated end-to-end verification                        | BLOCKED                                                               |

No deployment readiness or successful migration/Storage/RLS deployment is claimed. The real live schema is now partly inventoried, but the backend is not yet fully verified.

## 10. Gate Status

**GATE STATUS: BLOCKED**
