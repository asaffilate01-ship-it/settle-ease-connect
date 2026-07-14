
-- 1) Directory listings: remove anon column access to PII (email/phone/address).
-- Anon retains SELECT on the non-PII columns via the existing dir_public_read policy.
REVOKE SELECT (email, phone, address) ON public.directory_listings FROM anon;

-- 2) Re-scope RLS policies from bare `public` role to `authenticated`.

-- case_assignments
DROP POLICY IF EXISTS "case team reads assignments" ON public.case_assignments;
DROP POLICY IF EXISTS "staff writes assignments"    ON public.case_assignments;
DROP POLICY IF EXISTS "staff/assignee updates"      ON public.case_assignments;
DROP POLICY IF EXISTS "staff deletes assignments"   ON public.case_assignments;

CREATE POLICY "case team reads assignments" ON public.case_assignments
  FOR SELECT TO authenticated
  USING (public.can_access_case(auth.uid(), case_id) OR assignee_user_id = auth.uid());

CREATE POLICY "staff writes assignments" ON public.case_assignments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_internal(auth.uid()));

CREATE POLICY "staff/assignee updates" ON public.case_assignments
  FOR UPDATE TO authenticated
  USING (public.is_internal(auth.uid()) OR assignee_user_id = auth.uid())
  WITH CHECK (public.is_internal(auth.uid()) OR assignee_user_id = auth.uid());

CREATE POLICY "staff deletes assignments" ON public.case_assignments
  FOR DELETE TO authenticated
  USING (public.is_internal(auth.uid()));

-- channel_messages
DROP POLICY IF EXISTS "members read messages" ON public.channel_messages;
DROP POLICY IF EXISTS "members post messages" ON public.channel_messages;
DROP POLICY IF EXISTS "sender edits own"      ON public.channel_messages;
DROP POLICY IF EXISTS "sender/staff delete"   ON public.channel_messages;

CREATE POLICY "members read messages" ON public.channel_messages
  FOR SELECT TO authenticated
  USING (public.is_channel_member(auth.uid(), channel_id) OR public.is_internal(auth.uid()));

CREATE POLICY "members post messages" ON public.channel_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND (public.is_channel_member(auth.uid(), channel_id) OR public.is_internal(auth.uid()))
  );

CREATE POLICY "sender edits own" ON public.channel_messages
  FOR UPDATE TO authenticated
  USING (sender_user_id = auth.uid())
  WITH CHECK (sender_user_id = auth.uid());

CREATE POLICY "sender/staff delete" ON public.channel_messages
  FOR DELETE TO authenticated
  USING (sender_user_id = auth.uid() OR public.is_internal(auth.uid()));

-- message_attachments
DROP POLICY IF EXISTS "attachment follows message"       ON public.message_attachments;
DROP POLICY IF EXISTS "sender adds attachments"          ON public.message_attachments;
DROP POLICY IF EXISTS "sender/staff delete attachments"  ON public.message_attachments;

CREATE POLICY "attachment follows message" ON public.message_attachments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.channel_messages m
    WHERE m.id = message_attachments.message_id
      AND (public.is_channel_member(auth.uid(), m.channel_id) OR public.is_internal(auth.uid()))
  ));

CREATE POLICY "sender adds attachments" ON public.message_attachments
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.channel_messages m
    WHERE m.id = message_attachments.message_id
      AND m.sender_user_id = auth.uid()
  ));

CREATE POLICY "sender/staff delete attachments" ON public.message_attachments
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.channel_messages m
    WHERE m.id = message_attachments.message_id
      AND (m.sender_user_id = auth.uid() OR public.is_internal(auth.uid()))
  ));

-- message_channels
DROP POLICY IF EXISTS "members read channels"        ON public.message_channels;
DROP POLICY IF EXISTS "any auth creates channels"    ON public.message_channels;
DROP POLICY IF EXISTS "owners/staff update channels" ON public.message_channels;

CREATE POLICY "members read channels" ON public.message_channels
  FOR SELECT TO authenticated
  USING (
    public.is_channel_member(auth.uid(), id)
    OR public.is_internal(auth.uid())
    OR created_by = auth.uid()
  );

CREATE POLICY "any auth creates channels" ON public.message_channels
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "owners/staff update channels" ON public.message_channels
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.is_internal(auth.uid()))
  WITH CHECK (created_by = auth.uid() OR public.is_internal(auth.uid()));

-- notification_preferences
DROP POLICY IF EXISTS "own prefs" ON public.notification_preferences;
CREATE POLICY "own prefs" ON public.notification_preferences
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- push_subscriptions
DROP POLICY IF EXISTS "own push subs" ON public.push_subscriptions;
CREATE POLICY "own push subs" ON public.push_subscriptions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_internal(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_internal(auth.uid()));

-- 3) SECURITY DEFINER functions executable by anon — revoke public/anon EXECUTE.
-- These helpers are only meant to be called from RLS policies or triggers on
-- authenticated requests; anon has no need for them.
REVOKE EXECUTE ON FUNCTION public.is_agent(uuid)             FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_active_agent(uuid)      FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.ensure_agent_profile()     FROM PUBLIC, anon;
