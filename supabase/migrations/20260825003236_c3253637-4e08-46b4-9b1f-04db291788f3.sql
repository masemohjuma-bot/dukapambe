-- Restrict admin_profiles writes to super admins only (no role data changes)
CREATE POLICY "admin_profiles_insert_super_admin"
ON public.admin_profiles FOR INSERT TO authenticated
WITH CHECK (public.is_super_admin());

CREATE POLICY "admin_profiles_delete_super_admin"
ON public.admin_profiles FOR DELETE TO authenticated
USING (public.is_super_admin());

-- Trigger-only SECURITY DEFINER functions must not be callable via the API
REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_auth_user_updated() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_profile_security_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_seller_application_state() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_affiliate_security_fields() FROM PUBLIC, anon, authenticated;

-- Role-check helpers are used inside policies; keep them out of the public API surface
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_app_role() FROM PUBLIC, anon;