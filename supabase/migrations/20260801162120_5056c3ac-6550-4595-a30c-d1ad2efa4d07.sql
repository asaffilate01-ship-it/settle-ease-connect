-- =========================================================
-- 1. ENQUIRY INBOX + SLA WORKFLOW
-- =========================================================
CREATE TABLE public.enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL DEFAULT 'Website enquiry',
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  language text NOT NULL DEFAULT 'de',
  source_page text,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','in_progress','waiting_customer','resolved','spam')),
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','urgent')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tags text[] NOT NULL DEFAULT '{}',
  sla_due_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  first_response_at timestamptz,
  resolved_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX enquiries_status_idx ON public.enquiries (status, sla_due_at);
CREATE INDEX enquiries_email_idx ON public.enquiries (lower(email));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.enquiries TO authenticated;
GRANT ALL ON public.enquiries TO service_role;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage enquiries" ON public.enquiries FOR ALL TO authenticated
  USING (public.is_internal(auth.uid())) WITH CHECK (public.is_internal(auth.uid()));
CREATE POLICY "Auditors read enquiries" ON public.enquiries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'auditor'));

CREATE TRIGGER enquiries_updated_at BEFORE UPDATE ON public.enquiries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.enquiry_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id uuid NOT NULL REFERENCES public.enquiries(id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_type text NOT NULL DEFAULT 'internal'
    CHECK (note_type IN ('internal','reply','system')),
  body text NOT NULL,
  delivery_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX enquiry_notes_enquiry_idx ON public.enquiry_notes (enquiry_id, created_at);

GRANT SELECT, INSERT ON public.enquiry_notes TO authenticated;
GRANT ALL ON public.enquiry_notes TO service_role;
ALTER TABLE public.enquiry_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read enquiry notes" ON public.enquiry_notes FOR SELECT TO authenticated
  USING (public.is_internal(auth.uid()) OR public.has_role(auth.uid(), 'auditor'));
CREATE POLICY "Staff add enquiry notes" ON public.enquiry_notes FOR INSERT TO authenticated
  WITH CHECK (public.is_internal(auth.uid()) AND author_user_id = auth.uid());

-- =========================================================
-- 2. CASE MILESTONES / PROGRESS TRACKING
-- =========================================================
CREATE TABLE public.case_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  code text NOT NULL,
  title text NOT NULL,
  description text,
  position integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','active','blocked','done','skipped')),
  target_at timestamptz,
  completed_at timestamptz,
  completed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (case_id, code)
);
CREATE INDEX case_milestones_case_idx ON public.case_milestones (case_id, position);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_milestones TO authenticated;
GRANT ALL ON public.case_milestones TO service_role;
ALTER TABLE public.case_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Case participants read milestones" ON public.case_milestones FOR SELECT TO authenticated
  USING (public.can_access_case(auth.uid(), case_id));
CREATE POLICY "Staff manage milestones" ON public.case_milestones FOR ALL TO authenticated
  USING (public.is_internal(auth.uid()) AND public.can_access_case(auth.uid(), case_id))
  WITH CHECK (public.is_internal(auth.uid()) AND public.can_access_case(auth.uid(), case_id));

CREATE TRIGGER case_milestones_updated_at BEFORE UPDATE ON public.case_milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 3. SECURE FAMILY-ACCESS INVITATIONS
-- =========================================================
CREATE TABLE public.case_access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_name text NOT NULL,
  invited_email text NOT NULL,
  relationship text,
  access_level text NOT NULL DEFAULT 'updates'
    CHECK (access_level IN ('updates','documents','collaborator')),
  can_message boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'invited'
    CHECK (status IN ('invited','accepted','revoked','expired')),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX case_access_grants_case_idx ON public.case_access_grants (case_id);
CREATE INDEX case_access_grants_email_idx ON public.case_access_grants (lower(invited_email));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_access_grants TO authenticated;
GRANT ALL ON public.case_access_grants TO service_role;
ALTER TABLE public.case_access_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read own grants" ON public.case_access_grants FOR SELECT TO authenticated
  USING (
    owner_user_id = auth.uid()
    OR accepted_by = auth.uid()
    OR lower(invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    OR public.is_internal(auth.uid())
  );
CREATE POLICY "Owners create grants" ON public.case_access_grants FOR INSERT TO authenticated
  WITH CHECK (
    owner_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.cases c
       WHERE c.id = case_id AND c.client_user_id = auth.uid()
    )
  );
