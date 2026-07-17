
-- 1) directory_listings: hide PII columns from public/anon reads
REVOKE SELECT (email, phone, address, owner_user_id) ON public.directory_listings FROM anon, authenticated;
GRANT SELECT (email, phone, address, owner_user_id) ON public.directory_listings TO service_role;

-- 2) channel_members: tighten INSERT policy — no self-join into arbitrary channels
DROP POLICY IF EXISTS "owners/staff add members" ON public.channel_members;
CREATE POLICY "owners/staff add members" ON public.channel_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.message_channels c
             WHERE c.id = channel_members.channel_id AND c.created_by = auth.uid())
    OR public.is_channel_member(auth.uid(), channel_members.channel_id)
    OR public.is_internal(auth.uid())
  );

-- 3) expert_payouts & expert_invitations: rescope policies from public role to authenticated
DROP POLICY IF EXISTS "Experts can read their own payouts" ON public.expert_payouts;
CREATE POLICY "Experts can read their own payouts" ON public.expert_payouts
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.experts e WHERE e.id = expert_payouts.expert_id AND e.user_id = auth.uid()));

DROP POLICY IF EXISTS "Internal staff manage expert payouts" ON public.expert_payouts;
CREATE POLICY "Internal staff manage expert payouts" ON public.expert_payouts
  FOR ALL TO authenticated
  USING (public.is_internal(auth.uid()))
  WITH CHECK (public.is_internal(auth.uid()));

DROP POLICY IF EXISTS "Internal staff manage expert invitations" ON public.expert_invitations;
CREATE POLICY "Internal staff manage expert invitations" ON public.expert_invitations
  FOR ALL TO authenticated
  USING (public.is_internal(auth.uid()))
  WITH CHECK (public.is_internal(auth.uid()));

DROP POLICY IF EXISTS "Invitee can read own invitation by token via server fn" ON public.expert_invitations;
CREATE POLICY "Invitee can read own invitation by token via server fn" ON public.expert_invitations
  FOR SELECT TO authenticated
  USING (accepted_by = auth.uid());

-- 4) SECURITY DEFINER functions: revoke EXECUTE from public/anon
REVOKE EXECUTE ON FUNCTION public.close_case(uuid, text, jsonb, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.apply_case_template(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_partner_org(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_licensed_advisor(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_partner_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_partner_admin(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.audit_row_change() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.dela_regulated_guard() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.vault_autolink_case_tasks() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.insurance_leads_regulated_guard() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.close_case(uuid, text, jsonb, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_case_template(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_partner_org(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_licensed_advisor(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_partner_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_partner_admin(uuid, uuid) TO authenticated;

-- 5) translation cache table (server-side dedupe to cap AI costs on the public translate endpoint)
CREATE TABLE IF NOT EXISTS public.translation_cache (
  target_lang text NOT NULL,
  source_hash text NOT NULL,
  source_text text NOT NULL,
  translated_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (target_lang, source_hash)
);
GRANT SELECT, INSERT ON public.translation_cache TO service_role;
ALTER TABLE public.translation_cache ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (used by server function) may read/write.
