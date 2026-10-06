-- Requires the existing Supabase Buyer/Seller baseline (not present in repository).
CREATE TABLE public.seller_onboarding (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE REFERENCES public.seller_profiles(user_id) ON DELETE CASCADE,
 data jsonb NOT NULL DEFAULT '[{},{},{},{},{},{}]' CHECK(jsonb_typeof(data)='array' AND jsonb_array_length(data)=6),
 completed_steps integer[] NOT NULL DEFAULT '{}', revision integer NOT NULL DEFAULT 0, terms_version text, submitted_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.seller_documents (
 user_id uuid NOT NULL REFERENCES public.seller_onboarding(user_id) ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('business_license','tin_certificate','national_id','passport','company_registration','proof_of_address','logo','banner')),
 bucket text NOT NULL CHECK(bucket IN ('seller-documents','store-logos','store-banners')), path text NOT NULL UNIQUE, name text NOT NULL,
 mime text NOT NULL CHECK(mime IN ('application/pdf','image/png','image/jpeg')), size bigint NOT NULL CHECK(size>0 AND size<=10485760), PRIMARY KEY(user_id,kind),
 CHECK(split_part(path,'/',1)=user_id::text),
 CHECK((kind='logo' AND bucket='store-logos' AND mime<>'application/pdf') OR (kind='banner' AND bucket='store-banners' AND mime<>'application/pdf') OR (kind NOT IN ('logo','banner') AND bucket='seller-documents'))
);
CREATE TABLE public.seller_stores (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE REFERENCES public.seller_profiles(user_id) ON DELETE CASCADE,
 name text NOT NULL, slug text NOT NULL CHECK(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), description text NOT NULL, business_hours text NOT NULL,
 delivery_options text NOT NULL, pickup_available boolean NOT NULL DEFAULT false, shipping_regions text[] NOT NULL, logo_path text, banner_path text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX seller_stores_name_unique ON public.seller_stores(lower(trim(name)));
CREATE UNIQUE INDEX seller_stores_slug_unique ON public.seller_stores(lower(slug));
CREATE UNIQUE INDEX seller_registration_unique ON public.seller_profiles(lower(trim(business_registration_number))) WHERE trim(business_registration_number)<>'';
CREATE TABLE public.seller_preferences(user_id uuid PRIMARY KEY REFERENCES public.seller_profiles(user_id) ON DELETE CASCADE, preferences jsonb NOT NULL DEFAULT '{"email_notifications":true,"order_notifications":true}');
CREATE TABLE public.seller_notifications(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES public.seller_profiles(user_id) ON DELETE CASCADE,event text NOT NULL,message text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),read_at timestamptz,UNIQUE(user_id,event));
CREATE TABLE public.seller_application_comments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES public.seller_profiles(user_id) ON DELETE CASCADE,comment text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.seller_verification(user_id uuid PRIMARY KEY REFERENCES public.seller_profiles(user_id) ON DELETE CASCADE,status text NOT NULL DEFAULT 'UNVERIFIED',badges text[] NOT NULL DEFAULT '{}');
CREATE FUNCTION public.seller_can_edit(p_user uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT p_user=auth.uid() AND EXISTS(SELECT 1 FROM profiles p JOIN seller_profiles s ON s.user_id=p.id WHERE p.id=p_user AND p.role IN ('BUYER','SELLER') AND p.status NOT IN ('SUSPENDED','BLOCKED','DISABLED') AND s.application_status::text IN ('DRAFT','REJECTED','MORE_INFORMATION_REQUIRED'));
$$;
CREATE FUNCTION public.seller_is_approved(p_user uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT p_user=auth.uid() AND EXISTS(SELECT 1 FROM profiles p JOIN seller_profiles s ON s.user_id=p.id WHERE p.id=p_user AND p.role='SELLER' AND p.status NOT IN ('SUSPENDED','BLOCKED','DISABLED') AND s.application_status::text='APPROVED');
$$;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['seller_onboarding','seller_documents','seller_stores','seller_preferences','seller_notifications','seller_application_comments','seller_verification'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('CREATE POLICY owner_read ON public.%I FOR SELECT TO authenticated USING(user_id=auth.uid())',t);
 EXECUTE format('REVOKE ALL ON public.%I FROM anon,authenticated',t); EXECUTE format('GRANT SELECT ON public.%I TO authenticated',t);
 END LOOP;
END $$;
CREATE FUNCTION public.seller_start() RETURNS public.seller_onboarding LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r seller_onboarding; BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM profiles p JOIN buyer_profiles b ON b.user_id=p.id WHERE p.id=auth.uid() AND p.role IN ('BUYER','SELLER') AND p.status NOT IN ('SUSPENDED','BLOCKED','DISABLED')) THEN RAISE EXCEPTION 'Only active authenticated Buyers may apply'; END IF;
 INSERT INTO seller_profiles(user_id) VALUES(auth.uid()) ON CONFLICT(user_id) DO NOTHING;
 INSERT INTO seller_onboarding(user_id) VALUES(auth.uid()) ON CONFLICT(user_id) DO NOTHING;
 INSERT INTO seller_verification(user_id) VALUES(auth.uid()) ON CONFLICT DO NOTHING;
 SELECT * INTO r FROM seller_onboarding WHERE user_id=auth.uid(); RETURN r;
END $$;
CREATE FUNCTION public.seller_step_errors(p_step integer,p_data jsonb,p_user uuid) RETURNS text[] LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE required text[]; k text; v jsonb; errors text[]:='{}'; method text; BEGIN
 v:=p_data->p_step;
 IF v IS NULL OR jsonb_typeof(v)<>'object' THEN RETURN ARRAY['Invalid step data']; END IF;
 required:=CASE p_step
 WHEN 0 THEN ARRAY['business_name','business_type','business_category','country','region','district','physical_address','business_description','years_in_business','business_email','business_phone','registration_number']
 WHEN 1 THEN ARRAY['owner_name','nationality','national_id','date_of_birth','gender','phone','email','residential_address']
 WHEN 3 THEN ARRAY['preferred_payment_method']
 WHEN 4 THEN ARRAY['store_name','store_slug','store_description','business_hours','delivery_options','pickup_available','shipping_regions'] ELSE ARRAY[]::text[] END;
 FOREACH k IN ARRAY required LOOP IF coalesce(trim(v->>k),'')='' THEN errors:=array_append(errors,k||' is required'); END IF; END LOOP;
 FOR k IN SELECT jsonb_object_keys(v) LOOP IF jsonb_typeof(v->k)<>'string' OR length(v->>k)>2000 THEN errors:=array_append(errors,'Invalid or oversized field: '||k); END IF; END LOOP;
 IF p_step=0 THEN
 IF coalesce(v->>'business_type','') NOT IN ('Sole proprietor','Partnership','Company') THEN errors:=array_append(errors,'Invalid business type'); END IF;
 IF coalesce(v->>'years_in_business','') !~ '^\d{1,3}$' THEN errors:=array_append(errors,'Invalid years in business'); END IF;
 IF coalesce(v->>'business_email','') !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN errors:=array_append(errors,'Invalid business email'); END IF;
 IF coalesce(v->>'business_phone','') !~ '^\+?[0-9 ()-]{7,20}$' THEN errors:=array_append(errors,'Invalid business phone'); END IF;
 IF coalesce(v->>'gps_location','')<>'' THEN
 IF v->>'gps_location' !~ '^-?[0-9]{1,2}(\.[0-9]+)?,[[:space:]]*-?[0-9]{1,3}(\.[0-9]+)?$' THEN errors:=array_append(errors,'Invalid GPS coordinates');
 ELSIF abs(split_part(v->>'gps_location',',',1)::numeric)>90 OR abs(split_part(v->>'gps_location',',',2)::numeric)>180 THEN errors:=array_append(errors,'GPS coordinates are outside the valid range'); END IF; END IF;
 IF coalesce(v->>'website','')<>'' AND v->>'website' !~ '^https?://[^\s]+$' THEN errors:=array_append(errors,'Invalid website'); END IF;
 ELSIF p_step=1 THEN
 IF coalesce(v->>'date_of_birth','') !~ '^\d{4}-\d{2}-\d{2}$' THEN errors:=array_append(errors,'Invalid date of birth'); ELSE BEGIN IF (v->>'date_of_birth')::date>=current_date THEN errors:=array_append(errors,'Date of birth must be in the past'); END IF; EXCEPTION WHEN OTHERS THEN errors:=array_append(errors,'Invalid date of birth'); END; END IF;
 IF coalesce(v->>'email','') !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN errors:=array_append(errors,'Invalid owner email'); END IF;
 IF coalesce(v->>'phone','') !~ '^\+?[0-9 ()-]{7,20}$' THEN errors:=array_append(errors,'Invalid owner phone'); END IF;
 IF coalesce(v->>'alternative_phone','')<>'' AND v->>'alternative_phone' !~ '^\+?[0-9 ()-]{7,20}$' THEN errors:=array_append(errors,'Invalid alternative phone'); END IF;
 IF coalesce(v->>'gender','') NOT IN ('Female','Male','Other','Prefer not to say') THEN errors:=array_append(errors,'Invalid gender'); END IF;
 ELSIF p_step=2 THEN
 FOREACH k IN ARRAY ARRAY['business_license','national_id','proof_of_address'] LOOP IF NOT EXISTS(SELECT 1 FROM seller_documents WHERE user_id=p_user AND kind=k) THEN errors:=array_append(errors,k||' is required'); END IF; END LOOP;
 IF p_data->0->>'business_type'='Company' AND NOT EXISTS(SELECT 1 FROM seller_documents WHERE user_id=p_user AND kind='company_registration') THEN errors:=array_append(errors,'Company registration certificate is required'); END IF;
 ELSIF p_step=3 THEN
 method:=v->>'preferred_payment_method'; IF coalesce(method,'') NOT IN ('Bank','Mobile money') THEN errors:=array_append(errors,'Invalid payment method'); END IF;
 FOREACH k IN ARRAY CASE WHEN method='Bank' THEN ARRAY['bank_name','account_name','account_number','branch'] ELSE ARRAY['mobile_money_provider','mobile_money_number'] END LOOP IF coalesce(trim(v->>k),'')='' THEN errors:=array_append(errors,k||' is required'); END IF; END LOOP;
 IF method='Mobile money' AND coalesce(v->>'mobile_money_number','') !~ '^\+?[0-9 ()-]{7,20}$' THEN errors:=array_append(errors,'Invalid mobile money number'); END IF;
 ELSIF p_step=4 THEN
 IF coalesce(v->>'store_slug','') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN errors:=array_append(errors,'Invalid store slug'); END IF;
 IF coalesce(v->>'delivery_options','') NOT IN ('Delivery','Pickup','Delivery and pickup') OR coalesce(v->>'pickup_available','') NOT IN ('Yes','No') THEN errors:=array_append(errors,'Invalid delivery or pickup selection'); END IF;
 END IF; RETURN errors;
END $$;
CREATE FUNCTION public.seller_save_step(p_step integer,p_values jsonb,p_revision integer,p_complete boolean DEFAULT false) RETURNS public.seller_onboarding LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r seller_onboarding; merged jsonb; i integer; completed integer[]:='{}'; errors text[]; BEGIN
 SELECT * INTO r FROM seller_onboarding WHERE user_id=auth.uid() FOR UPDATE;
 IF NOT FOUND OR NOT seller_can_edit(auth.uid()) THEN RAISE EXCEPTION 'Application cannot be edited'; END IF;
 IF p_revision IS NULL OR r.revision<>p_revision THEN RAISE EXCEPTION 'Application changed in another tab. Reload before editing'; END IF;
 IF p_step IS NULL OR p_values IS NULL OR p_step NOT BETWEEN 0 AND 4 OR jsonb_typeof(p_values)<>'object' OR pg_column_size(p_values)>40000 THEN RAISE EXCEPTION 'Invalid step'; END IF;
 FOR i IN 0..p_step-1 LOOP IF cardinality(seller_step_errors(i,r.data,auth.uid()))>0 THEN RAISE EXCEPTION 'Complete earlier required steps first'; END IF; END LOOP;
 merged:=jsonb_set(r.data,ARRAY[p_step::text],p_values); errors:=seller_step_errors(p_step,merged,auth.uid());
 IF p_complete AND cardinality(errors)>0 THEN RAISE EXCEPTION '%',array_to_string(errors,'; '); END IF;
 FOR i IN 0..4 LOOP EXIT WHEN cardinality(seller_step_errors(i,merged,auth.uid()))>0; completed:=array_append(completed,i); END LOOP;
 UPDATE seller_onboarding SET data=merged,completed_steps=completed,revision=revision+1,updated_at=now() WHERE user_id=auth.uid() RETURNING * INTO r; RETURN r;
END $$;
CREATE FUNCTION public.seller_set_document(p_kind text,p_bucket text,p_path text,p_name text,p_mime text,p_size bigint) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE completed integer[]:='{}'; i integer; payload jsonb; BEGIN
 PERFORM 1 FROM seller_onboarding WHERE user_id=auth.uid() FOR UPDATE;
 IF NOT seller_can_edit(auth.uid()) THEN RAISE EXCEPTION 'Application cannot be edited'; END IF;
 IF p_path IS NULL THEN DELETE FROM seller_documents WHERE user_id=auth.uid() AND kind=p_kind;
 ELSE
 IF NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id=p_bucket AND name=p_path AND (storage.foldername(name))[1]=auth.uid()::text AND metadata->>'mimetype'=p_mime AND (metadata->>'size')::bigint=p_size) THEN RAISE EXCEPTION 'Uploaded file could not be verified'; END IF;
 INSERT INTO seller_documents(user_id,kind,bucket,path,name,mime,size) VALUES(auth.uid(),p_kind,p_bucket,p_path,left(p_name,255),p_mime,p_size) ON CONFLICT(user_id,kind) DO UPDATE SET bucket=excluded.bucket,path=excluded.path,name=excluded.name,mime=excluded.mime,size=excluded.size;
 END IF;
 SELECT data INTO payload FROM seller_onboarding WHERE user_id=auth.uid();
 FOR i IN 0..4 LOOP EXIT WHEN cardinality(seller_step_errors(i,payload,auth.uid()))>0; completed:=array_append(completed,i); END LOOP;
 UPDATE seller_onboarding SET completed_steps=completed,revision=revision+1,updated_at=now() WHERE user_id=auth.uid();
END $$;
CREATE FUNCTION public.seller_submit(p_revision integer,p_confirm boolean,p_terms boolean) RETURNS public.seller_onboarding LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r seller_onboarding; i integer; errors text[]; b jsonb; o jsonb; s jsonb; BEGIN
 SELECT * INTO r FROM seller_onboarding WHERE user_id=auth.uid() FOR UPDATE;
 IF NOT FOUND OR NOT seller_can_edit(auth.uid()) THEN RAISE EXCEPTION 'Application cannot be submitted'; END IF;
 IF p_revision IS NULL OR r.revision<>p_revision THEN RAISE EXCEPTION 'Application changed in another tab. Reload before submitting'; END IF;
 IF NOT coalesce(p_confirm,false) OR NOT coalesce(p_terms,false) THEN RAISE EXCEPTION 'Confirm your information and accept Seller Terms'; END IF;
 FOR i IN 0..4 LOOP errors:=seller_step_errors(i,r.data,auth.uid()); IF cardinality(errors)>0 THEN RAISE EXCEPTION '%',array_to_string(errors,'; '); END IF; END LOOP;
 b:=r.data->0; o:=r.data->1; s:=r.data->4;
 UPDATE seller_onboarding SET completed_steps=ARRAY[0,1,2,3,4,5],terms_version='2026-10-06',submitted_at=transaction_timestamp(),revision=revision+1 WHERE user_id=auth.uid() RETURNING * INTO r;
 UPDATE seller_profiles SET application_status='SUBMITTED',submitted_at=transaction_timestamp(), business_name=b->>'business_name',business_type=b->>'business_type',business_description=b->>'business_description',business_address=b->>'physical_address',business_registration_number=b->>'registration_number',county=b->>'region',district=b->>'district',ward=b->>'district',owner_name=o->>'owner_name',national_id=o->>'national_id',phone_number=b->>'business_phone',whatsapp_number=b->>'business_phone',delivery_areas=string_to_array(s->>'shipping_regions',','),payment_methods=ARRAY[r.data->3->>'preferred_payment_method'],operating_hours=jsonb_build_object('schedule',s->>'business_hours'),terms_accepted=true,terms_accepted_at=now(),profile_completion=100,business_logo_path=(SELECT path FROM seller_documents WHERE user_id=auth.uid() AND kind='logo'),business_cover_path=(SELECT path FROM seller_documents WHERE user_id=auth.uid() AND kind='banner') WHERE user_id=auth.uid();
 INSERT INTO seller_stores(user_id,name,slug,description,business_hours,delivery_options,pickup_available,shipping_regions,logo_path,banner_path) VALUES(auth.uid(),s->>'store_name',s->>'store_slug',s->>'store_description',s->>'business_hours',s->>'delivery_options',s->>'pickup_available'='Yes',string_to_array(s->>'shipping_regions',','),(SELECT path FROM seller_documents WHERE user_id=auth.uid() AND kind='logo'),(SELECT path FROM seller_documents WHERE user_id=auth.uid() AND kind='banner')) ON CONFLICT(user_id) DO UPDATE SET name=excluded.name,slug=excluded.slug,description=excluded.description,business_hours=excluded.business_hours,delivery_options=excluded.delivery_options,pickup_available=excluded.pickup_available,shipping_regions=excluded.shipping_regions,logo_path=excluded.logo_path,banner_path=excluded.banner_path;
 -- Role remains BUYER; only an external APPROVED transition promotes the account.
 UPDATE seller_verification SET status='PENDING_REVIEW',badges='{}' WHERE user_id=auth.uid(); RETURN r;
END $$;
-- Preserve the original application guard, allowing only a submission certified
-- by this transaction's validated, inaccessible-to-clients onboarding record.
DO $$ DECLARE def text; BEGIN
 SELECT pg_get_functiondef('public.protect_seller_application_state()'::regprocedure) INTO def;
 IF position('seller-validated-submission' IN def)=0 THEN
 IF def !~* '\mBEGIN\M' THEN RAISE EXCEPTION 'Unsupported seller guard definition; review deployment'; END IF;
 def:=regexp_replace(def,'\mBEGIN\M',E'BEGIN\n -- seller-validated-submission\n IF NEW.user_id=auth.uid() AND OLD.user_id=NEW.user_id AND OLD.application_status::text IN (''DRAFT'',''REJECTED'',''MORE_INFORMATION_REQUIRED'') AND NEW.application_status::text=''SUBMITTED'' AND NEW.approved_at IS NOT DISTINCT FROM OLD.approved_at AND NEW.approved_by IS NOT DISTINCT FROM OLD.approved_by AND NEW.membership_plan IS NOT DISTINCT FROM OLD.membership_plan AND NEW.terms_accepted=true AND NEW.submitted_at=transaction_timestamp() AND EXISTS(SELECT 1 FROM public.seller_onboarding WHERE user_id=NEW.user_id AND submitted_at=transaction_timestamp() AND terms_version=''2026-10-06'' AND completed_steps=ARRAY[0,1,2,3,4,5]) THEN RETURN NEW; END IF;\n','i'); EXECUTE def;
 END IF;
END $$;
CREATE FUNCTION public.seller_initialize_dashboard() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT seller_is_approved(auth.uid()) THEN RAISE EXCEPTION 'An approved Seller account is required'; END IF;
 INSERT INTO seller_preferences(user_id) VALUES(auth.uid()) ON CONFLICT DO NOTHING;
 INSERT INTO seller_notifications(user_id,event,message) VALUES(auth.uid(),'seller_approved','Your seller account is approved. Welcome to Dukapambe.') ON CONFLICT DO NOTHING;
 INSERT INTO seller_verification(user_id,status,badges) VALUES(auth.uid(),'VERIFIED',ARRAY['Verified Seller']) ON CONFLICT(user_id) DO UPDATE SET status='VERIFIED',badges=ARRAY['Verified Seller'];
END $$;
-- Add an approval-backed role exception while preserving the existing profile guard's body.
DO $$ DECLARE def text; BEGIN
 SELECT pg_get_functiondef('public.protect_profile_security_fields()'::regprocedure) INTO def;
 IF position('seller-approved-promotion' IN def)=0 THEN
 IF def !~* '\mBEGIN\M' THEN RAISE EXCEPTION 'Unsupported profile guard definition; review deployment'; END IF;
 def:=regexp_replace(def,'\mBEGIN\M',E'BEGIN\n -- seller-approved-promotion\n IF OLD.role::text=''BUYER'' AND NEW.role::text=''SELLER'' AND OLD.status::text NOT IN (''SUSPENDED'',''BLOCKED'',''DISABLED'') AND (to_jsonb(NEW)-''role''-''updated_at'')=(to_jsonb(OLD)-''role''-''updated_at'') AND EXISTS(SELECT 1 FROM public.seller_profiles WHERE user_id=NEW.id AND application_status::text=''APPROVED'') THEN RETURN NEW; END IF;\n','i'); EXECUTE def;
 END IF;
END $$;
CREATE FUNCTION public.seller_activate() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM seller_profiles s JOIN profiles p ON p.id=s.user_id WHERE s.user_id=auth.uid() AND s.application_status::text='APPROVED' AND p.status NOT IN ('SUSPENDED','BLOCKED','DISABLED') AND p.role IN ('BUYER','SELLER')) THEN RAISE EXCEPTION 'An approved Seller account is required'; END IF;
 UPDATE profiles SET role='SELLER' WHERE id=auth.uid() AND role='BUYER'; PERFORM seller_initialize_dashboard();
