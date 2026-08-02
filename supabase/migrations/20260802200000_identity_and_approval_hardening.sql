-- Phase 2 identity hardening: require a second AAL2 administrator for role
-- changes. A request and its decision are separate, auditable records and the
-- database applies an approved role change atomically.

CREATE TABLE IF NOT EXISTS public.security_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL CHECK (action IN ('role_grant', 'role_revoke')),
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reason text,
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  requested_at timestamptz NOT NULL DEFAULT now(),
  decided_by uuid REFERENCES auth.users(id),
  decided_at timestamptz,
  decision_note text,
  CONSTRAINT security_approval_not_self CHECK (target_user_id <> requested_by)
);

CREATE UNIQUE INDEX IF NOT EXISTS security_approvals_one_pending_role_change
  ON public.security_approvals(action, target_user_id, role)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS security_approvals_pending_order
  ON public.security_approvals(status, requested_at DESC);

ALTER TABLE public.security_approvals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.security_approvals FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.security_approvals TO authenticated;
GRANT ALL ON public.security_approvals TO service_role;

DROP POLICY IF EXISTS "aal2 admins read security approvals" ON public.security_approvals;
CREATE POLICY "aal2 admins read security approvals"
  ON public.security_approvals FOR SELECT TO authenticated
  USING (
    auth.jwt()->>'aal' = 'aal2'
    AND public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "aal2 admins request role changes" ON public.security_approvals;
CREATE POLICY "aal2 admins request role changes"
  ON public.security_approvals FOR INSERT TO authenticated
  WITH CHECK (
    auth.jwt()->>'aal' = 'aal2'
    AND public.has_role(auth.uid(), 'admin')
    AND requested_by = auth.uid()
    AND target_user_id <> auth.uid()
    AND status = 'pending'
    AND decided_by IS NULL
    AND decided_at IS NULL
  );

CREATE OR REPLACE FUNCTION public.decide_role_security_approval(
  _approval_id uuid,
  _decision text,
  _note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor uuid := auth.uid();
  approval public.security_approvals%ROWTYPE;
BEGIN
  IF actor IS NULL OR auth.jwt()->>'aal' <> 'aal2' THEN
    RAISE EXCEPTION 'AAL2 authentication required';
  END IF;
  IF NOT public.has_role(actor, 'admin') THEN
    RAISE EXCEPTION 'admin role required';
  END IF;
  IF _decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'invalid decision';
  END IF;

  SELECT * INTO approval
    FROM public.security_approvals
   WHERE id = _approval_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'approval not found';
  END IF;
  IF approval.status <> 'pending' THEN
    RAISE EXCEPTION 'approval already decided';
  END IF;
  IF approval.requested_by = actor THEN
    RAISE EXCEPTION 'a different administrator must decide this request';
  END IF;
  IF approval.target_user_id = actor THEN
    RAISE EXCEPTION 'administrators cannot decide changes to their own roles';
  END IF;

  IF _decision = 'approved' AND approval.action = 'role_grant' THEN
    INSERT INTO public.user_roles(user_id, role)
    VALUES (approval.target_user_id, approval.role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF _decision = 'approved' AND approval.action = 'role_revoke' THEN
    DELETE FROM public.user_roles
     WHERE user_id = approval.target_user_id
       AND role = approval.role;
  END IF;

  UPDATE public.security_approvals
     SET status = _decision,
         decided_by = actor,
         decided_at = now(),
         decision_note = NULLIF(trim(coalesce(_note, '')), '')
   WHERE id = _approval_id;
END;
$$;

REVOKE ALL ON FUNCTION public.decide_role_security_approval(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decide_role_security_approval(uuid, text, text) TO authenticated;
