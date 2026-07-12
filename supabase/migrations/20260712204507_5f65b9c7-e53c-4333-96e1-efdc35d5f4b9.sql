
-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  entity_type TEXT,
  entity_id UUID,
  read_at TIMESTAMPTZ,
  push_sent_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_created_idx ON public.notifications (user_id, created_at DESC);
CREATE INDEX notifications_user_unread_idx ON public.notifications (user_id) WHERE read_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications read" ON public.notifications FOR SELECT
  USING (auth.uid() = user_id OR public.is_internal(auth.uid()));
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own notifications delete" ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);
CREATE POLICY "staff insert notifications" ON public.notifications FOR INSERT
  WITH CHECK (public.is_internal(auth.uid()) OR auth.uid() = user_id);

-- PUSH SUBSCRIPTIONS
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  endpoint TEXT,
  p256dh TEXT,
  auth TEXT,
  device_token TEXT,
  user_agent TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX push_sub_unique_endpoint ON public.push_subscriptions (user_id, endpoint) WHERE endpoint IS NOT NULL;
CREATE UNIQUE INDEX push_sub_unique_token ON public.push_subscriptions (user_id, device_token) WHERE device_token IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own push subs" ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id OR public.is_internal(auth.uid()))
  WITH CHECK (auth.uid() = user_id);

-- NOTIFICATION PREFERENCES
CREATE TABLE public.notification_preferences (
  user_id UUID NOT NULL PRIMARY KEY,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  inapp_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  categories JSONB NOT NULL DEFAULT '{"case":true,"message":true,"task":true,"alert":true,"gps":true,"system":true}'::jsonb,
  quiet_hours_start SMALLINT,
  quiet_hours_end SMALLINT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own prefs" ON public.notification_preferences FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- LOCATION SHARES
CREATE TABLE public.location_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mode TEXT NOT NULL,
  case_id UUID,
  alert_id UUID,
  status TEXT NOT NULL DEFAULT 'active',
  message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  stopped_at TIMESTAMPTZ,
  last_lat DOUBLE PRECISION,
  last_lng DOUBLE PRECISION,
  last_accuracy_m DOUBLE PRECISION,
  last_point_at TIMESTAMPTZ
);
CREATE INDEX location_shares_user_idx ON public.location_shares (user_id, started_at DESC);
CREATE INDEX location_shares_case_idx ON public.location_shares (case_id) WHERE case_id IS NOT NULL;
CREATE INDEX location_shares_active_idx ON public.location_shares (status) WHERE status = 'active';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.location_shares TO authenticated;
GRANT ALL ON public.location_shares TO service_role;
ALTER TABLE public.location_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sharer manages own shares" ON public.location_shares FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "case team reads normal shares" ON public.location_shares FOR SELECT
  USING (mode = 'normal' AND case_id IS NOT NULL AND public.can_access_case(auth.uid(), case_id));
CREATE POLICY "staff reads all shares" ON public.location_shares FOR SELECT
  USING (public.is_internal(auth.uid()));
CREATE POLICY "nominated contact reads emergency shares" ON public.location_shares FOR SELECT
  USING (
    mode = 'emergency'
    AND EXISTS (
      SELECT 1 FROM public.trusted_contacts tc
      WHERE tc.client_user_id = location_shares.user_id
        AND lower(tc.email) = lower(coalesce((auth.jwt() ->> 'email'),''))
        AND tc.emergency_order IS NOT NULL
    )
  );

CREATE TABLE public.location_points (
  id BIGSERIAL PRIMARY KEY,
  share_id UUID NOT NULL REFERENCES public.location_shares(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  accuracy_m DOUBLE PRECISION,
  speed_mps DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX location_points_share_idx ON public.location_points (share_id, captured_at DESC);
GRANT SELECT, INSERT ON public.location_points TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.location_points_id_seq TO authenticated;
GRANT ALL ON public.location_points TO service_role;
GRANT ALL ON SEQUENCE public.location_points_id_seq TO service_role;
ALTER TABLE public.location_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sharer inserts own points" ON public.location_points FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.location_shares s WHERE s.id = share_id AND s.user_id = auth.uid()));
CREATE POLICY "viewers read points" ON public.location_points FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.location_shares s
      WHERE s.id = share_id AND (
        s.user_id = auth.uid()
        OR public.is_internal(auth.uid())
        OR (s.mode = 'normal' AND s.case_id IS NOT NULL AND public.can_access_case(auth.uid(), s.case_id))
        OR (s.mode = 'emergency' AND EXISTS (
              SELECT 1 FROM public.trusted_contacts tc
              WHERE tc.client_user_id = s.user_id
                AND lower(tc.email) = lower(coalesce((auth.jwt() ->> 'email'),''))
                AND tc.emergency_order IS NOT NULL
            ))
      )
    )
  );

-- MESSAGING
CREATE TABLE public.message_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind TEXT NOT NULL,
  name TEXT,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX message_channels_case_idx ON public.message_channels (case_id) WHERE case_id IS NOT NULL;
