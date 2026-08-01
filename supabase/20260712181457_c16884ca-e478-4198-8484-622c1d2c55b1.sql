-- Undo the SECURITY DEFINER view (linter flagged it as an error).
DROP VIEW IF EXISTS public.directory_public;

-- Column-level revoke: no PII on directory listings for anon or authenticated.
-- Owner and admin reads of PII happen via server functions that use the
-- service-role admin client (RLS + column grants bypassed).
REVOKE SELECT (email, phone, address) ON public.directory_listings FROM anon, authenticated;

-- Restore the public-active read policy so anon/authenticated can still browse
-- the directory (business name, category, city, etc.). The PII columns above
-- remain unreadable to them regardless of this policy.
DROP POLICY IF EXISTS dir_public_read ON public.directory_listings;
CREATE POLICY dir_public_read
ON public.directory_listings
FOR SELECT
TO anon, authenticated
USING (status = 'active');

-- Anon still needs the table-level base grant for the policy to apply.
GRANT SELECT ON public.directory_listings TO anon;
-- Then re-revoke just the PII columns from anon (GRANT SELECT above adds all).
REVOKE SELECT (email, phone, address) ON public.directory_listings FROM anon, authenticated;