-- 1. Lock down trigger-only / internal helper functions
REVOKE ALL ON FUNCTION public.audit_row_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_log_block_mutation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bump_post_reply_count() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_agent_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ensure_agent_profile() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.event_promote_waitlist() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.event_registration_capacity_guard() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dela_regulated_guard() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.insurance_leads_regulated_guard() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vault_autolink_case_tasks() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vault_set_sensitivity() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 2. audit_log becomes write-only through a controlled definer function
DROP POLICY IF EXISTS "any auth writes audit" ON public.audit_log;
REVOKE INSERT ON public.audit_log FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action text,
  _entity_type text DEFAULT NULL,
  _entity_id text DEFAULT NULL,
  _subject_user_id uuid DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF _action IS NULL OR length(trim(_action)) = 0 THEN
    RAISE EXCEPTION 'action is required';
  END IF;

  INSERT INTO public.audit_log (
    actor_user_id, actor_email, action, entity_type, entity_id, subject_user_id, metadata
  ) VALUES (
    auth.uid(),
    auth.jwt() ->> 'email',
    left(_action, 200),
    _entity_type,
    _entity_id,
    _subject_user_id,
    COALESCE(_metadata, '{}'::jsonb)
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_audit_event(text, text, text, uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_audit_event(text, text, text, uuid, jsonb) TO authenticated, service_role;

-- 3. Partner invitations: allow pending rows without a linked account
ALTER TABLE public.partner_users ALTER COLUMN user_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.accept_partner_invitations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimed integer := 0;
  _email text := lower(COALESCE(auth.jwt() ->> 'email', ''));
BEGIN
  IF auth.uid() IS NULL OR _email = '' THEN
    RETURN 0;
  END IF;

  UPDATE public.partner_users
     SET user_id = auth.uid(),
         status = 'active',
         accepted_at = now(),
         updated_at = now()
   WHERE user_id IS NULL
     AND status = 'invited'
     AND lower(invited_email) = _email;

  GET DIAGNOSTICS claimed = ROW_COUNT;

  IF claimed > 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (auth.uid(), 'partner_user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN claimed;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_partner_invitations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_partner_invitations() TO authenticated, service_role;