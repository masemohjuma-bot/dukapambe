-- Phase 2A.4: additive integration. Do not deploy until the live catalog/history
-- preflight confirms this repository's existing schema mapping.
DO $$ BEGIN
 IF to_regclass('public.buyer_profiles') IS NULL OR to_regclass('public.seller_onboarding') IS NULL OR to_regclass('public.seller_documents') IS NULL THEN
  RAISE EXCEPTION 'Required Buyer/Seller baseline or onboarding migration is missing';
 END IF;
END $$;
ALTER TABLE public.buyer_profiles ADD COLUMN IF NOT EXISTS avatar_path text;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.buyer_profiles'::regclass AND conname='buyer_avatar_ownership') THEN
  ALTER TABLE public.buyer_profiles ADD CONSTRAINT buyer_avatar_ownership CHECK(avatar_path IS NULL OR split_part(avatar_path,'/',1)=user_id::text);
 END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.seller_status_history (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.seller_profiles(user_id) ON DELETE CASCADE,
 from_status text, to_status text NOT NULL, changed_at timestamptz NOT NULL DEFAULT now()
);
-- Stop rather than repurpose a preexisting, incompatible history table.
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM (VALUES('id','uuid'),('user_id','uuid'),('from_status','text'),('to_status','text'),('changed_at','timestamp with time zone')) AS expected(name,type)
 WHERE NOT EXISTS(SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name='seller_status_history' AND c.column_name=expected.name AND c.data_type=expected.type)) THEN
 RAISE EXCEPTION 'Existing seller_status_history has a different schema; reconcile before deployment'; END IF;
END $$;
CREATE INDEX IF NOT EXISTS seller_history_owner_date ON public.seller_status_history(user_id,changed_at DESC);
ALTER TABLE public.seller_status_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.seller_status_history FROM anon,authenticated;
GRANT SELECT ON public.seller_status_history TO authenticated;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='seller_status_history' AND policyname='seller_history_owner_read') THEN
  CREATE POLICY seller_history_owner_read ON public.seller_status_history FOR SELECT TO authenticated USING(user_id=auth.uid());
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='seller_status_history' AND policyname='seller_history_private_guard') THEN
  CREATE POLICY seller_history_private_guard ON public.seller_status_history AS RESTRICTIVE FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.is_admin());
 END IF;
END $$;
CREATE OR REPLACE FUNCTION public.record_seller_status_history() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  INSERT INTO seller_status_history(user_id,from_status,to_status) VALUES(NEW.user_id,NULL,NEW.application_status::text);
 ELSIF NEW.application_status IS DISTINCT FROM OLD.application_status THEN
  INSERT INTO seller_status_history(user_id,from_status,to_status) VALUES(NEW.user_id,OLD.application_status::text,NEW.application_status::text);
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.record_seller_status_history() FROM PUBLIC,anon,authenticated;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.seller_profiles'::regclass AND tgname='record_seller_status_history') THEN
  CREATE TRIGGER record_seller_status_history AFTER INSERT OR UPDATE OF application_status ON public.seller_profiles FOR EACH ROW EXECUTE FUNCTION public.record_seller_status_history();
 END IF;
END $$;

-- Required canonical buckets. Existing definitions are not silently overwritten.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES
 ('buyer-profile-images','buyer-profile-images',false,2097152,ARRAY['image/png','image/jpeg']),
 ('seller-documents','seller-documents',false,10485760,ARRAY['application/pdf','image/png','image/jpeg']),
 ('seller-logos','seller-logos',false,10485760,ARRAY['image/png','image/jpeg']),
 ('seller-banners','seller-banners',false,10485760,ARRAY['image/png','image/jpeg']),
 ('product-images','product-images',true,10485760,ARRAY['image/png','image/jpeg','image/webp']),
 ('category-images','category-images',true,10485760,ARRAY['image/png','image/jpeg','image/webp']),
 ('brand-assets','brand-assets',true,10485760,ARRAY['image/png','image/jpeg','image/webp'])
ON CONFLICT(id) DO NOTHING;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM storage.buckets WHERE id IN ('buyer-profile-images','seller-documents','seller-logos','seller-banners') AND (public OR file_size_limit IS NULL OR file_size_limit>CASE WHEN id='buyer-profile-images' THEN 2097152 ELSE 10485760 END OR allowed_mime_types IS NULL OR NOT(allowed_mime_types <@ CASE WHEN id='seller-documents' THEN ARRAY['application/pdf','image/png','image/jpeg'] ELSE ARRAY['image/png','image/jpeg'] END))) THEN
 RAISE EXCEPTION 'Existing private bucket configuration is incompatible; review without exposing private data'; END IF;
END $$;
-- Retain legacy store artwork buckets and object paths so existing references work.
DO $$ DECLARE c record; BEGIN
 FOR c IN SELECT conname FROM pg_constraint WHERE conrelid='public.seller_documents'::regclass AND contype='c' AND pg_get_constraintdef(oid) LIKE '%store-logos%' LOOP
  EXECUTE format('ALTER TABLE public.seller_documents DROP CONSTRAINT %I',c.conname);
 END LOOP;
