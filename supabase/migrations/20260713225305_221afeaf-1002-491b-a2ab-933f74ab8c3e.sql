
-- Make agent code generation not depend on pgcrypto's gen_random_bytes
CREATE OR REPLACE FUNCTION public.generate_agent_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $fn$
DECLARE
  candidate text;
  i int := 0;
BEGIN
  LOOP
    candidate := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    IF NOT EXISTS (SELECT 1 FROM public.agents WHERE code = candidate) THEN
      RETURN candidate;
    END IF;
    i := i + 1;
    IF i > 20 THEN
      RETURN 'AG' || upper(substr(md5(random()::text), 1, 8));
    END IF;
  END LOOP;
END;
$fn$;

-- Seed dev accounts
DO $$
DECLARE
  seeds jsonb := '[
    {"email":"admin@beistand.de","role":"admin","name":"Dev Admin"},
    {"email":"staff@beistand.de","role":"staff","name":"Dev Staff"},
    {"email":"manager@beistand.de","role":"case_manager","name":"Dev Manager"},
    {"email":"expert@beistand.de","role":"expert","name":"Dev Expert"},
    {"email":"agent@beistand.de","role":"agent","name":"Dev Agent"}
  ]'::jsonb;
  s jsonb;
  uid uuid;
  pwd text := 'beistand2026!';
BEGIN
  FOR s IN SELECT * FROM jsonb_array_elements(seeds)
  LOOP
    SELECT id INTO uid FROM auth.users WHERE email = s->>'email';

    IF uid IS NULL THEN
      uid := gen_random_uuid();
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, email_change,
        email_change_token_new, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
        s->>'email', crypt(pwd, gen_salt('bf')),
        now(),
        jsonb_build_object('provider','email','providers',jsonb_build_array('email')),
        jsonb_build_object('full_name', s->>'name'),
        now(), now(), '', '', '', ''
      );
      INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), uid, uid::text,
        jsonb_build_object('sub', uid::text, 'email', s->>'email', 'email_verified', true),
        'email', now(), now(), now()
      );
    ELSE
      UPDATE auth.users
         SET encrypted_password = crypt(pwd, gen_salt('bf')),
             email_confirmed_at = COALESCE(email_confirmed_at, now()),
             updated_at = now()
       WHERE id = uid;
    END IF;

    INSERT INTO public.profiles (id, full_name)
    VALUES (uid, s->>'name')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (uid, (s->>'role')::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    IF (s->>'role') = 'agent' THEN
      INSERT INTO public.agents (user_id, code)
      VALUES (uid, public.generate_agent_code())
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  END LOOP;
END $$;
