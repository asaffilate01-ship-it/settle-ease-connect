
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS household_kind TEXT NOT NULL DEFAULT 'individual'
    CHECK (household_kind IN ('individual','family','family_plus')),
  ADD COLUMN IF NOT EXISTS plan_group TEXT,
  ADD COLUMN IF NOT EXISTS max_adults INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_children INTEGER NOT NULL DEFAULT 0;

UPDATE public.subscription_plans SET plan_group = code WHERE plan_group IS NULL;

-- Family variants
INSERT INTO public.subscription_plans
  (code, name, tagline, monthly_price_eur, features, sort_order, active,
   household_kind, plan_group, max_adults, max_children)
VALUES
  ('basic_family', 'Basic — Family', 'Everyday help for the whole household',
    9, '["Everything in Basic","2 adults + up to 3 children","Shared checklists & vault","AI in 13 languages"]'::jsonb,
    11, TRUE, 'family', 'basic', 2, 3),
  ('basic_family_plus', 'Basic — Extended family', 'For larger or multi-generational households',
    14, '["Everything in Basic","Up to 4 adults + 3 children","Multi-generational shared vault","AI in 13 languages"]'::jsonb,
    12, TRUE, 'family_plus', 'basic', 4, 3),
  ('plus_family', 'Plus — Family', 'Add-ons and priority for the household',
    18, '["Everything in Plus","2 adults + up to 3 children","Priority case manager","Visa, tax, driving guides"]'::jsonb,
    21, TRUE, 'family', 'plus', 2, 3),
  ('plus_family_plus', 'Plus — Extended family', 'Full add-ons for larger households',
    28, '["Everything in Plus","Up to 4 adults + 3 children","Priority case manager","Business & school add-ons"]'::jsonb,
    22, TRUE, 'family_plus', 'plus', 4, 3),
  ('complete_family', 'Complete — Family', 'Full case management for the household',
    39, '["Everything in Complete","2 adults + up to 3 children","Bereavement, visa & benefits case management","Dedicated case manager","Optional family funeral insurance"]'::jsonb,
    31, TRUE, 'family', 'complete', 2, 3),
  ('complete_family_plus', 'Complete — Extended family', 'For extended and multi-generational households',
    59, '["Everything in Complete","Up to 4 adults + 3 children","Bereavement, visa & benefits case management","Dedicated case manager","Optional extended-family funeral insurance"]'::jsonb,
    32, TRUE, 'family_plus', 'complete', 4, 3)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  monthly_price_eur = EXCLUDED.monthly_price_eur,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  household_kind = EXCLUDED.household_kind,
  plan_group = EXCLUDED.plan_group,
  max_adults = EXCLUDED.max_adults,
  max_children = EXCLUDED.max_children,
  active = TRUE;
