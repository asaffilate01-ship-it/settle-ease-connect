-- Drop the wide public-read policy that lets any anon/authenticated caller
-- SELECT full rows (including email/phone/address) of every active listing.
DROP POLICY IF EXISTS dir_public_read ON public.directory_listings;

-- Revoke any residual base-table access from anon so PII can never be read
-- by unauthenticated callers via the Data API. Owners (authenticated) still
-- reach their own rows through dir_owner_read; admins via dir_admin_all.
REVOKE ALL ON public.directory_listings FROM anon;

-- Public-safe view: only non-PII columns of active listings.
-- security_invoker=false (default) — the view runs with its owner's rights
-- and is not subject to RLS on the base table, so anon can read it.
CREATE OR REPLACE VIEW public.directory_public
WITH (security_invoker = false) AS
SELECT
  id, business_name, category, subcategory, description,
  city, bundesland, languages, website, logo_url, featured,
  created_at, updated_at
FROM public.directory_listings
WHERE status = 'active';

GRANT SELECT ON public.directory_public TO anon, authenticated;