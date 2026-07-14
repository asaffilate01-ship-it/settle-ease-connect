DROP POLICY IF EXISTS dir_public_read ON public.directory_listings;
CREATE POLICY dir_public_read ON public.directory_listings
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');