END $$;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES
 ('seller-documents','seller-documents',false,10485760,ARRAY['application/pdf','image/png','image/jpeg']),('store-logos','store-logos',false,10485760,ARRAY['image/png','image/jpeg']),('store-banners','store-banners',false,10485760,ARRAY['image/png','image/jpeg']) ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
CREATE POLICY seller_upload ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id IN ('seller-documents','store-logos','store-banners') AND (storage.foldername(name))[1]=auth.uid()::text AND public.seller_can_edit(auth.uid()));
CREATE POLICY seller_private_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id IN ('seller-documents','store-logos','store-banners') AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY seller_private_delete ON storage.objects FOR DELETE TO authenticated USING(bucket_id IN ('seller-documents','store-logos','store-banners') AND (storage.foldername(name))[1]=auth.uid()::text AND public.seller_can_edit(auth.uid()) AND NOT EXISTS(SELECT 1 FROM public.seller_documents d WHERE d.path=storage.objects.name AND d.bucket=storage.objects.bucket_id));
-- Restrictive policies constrain ALL existing permissive policies for these buckets,
-- without changing access to any existing bucket or removing its functionality.
CREATE POLICY seller_bucket_isolation ON storage.objects AS RESTRICTIVE FOR ALL TO PUBLIC
 USING(bucket_id NOT IN ('seller-documents','store-logos','store-banners') OR (storage.foldername(name))[1]=auth.uid()::text)
 WITH CHECK(bucket_id NOT IN ('seller-documents','store-logos','store-banners') OR ((storage.foldername(name))[1]=auth.uid()::text AND public.seller_can_edit(auth.uid())));
