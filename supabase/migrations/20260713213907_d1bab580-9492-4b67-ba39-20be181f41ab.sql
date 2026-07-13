
CREATE OR REPLACE FUNCTION public.generate_agent_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  candidate text;
  i int := 0;
BEGIN
  LOOP
    candidate := upper(substr(encode(gen_random_bytes(6), 'base64'), 1, 8));
    candidate := regexp_replace(candidate, '[^A-Z0-9]', '', 'g');
    IF length(candidate) < 6 THEN
      i := i + 1;
      IF i > 8 THEN candidate := 'AG' || substr(md5(random()::text), 1, 6); END IF;
      CONTINUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.agents WHERE code = candidate) THEN
      RETURN candidate;
    END IF;
    i := i + 1;
    IF i > 20 THEN
      RETURN 'AG' || substr(md5(random()::text), 1, 8);
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_agent_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'agent' THEN
    INSERT INTO public.agents (user_id, code)
    VALUES (NEW.user_id, public.generate_agent_code())
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_roles_ensure_agent ON public.user_roles;
CREATE TRIGGER user_roles_ensure_agent
  AFTER INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.ensure_agent_profile();

-- Backfill: any existing users already flagged as agents get an agents row.
INSERT INTO public.agents (user_id, code)
SELECT ur.user_id, public.generate_agent_code()
FROM public.user_roles ur
WHERE ur.role = 'agent'
  AND NOT EXISTS (SELECT 1 FROM public.agents a WHERE a.user_id = ur.user_id);
