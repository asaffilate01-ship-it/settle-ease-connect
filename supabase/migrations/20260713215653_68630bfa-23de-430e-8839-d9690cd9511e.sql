
-- Monthly agent commission generator + cron

CREATE OR REPLACE FUNCTION public.generate_monthly_agent_commissions(_period date DEFAULT date_trunc('month', now())::date)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count integer := 0;
  r record;
  plan_price numeric;
  rate numeric;
  commission numeric;
BEGIN
  FOR r IN
    SELECT s.user_id AS referred_user_id,
           s.referring_agent_user_id AS agent_user_id,
           s.plan_code,
           a.commission_rate,
           a.status AS agent_status
      FROM public.subscriptions s
      JOIN public.agents a ON a.user_id = s.referring_agent_user_id
     WHERE s.referring_agent_user_id IS NOT NULL
       AND s.status IN ('active','trialing','past_due')
       AND a.status = 'active'
  LOOP
    SELECT monthly_price_eur INTO plan_price
      FROM public.subscription_plans WHERE code = r.plan_code LIMIT 1;
    IF plan_price IS NULL THEN CONTINUE; END IF;

    rate := COALESCE(r.commission_rate, 0.05);
    commission := round((plan_price * rate)::numeric, 2);

    INSERT INTO public.agent_commissions
      (agent_user_id, referred_user_id, period_month, product,
       gross_eur, commission_rate, commission_eur, status)
    VALUES
      (r.agent_user_id, r.referred_user_id, _period, r.plan_code,
       plan_price, rate, commission, 'pending')
    ON CONFLICT DO NOTHING;

    IF FOUND THEN inserted_count := inserted_count + 1; END IF;
  END LOOP;

  RETURN inserted_count;
END;
$$;

-- Idempotency key so re-runs don't duplicate
CREATE UNIQUE INDEX IF NOT EXISTS agent_commissions_unique_period
  ON public.agent_commissions (agent_user_id, referred_user_id, period_month, product);

-- Schedule: 1st of each month at 03:00 UTC
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-monthly-agent-commissions') THEN
    PERFORM cron.unschedule('generate-monthly-agent-commissions');
  END IF;
  PERFORM cron.schedule(
    'generate-monthly-agent-commissions',
    '0 3 1 * *',
    $cron$ SELECT public.generate_monthly_agent_commissions(); $cron$
  );
END $$;
