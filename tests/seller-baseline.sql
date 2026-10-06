-- Isolated PostgreSQL integration-test fixture, NOT a deployable baseline.
-- Production auth continues to use Supabase. Tests set auth.uid via a session setting.
CREATE ROLE anon; CREATE ROLE authenticated;
CREATE SCHEMA auth; CREATE SCHEMA storage;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('test.user_id',true),'')::uuid $$;
CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$SELECT string_to_array($1,'/')$$;
CREATE TYPE app_role AS ENUM('BUYER','SELLER','AFFILIATE','ADMIN','SUPER_ADMIN');
CREATE TYPE account_status AS ENUM('ACTIVE','SUSPENDED','BLOCKED','DISABLED');
CREATE TYPE seller_application_status AS ENUM('DRAFT','SUBMITTED','PENDING_REVIEW','UNDER_REVIEW','MORE_INFORMATION_REQUIRED','APPROVED','REJECTED');
CREATE TABLE profiles(id uuid PRIMARY KEY,role app_role NOT NULL DEFAULT 'BUYER',status account_status NOT NULL DEFAULT 'ACTIVE',verification_status text NOT NULL DEFAULT 'UNVERIFIED',profile_completion integer NOT NULL DEFAULT 0,updated_at timestamptz DEFAULT now());
CREATE TABLE buyer_profiles(user_id uuid PRIMARY KEY REFERENCES profiles(id));
CREATE TABLE seller_profiles(user_id uuid PRIMARY KEY REFERENCES profiles(id),application_status seller_application_status NOT NULL DEFAULT 'DRAFT',business_name text DEFAULT '',business_type text DEFAULT '',business_description text DEFAULT '',business_address text DEFAULT '',business_registration_number text DEFAULT '',county text DEFAULT '',district text DEFAULT '',ward text DEFAULT '',owner_name text DEFAULT '',national_id text DEFAULT '',phone_number text DEFAULT '',whatsapp_number text DEFAULT '',delivery_areas text[] DEFAULT '{}',payment_methods text[] DEFAULT '{}',operating_hours jsonb DEFAULT '{}',terms_accepted boolean DEFAULT false,terms_accepted_at timestamptz,profile_completion integer DEFAULT 0,business_logo_path text,business_cover_path text,submitted_at timestamptz,approved_at timestamptz,approved_by uuid,membership_plan text);
CREATE FUNCTION protect_profile_security_fields() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.role<>OLD.role OR NEW.status<>OLD.status OR NEW.verification_status<>OLD.verification_status THEN RAISE EXCEPTION 'Security fields are protected'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER profile_security BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION protect_profile_security_fields();
CREATE FUNCTION protect_seller_application_state() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF auth.uid() IS NOT NULL AND (NEW.application_status<>OLD.application_status OR NEW.approved_at IS DISTINCT FROM OLD.approved_at OR NEW.approved_by IS DISTINCT FROM OLD.approved_by) THEN RAISE EXCEPTION 'Application state is protected'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER seller_security BEFORE UPDATE ON seller_profiles FOR EACH ROW EXECUTE FUNCTION protect_seller_application_state();
CREATE FUNCTION begin_seller_onboarding() RETURNS seller_profiles LANGUAGE plpgsql SECURITY DEFINER AS $$DECLARE r seller_profiles; BEGIN INSERT INTO seller_profiles(user_id) VALUES(auth.uid()) ON CONFLICT DO NOTHING;SELECT * INTO r FROM seller_profiles WHERE user_id=auth.uid();RETURN r;END $$;
CREATE FUNCTION submit_seller_application() RETURNS seller_profiles LANGUAGE plpgsql SECURITY DEFINER AS $$DECLARE r seller_profiles; BEGIN UPDATE seller_profiles SET application_status='SUBMITTED' WHERE user_id=auth.uid();SELECT * INTO r FROM seller_profiles WHERE user_id=auth.uid();RETURN r;END $$;
CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
CREATE TABLE storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),bucket_id text REFERENCES storage.buckets(id),name text,metadata jsonb);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA public,auth,storage TO authenticated,anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO authenticated,anon;
-- Deliberately broad preexisting policy: new restrictive policies must contain it.
CREATE POLICY old_broad_policy ON storage.objects FOR ALL TO PUBLIC USING(true) WITH CHECK(true);

CREATE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE AS $$SELECT false$$;
GRANT SELECT,UPDATE ON public.buyer_profiles TO authenticated;
ALTER TABLE public.buyer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY buyer_fixture_owner ON public.buyer_profiles FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
