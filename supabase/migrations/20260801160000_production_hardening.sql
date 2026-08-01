-- Production hardening: least privilege, protected entitlements, abuse controls,
-- payment idempotency, and isolated verification documents.

BEGIN;

-- Subscription entitlements are payment-system state. Customers may read their
-- own row but can never create or alter plan/status through the public API.
REVOKE INSERT, UPDATE ON public.subscriptions FROM authenticated;
DROP POLICY IF EXISTS "Users create own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users update own subscription" ON public.subscriptions;

-- Keep the broad operational helper limited to roles that actually manage
-- cases. Finance and governance roles receive explicit, table-level access.
CREATE OR REPLACE FUNCTION public.is_internal(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
     WHERE user_id = _user_id
       AND role IN (
         'admin','staff','case_manager','senior_case_manager','team_leader',
         'insurance_admin','tax_admin','benefits_admin','medical_admin','new_arrival_admin'
       )
  );
$$;
REVOKE ALL ON FUNCTION public.is_internal(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_internal(uuid) TO authenticated, service_role;

-- Case access is assignment based. Administrators and designated supervisors
-- retain oversight; a generic staff role does not grant access to every family.
CREATE OR REPLACE FUNCTION public.is_case_supervisor(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
      OR public.has_role(_user_id, 'senior_case_manager')
      OR public.has_role(_user_id, 'team_leader');
$$;

CREATE OR REPLACE FUNCTION public.can_access_case(_user_id uuid, _case_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.cases c
     WHERE c.id = _case_id
       AND (c.client_user_id = _user_id OR c.case_manager_user_id = _user_id)
  )
  OR EXISTS (
    SELECT 1
      FROM public.case_participants p
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
  OR public.is_case_supervisor(_user_id);
$$;

CREATE OR REPLACE FUNCTION public.can_manage_case(_user_id uuid, _case_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.cases c
     WHERE c.id = _case_id AND c.case_manager_user_id = _user_id
  )
  OR EXISTS (
    SELECT 1
      FROM public.case_participants p
     WHERE p.case_id = _case_id
       AND p.user_id = _user_id
       AND p.role IN ('case_manager', 'expert')
  )
  OR public.is_case_supervisor(_user_id);
$$;

REVOKE ALL ON FUNCTION public.is_case_supervisor(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_access_case(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_manage_case(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_case_supervisor(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_case(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_case(uuid, uuid) TO authenticated, service_role;

-- This helper only answers whether the current caller is an active deputy for
-- the requested owner/category. RLS policies invoke it as the authenticated
-- caller, so authenticated requires EXECUTE while anon remains blocked.
REVOKE ALL ON FUNCTION public.vault_deputy_can_read(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vault_deputy_can_read(uuid, uuid, text)
  TO authenticated, service_role;

DROP POLICY IF EXISTS "Managers and internal update cases" ON public.cases;
CREATE POLICY "Assigned managers update cases"
  ON public.cases FOR UPDATE TO authenticated
  USING (public.can_manage_case(auth.uid(), id))
  WITH CHECK (public.can_manage_case(auth.uid(), id));

DROP POLICY IF EXISTS "Quote write via case access" ON public.case_quotes;
DROP POLICY IF EXISTS "Quote update via case access" ON public.case_quotes;
CREATE POLICY "Case operators create quotes"
  ON public.case_quotes FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_case(auth.uid(), case_id) AND created_by = auth.uid());
CREATE POLICY "Case operators update quotes"
  ON public.case_quotes FOR UPDATE TO authenticated
  USING (public.can_manage_case(auth.uid(), case_id))
  WITH CHECK (public.can_manage_case(auth.uid(), case_id));

-- Vault data is owner/deputy scoped. Sensitive metadata and files additionally
-- require an AAL2 JWT, which makes the rule effective for direct Supabase calls.
DROP POLICY IF EXISTS "owner manages own vault docs" ON public.vault_documents;
DROP POLICY IF EXISTS "deputy reads allowed vault docs" ON public.vault_documents;

CREATE POLICY "vault owner reads own documents"
  ON public.vault_documents FOR SELECT TO authenticated
  USING (
    auth.uid() = owner_user_id
    AND (NOT is_sensitive OR auth.jwt()->>'aal' = 'aal2')
  );
CREATE POLICY "vault owner creates own documents"
  ON public.vault_documents FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = owner_user_id
    AND (
      category NOT IN ('bank_details','tax','benefits','social_security','medical','will_testament','power_of_attorney','advance_directive')
      OR auth.jwt()->>'aal' = 'aal2'
    )
  );
CREATE POLICY "vault owner updates own documents"
  ON public.vault_documents FOR UPDATE TO authenticated
  USING (auth.uid() = owner_user_id AND (NOT is_sensitive OR auth.jwt()->>'aal' = 'aal2'))
  WITH CHECK (auth.uid() = owner_user_id AND (NOT is_sensitive OR auth.jwt()->>'aal' = 'aal2'));
CREATE POLICY "vault owner deletes own documents"
  ON public.vault_documents FOR DELETE TO authenticated
  USING (auth.uid() = owner_user_id AND (NOT is_sensitive OR auth.jwt()->>'aal' = 'aal2'));
CREATE POLICY "vault deputy reads allowed documents with assurance"
  ON public.vault_documents FOR SELECT TO authenticated
  USING (
    public.vault_deputy_can_read(auth.uid(), owner_user_id, category)
    AND (NOT is_sensitive OR auth.jwt()->>'aal' = 'aal2')
  );

DROP POLICY IF EXISTS "vault owner manages own files" ON storage.objects;
DROP POLICY IF EXISTS "vault deputy reads allowed files" ON storage.objects;
DROP POLICY IF EXISTS "staff reads vault files for verification" ON storage.objects;

CREATE POLICY "vault owner uploads own files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vault' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "vault owner reads own files with assurance"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'vault'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND EXISTS (
      SELECT 1 FROM public.vault_documents vd
       WHERE vd.id::text = (storage.foldername(name))[2]
         AND vd.owner_user_id = auth.uid()
         AND (NOT vd.is_sensitive OR auth.jwt()->>'aal' = 'aal2')
    )
  );
CREATE POLICY "vault owner updates own files with assurance"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'vault'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND auth.jwt()->>'aal' = 'aal2'
  )
  WITH CHECK (
    bucket_id = 'vault'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND auth.jwt()->>'aal' = 'aal2'
  );
CREATE POLICY "vault owner deletes own files with assurance"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'vault'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND auth.jwt()->>'aal' = 'aal2'
  );
CREATE POLICY "vault deputy reads allowed files with assurance"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'vault'
    AND EXISTS (
      SELECT 1 FROM public.vault_documents vd
       WHERE vd.id::text = (storage.foldername(name))[2]
         AND vd.owner_user_id::text = (storage.foldername(name))[1]
         AND public.vault_deputy_can_read(auth.uid(), vd.owner_user_id, vd.category)
         AND (NOT vd.is_sensitive OR auth.jwt()->>'aal' = 'aal2')
    )
  );

-- Student evidence is not part of the family vault and receives its own policy.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-verifications',
  'student-verifications',
  false,
  10485760,
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "students upload own verification evidence"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'student-verifications'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "students read own verification evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'student-verifications'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "assured staff read verification evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'student-verifications'
    AND public.is_internal(auth.uid())
    AND auth.jwt()->>'aal' = 'aal2'
  );

-- Distributed fixed-window rate limiting for public, metered server functions.
CREATE TABLE IF NOT EXISTS public.public_api_rate_limits (
  scope text NOT NULL,
  key_hash text NOT NULL,
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 1 CHECK (request_count > 0),
  PRIMARY KEY (scope, key_hash, window_started_at)
);
ALTER TABLE public.public_api_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.public_api_rate_limits FROM anon, authenticated;
GRANT ALL ON public.public_api_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.consume_public_rate_limit(
  _scope text,
  _key_hash text,
  _limit integer,
  _window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  bucket timestamptz;
  current_count integer;
BEGIN
  IF _limit < 1 OR _window_seconds < 1 THEN
    RAISE EXCEPTION 'invalid rate-limit configuration';
  END IF;
  bucket := to_timestamp(
    floor(extract(epoch FROM clock_timestamp()) / _window_seconds) * _window_seconds
  );

  INSERT INTO public.public_api_rate_limits(scope, key_hash, window_started_at, request_count)
  VALUES (_scope, _key_hash, bucket, 1)
  ON CONFLICT (scope, key_hash, window_started_at)
  DO UPDATE SET request_count = public.public_api_rate_limits.request_count + 1
    WHERE public.public_api_rate_limits.request_count < _limit
  RETURNING request_count INTO current_count;

  RETURN current_count IS NOT NULL AND current_count <= _limit;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_public_rate_limit(text, text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_public_rate_limit(text, text, integer, integer)
  TO service_role;

-- Partner invitations are separate from active memberships. The original UI
-- inserted the inviter's user id as a placeholder, which could never produce a
-- valid invitation and risked corrupting membership state.
CREATE TABLE IF NOT EXISTS public.partner_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.partner_organisations(id) ON DELETE CASCADE,
  email text NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  token_hash text NOT NULL UNIQUE,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS partner_invitations_org_created_idx
  ON public.partner_invitations(org_id, created_at DESC);
ALTER TABLE public.partner_invitations ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_invitations TO authenticated;
GRANT ALL ON public.partner_invitations TO service_role;
CREATE POLICY "partner admins manage invitations"
  ON public.partner_invitations FOR ALL TO authenticated
  USING (public.is_internal(auth.uid()) OR public.is_partner_admin(auth.uid(), org_id))
  WITH CHECK (public.is_internal(auth.uid()) OR public.is_partner_admin(auth.uid(), org_id));

CREATE OR REPLACE FUNCTION public.accept_partner_invitation(_invitation_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  invitation public.partner_invitations%ROWTYPE;
  actor_id uuid := auth.uid();
  actor_email text;
BEGIN
  IF actor_id IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;

  SELECT * INTO invitation
    FROM public.partner_invitations
   WHERE id = _invitation_id
   FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'invitation not found'; END IF;
  IF invitation.accepted_at IS NOT NULL THEN RAISE EXCEPTION 'invitation already accepted'; END IF;
  IF invitation.expires_at <= now() THEN RAISE EXCEPTION 'invitation expired'; END IF;

  SELECT lower(email) INTO actor_email FROM auth.users WHERE id = actor_id;
  IF actor_email IS NULL OR actor_email <> lower(invitation.email) THEN
    RAISE EXCEPTION 'sign in with the invited email address';
  END IF;

  INSERT INTO public.partner_users(
    org_id, user_id, is_admin, status, invited_email, invited_at, accepted_at
  ) VALUES (
    invitation.org_id, actor_id, invitation.is_admin, 'active',
    lower(invitation.email), invitation.created_at, now()
  )
  ON CONFLICT (org_id, user_id) DO UPDATE SET
    is_admin = EXCLUDED.is_admin,
    status = 'active',
    invited_email = EXCLUDED.invited_email,
    accepted_at = now();

  INSERT INTO public.user_roles(user_id, role)
  VALUES (
    actor_id,
    CASE WHEN invitation.is_admin THEN 'partner_admin'::public.app_role
         ELSE 'partner_user'::public.app_role END
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.partner_invitations
     SET accepted_at = now(), accepted_by = actor_id
   WHERE id = invitation.id;

  RETURN invitation.org_id;
END;
$$;
REVOKE ALL ON FUNCTION public.accept_partner_invitation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_partner_invitation(uuid) TO authenticated;

-- Contact submissions are server-only writes and staff-only reads.
CREATE TABLE IF NOT EXISTS public.contact_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  preferred_language text,
  source text NOT NULL DEFAULT 'contact_page',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_progress','resolved','spam')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS contact_enquiries_status_created_idx
  ON public.contact_enquiries(status, created_at DESC);
ALTER TABLE public.contact_enquiries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.contact_enquiries FROM anon, authenticated;
GRANT SELECT ON public.contact_enquiries TO authenticated;
GRANT ALL ON public.contact_enquiries TO service_role;
CREATE POLICY "internal staff read contact enquiries"
  ON public.contact_enquiries FOR SELECT TO authenticated
  USING (public.is_internal(auth.uid()));

-- Stripe webhook event ledger prevents duplicate side effects across retries.
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  environment text NOT NULL CHECK (environment IN ('sandbox','live')),
  status text NOT NULL CHECK (status IN ('processing','succeeded','failed')),
  error_message text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stripe_webhook_events FROM anon, authenticated;
GRANT ALL ON public.stripe_webhook_events TO service_role;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_stripe_subscription_unique
  ON public.subscriptions(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- Payout queuing is atomic and limited to finance/admin. This is a ledger
-- transition only; live fund movement remains disabled in application code.
ALTER TABLE public.expert_payouts
  DROP CONSTRAINT IF EXISTS expert_payouts_kind_check;
ALTER TABLE public.expert_payouts
  ADD CONSTRAINT expert_payouts_kind_check CHECK (
    kind IN ('referral_fee','wholesale_markup','hourly','bonus','adjustment','escrow_release')
  );
CREATE UNIQUE INDEX IF NOT EXISTS expert_payouts_invoice_release_unique
  ON public.expert_payouts(invoice_id)
  WHERE invoice_id IS NOT NULL AND kind = 'escrow_release';

DROP POLICY IF EXISTS "Internal staff manage expert payouts" ON public.expert_payouts;
CREATE POLICY "finance reads expert payouts"
  ON public.expert_payouts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance'));
CREATE POLICY "finance manages expert payouts"
  ON public.expert_payouts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance'));

CREATE OR REPLACE FUNCTION public.queue_invoice_payout(
  _invoice_id uuid,
  _actor_user_id uuid,
  _notes text DEFAULT NULL
)
RETURNS timestamptz
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  inv public.case_invoices%ROWTYPE;
  released_at_value timestamptz := now();
BEGIN
  IF NOT (
    public.has_role(_actor_user_id, 'admin')
    OR public.has_role(_actor_user_id, 'finance')
  ) THEN
    RAISE EXCEPTION 'finance role required';
  END IF;

  SELECT * INTO inv
    FROM public.case_invoices
   WHERE id = _invoice_id
   FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'invoice not found'; END IF;
  IF inv.expert_id IS NULL THEN RAISE EXCEPTION 'invoice has no expert'; END IF;
  IF inv.status NOT IN ('held_escrow','paid') THEN
    RAISE EXCEPTION 'invoice is not eligible for payout';
  END IF;

  INSERT INTO public.expert_payouts(
    expert_id, case_id, invoice_id, period_month, kind, description,
    gross_eur, amount_eur, currency, status, created_by
  ) VALUES (
    inv.expert_id,
    inv.case_id,
    inv.id,
    date_trunc('month', released_at_value)::date,
    'escrow_release',
    COALESCE(NULLIF(_notes, ''), 'Payment release queued'),
    inv.amount_eur,
    COALESCE(inv.payout_to_expert_eur, inv.amount_eur),
    'EUR',
    'pending',
    _actor_user_id
  );

  UPDATE public.case_invoices
     SET status = 'released', released_at = released_at_value
   WHERE id = inv.id;

  RETURN released_at_value;
END;
$$;
REVOKE ALL ON FUNCTION public.queue_invoice_payout(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.queue_invoice_payout(uuid, uuid, text)
  TO service_role;

COMMIT;
