
-- Roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'partner_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'partner_user';

-- Category enums
DO $$ BEGIN
  CREATE TYPE public.partner_category AS ENUM (
    'funeral_director','lawyer','translator','religious_org','hospital',
    'airline','driving_school','childcare','relocation','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.translator_service_type AS ENUM (
    'general','interpreting','certified','sworn','medical','authority_appointment','urgent_phone'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Organisations
CREATE TABLE public.partner_organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name text NOT NULL,
  trading_name text,
  primary_category public.partner_category NOT NULL,
  registration_no text,
  vat_no text,
  address_line1 text,
  address_line2 text,
  postal_code text,
  city text,
  country text NOT NULL DEFAULT 'DE',
  bundesland text,
  contact_email text,
  contact_phone text,
  website text,
  bank_iban text,
  bank_bic text,
  bank_holder text,
  status text NOT NULL DEFAULT 'pending', -- pending, active, suspended, offboarded
  verified boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_organisations TO authenticated;
GRANT ALL ON public.partner_organisations TO service_role;
ALTER TABLE public.partner_organisations ENABLE ROW LEVEL SECURITY;

-- Partner users (link auth.users to org)
CREATE TABLE public.partner_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.partner_organisations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin boolean NOT NULL DEFAULT false,
  role_title text,
  status text NOT NULL DEFAULT 'active', -- active, invited, suspended
  invited_email text,
  invited_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_users TO authenticated;
GRANT ALL ON public.partner_users TO service_role;
ALTER TABLE public.partner_users ENABLE ROW LEVEL SECURITY;

-- Helper functions (SECURITY DEFINER to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_partner_member(_user_id uuid, _org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.partner_users
    WHERE user_id = _user_id AND org_id = _org_id AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_partner_admin(_user_id uuid, _org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.partner_users
    WHERE user_id = _user_id AND org_id = _org_id AND status = 'active' AND is_admin = true
  );
$$;

CREATE OR REPLACE FUNCTION public.current_partner_org(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT org_id FROM public.partner_users
   WHERE user_id = _user_id AND status = 'active'
   ORDER BY is_admin DESC, created_at ASC
   LIMIT 1;
$$;

-- Partner documents (licence, insurance, bank statement, etc.)
CREATE TABLE public.partner_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.partner_organisations(id) ON DELETE CASCADE,
  category text NOT NULL, -- licence, insurance, bank_details, registration, other
  title text NOT NULL,
  storage_path text,
  file_url text,
  valid_from date,
  valid_until date,
  status text NOT NULL DEFAULT 'pending', -- pending, verified, rejected, expired
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_documents TO authenticated;
GRANT ALL ON public.partner_documents TO service_role;
ALTER TABLE public.partner_documents ENABLE ROW LEVEL SECURITY;

-- Partner service categories (a partner org may offer multiple)
CREATE TABLE public.partner_service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.partner_organisations(id) ON DELETE CASCADE,
  category public.partner_category NOT NULL,
  translator_service_type public.translator_service_type,
  sworn_courts text[] NOT NULL DEFAULT '{}', -- for sworn translators (list of German court names)
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, category, translator_service_type)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_service_categories TO authenticated;
GRANT ALL ON public.partner_service_categories TO service_role;
ALTER TABLE public.partner_service_categories ENABLE ROW LEVEL SECURITY;

-- Partner regions
CREATE TABLE public.partner_service_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.partner_organisations(id) ON DELETE CASCADE,
  bundesland text,
  postal_prefix text, -- e.g. "10" for Berlin district
  radius_km int,
  city text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_service_regions TO authenticated;
GRANT ALL ON public.partner_service_regions TO service_role;
ALTER TABLE public.partner_service_regions ENABLE ROW LEVEL SECURITY;

-- Partner availability
CREATE TABLE public.partner_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.partner_organisations(id) ON DELETE CASCADE,
  weekday int NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  accepts_urgent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_availability TO authenticated;
GRANT ALL ON public.partner_availability TO service_role;
ALTER TABLE public.partner_availability ENABLE ROW LEVEL SECURITY;

-- Case assignments extension (already exists)
ALTER TABLE public.case_assignments
  ADD COLUMN IF NOT EXISTS partner_org_id uuid REFERENCES public.partner_organisations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invited_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS declined_at timestamptz,
  ADD COLUMN IF NOT EXISTS decline_reason text;

CREATE INDEX IF NOT EXISTS idx_case_assignments_partner_org
  ON public.case_assignments(partner_org_id);

-- updated_at triggers
CREATE TRIGGER trg_partner_orgs_updated BEFORE UPDATE ON public.partner_organisations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_partner_users_updated BEFORE UPDATE ON public.partner_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_partner_docs_updated BEFORE UPDATE ON public.partner_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Policies
-- partner_organisations
CREATE POLICY "partner staff view own org"
  ON public.partner_organisations FOR SELECT TO authenticated
  USING (public.is_partner_member(auth.uid(), id) OR public.is_internal(auth.uid()));

CREATE POLICY "internal manages orgs"
  ON public.partner_organisations FOR INSERT TO authenticated
  WITH CHECK (public.is_internal(auth.uid()));

CREATE POLICY "internal updates orgs"
  ON public.partner_organisations FOR UPDATE TO authenticated
  USING (public.is_internal(auth.uid()) OR public.is_partner_admin(auth.uid(), id))
  WITH CHECK (public.is_internal(auth.uid()) OR public.is_partner_admin(auth.uid(), id));

CREATE POLICY "admin deletes orgs"
  ON public.partner_organisations FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- partner_users
CREATE POLICY "self and org members see partner_users"
  ON public.partner_users FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_partner_admin(auth.uid(), org_id)
    OR public.is_internal(auth.uid())
  );

CREATE POLICY "internal or org admin adds partner_users"
  ON public.partner_users FOR INSERT TO authenticated
  WITH CHECK (public.is_internal(auth.uid()) OR public.is_partner_admin(auth.uid(), org_id));

CREATE POLICY "internal or org admin updates partner_users"
  ON public.partner_users FOR UPDATE TO authenticated
  USING (public.is_internal(auth.uid()) OR public.is_partner_admin(auth.uid(), org_id))
  WITH CHECK (public.is_internal(auth.uid()) OR public.is_partner_admin(auth.uid(), org_id));

CREATE POLICY "internal or org admin removes partner_users"
  ON public.partner_users FOR DELETE TO authenticated
  USING (public.is_internal(auth.uid()) OR public.is_partner_admin(auth.uid(), org_id));

-- partner_documents
CREATE POLICY "org members view documents"
  ON public.partner_documents FOR SELECT TO authenticated
  USING (public.is_partner_member(auth.uid(), org_id) OR public.is_internal(auth.uid()));

CREATE POLICY "org admin or internal writes documents"
  ON public.partner_documents FOR INSERT TO authenticated
  WITH CHECK (public.is_partner_admin(auth.uid(), org_id) OR public.is_internal(auth.uid()));

CREATE POLICY "org admin or internal updates documents"
  ON public.partner_documents FOR UPDATE TO authenticated
  USING (public.is_partner_admin(auth.uid(), org_id) OR public.is_internal(auth.uid()))
  WITH CHECK (public.is_partner_admin(auth.uid(), org_id) OR public.is_internal(auth.uid()));

CREATE POLICY "org admin or internal deletes documents"
  ON public.partner_documents FOR DELETE TO authenticated
  USING (public.is_partner_admin(auth.uid(), org_id) OR public.is_internal(auth.uid()));

-- partner_service_categories
CREATE POLICY "org sees own categories"
  ON public.partner_service_categories FOR SELECT TO authenticated
  USING (public.is_partner_member(auth.uid(), org_id) OR public.is_internal(auth.uid()));
CREATE POLICY "org admin writes categories"
  ON public.partner_service_categories FOR INSERT TO authenticated
  WITH CHECK (public.is_partner_admin(auth.uid(), org_id) OR public.is_internal(auth.uid()));
CREATE POLICY "org admin updates categories"
  ON public.partner_service_categories FOR UPDATE TO authenticated
  USING (public.is_partner_admin(auth.uid(), org_id) OR public.is_internal(auth.uid()))
  WITH CHECK (public.is_partner_admin(auth.uid(), org_id) OR public.is_internal(auth.uid()));
CREATE POLICY "org admin deletes categories"
  ON public.partner_service_categories FOR DELETE TO authenticated
  USING (public.is_partner_admin(auth.uid(), org_id) OR public.is_internal(auth.uid()));

-- partner_service_regions
CREATE POLICY "org sees own regions"
  ON public.partner_service_regions FOR SELECT TO authenticated
  USING (public.is_partner_member(auth.uid(), org_id) OR public.is_internal(auth.uid()));
CREATE POLICY "org admin writes regions"
  ON public.partner_service_regions FOR INSERT TO authenticated
  WITH CHECK (public.is_partner_admin(auth.uid(), org_id) OR public.is_internal(auth.uid()));
CREATE POLICY "org admin updates regions"
  ON public.partner_service_regions FOR UPDATE TO authenticated
  USING (public.is_partner_admin(auth.uid(), org_id) OR public.is_internal(auth.uid()))
  WITH CHECK (public.is_partner_admin(auth.uid(), org_id) OR public.is_internal(auth.uid()));
CREATE POLICY "org admin deletes regions"
  ON public.partner_service_regions FOR DELETE TO authenticated
  USING (public.is_partner_admin(auth.uid(), org_id) OR public.is_internal(auth.uid()));

-- partner_availability
CREATE POLICY "org sees own availability"
  ON public.partner_availability FOR SELECT TO authenticated
  USING (public.is_partner_member(auth.uid(), org_id) OR public.is_internal(auth.uid()));
CREATE POLICY "org admin writes availability"
  ON public.partner_availability FOR INSERT TO authenticated
  WITH CHECK (public.is_partner_admin(auth.uid(), org_id) OR public.is_internal(auth.uid()));
CREATE POLICY "org admin updates availability"
  ON public.partner_availability FOR UPDATE TO authenticated
  USING (public.is_partner_admin(auth.uid(), org_id) OR public.is_internal(auth.uid()))
  WITH CHECK (public.is_partner_admin(auth.uid(), org_id) OR public.is_internal(auth.uid()));
CREATE POLICY "org admin deletes availability"
  ON public.partner_availability FOR DELETE TO authenticated
  USING (public.is_partner_admin(auth.uid(), org_id) OR public.is_internal(auth.uid()));

-- Extend can_access_case to include partner org members
CREATE OR REPLACE FUNCTION public.can_access_case(_user_id uuid, _case_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    EXISTS (SELECT 1 FROM public.cases c WHERE c.id = _case_id AND (c.client_user_id = _user_id OR c.case_manager_user_id = _user_id))
    OR EXISTS (SELECT 1 FROM public.case_participants p WHERE p.case_id = _case_id AND p.user_id = _user_id)
    OR EXISTS (
      SELECT 1 FROM public.case_assignments a
       JOIN public.partner_users pu ON pu.org_id = a.partner_org_id AND pu.user_id = _user_id AND pu.status = 'active'
      WHERE a.case_id = _case_id AND a.accepted_at IS NOT NULL
    )
    OR public.is_internal(_user_id);
$$;
