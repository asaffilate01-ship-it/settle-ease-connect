-- Tighten RLS on case workspace financial/admin objects so clients and
-- external participants cannot tamper with quotes, appointments, or tasks.

-- CASE QUOTES
-- Broad case-access INSERT/UPDATE removed; clients/participants remain read-only.
DROP POLICY IF EXISTS "Quote write via case access" ON public.case_quotes;
DROP POLICY IF EXISTS "Quote update via case access" ON public.case_quotes;

-- Keep existing: "Quote read via case access" and "Internal staff can update quotes".

-- Staff can create quotes.
CREATE POLICY "Internal staff create quotes"
  ON public.case_quotes
  FOR INSERT
  TO authenticated
  WITH CHECK (is_internal(auth.uid()));

-- The expert assigned to the quote can update non-financial metadata, but not
-- the amount/platform fee. A trigger below enforces that.
CREATE POLICY "Assigned expert can update own quote"
  ON public.case_quotes
  FOR UPDATE
  TO authenticated
  USING (expert_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.experts e WHERE e.id = case_quotes.expert_id AND e.user_id = auth.uid()
  ))
  WITH CHECK (expert_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.experts e WHERE e.id = case_quotes.expert_id AND e.user_id = auth.uid()
  ));


-- CASE APPOINTMENTS
-- Broad case-access mutations removed; clients/participants remain read-only.
DROP POLICY IF EXISTS "case members and staff manage appointments" ON public.case_appointments;
DROP POLICY IF EXISTS "case members and staff update appointments" ON public.case_appointments;
DROP POLICY IF EXISTS "case members and staff delete appointments" ON public.case_appointments;

-- Keep existing: "case members and staff view appointments".

-- Staff or the creator can manage appointments.
CREATE POLICY "Staff or creator create appointments"
  ON public.case_appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (is_internal(auth.uid()) OR created_by = auth.uid());

CREATE POLICY "Staff or creator update appointments"
  ON public.case_appointments
  FOR UPDATE
  TO authenticated
  USING (is_internal(auth.uid()) OR created_by = auth.uid())
  WITH CHECK (is_internal(auth.uid()) OR created_by = auth.uid());

CREATE POLICY "Staff or creator delete appointments"
  ON public.case_appointments
  FOR DELETE
  TO authenticated
  USING (is_internal(auth.uid()) OR created_by = auth.uid());


-- CASE TASKS
-- Broad case-access mutations removed; clients/participants remain read-only.
DROP POLICY IF EXISTS "Task write via case access" ON public.case_tasks;
DROP POLICY IF EXISTS "Task update via case access" ON public.case_tasks;

-- Keep existing: "Task read via case access" and "Task delete internal".

-- Staff can create tasks.
CREATE POLICY "Staff create tasks"
  ON public.case_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (is_internal(auth.uid()));

-- Staff or the assigned user can update tasks.
CREATE POLICY "Staff or assignee update tasks"
  ON public.case_tasks
  FOR UPDATE
  TO authenticated
  USING (is_internal(auth.uid()) OR assignee_user_id = auth.uid())
  WITH CHECK (is_internal(auth.uid()) OR assignee_user_id = auth.uid());


-- TRIGGER: experts cannot alter financial fields on case_quotes.
CREATE OR REPLACE FUNCTION public.case_quotes_expert_update_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.is_internal(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF NEW.amount_eur IS DISTINCT FROM OLD.amount_eur THEN
    RAISE EXCEPTION 'Assigned experts cannot change quote amount';
  END IF;
  IF NEW.vat_pct IS DISTINCT FROM OLD.vat_pct THEN
    RAISE EXCEPTION 'Assigned experts cannot change quote VAT';
  END IF;
  IF NEW.platform_fee_pct IS DISTINCT FROM OLD.platform_fee_pct THEN
    RAISE EXCEPTION 'Assigned experts cannot change platform fee percentage';
  END IF;
  IF NEW.platform_fee_eur IS DISTINCT FROM OLD.platform_fee_eur THEN
    RAISE EXCEPTION 'Assigned experts cannot change platform fee amount';
  END IF;
  IF NEW.compensation_model IS DISTINCT FROM OLD.compensation_model THEN
    RAISE EXCEPTION 'Assigned experts cannot change compensation model';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_case_quotes_expert_update_guard ON public.case_quotes;
CREATE TRIGGER trg_case_quotes_expert_update_guard
  BEFORE UPDATE ON public.case_quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.case_quotes_expert_update_guard();
