
INSERT INTO public.role_invitations (email, role, note, expires_at) VALUES
  ('agent@beistand.de', 'agent', 'Seed agent account', now() + interval '365 days')
ON CONFLICT DO NOTHING;
