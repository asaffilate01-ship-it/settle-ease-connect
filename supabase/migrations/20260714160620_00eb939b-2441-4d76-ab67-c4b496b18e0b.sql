-- Fix: Directory listings PII exposure to anon
-- Revoke column-level SELECT on PII fields (email, phone, address) from anon.
-- Anonymous browsers can still see business_name, category, city, website, etc.
REVOKE SELECT ON public.directory_listings FROM anon;
GRANT SELECT (
  id, owner_user_id, business_name, category, subcategory, description,
  city, bundesland, languages, website, logo_url, status, paid_until,
  featured, created_at, updated_at
) ON public.directory_listings TO anon;

-- Fix: accept_expert_invitation executable by anon
-- The function requires auth.uid() but was still EXECUTE-able by anon (returning an error).
-- Restrict EXECUTE to authenticated users only.
REVOKE EXECUTE ON FUNCTION public.accept_expert_invitation(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_expert_invitation(text) TO authenticated;