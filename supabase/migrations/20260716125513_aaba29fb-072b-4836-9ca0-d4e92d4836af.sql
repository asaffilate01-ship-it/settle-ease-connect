
-- Extend cases table
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS template_code text,
  ADD COLUMN IF NOT EXISTS current_stage text,
  ADD COLUMN IF NOT EXISTS sla_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS risk_level text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS closure_report text;

-- Templates
CREATE TABLE public.case_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  case_type public.case_type NOT NULL,
  expected_duration_days integer,
  risk_level text DEFAULT 'normal',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.case_templates TO authenticated;
GRANT ALL ON public.case_templates TO service_role;
ALTER TABLE public.case_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Internal staff read templates" ON public.case_templates FOR SELECT
  TO authenticated USING (public.is_internal(auth.uid()));
CREATE POLICY "Admins manage templates" ON public.case_templates FOR ALL
  TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_case_templates_updated BEFORE UPDATE ON public.case_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.case_template_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.case_templates(id) ON DELETE CASCADE,
  code text NOT NULL,
  position integer NOT NULL,
  name text NOT NULL,
  description text,
  sla_hours integer,
  required_consent text,
  requires_role text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, code)
);
GRANT SELECT ON public.case_template_stages TO authenticated;
GRANT ALL ON public.case_template_stages TO service_role;
ALTER TABLE public.case_template_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Internal staff read stages" ON public.case_template_stages FOR SELECT
  TO authenticated USING (public.is_internal(auth.uid()));
CREATE POLICY "Admins manage stages" ON public.case_template_stages FOR ALL
  TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.case_template_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES public.case_template_stages(id) ON DELETE CASCADE,
  position integer NOT NULL,
  title text NOT NULL,
  description text,
  assignee_role text,
  offset_hours integer DEFAULT 0,
  required boolean NOT NULL DEFAULT true,
  requires_document boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.case_template_tasks TO authenticated;
GRANT ALL ON public.case_template_tasks TO service_role;
ALTER TABLE public.case_template_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Internal staff read template tasks" ON public.case_template_tasks FOR SELECT
  TO authenticated USING (public.is_internal(auth.uid()));
CREATE POLICY "Admins manage template tasks" ON public.case_template_tasks FOR ALL
  TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Function to apply template to a case (populates case_tasks + sets template_code/current_stage)
