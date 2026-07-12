
-- Directory listings (paid €10/yr, publicly visible)
CREATE TABLE public.directory_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  business_name text NOT NULL,
  category text NOT NULL,           -- lawyer | doctor | immigration | tax | welfare | medical | education | religious | translator | funeral | other
  subcategory text,
  description text,
  city text,
  bundesland text,
  languages text[] NOT NULL DEFAULT '{}',
  website text,
  phone text,
  email text,
  address text,
  logo_url text,
  status text NOT NULL DEFAULT 'draft',  -- draft | active | expired | suspended
  paid_until date,                       -- NULL = never paid
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_directory_category ON public.directory_listings(category);
CREATE INDEX idx_directory_public ON public.directory_listings(status, paid_until);

GRANT SELECT ON public.directory_listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.directory_listings TO authenticated;
GRANT ALL ON public.directory_listings TO service_role;

ALTER TABLE public.directory_listings ENABLE ROW LEVEL SECURITY;

-- Public: only active + paid listings visible
CREATE POLICY "dir_public_read" ON public.directory_listings
  FOR SELECT TO anon, authenticated
  USING (status = 'active' AND paid_until IS NOT NULL AND paid_until >= CURRENT_DATE);

-- Owners: read/update/insert their own regardless of status
CREATE POLICY "dir_owner_read" ON public.directory_listings
  FOR SELECT TO authenticated USING (owner_user_id = auth.uid());
CREATE POLICY "dir_owner_insert" ON public.directory_listings
  FOR INSERT TO authenticated WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "dir_owner_update" ON public.directory_listings
  FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid() AND status <> 'suspended');

-- Admins: full control
CREATE POLICY "dir_admin_all" ON public.directory_listings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_dir_updated BEFORE UPDATE ON public.directory_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
