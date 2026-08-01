
-- 1. Extend role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'case_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'expert';

COMMIT;

-- 2. Helper: is this user internal (staff/case_manager/admin)?
CREATE OR REPLACE FUNCTION public.is_internal(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin','staff','case_manager')
  )
$$;

-- 3. Knowledge categories
CREATE TABLE public.knowledge_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_categories TO authenticated;
GRANT ALL ON public.knowledge_categories TO service_role;
ALTER TABLE public.knowledge_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kb_cat_internal_read" ON public.knowledge_categories
  FOR SELECT TO authenticated USING (public.is_internal(auth.uid()));
CREATE POLICY "kb_cat_admin_write" ON public.knowledge_categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_kb_cat_updated BEFORE UPDATE ON public.knowledge_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Regulations (laws / paragraphs / directives)
CREATE TABLE public.knowledge_regulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,             -- e.g. 'AufenthG §18b', 'SGB II §7'
  title text NOT NULL,
  jurisdiction text NOT NULL DEFAULT 'DE-FED', -- DE-FED, DE-BE, DE-NRW, EU
  authority text,                        -- BMI, BAMF, Sozialamt, Standesamt, ...
  official_url text,
  summary text,
  last_reviewed_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_regulations TO authenticated;
GRANT ALL ON public.knowledge_regulations TO service_role;
ALTER TABLE public.knowledge_regulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kb_reg_internal_read" ON public.knowledge_regulations
  FOR SELECT TO authenticated USING (public.is_internal(auth.uid()));
CREATE POLICY "kb_reg_admin_write" ON public.knowledge_regulations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_kb_reg_updated BEFORE UPDATE ON public.knowledge_regulations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Services (the operational SOP for each thing Beistand delivers)
CREATE TABLE public.knowledge_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.knowledge_categories(id) ON DELETE RESTRICT,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  short_description text,
  eligibility text,
  legal_basis text,                      -- prose summary (AufenthG §..., SGB ...)
  jurisdiction_notes text,               -- how it varies by Bundesland
  typical_timeline text,                 -- '4–12 weeks'
  official_fees text,                    -- '€100 permit fee'
  our_wholesale_notes text,              -- internal margin / partner arrangement
  delivery_playbook jsonb NOT NULL DEFAULT '[]'::jsonb, -- ordered SOP steps
  required_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  common_pitfalls jsonb NOT NULL DEFAULT '[]'::jsonb,
  escalation_contacts jsonb NOT NULL DEFAULT '[]'::jsonb,
  languages text[] NOT NULL DEFAULT ARRAY['de','en'],
  requires_expert_role text,             -- 'lawyer','imam','funeral_director',...
  status text NOT NULL DEFAULT 'active', -- active | draft | retired
  last_reviewed_at date,
  last_reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_kb_services_category ON public.knowledge_services(category_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_services TO authenticated;
GRANT ALL ON public.knowledge_services TO service_role;
ALTER TABLE public.knowledge_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kb_svc_internal_read" ON public.knowledge_services
  FOR SELECT TO authenticated USING (public.is_internal(auth.uid()));
CREATE POLICY "kb_svc_admin_write" ON public.knowledge_services
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_kb_svc_updated BEFORE UPDATE ON public.knowledge_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Service <-> Regulation link
CREATE TABLE public.knowledge_service_regulations (
  service_id uuid NOT NULL REFERENCES public.knowledge_services(id) ON DELETE CASCADE,
  regulation_id uuid NOT NULL REFERENCES public.knowledge_regulations(id) ON DELETE CASCADE,
  note text,
  PRIMARY KEY (service_id, regulation_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_service_regulations TO authenticated;
GRANT ALL ON public.knowledge_service_regulations TO service_role;
ALTER TABLE public.knowledge_service_regulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kb_svcreg_internal_read" ON public.knowledge_service_regulations
  FOR SELECT TO authenticated USING (public.is_internal(auth.uid()));
CREATE POLICY "kb_svcreg_admin_write" ON public.knowledge_service_regulations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 7. Experts / consultants roster
CREATE TABLE public.experts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- optional login
  full_name text NOT NULL,
  profession text NOT NULL,              -- 'lawyer','tax_advisor','imam','priest','funeral_director','translator','doctor','notary','social_worker'
  specialisations text[] NOT NULL DEFAULT '{}',
  kammer_authority text,                 -- RAK Berlin, Steuerberaterkammer, ...
  registration_number text,              -- Anwaltsregister #, Zulassung #
  verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  languages text[] NOT NULL DEFAULT '{}',
  city text,
  bundesland text,
  email text,
  phone text,
  hourly_rate_eur numeric(10,2),
  wholesale_rate_eur numeric(10,2),      -- rate to Beistand (pass-through model)
  availability_notes text,
  bio text,
  status text NOT NULL DEFAULT 'active', -- active | paused | offboarded
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_experts_profession ON public.experts(profession);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.experts TO authenticated;
GRANT ALL ON public.experts TO service_role;
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "experts_internal_read" ON public.experts
  FOR SELECT TO authenticated USING (public.is_internal(auth.uid()));
CREATE POLICY "experts_self_read" ON public.experts
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "experts_admin_write" ON public.experts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_experts_updated BEFORE UPDATE ON public.experts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Expert <-> Service link
CREATE TABLE public.expert_services (
  expert_id uuid NOT NULL REFERENCES public.experts(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.knowledge_services(id) ON DELETE CASCADE,
  is_lead boolean NOT NULL DEFAULT false,
  note text,
  PRIMARY KEY (expert_id, service_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expert_services TO authenticated;
GRANT ALL ON public.expert_services TO service_role;
ALTER TABLE public.expert_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expsvc_internal_read" ON public.expert_services
  FOR SELECT TO authenticated USING (public.is_internal(auth.uid()));
CREATE POLICY "expsvc_expert_read" ON public.expert_services
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.experts e WHERE e.id = expert_id AND e.user_id = auth.uid())
  );
CREATE POLICY "expsvc_admin_write" ON public.expert_services
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
