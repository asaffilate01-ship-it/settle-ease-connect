
-- ============================================================
-- Personal Secure Vault
-- ============================================================

-- ---------- vault_documents ----------
CREATE TABLE public.vault_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'passport','visa','residence_card','national_id',
    'birth_cert','marriage_cert','death_cert','divorce_cert',
    'driving_licence','vehicle_docs',
    'bank_details','insurance','tax','benefits','social_security',
    'medical','education','employment','property','rental',
    'will_testament','power_of_attorney','advance_directive',
    'other'
  )),
  label TEXT NOT NULL,
  issuer TEXT,
  document_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  country TEXT,
  storage_path TEXT,
  file_name TEXT,
  mime_type TEXT,
  file_size BIGINT,
  checksum TEXT,
  notes TEXT,
  is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vault_documents_owner ON public.vault_documents(owner_user_id);
CREATE INDEX idx_vault_documents_category ON public.vault_documents(owner_user_id, category);
CREATE INDEX idx_vault_documents_expiry ON public.vault_documents(owner_user_id, expiry_date) WHERE expiry_date IS NOT NULL;

-- Auto-flag sensitive categories
CREATE OR REPLACE FUNCTION public.vault_set_sensitivity()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.category IN ('bank_details','tax','benefits','social_security','medical','will_testament','power_of_attorney','advance_directive') THEN
    NEW.is_sensitive := TRUE;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_vault_docs_sensitivity
  BEFORE INSERT OR UPDATE ON public.vault_documents
  FOR EACH ROW EXECUTE FUNCTION public.vault_set_sensitivity();

CREATE TRIGGER trg_vault_docs_updated_at
  BEFORE UPDATE ON public.vault_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vault_documents TO authenticated;
GRANT ALL ON public.vault_documents TO service_role;
ALTER TABLE public.vault_documents ENABLE ROW LEVEL SECURITY;

-- ---------- vault_deputies ----------
CREATE TABLE public.vault_deputies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deputy_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invite_email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT,
  access_rule TEXT NOT NULL CHECK (access_rule IN ('immediate','on_incapacity','on_death')),
  verification_method TEXT NOT NULL DEFAULT 'case_manager' CHECK (verification_method IN ('case_manager','multi_deputy')),
  min_confirmations INTEGER NOT NULL DEFAULT 2,
  allowed_categories TEXT[] NOT NULL DEFAULT '{}'::text[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','revoked')),
  access_granted BOOLEAN NOT NULL DEFAULT FALSE,
  access_granted_at TIMESTAMPTZ,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, invite_email)
);

CREATE INDEX idx_vault_deputies_owner ON public.vault_deputies(owner_user_id);
CREATE INDEX idx_vault_deputies_deputy ON public.vault_deputies(deputy_user_id);

CREATE TRIGGER trg_vault_deputies_updated_at
  BEFORE UPDATE ON public.vault_deputies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vault_deputies TO authenticated;
GRANT ALL ON public.vault_deputies TO service_role;
ALTER TABLE public.vault_deputies ENABLE ROW LEVEL SECURITY;

-- ---------- vault_unlock_requests ----------
CREATE TABLE public.vault_unlock_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('death','incapacity')),
  verification_method TEXT NOT NULL CHECK (verification_method IN ('case_manager','multi_deputy')),
  evidence_storage_path TEXT,
  evidence_note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected','cancelled')),
  verified_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vault_unlock_owner ON public.vault_unlock_requests(owner_user_id, status);

CREATE TRIGGER trg_vault_unlock_updated_at
  BEFORE UPDATE ON public.vault_unlock_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vault_unlock_requests TO authenticated;
GRANT ALL ON public.vault_unlock_requests TO service_role;
ALTER TABLE public.vault_unlock_requests ENABLE ROW LEVEL SECURITY;

-- ---------- vault_unlock_confirmations ----------
CREATE TABLE public.vault_unlock_confirmations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unlock_request_id UUID NOT NULL REFERENCES public.vault_unlock_requests(id) ON DELETE CASCADE,
  deputy_id UUID NOT NULL REFERENCES public.vault_deputies(id) ON DELETE CASCADE,
  confirmed_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (unlock_request_id, deputy_id)
);

GRANT SELECT, INSERT, DELETE ON public.vault_unlock_confirmations TO authenticated;
GRANT ALL ON public.vault_unlock_confirmations TO service_role;
ALTER TABLE public.vault_unlock_confirmations ENABLE ROW LEVEL SECURITY;

-- ---------- vault_access_log ----------
CREATE TABLE public.vault_access_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vault_owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accessed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  document_id UUID REFERENCES public.vault_documents(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('view','download','upload','delete','meta_update','deputy_invite','deputy_accept','deputy_revoke','unlock_request','unlock_verify','unlock_reject')),
  reason TEXT,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vault_log_owner ON public.vault_access_log(vault_owner_user_id, created_at DESC);

