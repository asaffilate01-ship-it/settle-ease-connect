BEGIN;

-- ============================================================
-- Operational release: enquiries, case milestones, family access,
-- governance and durable partner delivery.
-- ============================================================

-- Contact enquiries become an assignable, SLA-tracked staff queue.
ALTER TABLE public.contact_enquiries
  DROP CONSTRAINT IF EXISTS contact_enquiries_status_check;
ALTER TABLE public.contact_enquiries
  ADD CONSTRAINT contact_enquiries_status_check
    CHECK (status IN ('new','in_progress','waiting_customer','resolved','spam')),
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','urgent')),
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS sla_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_response_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.contact_enquiries
   SET subject = COALESCE(subject, 'General enquiry'),
       sla_due_at = COALESCE(sla_due_at, created_at + interval '24 hours');

ALTER TABLE public.contact_enquiries ALTER COLUMN subject SET NOT NULL;
ALTER TABLE public.contact_enquiries ALTER COLUMN subject SET DEFAULT 'General enquiry';
ALTER TABLE public.contact_enquiries ALTER COLUMN sla_due_at SET DEFAULT (now() + interval '24 hours');

CREATE INDEX IF NOT EXISTS contact_enquiries_assignee_status_idx
  ON public.contact_enquiries(assigned_to, status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS contact_enquiries_sla_idx
  ON public.contact_enquiries(sla_due_at)
  WHERE status NOT IN ('resolved','spam');

DROP TRIGGER IF EXISTS trg_contact_enquiries_updated ON public.contact_enquiries;
CREATE TRIGGER trg_contact_enquiries_updated
  BEFORE UPDATE ON public.contact_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.contact_enquiry_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id uuid NOT NULL REFERENCES public.contact_enquiries(id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 8000),
  note_type text NOT NULL DEFAULT 'internal'
    CHECK (note_type IN ('internal','customer_reply','status_change','assignment')),
  delivery_status text
    CHECK (delivery_status IS NULL OR delivery_status IN ('queued','sent','failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contact_enquiry_notes_enquiry_idx
  ON public.contact_enquiry_notes(enquiry_id, created_at);
ALTER TABLE public.contact_enquiry_notes ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.contact_enquiry_notes TO authenticated;
GRANT ALL ON public.contact_enquiry_notes TO service_role;
CREATE POLICY "operational staff read enquiry notes"
  ON public.contact_enquiry_notes FOR SELECT TO authenticated
  USING (public.is_internal(auth.uid()));
CREATE POLICY "operational staff add enquiry notes"
  ON public.contact_enquiry_notes FOR INSERT TO authenticated
  WITH CHECK (public.is_internal(auth.uid()) AND author_user_id = auth.uid());

-- Explicit case milestones provide a client-friendly progress path independent
-- of the lower-level append-only case event ledger.
CREATE TABLE IF NOT EXISTS public.case_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 240),
  description text,
  position integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming','current','completed','blocked','skipped')),
  target_at timestamptz,
  completed_at timestamptz,
  completed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  visible_to_client boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(case_id, position)
);
CREATE INDEX IF NOT EXISTS case_milestones_case_position_idx
  ON public.case_milestones(case_id, position);
ALTER TABLE public.case_milestones ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_milestones TO authenticated;
GRANT ALL ON public.case_milestones TO service_role;
CREATE POLICY "case members read visible milestones"
  ON public.case_milestones FOR SELECT TO authenticated
  USING (
    public.can_access_case(auth.uid(), case_id)
    AND (visible_to_client OR public.can_manage_case(auth.uid(), case_id))
  );
CREATE POLICY "case operators create milestones"
  ON public.case_milestones FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_case(auth.uid(), case_id) AND created_by = auth.uid());
CREATE POLICY "case operators update milestones"
  ON public.case_milestones FOR UPDATE TO authenticated
  USING (public.can_manage_case(auth.uid(), case_id))
  WITH CHECK (public.can_manage_case(auth.uid(), case_id));
CREATE POLICY "case operators delete milestones"
  ON public.case_milestones FOR DELETE TO authenticated
  USING (public.can_manage_case(auth.uid(), case_id));
