DROP POLICY IF EXISTS "Assigned managers update cases" ON public.cases;
DROP POLICY IF EXISTS "Internal staff update cases" ON public.cases;
DROP POLICY IF EXISTS "aal2 internal staff update cases" ON public.cases;
CREATE POLICY "aal2 internal staff update cases"
  ON public.cases FOR UPDATE TO authenticated
  USING (public.is_internal(auth.uid()) AND auth.jwt()->>'aal' = 'aal2')
  WITH CHECK (public.is_internal(auth.uid()) AND auth.jwt()->>'aal' = 'aal2');

DROP POLICY IF EXISTS "case message send respects family grant" ON public.case_messages;
DROP POLICY IF EXISTS "case messages enforce audience and assurance" ON public.case_messages;
CREATE POLICY "case messages enforce audience and assurance"
  ON public.case_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND public.can_access_case(auth.uid(), case_id)
    AND (
      (
        NOT internal_note
        AND (
          NOT public.family_case_grant(auth.uid(), case_id, 'updates')
          OR EXISTS (
            SELECT 1
              FROM public.case_access_grants grant_row
             WHERE grant_row.case_id = case_id
               AND grant_row.accepted_by = auth.uid()
               AND grant_row.status = 'accepted'
               AND grant_row.expires_at > now()
               AND grant_row.can_message
          )
        )
      )
      OR (
        internal_note
        AND public.can_manage_case(auth.uid(), case_id)
        AND auth.jwt()->>'aal' = 'aal2'
      )
    )
  );