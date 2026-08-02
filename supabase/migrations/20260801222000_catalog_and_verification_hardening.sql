-- Align the customer-visible subscription catalogue and put verification /
-- directory moderation writes exclusively behind validated server functions.

BEGIN;

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

-- A customer must not be able to submit an already-approved verification or
-- alter review fields through the generated Supabase API. The application
-- server writes tightly scoped rows with the service role after authentication.
REVOKE INSERT, UPDATE ON public.student_verifications FROM authenticated;
DROP POLICY IF EXISTS "Students insert own verification" ON public.student_verifications;
DROP POLICY IF EXISTS "Students update own pending; staff update any" ON public.student_verifications;
DROP POLICY IF EXISTS "Students read own verification" ON public.student_verifications;
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

-- Listing content and moderation state are likewise server-owned. This closes
-- the path where a listing owner could set status=active through the API or
-- replace reviewed content without sending it back to moderation.
REVOKE INSERT, UPDATE ON public.directory_listings FROM authenticated;
DROP POLICY IF EXISTS "dir_owner_insert" ON public.directory_listings;
DROP POLICY IF EXISTS "dir_owner_update" ON public.directory_listings;

-- Invitation links are bearer secrets, but possession alone must never grant
-- an expert role. Bind acceptance to the authenticated email and keep the
-- profile out of active directories until professional vetting is recorded.
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