DROP TRIGGER IF EXISTS trg_case_milestones_updated ON public.case_milestones;
CREATE TRIGGER trg_case_milestones_updated
  BEFORE UPDATE ON public.case_milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Family/trusted-person access is email-bound, expiring and revocable. Tokens
-- are stored only as SHA-256 hashes; raw invitation tokens never enter the DB.
CREATE TABLE IF NOT EXISTS public.case_family_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_name text NOT NULL,
  invited_email text NOT NULL,
  relationship text,
  access_level text NOT NULL DEFAULT 'updates'
    CHECK (access_level IN ('updates','documents','collaborator')),
  can_message boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','revoked','expired')),
  invitation_token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS case_family_access_case_idx
  ON public.case_family_access(case_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS case_family_access_user_idx
  ON public.case_family_access(accepted_by, status);
ALTER TABLE public.case_family_access ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.case_family_access TO authenticated;
GRANT ALL ON public.case_family_access TO service_role;

CREATE OR REPLACE FUNCTION public.family_case_grant(
  _user_id uuid,
  _case_id uuid,
  _minimum_level text DEFAULT 'updates'
)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.case_family_access f
     WHERE f.case_id = _case_id
       AND f.accepted_by = _user_id
       AND f.status = 'accepted'
       AND f.expires_at > now()
       AND CASE _minimum_level
         WHEN 'collaborator' THEN f.access_level = 'collaborator'
         WHEN 'documents' THEN f.access_level IN ('documents','collaborator')
         ELSE f.access_level IN ('updates','documents','collaborator')
       END
  );
$$;
REVOKE ALL ON FUNCTION public.family_case_grant(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.family_case_grant(uuid, uuid, text)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.can_access_case(_user_id uuid, _case_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.cases c
     WHERE c.id = _case_id
       AND (c.client_user_id = _user_id OR c.case_manager_user_id = _user_id)
  )
  OR EXISTS (
    SELECT 1 FROM public.case_participants p
     WHERE p.case_id = _case_id AND p.user_id = _user_id
  )
  OR EXISTS (
    SELECT 1
      FROM public.case_assignments a
      JOIN public.partner_users pu
        ON pu.org_id = a.partner_org_id
       AND pu.user_id = _user_id
       AND pu.status = 'active'
     WHERE a.case_id = _case_id
       AND a.status = 'accepted'
       AND a.accepted_at IS NOT NULL
  )
  OR public.family_case_grant(_user_id, _case_id, 'updates')
  OR public.is_case_supervisor(_user_id);
$$;

CREATE POLICY "case owner and operators list family access"
  ON public.case_family_access FOR SELECT TO authenticated
  USING (
    owner_user_id = auth.uid()
    OR accepted_by = auth.uid()
    OR public.can_manage_case(auth.uid(), case_id)
  );
CREATE POLICY "case owner invites family access"
  ON public.case_family_access FOR INSERT TO authenticated
  WITH CHECK (
    owner_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.cases c
       WHERE c.id = case_id AND c.client_user_id = auth.uid()
    )
  );
CREATE POLICY "case owner or operator updates family access"
  ON public.case_family_access FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid() OR public.can_manage_case(auth.uid(), case_id))
  WITH CHECK (owner_user_id = auth.uid() OR public.can_manage_case(auth.uid(), case_id));