CREATE OR REPLACE FUNCTION public.apply_case_template(_case_id uuid, _template_code text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tpl RECORD;
  first_stage RECORD;
  inserted integer := 0;
  t RECORD;
BEGIN
  IF NOT public.can_access_case(auth.uid(), _case_id) THEN
    RAISE EXCEPTION 'Not authorised for this case';
  END IF;

  SELECT * INTO tpl FROM public.case_templates WHERE template_code = _template_code AND active LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Template % not found', _template_code; END IF;

  SELECT * INTO first_stage FROM public.case_template_stages
    WHERE template_id = tpl.id ORDER BY position ASC LIMIT 1;

  UPDATE public.cases
     SET template_code = tpl.template_code,
         current_stage = COALESCE(first_stage.code, current_stage),
         risk_level = COALESCE(tpl.risk_level, risk_level),
         sla_due_at = CASE WHEN tpl.expected_duration_days IS NOT NULL
                           THEN now() + (tpl.expected_duration_days || ' days')::interval
                           ELSE sla_due_at END
   WHERE id = _case_id;

  FOR t IN
    SELECT ct.*, cs.position AS stage_pos
      FROM public.case_template_tasks ct
      JOIN public.case_template_stages cs ON cs.id = ct.stage_id
     WHERE cs.template_id = tpl.id
     ORDER BY cs.position, ct.position
  LOOP
    INSERT INTO public.case_tasks (case_id, title, description, due_at, status, created_by)
    VALUES (_case_id, t.title, t.description,
            now() + (t.offset_hours || ' hours')::interval,
            'open', auth.uid());
    inserted := inserted + 1;
  END LOOP;

  RETURN inserted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_case_template(uuid, text) TO authenticated;

-- ============ SEED 8 TEMPLATES ============

INSERT INTO public.case_templates (template_code, name, description, case_type, expected_duration_days, risk_level) VALUES
  ('funeral_de', 'Funeral in Germany', 'Full workflow from death reported through case closure and aftercare — burial or cremation in Germany.', 'bereavement', 21, 'high'),
  ('repatriation', 'International Repatriation', 'Repatriation of the deceased to home country: consular, embalming, air cargo, receiving director.', 'bereavement', 30, 'high'),
  ('funeral_insurance', 'Funeral-Expense Insurance Referral', 'Sterbegeld regulated advice: consent, disclosure, application, policy issued, commission tracking.', 'other', 45, 'normal'),
  ('health_gkv', 'Statutory Health Insurance (GKV) Referral', 'Enrol member into a statutory (GKV) fund and hand over to the fund.', 'healthcare', 14, 'normal'),
  ('health_pkv', 'Private Health Insurance (PKV) Referral', 'PKV regulated advice: eligibility, disclosure, application, policy accepted.', 'healthcare', 30, 'normal'),
  ('welfare_benefits', 'Welfare / Benefits Assistance', 'Bürgergeld, Wohngeld, Kindergeld, Elterngeld and similar — application and follow-through.', 'benefits_claim', 60, 'normal'),
  ('immigration_referral', 'Immigration Law Referral', 'Refer to a Fachanwalt für Migrationsrecht; supervise engagement and documents.', 'nationality', 90, 'high'),
  ('translation_docs', 'Translation / Document Support', 'Sworn translations, apostilles, and document procurement.', 'translation', 14, 'normal');

-- === FUNERAL IN GERMANY — detailed ===
WITH t AS (SELECT id FROM public.case_templates WHERE template_code = 'funeral_de'),
s AS (
  INSERT INTO public.case_template_stages (template_id, code, position, name, description, sla_hours, required_consent, requires_role)
  SELECT t.id, code, pos, name, descr, sla, consent, role FROM t, (VALUES
    ('death_reported',        1, 'Death reported', 'Intake call, deceased basics, family contact', 1, NULL, NULL),
    ('identity_verified',     2, 'Identity & relationship verified', 'ID of caller, relationship to deceased', 2, NULL, NULL),
    ('consent_authority',     3, 'Consent & authority obtained', 'Written authority to act (Bestattungsvollmacht)', 4, 'funeral_authority', NULL),
    ('risks_assessed',        4, 'Immediate risks assessed', 'Time limits, religion, refrigeration deadlines, vulnerable relatives', 6, NULL, NULL),
    ('requirements_recorded', 5, 'Funeral requirements recorded', 'Burial vs cremation, coffin, ceremony, location', 24, NULL, NULL),
    ('religion_recorded',     6, 'Religion & cultural requirements', 'Rites, imam/priest, ghusl, timings', 24, NULL, NULL),
    ('director_invited',      7, 'Funeral director invited', 'Invite 1-3 approved directors to quote', 24, NULL, NULL),
    ('quotes_collected',      8, 'Quotes collected', 'Compare 2-3 fixed-price approved-transport-casket quotes', 48, NULL, NULL),
    ('provider_appointed',    9, 'Provider appointed', 'Family selects; contract signed', 12, 'provider_appointment', NULL),
    ('burial_workflow',      10, 'Burial or cremation workflow', 'Standesamt, Totenschein, permits, plot/urn', 72, NULL, NULL),
    ('insurer_checked',      11, 'Insurer / policy details checked', 'Sterbegeld claim, direct-pay setup', 48, NULL, NULL),
    ('documents_tracked',    12, 'Documents tracked', 'Death certificate, permits, receipts in vault', 24, NULL, NULL),
    ('family_updated',       13, 'Family updated', 'Milestone update at each stage', 24, NULL, NULL),
    ('providers_paid',       14, 'Providers paid / reconciled', 'Escrow release, invoices reconciled', 168, NULL, NULL),
    ('case_closed',          15, 'Case closed', 'Closure report, balance settled', 24, NULL, NULL),
    ('aftercare_offered',    16, 'Aftercare offered', '14/30/90 day follow-ups, grief support', NULL, NULL, NULL)
  ) v(code,pos,name,descr,sla,consent,role)
  RETURNING id, code, position
)
INSERT INTO public.case_template_tasks (stage_id, position, title, description, assignee_role, offset_hours, required)
SELECT s.id, tk.pos, tk.title, tk.descr, tk.role, tk.off, tk.req
FROM s JOIN (VALUES
  ('death_reported',        1, 'Log intake call',                   'Record who called, when, deceased details', 'case_manager', 0, true),
  ('death_reported',        2, 'Open bereavement case file',        'Create case with high priority',            'case_manager', 0, true),
  ('identity_verified',     1, 'Verify caller ID',                  'Passport / Ausweis on file',                'case_manager', 2, true),
  ('identity_verified',     2, 'Verify relationship',                'Family book / marriage cert / declaration', 'case_manager', 2, true),
  ('consent_authority',     1, 'Send Bestattungsvollmacht',         'Send authority form for e-sign',            'case_manager', 4, true),
  ('consent_authority',     2, 'File signed authority in vault',    'Upload to case vault',                      'case_manager', 6, true),
  ('risks_assessed',        1, 'Confirm refrigeration deadline',    'Contact hospital/morgue',                   'case_manager', 6, true),
  ('risks_assessed',        2, 'Flag religious/timing constraints', 'Islamic burial within 24h, etc.',           'case_manager', 6, true),
  ('requirements_recorded', 1, 'Complete funeral wishes form',      'Burial/cremation, casket, ceremony',        'case_manager', 12, true),
  ('religion_recorded',     1, 'Confirm officiant',                 'Book imam / priest / celebrant',            'case_manager', 24, true),
  ('director_invited',      1, 'Invite 3 approved directors',       'Send RFQ with requirements',                'case_manager', 24, true),
  ('quotes_collected',      1, 'Collect fixed-price quotes',        'Approved transport casket only',            'case_manager', 48, true),
  ('quotes_collected',      2, 'Present quotes to family',           'Side-by-side comparison',                   'case_manager', 48, true),
  ('provider_appointed',    1, 'Family selects director',           'Record choice, reason',                     'case_manager', 60, true),
  ('provider_appointed',    2, 'Sign contract',                     'Countersign on family behalf',              'case_manager', 60, true),
  ('burial_workflow',      1, 'Standesamt death registration',     'Totenschein → Sterbeurkunde',              'case_manager', 72, true),
  ('burial_workflow',      2, 'Cemetery / crematorium booking',    'Plot or urn slot',                          'case_manager', 96, true),
  ('insurer_checked',      1, 'Verify Sterbegeld policy',           'Confirm cover, direct-pay',                 'case_manager', 48, true),
  ('insurer_checked',      2, 'Submit insurer claim',              'Attach death cert + invoices',              'case_manager', 96, true),
  ('documents_tracked',    1, 'Upload all documents to vault',      'Death cert, permits, receipts',             'case_manager', 24, true),
  ('family_updated',       1, 'Daily status update to family',      'Written summary + call',                    'case_manager', 24, true),
  ('providers_paid',       1, 'Escrow release to director',         'On completion of service',                  'case_manager', 168, true),
  ('providers_paid',       2, 'Reconcile invoices',                'Match to escrow',                           'case_manager', 168, true),
  ('case_closed',          1, 'Draft closure report',              'Timeline, costs, outcomes',                 'case_manager', 24, true),
  ('case_closed',          2, 'Close case',                        'Mark status closed',                        'case_manager', 24, true),
  ('aftercare_offered',    1, 'Aftercare call — day 14',           'Grief check-in',                            'case_manager', 336, false),
  ('aftercare_offered',    2, 'Aftercare call — day 30',           'Estate/admin help',                         'case_manager', 720, false),
  ('aftercare_offered',    3, 'Aftercare call — day 90',           'Final check-in',                            'case_manager', 2160, false)
) tk(stage_code, pos, title, descr, role, off, req) ON s.code = tk.stage_code;

-- === REPATRIATION — detailed ===
WITH t AS (SELECT id FROM public.case_templates WHERE template_code = 'repatriation'),
s AS (
  INSERT INTO public.case_template_stages (template_id, code, position, name, description, sla_hours)
  SELECT t.id, code, pos, name, descr, sla FROM t, (VALUES
    ('death_reported',       1, 'Death reported',                  'Intake + destination country', 1),
    ('identity_verified',    2, 'Identity & relationship verified','Caller + deceased', 2),
    ('consent_authority',    3, 'Consent & authority',             'Repatriation authority form', 4),
    ('destination_confirmed',4, 'Destination confirmed',           'Home country, receiving director, cemetery', 12),
    ('embassy_notified',     5, 'Embassy / consulate notified',    'NOC application initiated', 24),
    ('documents_prepared',   6, 'Documents prepared',              'Death cert, embalming cert, non-contagion, transit permit', 48),
    ('embalming_arranged',   7, 'Embalming arranged',              'Approved facility, family witness if requested', 48),
    ('coffin_specified',     8, 'Transport casket specified',      'Zinc-lined-equivalent approved transport casket', 24),
    ('cargo_booked',         9, 'Air cargo booked',                'Airline HR booking, routing', 48),
    ('customs_cleared',     10, 'Customs cleared at origin',       'Zoll clearance',                             48),
    ('receiving_director',  11, 'Receiving director briefed',      'Handover contact, timeline',                 24),
    ('family_updated',      12, 'Family updated at each step',     'Written + call',                             24),
    ('handover_confirmed',  13, 'Handover confirmed at destination','Signed receipt from receiving director',    24),
    ('providers_paid',      14, 'Providers paid / reconciled',     'Escrow release, invoices reconciled',       168),
    ('case_closed',         15, 'Case closed',                     'Closure report',                             24),
    ('aftercare_offered',   16, 'Aftercare offered',               '14/30/90 day follow-ups',                    NULL)
  ) v(code,pos,name,descr,sla)
  RETURNING id, code
)
INSERT INTO public.case_template_tasks (stage_id, position, title, description, assignee_role, offset_hours)
SELECT s.id, tk.pos, tk.title, tk.descr, tk.role, tk.off FROM s JOIN (VALUES
  ('death_reported',        1, 'Log intake — repatriation flag',      'Note destination country',           'case_manager', 0),
  ('identity_verified',     1, 'Verify caller ID + relationship',     'Passport, family book',              'case_manager', 2),
  ('consent_authority',     1, 'Send repatriation authority',         'E-sign form',                        'case_manager', 4),
  ('destination_confirmed', 1, 'Confirm home country + city',         'Address of receiving director',      'case_manager', 12),
  ('destination_confirmed', 2, 'Identify receiving director',         'Panel or family choice',             'case_manager', 12),
  ('embassy_notified',      1, 'Apply for NOC',                       'Consulate no-objection certificate', 'case_manager', 24),
  ('documents_prepared',    1, 'Order Sterbeurkunde',                 'International multilingual form',    'case_manager', 48),
  ('documents_prepared',    2, 'Embalming certificate',                'From licensed embalmer',            'case_manager', 48),
  ('documents_prepared',    3, 'Non-contagion certificate',            'Health authority',                  'case_manager', 48),
  ('documents_prepared',    4, 'Transit permit',                       'Leichenpass',                       'case_manager', 48),
  ('embalming_arranged',    1, 'Book embalming facility',              'Approved provider',                 'case_manager', 48),
  ('coffin_specified',      1, 'Specify approved transport casket',    'Airline-compliant',                 'case_manager', 24),
  ('cargo_booked',          1, 'Book air cargo (HR)',                  'Airline human-remains service',     'case_manager', 48),
  ('customs_cleared',       1, 'Zoll customs clearance',               'Export documents',                  'case_manager', 48),
  ('receiving_director',    1, 'Brief receiving director',             'ETA, docs, contact',                'case_manager', 96),
  ('family_updated',        1, 'Daily update to family',                'Written + call',                    'case_manager', 24),
  ('handover_confirmed',    1, 'Confirm handover at destination',      'Signed receipt',                    'case_manager', 24),
  ('providers_paid',        1, 'Escrow release',                       'Airline, embalmer, director',       'case_manager', 168),
  ('case_closed',           1, 'Draft closure report',                 'Timeline, costs',                   'case_manager', 24),
  ('aftercare_offered',     1, 'Aftercare — day 14',                   'Grief check-in',                    'case_manager', 336),
  ('aftercare_offered',     2, 'Aftercare — day 30',                   'Estate help',                       'case_manager', 720),
  ('aftercare_offered',     3, 'Aftercare — day 90',                   'Final check-in',                    'case_manager', 2160)
) tk(stage_code, pos, title, descr, role, off) ON s.code = tk.stage_code;

-- === Skeletons for the other 6 templates (stages only, tasks can be filled in later) ===

WITH t AS (SELECT id FROM public.case_templates WHERE template_code = 'funeral_insurance')
INSERT INTO public.case_template_stages (template_id, code, position, name, sla_hours, required_consent, requires_role)
SELECT t.id, code, pos, name, sla, consent, role FROM t, (VALUES
  ('enquiry',              1, 'Enquiry received',            2,  NULL,                 NULL),
  ('marketing_lead',       2, 'Marketing lead',              24, 'marketing',          NULL),
  ('consent_to_contact',   3, 'Consent to contact',          24, 'contact',            NULL),
  ('regulated_advice',     4, 'Regulated advice',            72, 'regulated_advice',   'insurance_admin'),
  ('application',          5, 'Application submitted',       48, NULL,                 'insurance_admin'),
  ('policy_accepted',      6, 'Policy accepted',             168, NULL,                 'insurance_admin'),
  ('commission_due',       7, 'Commission due',              720, NULL,                 'insurance_admin'),
  ('commission_paid',      8, 'Commission paid',             NULL, NULL,                 'insurance_admin')
) v(code,pos,name,sla,consent,role);

WITH t AS (SELECT id FROM public.case_templates WHERE template_code = 'health_gkv')
INSERT INTO public.case_template_stages (template_id, code, position, name, sla_hours)
SELECT t.id, code, pos, name, sla FROM t, (VALUES
  ('enquiry',        1, 'Enquiry',              2),
  ('fund_selected',  2, 'Fund selected',        48),
  ('application',    3, 'Application submitted', 48),
  ('membership',     4, 'Membership confirmed', 336),
  ('handover',       5, 'Handover to fund',     24),
  ('closed',         6, 'Case closed',          24)
) v(code,pos,name,sla);

WITH t AS (SELECT id FROM public.case_templates WHERE template_code = 'health_pkv')
INSERT INTO public.case_template_stages (template_id, code, position, name, sla_hours, required_consent, requires_role)
SELECT t.id, code, pos, name, sla, consent, role FROM t, (VALUES
  ('enquiry',           1, 'Enquiry',            2,   NULL,                NULL),
  ('eligibility',       2, 'Eligibility check',  24,  NULL,                NULL),
  ('consent_advice',    3, 'Consent to advice',  24,  'regulated_advice',  NULL),
  ('advice',            4, 'Regulated advice',   72,  'regulated_advice',  'insurance_admin'),
  ('application',       5, 'Application',        48,  NULL,                'insurance_admin'),
  ('policy_accepted',   6, 'Policy accepted',    336, NULL,                'insurance_admin'),
  ('closed',            7, 'Case closed',        24,  NULL,                NULL)
) v(code,pos,name,sla,consent,role);

WITH t AS (SELECT id FROM public.case_templates WHERE template_code = 'welfare_benefits')
INSERT INTO public.case_template_stages (template_id, code, position, name, sla_hours)
SELECT t.id, code, pos, name, sla FROM t, (VALUES
  ('enquiry',         1, 'Enquiry',                 2),
  ('eligibility',     2, 'Eligibility assessed',    24),
  ('documents',       3, 'Documents gathered',      168),
  ('application',     4, 'Application submitted',   48),
  ('authority_review',5, 'Authority review',        672),
  ('decision',        6, 'Decision received',       24),
  ('appeal',          7, 'Appeal (if needed)',      336),
  ('closed',          8, 'Case closed',             24)
) v(code,pos,name,sla);

WITH t AS (SELECT id FROM public.case_templates WHERE template_code = 'immigration_referral')
INSERT INTO public.case_template_stages (template_id, code, position, name, sla_hours)
SELECT t.id, code, pos, name, sla FROM t, (VALUES
  ('enquiry',            1, 'Enquiry',                    2),
  ('assessment',         2, 'Case assessment',            24),
  ('lawyer_matched',     3, 'Lawyer matched',             48),
  ('engagement_signed',  4, 'Engagement signed',          72),
  ('application',        5, 'Application prepared',       336),
  ('authority_review',   6, 'Authority review',           1440),
  ('decision',           7, 'Decision received',          24),
  ('closed',             8, 'Case closed',                24)
) v(code,pos,name,sla);

WITH t AS (SELECT id FROM public.case_templates WHERE template_code = 'translation_docs')
INSERT INTO public.case_template_stages (template_id, code, position, name, sla_hours)
SELECT t.id, code, pos, name, sla FROM t, (VALUES
  ('enquiry',        1, 'Enquiry',              2),
  ('scope',          2, 'Scope agreed',         12),
  ('translator',     3, 'Translator assigned',  24),
  ('delivery',       4, 'Translation delivered',168),
  ('apostille',      5, 'Apostille (if needed)',168),
  ('handover',       6, 'Handover to client',   24),
  ('closed',         7, 'Case closed',          24)
) v(code,pos,name,sla);