CREATE POLICY "Owners update own grants" ON public.case_access_grants FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid() OR public.is_internal(auth.uid()))
  WITH CHECK (owner_user_id = auth.uid() OR public.is_internal(auth.uid()));

CREATE TRIGGER case_access_grants_updated_at BEFORE UPDATE ON public.case_access_grants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Accepting an invitation: token-based, security definer so the invitee can be
-- linked without broad table privileges.
CREATE OR REPLACE FUNCTION public.accept_case_access_grant(_token_hash text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  g RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO g
    FROM public.case_access_grants
   WHERE token_hash = _token_hash
     AND status = 'invited'
     AND expires_at > now()
   LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invitation not found or expired';
  END IF;

  IF lower(g.invited_email) <> lower(coalesce(auth.jwt() ->> 'email', '')) THEN
    RAISE EXCEPTION 'this invitation was issued to a different email address';
  END IF;

  UPDATE public.case_access_grants
     SET status = 'accepted', accepted_at = now(), accepted_by = auth.uid()
   WHERE id = g.id;

  INSERT INTO public.case_participants (case_id, user_id, role, added_by)
  VALUES (g.case_id, auth.uid(), 'observer', g.owner_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'family_deputy')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN g.case_id;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_case_access_grant(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_case_access_grant(text) TO authenticated;

-- =========================================================
-- 4. PRIVACY REQUESTS -> FULL DPO WORKFLOW
-- =========================================================
ALTER TABLE public.privacy_requests
  ADD COLUMN IF NOT EXISTS request_type text,
  ADD COLUMN IF NOT EXISTS requester_email text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS due_at timestamptz,
  ADD COLUMN IF NOT EXISTS identity_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resolution text;

UPDATE public.privacy_requests
   SET request_type = COALESCE(request_type, CASE kind WHEN 'export' THEN 'portability' ELSE 'erasure' END),
       description = COALESCE(description, reason, ''),
       due_at = COALESCE(due_at, created_at + interval '30 days');

ALTER TABLE public.privacy_requests
  ALTER COLUMN request_type SET DEFAULT 'access',
  ALTER COLUMN request_type SET NOT NULL,
  ALTER COLUMN description SET DEFAULT '',
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN due_at SET DEFAULT (now() + interval '30 days'),
  ALTER COLUMN due_at SET NOT NULL;

ALTER TABLE public.privacy_requests DROP CONSTRAINT IF EXISTS privacy_requests_kind_check;
ALTER TABLE public.privacy_requests
  ADD CONSTRAINT privacy_requests_kind_check
  CHECK (kind IN ('export','deletion','request'));

ALTER TABLE public.privacy_requests
  ADD CONSTRAINT privacy_requests_request_type_check
  CHECK (request_type IN ('access','rectification','erasure','portability','restriction','objection','consent_withdrawal'));

ALTER TABLE public.privacy_requests DROP CONSTRAINT IF EXISTS privacy_requests_status_check;
ALTER TABLE public.privacy_requests
  ADD CONSTRAINT privacy_requests_status_check
  CHECK (status IN (
    'pending','in_progress','completed','rejected','cancelled',
    'submitted','identity_check','in_review','waiting_requester','fulfilled','declined'
  ));

ALTER TABLE public.privacy_requests ALTER COLUMN kind SET DEFAULT 'request';

CREATE POLICY "Auditors read privacy requests" ON public.privacy_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'auditor'));

