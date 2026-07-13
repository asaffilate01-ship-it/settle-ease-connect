
CREATE OR REPLACE FUNCTION public.generate_agent_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
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
