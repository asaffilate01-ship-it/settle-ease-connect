BEGIN;

CREATE OR REPLACE FUNCTION public.claim_stripe_webhook_event(
  _event_id text,
  _event_type text,
  _environment text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimed_event_id text;
BEGIN
  IF _event_id IS NULL OR char_length(_event_id) < 3 THEN
    RAISE EXCEPTION 'invalid event id';
  END IF;
  IF _event_type IS NULL OR char_length(_event_type) < 3 THEN
    RAISE EXCEPTION 'invalid event type';
  END IF;
  IF _environment NOT IN ('sandbox', 'live') THEN
    RAISE EXCEPTION 'invalid payment environment';
  END IF;

  INSERT INTO public.stripe_webhook_events (
    event_id, event_type, environment, status, error_message, received_at, processed_at
  )
  VALUES (_event_id, _event_type, _environment, 'processing', NULL, now(), NULL)
  ON CONFLICT (event_id) DO UPDATE
    SET status = 'processing',
        error_message = NULL,
        received_at = now(),
        processed_at = NULL
    WHERE public.stripe_webhook_events.event_type = EXCLUDED.event_type
      AND public.stripe_webhook_events.environment = EXCLUDED.environment
      AND (
        public.stripe_webhook_events.status = 'failed'
        OR (
          public.stripe_webhook_events.status = 'processing'
          AND public.stripe_webhook_events.received_at < now() - interval '15 minutes'
        )
      )
  RETURNING event_id INTO claimed_event_id;

  RETURN claimed_event_id IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_stripe_webhook_event(text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_stripe_webhook_event(text, text, text)
  TO service_role;

UPDATE public.subscription_plans
SET
  tagline = CASE plan_group
    WHEN 'basic' THEN 'Core case and document workspace'
    WHEN 'plus' THEN 'Additional coordination tools and referral preparation'
    WHEN 'complete' THEN 'Expanded case organisation for complex life events'
    ELSE tagline
  END,
  features = CASE plan_group
    WHEN 'basic' THEN '[
      "Personal account and subscription billing",
      "Case, task and document workspace",
      "Public guides and provider directory",
      "Draft translation and summary tools when configured; verification required",
      "Email support during published support hours"
    ]'::jsonb
    WHEN 'plus' THEN '[
      "Everything in Basic",
      "Additional case-coordination tools",
      "Consent-based referral preparation where an approved provider is available",
      "Household access up to the limit shown for the selected plan",
      "Human support only after availability and scope are confirmed"
    ]'::jsonb
    WHEN 'complete' THEN '[
      "Everything in Plus",
      "Bereavement case workspace and organisational checklists",
      "Expanded household access up to the limit shown for the selected plan",
      "Provider introduction requests with separate provider terms and fees",
      "No guaranteed response time, appointment, outcome or third-party availability"
    ]'::jsonb
    ELSE features
  END,
  updated_at = now()
WHERE plan_group IN ('basic', 'plus', 'complete');

ALTER TABLE public.student_verifications
  ALTER COLUMN discount_percent SET DEFAULT 20;

UPDATE public.student_verifications
SET discount_percent = 20
WHERE discount_percent IS DISTINCT FROM 20;

REVOKE INSERT, UPDATE ON public.student_verifications FROM authenticated;
DROP POLICY IF EXISTS "Students insert own verification" ON public.student_verifications;
DROP POLICY IF EXISTS "Students update own pending; staff update any" ON public.student_verifications;
DROP POLICY IF EXISTS "Students read own verification" ON public.student_verifications;
DROP POLICY IF EXISTS "Students read own or assured staff review" ON public.student_verifications;
CREATE POLICY "Students read own or assured staff review"
  ON public.student_verifications
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      public.is_internal(auth.uid())
      AND auth.jwt()->>'aal' = 'aal2'
    )
  );

REVOKE INSERT, UPDATE ON public.directory_listings FROM authenticated;
DROP POLICY IF EXISTS "dir_owner_insert" ON public.directory_listings;
DROP POLICY IF EXISTS "dir_owner_update" ON public.directory_listings;

CREATE OR REPLACE FUNCTION public.accept_expert_invitation(_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  inv public.expert_invitations%ROWTYPE;
  new_expert_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO inv
    FROM public.expert_invitations
   WHERE token = _token
     AND accepted_at IS NULL
     AND expires_at > now()
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invitation not found or expired';
  END IF;

  IF lower(coalesce(auth.jwt()->>'email', '')) <> lower(inv.email) THEN
    RAISE EXCEPTION 'invitation email does not match authenticated account';
  END IF;

  IF EXISTS (SELECT 1 FROM public.experts WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'an expert profile already exists for this account';
  END IF;

  INSERT INTO public.experts (
    user_id, full_name, email, profession, compensation_model,
    referral_fee_pct, wholesale_rate_eur, hourly_rate_eur,
    languages, city, bundesland, status, verified
  ) VALUES (
    auth.uid(), inv.full_name, inv.email, inv.profession, inv.compensation_model,
    inv.referral_fee_pct, inv.wholesale_rate_eur, inv.hourly_rate_eur,
    inv.languages, inv.city, inv.bundesland, 'paused', false
  )
  RETURNING id INTO new_expert_id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'expert')
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.expert_invitations
     SET accepted_at = now(),
         accepted_by = auth.uid(),
         created_expert_id = new_expert_id
   WHERE id = inv.id;

  RETURN new_expert_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.accept_expert_invitation(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_expert_invitation(text) TO authenticated;

COMMIT;