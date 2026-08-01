-- ============ community_events ============
CREATE TABLE public.community_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'community_gathering',
  sub_category text,
  event_date timestamptz NOT NULL,
  end_date timestamptz,
  location text,
  address text,
  city text,
  max_attendees integer,
  fee_eur numeric(10,2) NOT NULL DEFAULT 0,
  is_members_only boolean NOT NULL DEFAULT false,
  expert_user_id uuid,
  organiser_user_id uuid,
  image_url text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_events_date ON public.community_events (event_date);
CREATE INDEX idx_community_events_status ON public.community_events (status);

GRANT SELECT ON public.community_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_events TO authenticated;
GRANT ALL ON public.community_events TO service_role;

ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published events are publicly readable"
  ON public.community_events FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "Staff can read all events"
  ON public.community_events FOR SELECT TO authenticated
  USING (public.is_internal(auth.uid()));

CREATE POLICY "Staff can insert events"
  ON public.community_events FOR INSERT TO authenticated
  WITH CHECK (public.is_internal(auth.uid()));

CREATE POLICY "Staff can update events"
  ON public.community_events FOR UPDATE TO authenticated
  USING (public.is_internal(auth.uid()))
  WITH CHECK (public.is_internal(auth.uid()));

CREATE POLICY "Staff can delete events"
  ON public.community_events FOR DELETE TO authenticated
  USING (public.is_internal(auth.uid()));

CREATE TRIGGER trg_community_events_updated_at
  BEFORE UPDATE ON public.community_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ event_registrations ============
CREATE TABLE public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.community_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'registered',
  guests integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX idx_event_registrations_event ON public.event_registrations (event_id);
CREATE INDEX idx_event_registrations_user ON public.event_registrations (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_registrations TO authenticated;
GRANT ALL ON public.event_registrations TO service_role;

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own registrations"
  ON public.event_registrations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_internal(auth.uid()));

CREATE POLICY "Users create own registrations"
  ON public.event_registrations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own registrations"
  ON public.event_registrations FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_internal(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_internal(auth.uid()));

CREATE POLICY "Users delete own registrations"
  ON public.event_registrations FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_internal(auth.uid()));

CREATE TRIGGER trg_event_registrations_updated_at
  BEFORE UPDATE ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Capacity enforcement: overflow becomes waitlist
CREATE OR REPLACE FUNCTION public.event_registration_capacity_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cap integer;
  taken integer;
BEGIN
  SELECT max_attendees INTO cap FROM public.community_events WHERE id = NEW.event_id;
  IF cap IS NULL THEN RETURN NEW; END IF;
  IF NEW.status <> 'registered' THEN RETURN NEW; END IF;

  SELECT count(*) INTO taken
    FROM public.event_registrations
   WHERE event_id = NEW.event_id
     AND status IN ('registered','attended')
     AND (TG_OP = 'INSERT' OR id <> NEW.id);

  IF taken >= cap THEN
    NEW.status := 'waitlist';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_event_capacity_guard
  BEFORE INSERT OR UPDATE OF status ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.event_registration_capacity_guard();

-- Waitlist auto-promotion when a spot frees up
CREATE OR REPLACE FUNCTION public.event_promote_waitlist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cap integer;
  taken integer;
  next_id uuid;
BEGIN
  SELECT max_attendees INTO cap FROM public.community_events WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  IF cap IS NULL THEN RETURN NULL; END IF;

  SELECT count(*) INTO taken
    FROM public.event_registrations
   WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
     AND status IN ('registered','attended');

  WHILE taken < cap LOOP
    SELECT id INTO next_id
      FROM public.event_registrations
     WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
       AND status = 'waitlist'
     ORDER BY created_at ASC
     LIMIT 1;
    IF next_id IS NULL THEN EXIT; END IF;
    UPDATE public.event_registrations SET status = 'registered', updated_at = now() WHERE id = next_id;
    taken := taken + 1;
  END LOOP;
  RETURN NULL;
END $$;

CREATE TRIGGER trg_event_promote_waitlist
  AFTER UPDATE OF status OR DELETE ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.event_promote_waitlist();

-- ============ announcements ============
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  audience text NOT NULL DEFAULT 'all',
  severity text NOT NULL DEFAULT 'info',
  link_url text,
  visible_from timestamptz NOT NULL DEFAULT now(),
  visible_until timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_window ON public.announcements (visible_from, visible_until);

GRANT SELECT ON public.announcements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public announcements readable in window"
  ON public.announcements FOR SELECT TO anon, authenticated
  USING (
    audience = 'all'
    AND visible_from <= now()
    AND (visible_until IS NULL OR visible_until > now())
  );

CREATE POLICY "Authenticated read tier and staff announcements"
  ON public.announcements FOR SELECT TO authenticated
  USING (
    (visible_from <= now() AND (visible_until IS NULL OR visible_until > now())
     AND audience IN ('basic','plus','complete'))
    OR public.is_internal(auth.uid())
  );

CREATE POLICY "Staff insert announcements"
  ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (public.is_internal(auth.uid()));

CREATE POLICY "Staff update announcements"
  ON public.announcements FOR UPDATE TO authenticated
  USING (public.is_internal(auth.uid()))
  WITH CHECK (public.is_internal(auth.uid()));

CREATE POLICY "Staff delete announcements"
  ON public.announcements FOR DELETE TO authenticated
  USING (public.is_internal(auth.uid()));

CREATE TRIGGER trg_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

REVOKE ALL ON FUNCTION public.event_registration_capacity_guard() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.event_promote_waitlist() FROM PUBLIC, anon;