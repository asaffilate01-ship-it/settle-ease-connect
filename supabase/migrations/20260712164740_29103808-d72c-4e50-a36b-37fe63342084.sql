
-- Ensure 'staff' role exists (already in enum) and add invitations table
CREATE TABLE public.role_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role app_role NOT NULL,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX role_invitations_email_idx ON public.role_invitations (lower(email));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_invitations TO authenticated;
GRANT ALL ON public.role_invitations TO service_role;

ALTER TABLE public.role_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invitations"
  ON public.role_invitations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Invitee can view own invitation"
  ON public.role_invitations FOR SELECT
  TO authenticated
  USING (lower(email) = lower((auth.jwt() ->> 'email')));

CREATE TRIGGER role_invitations_updated_at
  BEFORE UPDATE ON public.role_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Replace handle_new_user to honor pending invitations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invited_role app_role;
  applied boolean := false;
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  FOR invited_role IN
    SELECT role FROM public.role_invitations
    WHERE lower(email) = lower(NEW.email)
      AND accepted_at IS NULL
      AND expires_at > now()
  LOOP
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, invited_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    applied := true;
  END LOOP;

  IF applied THEN
    UPDATE public.role_invitations
       SET accepted_at = now(), accepted_by = NEW.id
     WHERE lower(email) = lower(NEW.email)
       AND accepted_at IS NULL
       AND expires_at > now();
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'family')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Seed dummy invitations
INSERT INTO public.role_invitations (email, role, note, expires_at) VALUES
  ('admin@beistand.de',   'admin',        'Seed admin account',        now() + interval '365 days'),
  ('staff@beistand.de',   'staff',        'Seed staff account',        now() + interval '365 days'),
  ('manager@beistand.de', 'case_manager', 'Seed case manager account', now() + interval '365 days'),
  ('expert@beistand.de',  'expert',       'Seed expert account',       now() + interval '365 days');
