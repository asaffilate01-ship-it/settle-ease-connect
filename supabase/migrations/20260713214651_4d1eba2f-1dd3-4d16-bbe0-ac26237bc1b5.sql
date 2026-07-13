-- Tighten agents RLS: agent may only update non-commission fields
DROP POLICY IF EXISTS "agents_update_self" ON public.agents;

CREATE POLICY "agents_update_self_safe"
ON public.agents
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND commission_rate = (SELECT commission_rate FROM public.agents WHERE user_id = auth.uid())
  AND status = (SELECT status FROM public.agents WHERE user_id = auth.uid())
);

CREATE POLICY "agents_update_admin"
ON public.agents
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Helper: check active agent status
CREATE OR REPLACE FUNCTION public.is_active_agent(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agents
    WHERE user_id = _user_id AND status = 'active'
  )
$$;