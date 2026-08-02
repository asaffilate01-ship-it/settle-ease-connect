BEGIN;

CREATE OR REPLACE FUNCTION public.family_case_grant(
  _user_id uuid,
  _case_id uuid,
  _minimum_level text DEFAULT 'updates'
)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.case_access_grants grant_row
     WHERE grant_row.case_id = _case_id
       AND grant_row.accepted_by = _user_id
       AND grant_row.status = 'accepted'
       AND grant_row.expires_at > now()
       AND CASE _minimum_level
         WHEN 'collaborator' THEN grant_row.access_level = 'collaborator'
         WHEN 'documents' THEN grant_row.access_level IN ('documents', 'collaborator')
         ELSE grant_row.access_level IN ('updates', 'documents', 'collaborator')
       END
  );
$$;
REVOKE ALL ON FUNCTION public.family_case_grant(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.family_case_grant(uuid, uuid, text) TO authenticated, service_role;

DELETE FROM public.case_participants participant
WHERE participant.role = 'observer'
  AND EXISTS (
    SELECT 1
      FROM public.case_access_grants grant_row
     WHERE grant_row.case_id = participant.case_id
       AND grant_row.accepted_by = participant.user_id
  );

CREATE OR REPLACE FUNCTION public.can_access_case(_user_id uuid, _case_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.cases case_row
     WHERE case_row.id = _case_id
       AND (case_row.client_user_id = _user_id OR case_row.case_manager_user_id = _user_id)
  )
  OR EXISTS (
    SELECT 1
      FROM public.case_participants participant
     WHERE participant.case_id = _case_id
       AND participant.user_id = _user_id
       AND participant.role <> 'observer'
  )
  OR EXISTS (
    SELECT 1
      FROM public.case_assignments assignment
      JOIN public.partner_users partner_user
        ON partner_user.org_id = assignment.partner_org_id
       AND partner_user.user_id = _user_id
       AND partner_user.status = 'active'
     WHERE assignment.case_id = _case_id
       AND assignment.accepted_at IS NOT NULL
  )
  OR public.family_case_grant(_user_id, _case_id, 'updates')
  OR public.is_case_supervisor(_user_id);
$$;
REVOKE ALL ON FUNCTION public.can_access_case(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_case(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.accept_case_access_grant(_token_hash text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  grant_row public.case_access_grants%ROWTYPE;
  actor_id uuid := auth.uid();
  actor_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
BEGIN
  IF actor_id IS NULL OR actor_email = '' THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  SELECT * INTO grant_row
    FROM public.case_access_grants
   WHERE token_hash = _token_hash
   FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'invitation not found'; END IF;
  IF grant_row.status <> 'invited' THEN RAISE EXCEPTION 'invitation is no longer active'; END IF;
  IF grant_row.expires_at <= now() THEN
    UPDATE public.case_access_grants SET status = 'expired' WHERE id = grant_row.id;
    RAISE EXCEPTION 'invitation expired';
  END IF;
  IF lower(grant_row.invited_email) <> actor_email THEN
    RAISE EXCEPTION 'sign in with the invited email address';
  END IF;

  UPDATE public.case_access_grants
     SET status = 'accepted', accepted_at = now(), accepted_by = actor_id
   WHERE id = grant_row.id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (actor_id, 'family_deputy'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN grant_row.case_id;
END;
$$;
REVOKE ALL ON FUNCTION public.accept_case_access_grant(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_case_access_grant(text) TO authenticated;

DROP POLICY IF EXISTS "Doc read via case access" ON public.case_documents;
DROP POLICY IF EXISTS "case documents respect family grant" ON public.case_documents;
CREATE POLICY "case documents respect family grant"
  ON public.case_documents FOR SELECT TO authenticated
  USING (
    public.can_access_case(auth.uid(), case_id)
    AND (
      NOT public.family_case_grant(auth.uid(), case_id, 'updates')
      OR public.family_case_grant(auth.uid(), case_id, 'documents')
    )
  );

DROP POLICY IF EXISTS "Doc upload via case access" ON public.case_documents;
DROP POLICY IF EXISTS "case document upload respects family grant" ON public.case_documents;
CREATE POLICY "case document upload respects family grant"
  ON public.case_documents FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND (
      public.can_manage_case(auth.uid(), case_id)
      OR EXISTS (
        SELECT 1 FROM public.cases case_row
         WHERE case_row.id = case_id AND case_row.client_user_id = auth.uid()
      )
      OR public.family_case_grant(auth.uid(), case_id, 'collaborator')
    )
  );

DROP POLICY IF EXISTS "Doc delete uploader or internal" ON public.case_documents;
DROP POLICY IF EXISTS "case document delete respects family grant" ON public.case_documents;
CREATE POLICY "case document delete respects family grant"
  ON public.case_documents FOR DELETE TO authenticated
  USING (
    public.can_manage_case(auth.uid(), case_id)
    OR EXISTS (
      SELECT 1 FROM public.cases case_row
       WHERE case_row.id = case_id AND case_row.client_user_id = auth.uid()
    )
    OR (
      uploaded_by = auth.uid()
      AND public.family_case_grant(auth.uid(), case_id, 'collaborator')
    )
  );

DROP POLICY IF EXISTS "Message read via case access, internal notes internal-only" ON public.case_messages;
DROP POLICY IF EXISTS "case messages respect family access" ON public.case_messages;
CREATE POLICY "case messages respect family access"
  ON public.case_messages FOR SELECT TO authenticated
  USING (
    public.can_access_case(auth.uid(), case_id)
    AND (NOT internal_note OR public.can_manage_case(auth.uid(), case_id))
  );

DROP POLICY IF EXISTS "Message send via case access" ON public.case_messages;
DROP POLICY IF EXISTS "case message send respects family grant" ON public.case_messages;
CREATE POLICY "case message send respects family grant"
  ON public.case_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND public.can_access_case(auth.uid(), case_id)
    AND NOT internal_note
    AND (
      NOT public.family_case_grant(auth.uid(), case_id, 'updates')
      OR EXISTS (
        SELECT 1
          FROM public.case_access_grants grant_row
         WHERE grant_row.case_id = case_messages.case_id
           AND grant_row.accepted_by = auth.uid()
           AND grant_row.status = 'accepted'
           AND grant_row.expires_at > now()
           AND grant_row.can_message
      )
    )
  );

DROP POLICY IF EXISTS "Task write via case access" ON public.case_tasks;
DROP POLICY IF EXISTS "Staff create tasks" ON public.case_tasks;
DROP POLICY IF EXISTS "case members create permitted tasks" ON public.case_tasks;
CREATE POLICY "case members create permitted tasks"
  ON public.case_tasks FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      public.can_manage_case(auth.uid(), case_id)
      OR EXISTS (
        SELECT 1 FROM public.cases case_row
         WHERE case_row.id = case_id AND case_row.client_user_id = auth.uid()
      )
      OR public.family_case_grant(auth.uid(), case_id, 'collaborator')
    )
  );

DROP POLICY IF EXISTS "Task update via case access" ON public.case_tasks;
DROP POLICY IF EXISTS "Staff or assignee update tasks" ON public.case_tasks;
DROP POLICY IF EXISTS "case members update permitted tasks" ON public.case_tasks;
CREATE POLICY "case members update permitted tasks"
  ON public.case_tasks FOR UPDATE TO authenticated
  USING (
    public.can_manage_case(auth.uid(), case_id)
    OR EXISTS (
      SELECT 1 FROM public.cases case_row
       WHERE case_row.id = case_id AND case_row.client_user_id = auth.uid()
    )
    OR public.family_case_grant(auth.uid(), case_id, 'collaborator')
  )
  WITH CHECK (
    public.can_manage_case(auth.uid(), case_id)
    OR EXISTS (
      SELECT 1 FROM public.cases case_row
       WHERE case_row.id = case_id AND case_row.client_user_id = auth.uid()
    )
    OR public.family_case_grant(auth.uid(), case_id, 'collaborator')
  );

DROP POLICY IF EXISTS "Quote read via case access" ON public.case_quotes;
DROP POLICY IF EXISTS "quotes exclude family guests" ON public.case_quotes;
CREATE POLICY "quotes exclude family guests"
  ON public.case_quotes FOR SELECT TO authenticated
  USING (
    public.can_access_case(auth.uid(), case_id)
    AND NOT public.family_case_grant(auth.uid(), case_id, 'updates')
  );

DROP POLICY IF EXISTS "Invoice read via case access" ON public.case_invoices;
DROP POLICY IF EXISTS "invoices exclude family guests" ON public.case_invoices;
CREATE POLICY "invoices exclude family guests"
  ON public.case_invoices FOR SELECT TO authenticated
  USING (
    public.can_access_case(auth.uid(), case_id)
    AND NOT public.family_case_grant(auth.uid(), case_id, 'updates')
  );

UPDATE public.enquiry_notes SET note_type = 'reply' WHERE note_type = 'customer_reply';
UPDATE public.enquiry_notes SET note_type = 'system' WHERE note_type = 'status_change';

DROP POLICY IF EXISTS "Anyone can submit an insurance lead" ON public.insurance_leads;
DROP POLICY IF EXISTS "public can submit insurance leads" ON public.insurance_leads;
REVOKE INSERT ON public.insurance_leads FROM anon, authenticated;

DROP POLICY IF EXISTS "anyone can submit a tax lead" ON public.tax_leads;
REVOKE INSERT ON public.tax_leads FROM anon, authenticated;

DROP POLICY IF EXISTS "anyone can send a contact message" ON public.contact_messages;
REVOKE INSERT ON public.contact_messages FROM anon, authenticated;

COMMIT;