CREATE INDEX message_channels_updated_idx ON public.message_channels (updated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_channels TO authenticated;
GRANT ALL ON public.message_channels TO service_role;
ALTER TABLE public.message_channels ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.channel_members (
  channel_id UUID NOT NULL REFERENCES public.message_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  last_read_at TIMESTAMPTZ,
  muted BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (channel_id, user_id)
);
CREATE INDEX channel_members_user_idx ON public.channel_members (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.channel_members TO authenticated;
GRANT ALL ON public.channel_members TO service_role;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_channel_member(_user_id UUID, _channel_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = _channel_id AND user_id = _user_id);
$$;

CREATE POLICY "members read channels" ON public.message_channels FOR SELECT
  USING (public.is_channel_member(auth.uid(), id) OR public.is_internal(auth.uid()) OR created_by = auth.uid());
CREATE POLICY "any auth creates channels" ON public.message_channels FOR INSERT
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "owners/staff update channels" ON public.message_channels FOR UPDATE
  USING (created_by = auth.uid() OR public.is_internal(auth.uid()))
  WITH CHECK (created_by = auth.uid() OR public.is_internal(auth.uid()));

CREATE POLICY "members read membership" ON public.channel_members FOR SELECT
  USING (public.is_channel_member(auth.uid(), channel_id) OR public.is_internal(auth.uid()));
CREATE POLICY "self manages own membership" ON public.channel_members FOR UPDATE
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "self leaves channel" ON public.channel_members FOR DELETE
  USING (user_id = auth.uid() OR public.is_internal(auth.uid()));
CREATE POLICY "owners/staff add members" ON public.channel_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.message_channels c WHERE c.id = channel_id AND c.created_by = auth.uid())
    OR public.is_internal(auth.uid())
  );

CREATE TABLE public.channel_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.message_channels(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL,
  body TEXT,
  reply_to_id UUID REFERENCES public.channel_messages(id) ON DELETE SET NULL,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX channel_messages_channel_idx ON public.channel_messages (channel_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.channel_messages TO authenticated;
GRANT ALL ON public.channel_messages TO service_role;
ALTER TABLE public.channel_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read messages" ON public.channel_messages FOR SELECT
  USING (public.is_channel_member(auth.uid(), channel_id) OR public.is_internal(auth.uid()));
CREATE POLICY "members post messages" ON public.channel_messages FOR INSERT
  WITH CHECK (sender_user_id = auth.uid() AND public.is_channel_member(auth.uid(), channel_id));
CREATE POLICY "sender edits own" ON public.channel_messages FOR UPDATE
  USING (sender_user_id = auth.uid()) WITH CHECK (sender_user_id = auth.uid());
CREATE POLICY "sender/staff delete" ON public.channel_messages FOR DELETE
  USING (sender_user_id = auth.uid() OR public.is_internal(auth.uid()));

CREATE TABLE public.message_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.channel_messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX message_attachments_message_idx ON public.message_attachments (message_id);
GRANT SELECT, INSERT, DELETE ON public.message_attachments TO authenticated;
GRANT ALL ON public.message_attachments TO service_role;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attachment follows message" ON public.message_attachments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.channel_messages m WHERE m.id = message_id AND (public.is_channel_member(auth.uid(), m.channel_id) OR public.is_internal(auth.uid()))));
CREATE POLICY "sender adds attachments" ON public.message_attachments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.channel_messages m WHERE m.id = message_id AND m.sender_user_id = auth.uid()));
CREATE POLICY "sender/staff delete attachments" ON public.message_attachments FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.channel_messages m WHERE m.id = message_id AND (m.sender_user_id = auth.uid() OR public.is_internal(auth.uid()))));

-- AUDIT LOG
CREATE TABLE public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id UUID,
  actor_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  subject_user_id UUID,
  ip TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_created_idx ON public.audit_log (created_at DESC);
CREATE INDEX audit_log_actor_idx ON public.audit_log (actor_user_id, created_at DESC);
CREATE INDEX audit_log_subject_idx ON public.audit_log (subject_user_id, created_at DESC);
CREATE INDEX audit_log_entity_idx ON public.audit_log (entity_type, entity_id);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.audit_log_id_seq TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
GRANT ALL ON SEQUENCE public.audit_log_id_seq TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read all audit" ON public.audit_log FOR SELECT
  USING (public.is_internal(auth.uid()));
CREATE POLICY "own audit read" ON public.audit_log FOR SELECT
  USING (actor_user_id = auth.uid() OR subject_user_id = auth.uid());
CREATE POLICY "any auth writes audit" ON public.audit_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND (actor_user_id = auth.uid() OR actor_user_id IS NULL));

-- CASE TASKS GANTT + ASSIGNMENTS
ALTER TABLE public.case_tasks
  ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS depends_on UUID REFERENCES public.case_tasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS progress_pct SMALLINT NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'todo';

CREATE TABLE public.case_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  assignee_user_id UUID,
  assignee_expert_id UUID REFERENCES public.experts(id) ON DELETE SET NULL,
  role TEXT NOT NULL,
  scope TEXT,
  status TEXT NOT NULL DEFAULT 'assigned',
  assigned_by UUID,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT
);
CREATE INDEX case_assignments_case_idx ON public.case_assignments (case_id);
CREATE INDEX case_assignments_user_idx ON public.case_assignments (assignee_user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_assignments TO authenticated;
GRANT ALL ON public.case_assignments TO service_role;
ALTER TABLE public.case_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "case team reads assignments" ON public.case_assignments FOR SELECT
  USING (public.can_access_case(auth.uid(), case_id) OR assignee_user_id = auth.uid());
CREATE POLICY "staff writes assignments" ON public.case_assignments FOR INSERT
  WITH CHECK (public.is_internal(auth.uid()));
CREATE POLICY "staff/assignee updates" ON public.case_assignments FOR UPDATE
  USING (public.is_internal(auth.uid()) OR assignee_user_id = auth.uid())
  WITH CHECK (public.is_internal(auth.uid()) OR assignee_user_id = auth.uid());
CREATE POLICY "staff deletes assignments" ON public.case_assignments FOR DELETE
  USING (public.is_internal(auth.uid()));

-- REALTIME (skip emergency_alerts, already added)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_shares;
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_points;

-- updated_at triggers
CREATE TRIGGER trg_message_channels_updated BEFORE UPDATE ON public.message_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_notification_prefs_updated BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
