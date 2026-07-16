
CREATE OR REPLACE FUNCTION public.sla_breach_sweep()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  inserted int := 0;
  c RECORD;
BEGIN
  FOR c IN
    SELECT c.id, c.title, c.case_manager_user_id, c.client_user_id, c.sla_due_at
      FROM public.cases c
     WHERE c.sla_due_at IS NOT NULL
       AND c.sla_due_at < now()
       AND c.status NOT IN ('closed','cancelled')
  LOOP
    IF c.case_manager_user_id IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM public.notifications n
          WHERE n.user_id = c.case_manager_user_id
            AND n.kind = 'sla_breach'
            AND n.entity_id = c.id::text
            AND n.created_at > c.sla_due_at
       ) THEN
      INSERT INTO public.notifications (user_id, kind, title, body, entity_type, entity_id, metadata)
      VALUES (c.case_manager_user_id, 'sla_breach',
              'SLA breached: ' || c.title,
              'This case has passed its SLA deadline. Please review.',
              'case', c.id::text,
              jsonb_build_object('sla_due_at', c.sla_due_at));
      inserted := inserted + 1;
    END IF;
  END LOOP;
  RETURN inserted;
END $fn$;

REVOKE ALL ON FUNCTION public.sla_breach_sweep() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sla_breach_sweep() TO service_role;

CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $c$
BEGIN
  PERFORM cron.unschedule('sla-breach-sweep');
EXCEPTION WHEN OTHERS THEN NULL;
END $c$;

SELECT cron.schedule(
  'sla-breach-sweep',
  '0 * * * *',
  $$SELECT public.sla_breach_sweep();$$
);
