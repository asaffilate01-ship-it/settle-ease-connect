CREATE OR REPLACE FUNCTION public.agents_update_is_safe(
  _id uuid,
  _commission_rate numeric,
  _status text,
  _code text,
  _user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT NOT EXISTS (
    SELECT 1
      FROM public.agents a
     WHERE a.id = _id
       AND (
         a.commission_rate IS DISTINCT FROM _commission_rate
         OR a.status IS DISTINCT FROM _status
         OR a.code IS DISTINCT FROM _code
         OR a.user_id IS DISTINCT FROM _user_id
       )
  );
$$;

REVOKE ALL ON FUNCTION public.agents_update_is_safe(uuid, numeric, text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.agents_update_is_safe(uuid, numeric, text, text, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "agents_update_self_safe" ON public.agents;
CREATE POLICY "agents_update_self_safe"
  ON public.agents
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND public.agents_update_is_safe(id, commission_rate, status, code, user_id)
  );