-- =========================================================
-- 5. COMPLIANCE CONSOLE
-- =========================================================
CREATE TABLE public.compliance_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general'
    CHECK (category IN ('general','gdpr','security','legal_copy','partner_due_diligence','incident','access_review','retention')),
  severity text NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low','medium','high','critical')),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','in_progress','blocked','ready_for_review','closed','accepted_risk')),
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_at timestamptz,
  resolution text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX compliance_actions_status_idx ON public.compliance_actions (status, due_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.compliance_actions TO authenticated;
GRANT ALL ON public.compliance_actions TO service_role;
ALTER TABLE public.compliance_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage compliance actions" ON public.compliance_actions FOR ALL TO authenticated
  USING (public.is_internal(auth.uid()) OR public.has_role(auth.uid(), 'compliance') OR public.has_role(auth.uid(), 'dpo'))
  WITH CHECK (public.is_internal(auth.uid()) OR public.has_role(auth.uid(), 'compliance') OR public.has_role(auth.uid(), 'dpo'));
CREATE POLICY "Auditors read compliance actions" ON public.compliance_actions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'auditor'));

CREATE TRIGGER compliance_actions_updated_at BEFORE UPDATE ON public.compliance_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 6. SIGNED PARTNER DELIVERY (retries + dead letter)
-- =========================================================
CREATE TABLE public.partner_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_code text NOT NULL UNIQUE,
  label text NOT NULL,
  endpoint_url text NOT NULL,
  signing_secret_env text NOT NULL,
  max_attempts integer NOT NULL DEFAULT 6,
  timeout_ms integer NOT NULL DEFAULT 10000,
  active boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_endpoints TO authenticated;
GRANT ALL ON public.partner_endpoints TO service_role;
ALTER TABLE public.partner_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage partner endpoints" ON public.partner_endpoints FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff read partner endpoints" ON public.partner_endpoints FOR SELECT TO authenticated
  USING (public.is_internal(auth.uid()) OR public.has_role(auth.uid(), 'auditor'));

CREATE TRIGGER partner_endpoints_updated_at BEFORE UPDATE ON public.partner_endpoints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.partner_api_pushes
  ADD COLUMN IF NOT EXISTS endpoint_id uuid REFERENCES public.partner_endpoints(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS locked_by text,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS dead_lettered_at timestamptz;

UPDATE public.partner_api_pushes
   SET idempotency_key = COALESCE(idempotency_key, id::text);

ALTER TABLE public.partner_api_pushes
  ALTER COLUMN idempotency_key SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS partner_api_pushes_idempotency_idx
  ON public.partner_api_pushes (idempotency_key);
CREATE INDEX IF NOT EXISTS partner_api_pushes_queue_idx
  ON public.partner_api_pushes (status, next_attempt_at);

CREATE TABLE public.partner_delivery_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  push_id uuid NOT NULL REFERENCES public.partner_api_pushes(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL,
  response_status integer,
  response_excerpt text,
  error_message text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX partner_delivery_attempts_push_idx ON public.partner_delivery_attempts (push_id, created_at);

GRANT SELECT ON public.partner_delivery_attempts TO authenticated;
GRANT ALL ON public.partner_delivery_attempts TO service_role;
ALTER TABLE public.partner_delivery_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read delivery attempts" ON public.partner_delivery_attempts FOR SELECT TO authenticated
  USING (public.is_internal(auth.uid()) OR public.has_role(auth.uid(), 'auditor'));

-- Lease-safe batch claim for the delivery worker.
CREATE OR REPLACE FUNCTION public.claim_partner_deliveries(_worker_id text, _batch_size integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  endpoint_id uuid,
  request_payload jsonb,
  attempt_count integer,
  idempotency_key text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH claimed AS (
    SELECT p.id
      FROM public.partner_api_pushes p
     WHERE p.status IN ('queued','retrying')
       AND p.next_attempt_at <= now()
       AND (p.locked_at IS NULL OR p.locked_at < now() - interval '5 minutes')
     ORDER BY p.next_attempt_at ASC
     LIMIT GREATEST(LEAST(_batch_size, 25), 1)
     FOR UPDATE SKIP LOCKED
  )
  UPDATE public.partner_api_pushes p
     SET locked_at = now(),
         locked_by = _worker_id,
         attempt_count = p.attempt_count + 1,
         status = 'sending'
   WHERE p.id IN (SELECT c.id FROM claimed c)
  RETURNING p.id, p.endpoint_id, p.request_payload, p.attempt_count, p.idempotency_key;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_partner_deliveries(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_partner_deliveries(text, integer) TO service_role;