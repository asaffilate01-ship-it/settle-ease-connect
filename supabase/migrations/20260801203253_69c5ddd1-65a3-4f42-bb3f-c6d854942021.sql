CREATE OR REPLACE VIEW public.public_directory_listings AS
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

GRANT SELECT ON public.public_directory_listings TO anon;
GRANT SELECT ON public.public_directory_listings TO authenticated;
GRANT ALL ON public.public_directory_listings TO service_role;

DROP POLICY IF EXISTS "dir_public_read" ON public.directory_listings;

DROP POLICY IF EXISTS "read replies" ON public.community_replies;
CREATE POLICY "read replies"
  ON public.community_replies
  FOR SELECT
  TO authenticated
  USING (
    author_user_id = auth.uid()
    OR is_internal(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.community_posts p
      WHERE p.id = community_replies.post_id
        AND (p.status <> 'hidden' OR p.author_user_id = auth.uid() OR is_internal(auth.uid()))
    )
  );