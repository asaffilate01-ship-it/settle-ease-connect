BEGIN;

-- Atomically claim a new Stripe event or reclaim one that previously failed.
-- A stale processing lease may be reclaimed after 15 minutes so a worker crash
-- cannot leave an event permanently unprocessable.
CREATE OR REPLACE FUNCTION public.claim_stripe_webhook_event(
  _event_id text,
  _event_type text,
  _environment text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimed_event_id text;
BEGIN
  IF _event_id IS NULL OR char_length(_event_id) < 3 THEN
    RAISE EXCEPTION 'invalid event id';
  END IF;
  IF _event_type IS NULL OR char_length(_event_type) < 3 THEN
    RAISE EXCEPTION 'invalid event type';
  END IF;
  IF _environment NOT IN ('sandbox', 'live') THEN
    RAISE EXCEPTION 'invalid payment environment';
  END IF;

  INSERT INTO public.stripe_webhook_events (
    event_id,
    event_type,
    environment,
    status,
    error_message,
    received_at,
    processed_at
  )
  VALUES (
    _event_id,
    _event_type,
    _environment,
    'processing',
    NULL,
    now(),
    NULL
  )
  ON CONFLICT (event_id) DO UPDATE
    SET status = 'processing',
        error_message = NULL,
        received_at = now(),
        processed_at = NULL
    WHERE public.stripe_webhook_events.event_type = EXCLUDED.event_type
      AND public.stripe_webhook_events.environment = EXCLUDED.environment
      AND (
        public.stripe_webhook_events.status = 'failed'
        OR (
          public.stripe_webhook_events.status = 'processing'
          AND public.stripe_webhook_events.received_at < now() - interval '15 minutes'
        )
      )
  RETURNING event_id INTO claimed_event_id;

  RETURN claimed_event_id IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_stripe_webhook_event(text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_stripe_webhook_event(text, text, text)
  TO service_role;

COMMIT;
