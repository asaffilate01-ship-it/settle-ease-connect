ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'sandbox';

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub_id
  ON public.subscriptions (stripe_subscription_id);

-- Make plan_code nullable so webhook can insert rows before we resolve a plan.
ALTER TABLE public.subscriptions ALTER COLUMN plan_code DROP NOT NULL;