GRANT SELECT, INSERT ON public.vault_access_log TO authenticated;
GRANT ALL ON public.vault_access_log TO service_role;
ALTER TABLE public.vault_access_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper: can this deputy read this category of the owner's vault?
-- ============================================================
CREATE OR REPLACE FUNCTION public.vault_deputy_can_read(_deputy_user UUID, _owner_user UUID, _category TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vault_deputies d
    WHERE d.owner_user_id = _owner_user
      AND d.deputy_user_id = _deputy_user
      AND d.status = 'accepted'
      AND (d.access_rule = 'immediate' OR d.access_granted = TRUE)
      AND (_category = ANY(d.allowed_categories) OR 'all' = ANY(d.allowed_categories))
  );
$$;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- vault_documents: owner full control; deputies read allowed categories
CREATE POLICY "owner manages own vault docs"
  ON public.vault_documents FOR ALL TO authenticated
  USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "deputy reads allowed vault docs"
  ON public.vault_documents FOR SELECT TO authenticated
  USING (public.vault_deputy_can_read(auth.uid(), owner_user_id, category));

-- vault_deputies: owner manages; deputy sees own row(s)
CREATE POLICY "owner manages own deputies"
  ON public.vault_deputies FOR ALL TO authenticated
  USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "deputy reads own nomination"
  ON public.vault_deputies FOR SELECT TO authenticated
  USING (auth.uid() = deputy_user_id);

CREATE POLICY "deputy accepts or declines own nomination"
  ON public.vault_deputies FOR UPDATE TO authenticated
  USING (auth.uid() = deputy_user_id)
  WITH CHECK (auth.uid() = deputy_user_id);

-- vault_unlock_requests: owner + requesting deputy see + case managers verify
CREATE POLICY "owner sees own unlock requests"
  ON public.vault_unlock_requests FOR SELECT TO authenticated
  USING (auth.uid() = owner_user_id);

CREATE POLICY "requester sees own unlock request"
  ON public.vault_unlock_requests FOR SELECT TO authenticated
  USING (auth.uid() = requested_by_user_id);

CREATE POLICY "deputies of the owner see unlock requests"
  ON public.vault_unlock_requests FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vault_deputies d
    WHERE d.owner_user_id = vault_unlock_requests.owner_user_id
      AND d.deputy_user_id = auth.uid()
      AND d.status = 'accepted'
  ));

CREATE POLICY "staff sees all unlock requests"
  ON public.vault_unlock_requests FOR SELECT TO authenticated
  USING (public.is_internal(auth.uid()));

CREATE POLICY "deputies open unlock requests"
  ON public.vault_unlock_requests FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = requested_by_user_id
    AND EXISTS (
      SELECT 1 FROM public.vault_deputies d
      WHERE d.owner_user_id = vault_unlock_requests.owner_user_id
        AND d.deputy_user_id = auth.uid()
        AND d.status = 'accepted'
    )
  );

CREATE POLICY "owner cancels own unlock requests"
  ON public.vault_unlock_requests FOR UPDATE TO authenticated
  USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "staff verifies unlock requests"
  ON public.vault_unlock_requests FOR UPDATE TO authenticated
  USING (public.is_internal(auth.uid())) WITH CHECK (public.is_internal(auth.uid()));

-- vault_unlock_confirmations: any accepted deputy of the owner can confirm
CREATE POLICY "deputy confirms unlock"
  ON public.vault_unlock_confirmations FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = confirmed_by_user_id
    AND EXISTS (
      SELECT 1 FROM public.vault_deputies d
      JOIN public.vault_unlock_requests r ON r.owner_user_id = d.owner_user_id
      WHERE d.id = vault_unlock_confirmations.deputy_id
        AND r.id = vault_unlock_confirmations.unlock_request_id
        AND d.deputy_user_id = auth.uid()
        AND d.status = 'accepted'
    )
  );

CREATE POLICY "involved parties see confirmations"
  ON public.vault_unlock_confirmations FOR SELECT TO authenticated
  USING (
    auth.uid() = confirmed_by_user_id
    OR public.is_internal(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.vault_unlock_requests r
      WHERE r.id = vault_unlock_confirmations.unlock_request_id
        AND (r.owner_user_id = auth.uid() OR r.requested_by_user_id = auth.uid())
    )
  );

-- vault_access_log: owner sees own; anyone with vault access can insert their own action
CREATE POLICY "owner reads own access log"
  ON public.vault_access_log FOR SELECT TO authenticated
  USING (auth.uid() = vault_owner_user_id);

CREATE POLICY "staff reads access log"
  ON public.vault_access_log FOR SELECT TO authenticated
  USING (public.is_internal(auth.uid()));

CREATE POLICY "user logs own action"
  ON public.vault_access_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = accessed_by_user_id);

-- ============================================================
-- STORAGE POLICIES on the private 'vault' bucket
-- Path convention: {owner_user_id}/{document_id}/{filename}
-- ============================================================

CREATE POLICY "vault owner manages own files"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'vault'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'vault'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "vault deputy reads allowed files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'vault'
    AND EXISTS (
      SELECT 1 FROM public.vault_documents vd
      WHERE vd.id::text = (storage.foldername(name))[2]
        AND vd.owner_user_id::text = (storage.foldername(name))[1]
        AND public.vault_deputy_can_read(auth.uid(), vd.owner_user_id, vd.category)
    )
  );

CREATE POLICY "staff reads vault files for verification"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'vault'
    AND public.is_internal(auth.uid())
  );
