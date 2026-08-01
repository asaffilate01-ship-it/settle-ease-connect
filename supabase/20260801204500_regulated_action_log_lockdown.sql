-- Remove direct INSERT on regulated_action_log so only SECURITY DEFINER guard triggers can write it.
-- Audit_log is already locked down; this migration closes the remaining compliance-log forgery path.

DROP POLICY IF EXISTS "Authenticated can insert (system + trigger writes)" ON public.regulated_action_log;

-- Triggers (insurance_leads_regulated_guard, dela_regulated_guard) are SECURITY DEFINER and
-- bypass RLS, so they do not need an INSERT policy.
