CREATE TABLE public.bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  severity text NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  source_route text,
  user_agent text,
  screenshot_url text,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX bug_reports_reporter_id_idx ON public.bug_reports (reporter_id);
CREATE INDEX bug_reports_status_idx ON public.bug_reports (status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bug_reports TO authenticated;
GRANT ALL ON public.bug_reports TO service_role;

ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bug reports"
  ON public.bug_reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

CREATE POLICY "Users can create their own bug reports"
  ON public.bug_reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can update their own open bug reports"
  ON public.bug_reports FOR UPDATE
  TO authenticated
  USING (reporter_id = auth.uid() AND status IN ('open','in_progress'))
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can delete their own open bug reports"
  ON public.bug_reports FOR DELETE
  TO authenticated
  USING (reporter_id = auth.uid() AND status IN ('open'));

CREATE POLICY "Internal staff can manage all bug reports"
  ON public.bug_reports FOR ALL
  TO authenticated
  USING (public.is_internal(auth.uid()))
  WITH CHECK (public.is_internal(auth.uid()));

CREATE TRIGGER bug_reports_updated_at
  BEFORE UPDATE ON public.bug_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();