END $$;
ALTER TABLE public.seller_documents ADD CONSTRAINT seller_document_bucket_allowlist CHECK(bucket IN ('seller-documents','seller-logos','seller-banners','store-logos','store-banners'));
ALTER TABLE public.seller_documents ADD CONSTRAINT seller_document_kind_bucket CHECK(
 (kind='logo' AND bucket IN ('seller-logos','store-logos') AND mime<>'application/pdf') OR
 (kind='banner' AND bucket IN ('seller-banners','store-banners') AND mime<>'application/pdf') OR
 (kind NOT IN ('logo','banner') AND bucket='seller-documents'));
CREATE POLICY seller_canonical_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id IN ('seller-logos','seller-banners') AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY seller_canonical_upload ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id IN ('seller-logos','seller-banners') AND (storage.foldername(name))[1]=auth.uid()::text AND public.seller_can_edit(auth.uid()));
CREATE POLICY seller_canonical_delete ON storage.objects FOR DELETE TO authenticated USING(bucket_id IN ('seller-logos','seller-banners') AND (storage.foldername(name))[1]=auth.uid()::text AND public.seller_can_edit(auth.uid()) AND NOT EXISTS(SELECT 1 FROM public.seller_documents d WHERE d.path=storage.objects.name AND d.bucket=storage.objects.bucket_id));
CREATE POLICY seller_canonical_isolation ON storage.objects AS RESTRICTIVE FOR ALL TO PUBLIC
 USING(bucket_id NOT IN ('seller-logos','seller-banners') OR (storage.foldername(name))[1]=auth.uid()::text)
 WITH CHECK(bucket_id NOT IN ('seller-logos','seller-banners') OR ((storage.foldername(name))[1]=auth.uid()::text AND public.seller_can_edit(auth.uid())));
CREATE POLICY seller_canonical_immutable ON storage.objects AS RESTRICTIVE FOR UPDATE TO PUBLIC USING(bucket_id NOT IN ('seller-logos','seller-banners'));
CREATE POLICY seller_canonical_delete_guard ON storage.objects AS RESTRICTIVE FOR DELETE TO PUBLIC USING(bucket_id NOT IN ('seller-logos','seller-banners') OR (public.seller_can_edit(auth.uid()) AND NOT EXISTS(SELECT 1 FROM public.seller_documents d WHERE d.path=storage.objects.name AND d.bucket=storage.objects.bucket_id)));

CREATE OR REPLACE FUNCTION public.platform_image_write_allowed(p_user uuid,p_bucket text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT p_user=auth.uid() AND EXISTS(SELECT 1 FROM profiles WHERE id=p_user AND status NOT IN ('SUSPENDED','BLOCKED','DISABLED')) AND CASE
 WHEN p_bucket='buyer-profile-images' THEN EXISTS(SELECT 1 FROM buyer_profiles WHERE user_id=p_user)
 WHEN p_bucket='product-images' THEN public.seller_is_approved(p_user)
 WHEN p_bucket IN ('category-images','brand-assets') THEN public.is_admin()
 ELSE false END;
$$;
REVOKE ALL ON FUNCTION public.platform_image_write_allowed(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.platform_image_write_allowed(uuid,text) TO authenticated;
CREATE POLICY platform_image_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id IN ('product-images','category-images','brand-assets') OR (bucket_id='buyer-profile-images' AND (storage.foldername(name))[1]=auth.uid()::text));
CREATE POLICY platform_public_image_read ON storage.objects FOR SELECT TO anon USING(bucket_id IN ('product-images','category-images','brand-assets'));
CREATE POLICY platform_image_upload ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id IN ('buyer-profile-images','product-images','category-images','brand-assets') AND (storage.foldername(name))[1]=auth.uid()::text AND public.platform_image_write_allowed(auth.uid(),bucket_id));
CREATE POLICY platform_image_delete ON storage.objects FOR DELETE TO authenticated USING(bucket_id IN ('buyer-profile-images','product-images','category-images','brand-assets') AND (storage.foldername(name))[1]=auth.uid()::text AND public.platform_image_write_allowed(auth.uid(),bucket_id));
CREATE POLICY buyer_avatar_private_guard ON storage.objects AS RESTRICTIVE FOR ALL TO PUBLIC
 USING(bucket_id<>'buyer-profile-images' OR (storage.foldername(name))[1]=auth.uid()::text)
 WITH CHECK(bucket_id<>'buyer-profile-images' OR ((storage.foldername(name))[1]=auth.uid()::text AND public.platform_image_write_allowed(auth.uid(),bucket_id)));
CREATE POLICY platform_image_insert_guard ON storage.objects AS RESTRICTIVE FOR INSERT TO PUBLIC WITH CHECK(bucket_id NOT IN ('buyer-profile-images','product-images','category-images','brand-assets') OR ((storage.foldername(name))[1]=auth.uid()::text AND public.platform_image_write_allowed(auth.uid(),bucket_id)));
CREATE POLICY platform_image_immutable_guard ON storage.objects AS RESTRICTIVE FOR UPDATE TO PUBLIC USING(bucket_id NOT IN ('buyer-profile-images','product-images','category-images','brand-assets'));
CREATE POLICY platform_image_delete_guard ON storage.objects AS RESTRICTIVE FOR DELETE TO PUBLIC USING(bucket_id NOT IN ('buyer-profile-images','product-images','category-images','brand-assets') OR ((storage.foldername(name))[1]=auth.uid()::text AND public.platform_image_write_allowed(auth.uid(),bucket_id) AND (bucket_id<>'buyer-profile-images' OR NOT EXISTS(SELECT 1 FROM public.buyer_profiles b WHERE b.avatar_path=storage.objects.name))));
