-- READ ONLY. Run using a trusted SQL editor/connection, then reconcile mappings.
-- No real users, documents, passwords, keys or application field values selected.
SELECT version AS applied_migration FROM supabase_migrations.schema_migrations ORDER BY version;
SELECT n.nspname AS schema,c.relname AS object,c.relkind,c.relrowsecurity AS rls_enabled,c.relforcerowsecurity AS rls_forced
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','storage') AND c.relkind IN ('r','p','v') ORDER BY 1,2;
SELECT table_name,column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public'
AND table_name IN ('profiles','buyer_profiles','seller_profiles','seller_applications','seller_onboarding','seller_stores','stores','seller_documents','seller_preferences','seller_notifications','seller_status_history','seller_application_comments','seller_verification','notifications','user_roles') ORDER BY table_name,ordinal_position;
SELECT n.nspname AS schema,c.relname AS table_name,co.conname,co.contype,pg_get_constraintdef(co.oid) AS definition FROM pg_constraint co
JOIN pg_class c ON c.oid=co.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' ORDER BY 1,2,3;
SELECT schemaname,tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename,indexname;
SELECT schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname IN ('public','storage') ORDER BY schemaname,tablename,policyname;
SELECT n.nspname AS schema,c.relname AS table_name,t.tgname,pg_get_triggerdef(t.oid) AS definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE NOT t.tgisinternal AND n.nspname IN ('public','auth') ORDER BY 1,2,3;
SELECT p.proname,p.prosecdef AS security_definer,p.proconfig,p.proacl,pg_get_functiondef(p.oid) AS definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('handle_new_auth_user','handle_auth_user_updated','protect_profile_security_fields','protect_seller_application_state','begin_seller_onboarding','submit_seller_application','seller_start','seller_save_step','seller_set_document','seller_submit','seller_activate','seller_initialize_dashboard','seller_approval_provision','seller_can_edit','seller_is_approved','record_seller_status_history','platform_image_write_allowed','is_admin','is_super_admin','current_app_role');
SELECT id,name,public,file_size_limit,allowed_mime_types FROM storage.buckets WHERE id IN ('buyer-profile-images','seller-documents','seller-logos','seller-banners','store-logos','store-banners','product-images','category-images','brand-assets') ORDER BY id;
-- Optional duplicate summary only: no identifiers or business names returned.
SELECT count(*) AS duplicate_registration_groups FROM (SELECT lower(trim(business_registration_number)) FROM public.seller_profiles WHERE trim(business_registration_number)<>'' GROUP BY 1 HAVING count(*)>1) duplicates;
-- Initial hardening migration depends on these being defined in the live baseline.
SELECT to_regclass('public.admin_profiles') AS admin_profiles,to_regprocedure('public.is_super_admin()') AS super_admin_helper;
