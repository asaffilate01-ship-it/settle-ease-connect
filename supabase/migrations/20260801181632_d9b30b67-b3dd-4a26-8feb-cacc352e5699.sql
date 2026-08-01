-- 1) Only channel creator or internal staff may add members
DROP POLICY IF EXISTS "owners/staff add members" ON public.channel_members;

CREATE POLICY "creator or staff add members"
ON public.channel_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.message_channels c
     WHERE c.id = channel_members.channel_id
       AND c.created_by = auth.uid()
  )
  OR public.is_internal(auth.uid())
);

-- 2) Prevent channel-role self-escalation on self-updates
CREATE OR REPLACE FUNCTION public.channel_members_guard_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT (
      public.is_internal(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.message_channels c
         WHERE c.id = NEW.channel_id AND c.created_by = auth.uid()
      )
    ) THEN
      RAISE EXCEPTION 'Only the channel owner or staff can change channel roles';
    END IF;
  END IF;
  -- membership rows may not be reassigned to another user
  IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.channel_id IS DISTINCT FROM OLD.channel_id THEN
    RAISE EXCEPTION 'Membership rows cannot be reassigned';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.channel_members_guard_role() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS channel_members_guard_role_trg ON public.channel_members;
CREATE TRIGGER channel_members_guard_role_trg
BEFORE UPDATE ON public.channel_members
FOR EACH ROW EXECUTE FUNCTION public.channel_members_guard_role();

DROP POLICY IF EXISTS "self manages own membership" ON public.channel_members;
CREATE POLICY "self manages own membership"
ON public.channel_members
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.is_internal(auth.uid()))
WITH CHECK (user_id = auth.uid() OR public.is_internal(auth.uid()));