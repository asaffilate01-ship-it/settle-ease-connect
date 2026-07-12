
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'case_messages','case_tasks','case_events','case_documents','case_quotes',
    'case_invoices','case_participants','cases',
    'emergency_alerts','vault_unlock_requests','vault_unlock_confirmations'
  ]) LOOP
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'directory_listings','cases','case_tasks','experts','knowledge_services',
    'vault_documents','vault_deputies'
  ]) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
      t, t
    );
  END LOOP;
END $$;

UPDATE public.directory_listings
   SET owner_user_id = '7b5de300-71d1-4545-ac57-1fd6248680f7',
       status = 'active'
 WHERE owner_user_id IS NULL;

DO $$
DECLARE
  v_client   uuid := '7b5de300-71d1-4545-ac57-1fd6248680f7';
  v_manager  uuid := '85cc9a61-6e9a-4f26-aa49-3da95ed5bc01';
  v_expert_u uuid := 'cff4f8a5-3560-41e3-baef-e69365014039';
  v_case1 uuid; v_case2 uuid; v_case3 uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.cases WHERE title LIKE 'Demo:%') THEN
    INSERT INTO public.cases (title, case_type, status, summary, client_user_id, case_manager_user_id, urgent, language, city, bundesland)
    VALUES ('Demo: Repatriation to Istanbul', 'bereavement', 'in_progress',
            'Family requesting repatriation of remains from Berlin to Istanbul within 5 days.',
            v_client, v_manager, true, 'tr', 'Berlin', 'Berlin')
    RETURNING id INTO v_case1;

    INSERT INTO public.cases (title, case_type, status, summary, client_user_id, case_manager_user_id, urgent, language, city, bundesland)
    VALUES ('Demo: New arrival — Anmeldung + health insurance', 'visa_application', 'new',
            'Recently arrived family of 4 needs Anmeldung, TK health cover, and school enrolment.',
            v_client, v_manager, false, 'ur', 'Munich', 'Bayern')
    RETURNING id INTO v_case2;

    INSERT INTO public.cases (title, case_type, status, summary, client_user_id, case_manager_user_id, urgent, language, city, bundesland)
    VALUES ('Demo: Bereavement paperwork after loss', 'bereavement', 'in_progress',
            'Widow needs help with pension notification, life insurance claim, and Sterbeurkunde translations.',
            v_client, v_manager, false, 'en', 'Hamburg', 'Hamburg')
    RETURNING id INTO v_case3;

    INSERT INTO public.case_participants (case_id, user_id, role) VALUES
      (v_case1, v_expert_u, 'expert'),
      (v_case2, v_expert_u, 'expert');

    INSERT INTO public.case_tasks (case_id, title, description, assignee_user_id, due_at, done, created_by) VALUES
      (v_case1, 'Obtain death certificate (Sterbeurkunde)', 'Register with Standesamt Berlin-Mitte', v_manager, now() + interval '1 day', true, v_manager),
      (v_case1, 'Book repatriation flight',                 'Turkish Airlines cargo desk',           v_expert_u, now() + interval '2 days', false, v_manager),
      (v_case1, 'Consulate paperwork',                      'Turkish consulate Berlin',              v_manager, now() + interval '3 days', false, v_manager),
      (v_case2, 'Book Anmeldung appointment',               'Bürgeramt München',                     v_manager, now() + interval '5 days', false, v_manager),
      (v_case2, 'Submit TK health insurance application',   'All 4 family members',                  v_manager, now() + interval '7 days', false, v_manager),
      (v_case3, 'Notify DRV (pension)',                     'Widow pension claim',                   v_manager, now() + interval '10 days', false, v_manager),
      (v_case3, 'Translate Sterbeurkunde EN→DE',           'Certified translator',                   v_expert_u, now() + interval '4 days', false, v_manager);

    INSERT INTO public.case_messages (case_id, sender_user_id, body, internal_note) VALUES
      (v_case1, v_client,  'Thank you for helping. My father passed this morning. Please help us bring him home.', false),
      (v_case1, v_manager, 'My sincere condolences. I have opened the case and started the repatriation checklist. I will call within the hour.', false),
      (v_case1, v_manager, 'Family speaks Turkish primarily. Assigning our Istanbul cargo partner.', true),
      (v_case2, v_client,  'We landed last week. Where do we start?', false),
      (v_case2, v_manager, 'Welcome to Germany. I have created a 5-step checklist starting with Anmeldung.', false),
      (v_case3, v_client,  'The pension office wants a translated death certificate — can you help?', false),
      (v_case3, v_manager, 'Yes — I have assigned one of our certified translators, ready in 3–4 days.', false);

    INSERT INTO public.case_events (case_id, event_type, payload, actor_user_id) VALUES
      (v_case1, 'case.created',    '{}'::jsonb, v_manager),
      (v_case1, 'case.status',     '{"to":"in_progress"}'::jsonb, v_manager),
      (v_case1, 'expert.assigned', '{"role":"expert"}'::jsonb, v_manager),
      (v_case2, 'case.created',    '{}'::jsonb, v_manager),
      (v_case3, 'case.created',    '{}'::jsonb, v_manager),
      (v_case3, 'case.status',     '{"to":"in_progress"}'::jsonb, v_manager);
  END IF;
END $$;
