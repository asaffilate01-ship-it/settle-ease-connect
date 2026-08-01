CREATE TABLE public.user_checklist_progress (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  template_key TEXT NOT NULL,
  item_id TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  done_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, template_key, item_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_checklist_progress TO authenticated;
GRANT ALL ON public.user_checklist_progress TO service_role;

ALTER TABLE public.user_checklist_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own checklist progress"
  ON public.user_checklist_progress
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_checklist_progress_updated_at
  BEFORE UPDATE ON public.user_checklist_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();