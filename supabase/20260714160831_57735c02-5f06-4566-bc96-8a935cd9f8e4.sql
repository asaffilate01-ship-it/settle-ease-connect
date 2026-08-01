
-- 1) directory_listings: strip PII from anonymous readers via column-level revoke
REVOKE SELECT (email, phone, address) ON public.directory_listings FROM anon;

-- 2) Restrict role from public -> authenticated on user-scoped tables
-- location_shares
DROP POLICY IF EXISTS "case team reads normal shares" ON public.location_shares;
CREATE POLICY "case team reads normal shares" ON public.location_shares
  FOR SELECT TO authenticated
  USING ((mode = 'normal'::text) AND (case_id IS NOT NULL) AND can_access_case(auth.uid(), case_id));

DROP POLICY IF EXISTS "nominated contact reads emergency shares" ON public.location_shares;
CREATE POLICY "nominated contact reads emergency shares" ON public.location_shares
  FOR SELECT TO authenticated
  USING ((mode = 'emergency'::text) AND (EXISTS (
    SELECT 1 FROM public.trusted_contacts tc
    WHERE tc.client_user_id = location_shares.user_id
      AND lower(tc.email) = lower(COALESCE((auth.jwt() ->> 'email'::text), ''::text))
      AND tc.emergency_order IS NOT NULL
  )));

DROP POLICY IF EXISTS "sharer manages own shares" ON public.location_shares;
CREATE POLICY "sharer manages own shares" ON public.location_shares
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "staff reads all shares" ON public.location_shares;
CREATE POLICY "staff reads all shares" ON public.location_shares
  FOR SELECT TO authenticated
  USING (is_internal(auth.uid()));

-- location_points
DROP POLICY IF EXISTS "sharer inserts own points" ON public.location_points;
CREATE POLICY "sharer inserts own points" ON public.location_points
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.location_shares s
    WHERE s.id = location_points.share_id AND s.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "viewers read points" ON public.location_points;
CREATE POLICY "viewers read points" ON public.location_points
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.location_shares s
    WHERE s.id = location_points.share_id
      AND (
        s.user_id = auth.uid()
        OR is_internal(auth.uid())
        OR (s.mode = 'normal'::text AND s.case_id IS NOT NULL AND can_access_case(auth.uid(), s.case_id))
        OR (s.mode = 'emergency'::text AND EXISTS (
              SELECT 1 FROM public.trusted_contacts tc
              WHERE tc.client_user_id = s.user_id
                AND lower(tc.email) = lower(COALESCE((auth.jwt() ->> 'email'::text), ''::text))
                AND tc.emergency_order IS NOT NULL
            ))
      )
  ));

-- channel_members
DROP POLICY IF EXISTS "members read membership" ON public.channel_members;
CREATE POLICY "members read membership" ON public.channel_members
  FOR SELECT TO authenticated
  USING (is_channel_member(auth.uid(), channel_id) OR is_internal(auth.uid()));

DROP POLICY IF EXISTS "owners/staff add members" ON public.channel_members;
CREATE POLICY "owners/staff add members" ON public.channel_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.message_channels c WHERE c.id = channel_members.channel_id AND c.created_by = auth.uid())
    OR is_internal(auth.uid())
  );

DROP POLICY IF EXISTS "self leaves channel" ON public.channel_members;
CREATE POLICY "self leaves channel" ON public.channel_members
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR is_internal(auth.uid()));

DROP POLICY IF EXISTS "self manages own membership" ON public.channel_members;
CREATE POLICY "self manages own membership" ON public.channel_members
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- notifications
DROP POLICY IF EXISTS "own notifications delete" ON public.notifications;
CREATE POLICY "own notifications delete" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own notifications read" ON public.notifications;
CREATE POLICY "own notifications read" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_internal(auth.uid()));

DROP POLICY IF EXISTS "own notifications update" ON public.notifications;
CREATE POLICY "own notifications update" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "staff insert notifications" ON public.notifications;
CREATE POLICY "staff insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (is_internal(auth.uid()) OR auth.uid() = user_id);

-- audit_log
DROP POLICY IF EXISTS "any auth writes audit" ON public.audit_log;
CREATE POLICY "any auth writes audit" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND (actor_user_id = auth.uid() OR actor_user_id IS NULL));

DROP POLICY IF EXISTS "own audit read" ON public.audit_log;
CREATE POLICY "own audit read" ON public.audit_log
  FOR SELECT TO authenticated
  USING (actor_user_id = auth.uid() OR subject_user_id = auth.uid());

DROP POLICY IF EXISTS "staff read all audit" ON public.audit_log;
CREATE POLICY "staff read all audit" ON public.audit_log
  FOR SELECT TO authenticated
  USING (is_internal(auth.uid()));

-- 3) Replace WITH CHECK (true) with basic input validation on public lead submission
DROP POLICY IF EXISTS "Anyone can submit an insurance lead" ON public.insurance_leads;
DROP POLICY IF EXISTS "public can submit insurance leads" ON public.insurance_leads;
CREATE POLICY "public can submit insurance leads" ON public.insurance_leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(full_name) BETWEEN 2 AND 200
    AND char_length(email) BETWEEN 5 AND 320
    AND email LIKE '%_@_%._%'
  );

DROP POLICY IF EXISTS "anyone can submit a tax lead" ON public.tax_leads;
CREATE POLICY "anyone can submit a tax lead" ON public.tax_leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(full_name) BETWEEN 2 AND 200
    AND char_length(email) BETWEEN 5 AND 320
    AND email LIKE '%_@_%._%'
    AND tax_year BETWEEN 2000 AND 2100
  );

-- 4) SECURITY DEFINER helpers: revoke EXECUTE from anon/public (kept for authenticated
--    because RLS policies invoke these functions and the querying role needs EXECUTE)
REVOKE EXECUTE ON FUNCTION public.can_access_case(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_internal(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_channel_member(uuid, uuid) FROM anon, public;
