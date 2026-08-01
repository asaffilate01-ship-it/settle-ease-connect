CREATE TABLE public.ai_advisory_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  domain TEXT NOT NULL DEFAULT 'general',
  question TEXT NOT NULL,
  draft_text TEXT NOT NULL,
  model TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  review_notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ai_advisory_drafts_status_chk CHECK (status IN ('pending','approved','rejected','sent')),
  CONSTRAINT ai_advisory_drafts_domain_chk CHECK (domain IN ('legal','tax','immigration','insurance','benefits','medical','funeral','general'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_advisory_drafts TO authenticated;
GRANT ALL ON public.ai_advisory_drafts TO service_role;

ALTER TABLE public.ai_advisory_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internal staff can read advisory drafts"
  ON public.ai_advisory_drafts FOR SELECT TO authenticated
  USING (public.is_internal(auth.uid()));

CREATE POLICY "Internal staff can create advisory drafts"
  ON public.ai_advisory_drafts FOR INSERT TO authenticated
  WITH CHECK (public.is_internal(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Internal staff can review advisory drafts"
  ON public.ai_advisory_drafts FOR UPDATE TO authenticated
  USING (public.is_internal(auth.uid()))
  WITH CHECK (public.is_internal(auth.uid()));

CREATE POLICY "Admins can delete advisory drafts"
  ON public.ai_advisory_drafts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX ai_advisory_drafts_status_idx ON public.ai_advisory_drafts (status, created_at DESC);
CREATE INDEX ai_advisory_drafts_case_idx ON public.ai_advisory_drafts (case_id);

CREATE TRIGGER update_ai_advisory_drafts_updated_at
  BEFORE UPDATE ON public.ai_advisory_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER audit_ai_advisory_drafts
  AFTER INSERT OR UPDATE OR DELETE ON public.ai_advisory_drafts
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();