DROP TRIGGER IF EXISTS trg_case_family_access_updated ON public.case_family_access;
CREATE TRIGGER trg_case_family_access_updated
  BEFORE UPDATE ON public.case_family_access
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.accept_case_family_invitation(_token_hash text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  grant_row public.case_family_access%ROWTYPE;
  actor_id uuid := auth.uid();
  actor_email text := lower(coalesce(auth.jwt()->>'email', ''));
BEGIN
  IF actor_id IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;

  SELECT * INTO grant_row
    FROM public.case_family_access
   WHERE invitation_token_hash = _token_hash
   FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'invitation not found'; END IF;
  IF grant_row.status <> 'pending' THEN RAISE EXCEPTION 'invitation is no longer active'; END IF;
  IF grant_row.expires_at <= now() THEN
    UPDATE public.case_family_access SET status = 'expired' WHERE id = grant_row.id;
    RAISE EXCEPTION 'invitation expired';
  END IF;
  IF lower(grant_row.invited_email) <> actor_email THEN
    RAISE EXCEPTION 'sign in with the invited email address';
  END IF;

  UPDATE public.case_family_access
     SET status = 'accepted', accepted_by = actor_id, accepted_at = now()
   WHERE id = grant_row.id;

  INSERT INTO public.user_roles(user_id, role)
  VALUES (actor_id, 'family_deputy'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN grant_row.case_id;
END;
$$;
REVOKE ALL ON FUNCTION public.accept_case_family_invitation(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_case_family_invitation(text) TO authenticated;

-- Existing child-table rules were written before granular family grants.
-- Family guests may view case status/tasks; document and message capabilities
-- are explicitly constrained by their grant.
DROP POLICY IF EXISTS "Doc read via case access" ON public.case_documents;
CREATE POLICY "case documents respect family grant"
  ON public.case_documents FOR SELECT TO authenticated
  USING (
    public.can_access_case(auth.uid(), case_id)
    AND (
      NOT public.family_case_grant(auth.uid(), case_id, 'updates')
      OR public.family_case_grant(auth.uid(), case_id, 'documents')
    )
  );

DROP POLICY IF EXISTS "Message send via case access" ON public.case_messages;
CREATE POLICY "case message send respects family grant"
  ON public.case_messages FOR INSERT TO authenticated
  WITH CHECK (
    public.can_access_case(auth.uid(), case_id)
    AND sender_user_id = auth.uid()
    AND (NOT internal_note OR public.can_manage_case(auth.uid(), case_id))
    AND (
      NOT public.family_case_grant(auth.uid(), case_id, 'updates')
      OR EXISTS (
        SELECT 1 FROM public.case_family_access f
         WHERE f.case_id = case_id
           AND f.accepted_by = auth.uid()
           AND f.status = 'accepted'
           AND f.expires_at > now()
           AND f.can_message
      )
    )
  );

DROP POLICY IF EXISTS "Task write via case access" ON public.case_tasks;
DROP POLICY IF EXISTS "Task update via case access" ON public.case_tasks;
CREATE POLICY "case members create permitted tasks"
  ON public.case_tasks FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      public.can_manage_case(auth.uid(), case_id)
      OR EXISTS (
        SELECT 1 FROM public.cases c
         WHERE c.id = case_id AND c.client_user_id = auth.uid()
      )
      OR public.family_case_grant(auth.uid(), case_id, 'collaborator')
    )
  );
CREATE POLICY "case members update permitted tasks"
  ON public.case_tasks FOR UPDATE TO authenticated
  USING (
    public.can_manage_case(auth.uid(), case_id)
    OR EXISTS (
      SELECT 1 FROM public.cases c
       WHERE c.id = case_id AND c.client_user_id = auth.uid()
    )
    OR public.family_case_grant(auth.uid(), case_id, 'collaborator')
  )
  WITH CHECK (
    public.can_manage_case(auth.uid(), case_id)
    OR EXISTS (
      SELECT 1 FROM public.cases c
       WHERE c.id = case_id AND c.client_user_id = auth.uid()
    )
    OR public.family_case_grant(auth.uid(), case_id, 'collaborator')
  );

DROP POLICY IF EXISTS "Doc upload via case access" ON public.case_documents;
CREATE POLICY "case document upload respects family grant"
  ON public.case_documents FOR INSERT TO authenticated
  WITH CHECK (
    public.can_manage_case(auth.uid(), case_id)
    OR EXISTS (
      SELECT 1 FROM public.cases c
       WHERE c.id = case_id AND c.client_user_id = auth.uid()
    )
    OR public.family_case_grant(auth.uid(), case_id, 'collaborator')
  );

-- Data-subject requests and compliance actions are separate queues with
-- least-privilege role policies. Auditors are read-only by design.
CREATE TABLE IF NOT EXISTS public.privacy_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_email text NOT NULL,
  request_type text NOT NULL
    CHECK (request_type IN ('access','rectification','erasure','portability','restriction','objection','consent_withdrawal')),
  description text,
  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted','identity_check','in_review','waiting_requester','fulfilled','declined')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  identity_verified_at timestamptz,
  resolution text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS privacy_requests_status_due_idx
  ON public.privacy_requests(status, due_at);
ALTER TABLE public.privacy_requests ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.privacy_requests TO authenticated;
GRANT ALL ON public.privacy_requests TO service_role;
CREATE POLICY "users submit privacy requests"
  ON public.privacy_requests FOR INSERT TO authenticated
  WITH CHECK (requester_user_id = auth.uid());
CREATE POLICY "users read own privacy requests"
  ON public.privacy_requests FOR SELECT TO authenticated
  USING (
    requester_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'dpo')
    OR public.has_role(auth.uid(), 'auditor')
  );