CREATE POLICY seller_bucket_immutable ON storage.objects AS RESTRICTIVE FOR UPDATE TO PUBLIC
 USING(bucket_id NOT IN ('seller-documents','store-logos','store-banners'));
CREATE POLICY seller_bucket_delete_guard ON storage.objects AS RESTRICTIVE FOR DELETE TO PUBLIC
 USING(bucket_id NOT IN ('seller-documents','store-logos','store-banners') OR (public.seller_can_edit(auth.uid()) AND NOT EXISTS(SELECT 1 FROM public.seller_documents d WHERE d.path=storage.objects.name AND d.bucket=storage.objects.bucket_id)));
REVOKE ALL ON FUNCTION public.seller_step_errors(integer,jsonb,uuid) FROM PUBLIC,anon,authenticated;
DO $$ DECLARE signature text; BEGIN
 FOREACH signature IN ARRAY ARRAY['seller_can_edit(uuid)','seller_is_approved(uuid)','seller_start()','seller_save_step(integer,jsonb,integer,boolean)','seller_set_document(text,text,text,text,text,bigint)','seller_submit(integer,boolean,boolean)','seller_initialize_dashboard()','seller_activate()'] LOOP
 EXECUTE 'REVOKE ALL ON FUNCTION public.'||signature||' FROM PUBLIC,anon'; EXECUTE 'GRANT EXECUTE ON FUNCTION public.'||signature||' TO authenticated'; END LOOP;
