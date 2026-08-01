ALTER TABLE public.knowledge_services
  ADD COLUMN IF NOT EXISTS forms jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS where_to_apply text,
  ADD COLUMN IF NOT EXISTS fees_detail text,
  ADD COLUMN IF NOT EXISTS appeals_process text,
  ADD COLUMN IF NOT EXISTS tips text,
  ADD COLUMN IF NOT EXISTS online_portals jsonb NOT NULL DEFAULT '[]'::jsonb;

INSERT INTO public.knowledge_categories (slug, name, description, sort_order) VALUES
  ('registration',   'Registration & ID',         'Anmeldung, IDs, Meldebescheinigung, police clearance', 10),
  ('social-security','Social Security & Numbers', 'SV-Nummer, Rentenversicherung, statutory health',       20),
  ('healthcare',     'Healthcare',                'GP registration, eGK, referrals, Pflege',              30),
  ('family',         'Family & Civil Status',     'Marriage, birth, paternity, death registration',        40),
  ('housing',        'Housing',                   'WBS, Sozialwohnung, Wohngeld',                          50),
  ('benefits',       'Benefits & Welfare',        'Buergergeld, ALG I, Krankengeld, Elterngeld, Kindergeld',60),
  ('tax',            'Tax & Revenue',             'Elster, Einkommensteuer, VAT, Freiberufler, Gewerbe',   70),
  ('immigration',    'Immigration & Nationality', 'Aufenthaltstitel, Blue Card, Einbuergerung',            80),
  ('education',      'Education & Recognition',   'Kita, Schule, Anerkennung, Fuehrerschein',              90),
  ('bereavement',    'Bereavement',               'Funeral, repatriation, Islamic rites',                 100)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order;