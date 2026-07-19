CREATE OR REPLACE FUNCTION public.partner_doc_expiry_sweep()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted int := 0;
  row_ct int := 0;
  d RECORD;
BEGIN
  FOR d IN
    SELECT pd.id, pd.org_id, pd.doc_type, pd.expires_at, po.name AS org_name
      FROM public.partner_documents pd
      JOIN public.partner_organisations po ON po.id = pd.org_id
     WHERE pd.expires_at IS NOT NULL
       AND pd.expires_at BETWEEN now() AND now() + interval '14 days'
       AND pd.status IN ('approved','pending')
  LOOP
    INSERT INTO public.notifications (user_id, kind, title, body, entity_type, entity_id, metadata)
    SELECT pu.user_id, 'partner_doc_expiring',
           'Document expiring: ' || d.doc_type,
           d.org_name || ' — ' || d.doc_type || ' expires ' || to_char(d.expires_at, 'YYYY-MM-DD') || '.',
           'partner_document', d.id::text,
           jsonb_build_object('org_id', d.org_id, 'expires_at', d.expires_at)
      FROM public.partner_users pu
     WHERE pu.org_id = d.org_id AND pu.status = 'active' AND pu.is_admin = true
       AND NOT EXISTS (
         SELECT 1 FROM public.notifications n
          WHERE n.user_id = pu.user_id
            AND n.kind = 'partner_doc_expiring'
            AND n.entity_id = d.id::text
            AND n.created_at > now() - interval '3 days'
       );
    GET DIAGNOSTICS row_ct = ROW_COUNT;
    inserted := inserted + row_ct;
  END LOOP;
  RETURN inserted;
END $$;

CREATE OR REPLACE FUNCTION public.subscription_dunning_sweep()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted int := 0;
  s RECORD;
BEGIN
  FOR s IN
    SELECT id, user_id, plan_code
      FROM public.subscriptions
     WHERE status = 'past_due'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications n
       WHERE n.user_id = s.user_id
         AND n.kind = 'subscription_past_due'
         AND n.entity_id = s.id::text
         AND n.created_at > now() - interval '3 days'
    ) THEN
      INSERT INTO public.notifications (user_id, kind, title, body, entity_type, entity_id, metadata)
      VALUES (s.user_id, 'subscription_past_due',
              'Payment needed to keep your plan active',
              'Your last payment did not go through. Update your payment method to keep your ' || COALESCE(s.plan_code,'subscription') || ' active.',
              'subscription', s.id::text,
              jsonb_build_object('plan_code', s.plan_code));
      inserted := inserted + 1;
    END IF;
  END LOOP;
  RETURN inserted;
END $$;

REVOKE EXECUTE ON FUNCTION public.partner_doc_expiry_sweep() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.subscription_dunning_sweep() FROM PUBLIC, anon, authenticated;