CREATE POLICY "dpo manages privacy requests"
  ON public.privacy_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dpo'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dpo'));
DROP TRIGGER IF EXISTS trg_privacy_requests_updated ON public.privacy_requests;
CREATE TRIGGER trg_privacy_requests_updated
  BEFORE UPDATE ON public.privacy_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.compliance_actions (
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
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  resolution text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS compliance_actions_status_due_idx
  ON public.compliance_actions(status, severity, due_at);
ALTER TABLE public.compliance_actions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.compliance_actions TO authenticated;
GRANT ALL ON public.compliance_actions TO service_role;
CREATE POLICY "governance reads compliance actions"
  ON public.compliance_actions FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'compliance')
    OR public.has_role(auth.uid(), 'auditor')
  );
CREATE POLICY "compliance manages actions"
  ON public.compliance_actions FOR INSERT TO authenticated
  WITH CHECK (
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'compliance'))
    AND created_by = auth.uid()
  );
CREATE POLICY "compliance updates actions"
  ON public.compliance_actions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'compliance'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'compliance'));
DROP TRIGGER IF EXISTS trg_compliance_actions_updated ON public.compliance_actions;
CREATE TRIGGER trg_compliance_actions_updated
  BEFORE UPDATE ON public.compliance_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "staff read all audit" ON public.audit_log;
CREATE POLICY "operations and governance read audit"
  ON public.audit_log FOR SELECT TO authenticated
  USING (
    public.is_internal(auth.uid())
    OR public.has_role(auth.uid(), 'compliance')
    OR public.has_role(auth.uid(), 'dpo')
    OR public.has_role(auth.uid(), 'auditor')
  );

-- Registered endpoints prevent staff-entered SSRF destinations. Secrets are
-- environment-variable references; secret values never enter Postgres.
CREATE TABLE IF NOT EXISTS public.partner_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_code text NOT NULL UNIQUE,
  display_name text NOT NULL,
  endpoint_url text NOT NULL CHECK (endpoint_url ~ '^https://'),
  signing_secret_env text NOT NULL CHECK (signing_secret_env ~ '^[A-Z][A-Z0-9_]+$'),
  active boolean NOT NULL DEFAULT false,
  max_attempts integer NOT NULL DEFAULT 6 CHECK (max_attempts BETWEEN 1 AND 12),
  timeout_ms integer NOT NULL DEFAULT 10000 CHECK (timeout_ms BETWEEN 1000 AND 30000),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.partner_endpoints ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.partner_endpoints TO authenticated;
GRANT ALL ON public.partner_endpoints TO service_role;
CREATE POLICY "staff read configured partner endpoints"
  ON public.partner_endpoints FOR SELECT TO authenticated
  USING (public.is_internal(auth.uid()));
CREATE POLICY "admins create partner endpoints"
  ON public.partner_endpoints FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());
CREATE POLICY "admins update partner endpoints"
  ON public.partner_endpoints FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS trg_partner_endpoints_updated ON public.partner_endpoints;
CREATE TRIGGER trg_partner_endpoints_updated
  BEFORE UPDATE ON public.partner_endpoints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.partner_api_pushes
  DROP CONSTRAINT IF EXISTS partner_api_pushes_status_check;
