DROP POLICY IF EXISTS "case messages enforce audience and assurance" ON public.case_messages;
CREATE POLICY "case messages enforce audience and assurance"
ON public.case_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_user_id = auth.uid()
  AND can_access_case(auth.uid(), case_id)
  AND (
    ((NOT internal_note) AND (
      (NOT family_case_grant(auth.uid(), case_id, 'updates'::text))
      OR EXISTS (
        SELECT 1 FROM public.case_access_grants grant_row
        WHERE grant_row.case_id = case_messages.case_id
          AND grant_row.accepted_by = auth.uid()
          AND grant_row.status = 'accepted'
          AND grant_row.expires_at > now()
          AND grant_row.can_message
      )
    ))
    OR (internal_note AND can_manage_case(auth.uid(), case_id) AND ((auth.jwt() ->> 'aal') = 'aal2'))
  )
);