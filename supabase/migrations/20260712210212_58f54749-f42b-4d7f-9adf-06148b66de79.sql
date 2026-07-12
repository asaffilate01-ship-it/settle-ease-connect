
CREATE TABLE public.student_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  university text NOT NULL,
  country text,
  student_id_number text,
  id_document_path text,
  valid_until date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired')),
  discount_percent int NOT NULL DEFAULT 30 CHECK (discount_percent BETWEEN 0 AND 100),
  reviewer_notes text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.student_verifications TO authenticated;
GRANT ALL ON public.student_verifications TO service_role;

ALTER TABLE public.student_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read own verification"
  ON public.student_verifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_internal(auth.uid()));

CREATE POLICY "Students insert own verification"
  ON public.student_verifications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Students update own pending; staff update any"
  ON public.student_verifications FOR UPDATE TO authenticated
  USING (
    (user_id = auth.uid() AND status = 'pending')
    OR public.is_internal(auth.uid())
  )
  WITH CHECK (
    (user_id = auth.uid() AND status = 'pending')
    OR public.is_internal(auth.uid())
  );

CREATE TRIGGER update_student_verifications_updated_at
  BEFORE UPDATE ON public.student_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX student_verifications_user_id_idx ON public.student_verifications(user_id);
CREATE INDEX student_verifications_status_idx ON public.student_verifications(status);