ALTER TABLE public.partner_api_pushes
  ADD CONSTRAINT partner_api_pushes_status_check
    CHECK (status IN ('queued','processing','retrying','sent','failed','acknowledged','dead_letter')),
  ADD COLUMN IF NOT EXISTS endpoint_id uuid REFERENCES public.partner_endpoints(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS dead_lettered_at timestamptz,
  ADD COLUMN IF NOT EXISTS locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS locked_by text;
CREATE UNIQUE INDEX IF NOT EXISTS partner_pushes_idempotency_unique
  ON public.partner_api_pushes(idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS partner_pushes_dispatch_idx
  ON public.partner_api_pushes(status, next_attempt_at)
  WHERE status IN ('queued','retrying','processing');

CREATE TABLE IF NOT EXISTS public.partner_delivery_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  push_id uuid NOT NULL REFERENCES public.partner_api_pushes(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL,
  request_started_at timestamptz NOT NULL DEFAULT now(),
  response_status integer,
  response_excerpt text,
  error_message text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(push_id, attempt_number)
);
CREATE INDEX IF NOT EXISTS partner_delivery_attempts_push_idx
  ON public.partner_delivery_attempts(push_id, attempt_number DESC);
ALTER TABLE public.partner_delivery_attempts ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.partner_delivery_attempts TO authenticated;
GRANT ALL ON public.partner_delivery_attempts TO service_role;
CREATE POLICY "internal staff read delivery attempts"
  ON public.partner_delivery_attempts FOR SELECT TO authenticated
  USING (public.is_internal(auth.uid()));

-- Service-role worker claims a small lease-safe batch. Authenticated users
-- cannot execute this function directly.
CREATE OR REPLACE FUNCTION public.claim_partner_deliveries(
  _worker_id text,
  _batch_size integer DEFAULT 10
)
RETURNS SETOF public.partner_api_pushes
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT p.id
      FROM public.partner_api_pushes p
      JOIN public.partner_endpoints e ON e.id = p.endpoint_id AND e.active
     WHERE (
       (p.status IN ('queued','retrying') AND p.next_attempt_at <= now())
       OR (p.status = 'processing' AND p.locked_at < now() - interval '5 minutes')
     )
     ORDER BY p.next_attempt_at, p.created_at
     FOR UPDATE SKIP LOCKED
     LIMIT LEAST(GREATEST(_batch_size, 1), 25)
  )
  UPDATE public.partner_api_pushes p
     SET status = 'processing',
         locked_at = now(),
         locked_by = _worker_id,
         attempt_count = p.attempt_count + 1
    FROM candidates c
   WHERE p.id = c.id
  RETURNING p.*;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_partner_deliveries(text, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_partner_deliveries(text, integer)
  TO service_role;

-- Store operational audit evidence without copying free-text messages,
-- invitation token hashes or partner payloads into the audit ledger.
CREATE OR REPLACE FUNCTION public.audit_operational_change()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  record_data jsonb;
  safe_metadata jsonb;
BEGIN
  record_data := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
  safe_metadata := jsonb_strip_nulls(jsonb_build_object(
    'operation', lower(TG_OP),
    'status', record_data ->> 'status',
    'case_id', record_data ->> 'case_id',
    'push_id', record_data ->> 'push_id',
    'endpoint_id', record_data ->> 'endpoint_id'
  ));

  INSERT INTO public.audit_log (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    auth.uid(),
    lower(TG_OP),
    TG_TABLE_NAME,
    NULLIF(record_data ->> 'id', '')::uuid,
    safe_metadata
  );
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

-- Audit the newly mutable operational records using the minimized event shape.
DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'contact_enquiries','contact_enquiry_notes','case_milestones',
    'case_family_access','privacy_requests','compliance_actions',
    'partner_endpoints','partner_api_pushes'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 'trg_audit_' || table_name, table_name);
    EXECUTE format(
      'CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.audit_operational_change()',
      'trg_audit_' || table_name,
      table_name
    );
  END LOOP;
END $$;

COMMIT;
