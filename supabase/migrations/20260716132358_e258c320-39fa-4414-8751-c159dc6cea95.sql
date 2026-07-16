
-- ============================================================
-- Append-only audit_log (block UPDATE/DELETE for regular users)
-- ============================================================
REVOKE UPDATE, DELETE ON public.audit_log FROM authenticated;
REVOKE UPDATE, DELETE ON public.audit_log FROM anon;

-- Optional hard guard: even service_role edits get logged as unusual
CREATE OR REPLACE FUNCTION public.audit_log_block_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only; % is not permitted', TG_OP;
END $$;

DROP TRIGGER IF EXISTS trg_audit_log_no_update ON public.audit_log;
CREATE TRIGGER trg_audit_log_no_update
  BEFORE UPDATE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_block_mutation();

DROP TRIGGER IF EXISTS trg_audit_log_no_delete ON public.audit_log;
CREATE TRIGGER trg_audit_log_no_delete
  BEFORE DELETE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_block_mutation();

-- ============================================================
-- Generic row-change auditor
-- ============================================================
CREATE OR REPLACE FUNCTION public.audit_row_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor uuid := auth.uid();
  _row_id text;
  _subject uuid;
  _entity text := TG_TABLE_NAME;
  _action text := lower(TG_OP);
  _payload jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _row_id := coalesce((row_to_json(OLD)::jsonb->>'id'), '');
    _payload := jsonb_build_object('old', to_jsonb(OLD));
    _subject := (row_to_json(OLD)::jsonb->>'user_id')::uuid;
  ELSE
    _row_id := coalesce((row_to_json(NEW)::jsonb->>'id'), '');
    _subject := (row_to_json(NEW)::jsonb->>'user_id')::uuid;
    IF TG_OP = 'UPDATE' THEN
      -- Diff: only changed keys
      _payload := jsonb_build_object(
        'changed', (
          SELECT jsonb_object_agg(key, jsonb_build_object('from', o_val, 'to', n_val))
          FROM (
            SELECT key, o.value AS o_val, n.value AS n_val
            FROM jsonb_each(to_jsonb(OLD)) o
            JOIN jsonb_each(to_jsonb(NEW)) n USING (key)
            WHERE o.value IS DISTINCT FROM n.value
              AND key NOT IN ('updated_at','created_at')
          ) diffs
        )
      );
    ELSE
      _payload := jsonb_build_object('new', to_jsonb(NEW));
    END IF;
  END IF;

  -- Skip pure timestamp-only updates
  IF TG_OP = 'UPDATE' AND (_payload->'changed') IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.audit_log (actor_user_id, action, entity_type, entity_id, subject_user_id, metadata)
  VALUES (_actor, _entity || '.' || _action, _entity, _row_id, _subject, coalesce(_payload, '{}'::jsonb));

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END $$;

-- ============================================================
-- Attach triggers
-- ============================================================
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'profiles',
    'cases',
    'case_documents',
    'crm_consents',
    'dela_referrals',
    'insurance_leads',
    'user_roles',
    'partner_organisations',
    'partner_users'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%1$s ON public.%1$s', t);
    EXECUTE format(
      'CREATE TRIGGER trg_audit_%1$s AFTER INSERT OR UPDATE OR DELETE ON public.%1$s FOR EACH ROW EXECUTE FUNCTION public.audit_row_change()',
      t
    );
  END LOOP;
END $$;
