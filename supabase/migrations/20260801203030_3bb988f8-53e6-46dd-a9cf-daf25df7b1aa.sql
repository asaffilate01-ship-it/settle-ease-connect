-- Replace fragile self-referential RLS checks with triggers, and remove
-- email-based SELECT visibility on case_access_grants.

-- AGENTS
DROP POLICY IF EXISTS "agents_update_self_safe" ON public.agents;

-- Agents can update their own row; the trigger below locks commission_rate and status.
CREATE POLICY "agents_update_self_safe"
  ON public.agents
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.agents_self_update_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.commission_rate IS DISTINCT FROM OLD.commission_rate THEN
    RAISE EXCEPTION 'Agents cannot change their own commission rate';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Agents cannot change their own status';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Agents cannot reassign their profile';
  END IF;
  IF NEW.code IS DISTINCT FROM OLD.code THEN
    RAISE EXCEPTION 'Agents cannot change their referral code';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agents_self_update_guard ON public.agents;
CREATE TRIGGER trg_agents_self_update_guard
  BEFORE UPDATE ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION public.agents_self_update_guard();


-- CASE ACCESS GRANTS
-- Remove the email-based SELECT clause so users cannot snoop on invites by
-- changing email claims. Owners, accepted users, and staff can still read.
DROP POLICY IF EXISTS "Owners read own grants" ON public.case_access_grants;
CREATE POLICY "Owners read own grants"
  ON public.case_access_grants
  FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid() OR accepted_by = auth.uid() OR is_internal(auth.uid()));