END $$;

ALTER TYPE public.seller_application_status ADD VALUE IF NOT EXISTS 'SUSPENDED';
ALTER TYPE public.seller_application_status ADD VALUE IF NOT EXISTS 'BLOCKED';
-- This is provisioning after an external approval, not an approval mechanism.
CREATE FUNCTION public.seller_approval_provision() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.application_status::text='APPROVED' AND OLD.application_status::text<>'APPROVED' THEN
  UPDATE profiles SET role='SELLER' WHERE id=NEW.user_id AND role='BUYER' AND status NOT IN ('SUSPENDED','BLOCKED','DISABLED');
  INSERT INTO seller_preferences(user_id) VALUES(NEW.user_id) ON CONFLICT DO NOTHING;
  INSERT INTO seller_notifications(user_id,event,message) VALUES(NEW.user_id,'seller_approved','Your seller account is approved. Welcome to Dukapambe.') ON CONFLICT DO NOTHING;
  INSERT INTO seller_verification(user_id,status,badges) VALUES(NEW.user_id,'VERIFIED',ARRAY['Verified Seller']) ON CONFLICT(user_id) DO UPDATE SET status='VERIFIED',badges=ARRAY['Verified Seller'];
 ELSIF NEW.application_status::text IN ('SUSPENDED','BLOCKED','REJECTED') THEN
  UPDATE seller_verification SET status=NEW.application_status::text,badges='{}' WHERE user_id=NEW.user_id;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.seller_approval_provision() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER seller_after_approval AFTER UPDATE OF application_status ON public.seller_profiles FOR EACH ROW EXECUTE FUNCTION public.seller_approval_provision();
DROP POLICY owner_read ON public.seller_preferences;
CREATE POLICY approved_owner_read ON public.seller_preferences FOR SELECT TO authenticated USING(public.seller_is_approved(user_id));
DROP POLICY owner_read ON public.seller_notifications;
CREATE POLICY approved_owner_read ON public.seller_notifications FOR SELECT TO authenticated USING(public.seller_is_approved(user_id));

-- Legacy RPCs remain available to trusted functions, but cannot bypass the wizard.
REVOKE EXECUTE ON FUNCTION public.begin_seller_onboarding() FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.submit_seller_application() FROM PUBLIC,anon,authenticated;
