CREATE OR REPLACE VIEW public.public_directory_listings WITH (security_invoker = true) AS
SELECT
  id,
  business_name,
  category,
  subcategory,
  description,
  city,
  bundesland,
  languages,
  website,
  logo_url,
  featured,
  status,
  created_at,
  updated_at
FROM public.directory_listings
WHERE status = 'active';