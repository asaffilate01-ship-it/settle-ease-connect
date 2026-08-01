UPDATE auth.users
SET
  encrypted_password = crypt('B3ist4nd_2026_Pass', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at         = now()
WHERE email IN (
  'admin@beistand.de','staff@beistand.de','manager@beistand.de',
  'insurance-admin@beistand.de','tax-admin@beistand.de',
  'benefits-admin@beistand.de','medical-admin@beistand.de',
  'arrival-admin@beistand.de',
  'expert@beistand.de','lawyer@beistand.de','notary@beistand.de',
  'accountant@beistand.de','doctor@beistand.de','social-worker@beistand.de',
  'translator@beistand.de','funeral@beistand.de',
  'mosque@beistand.de','church@beistand.de','temple@beistand.de',
  'hospital@beistand.de',
  'agent@beistand.de',
  'family@beistand.de','beneficiary@beistand.de'
);