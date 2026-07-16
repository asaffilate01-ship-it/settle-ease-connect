
-- 1. AI document analyses (summaries + eligibility extractions)
CREATE TABLE public.ai_document_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  vault_document_id UUID REFERENCES public.vault_documents(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('summary','eligibility_extract','kb_answer')),
  input_excerpt TEXT,
  output_text TEXT,
  output_json JSONB,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_document_analyses TO authenticated;
GRANT ALL ON public.ai_document_analyses TO service_role;
ALTER TABLE public.ai_document_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or internal read" ON public.ai_document_analyses FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid() OR public.is_internal(auth.uid()));
CREATE POLICY "own or internal write" ON public.ai_document_analyses FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid() OR public.is_internal(auth.uid()));

-- 2. Community help board
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id UUID NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  city TEXT,
  language TEXT DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','hidden')),
  reply_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_posts TO authenticated;
GRANT ALL ON public.community_posts TO service_role;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read visible posts" ON public.community_posts FOR SELECT TO authenticated USING (status <> 'hidden' OR author_user_id = auth.uid() OR public.is_internal(auth.uid()));
CREATE POLICY "authors create posts" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (author_user_id = auth.uid());
CREATE POLICY "authors update own" ON public.community_posts FOR UPDATE TO authenticated USING (author_user_id = auth.uid() OR public.is_internal(auth.uid()));
CREATE POLICY "staff or author delete" ON public.community_posts FOR DELETE TO authenticated USING (author_user_id = auth.uid() OR public.is_internal(auth.uid()));

CREATE TABLE public.community_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL,
  body TEXT NOT NULL,
  is_staff BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_replies TO authenticated;
GRANT ALL ON public.community_replies TO service_role;
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read replies" ON public.community_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "authors write" ON public.community_replies FOR INSERT TO authenticated WITH CHECK (author_user_id = auth.uid());
CREATE POLICY "authors edit own" ON public.community_replies FOR UPDATE TO authenticated USING (author_user_id = auth.uid() OR public.is_internal(auth.uid()));

-- 3. Member referrals & rewards
CREATE TABLE public.member_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL,
  referred_email TEXT,
  referred_user_id UUID,
  code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','signed_up','subscribed','rewarded','expired')),
  reward_type TEXT NOT NULL DEFAULT 'month_free',
  reward_value_eur NUMERIC(10,2) DEFAULT 5,
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX member_referrals_code_uniq ON public.member_referrals(code);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_referrals TO authenticated;
GRANT ALL ON public.member_referrals TO service_role;
ALTER TABLE public.member_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own referrals read" ON public.member_referrals FOR SELECT TO authenticated USING (referrer_user_id = auth.uid() OR public.is_internal(auth.uid()));
CREATE POLICY "own referrals write" ON public.member_referrals FOR INSERT TO authenticated WITH CHECK (referrer_user_id = auth.uid());
CREATE POLICY "own referrals update" ON public.member_referrals FOR UPDATE TO authenticated USING (referrer_user_id = auth.uid() OR public.is_internal(auth.uid()));

-- 4. Session/device history (app-visible mirror; auth.sessions itself is not exposed)
CREATE TABLE public.session_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event TEXT NOT NULL CHECK (event IN ('sign_in','sign_out','token_refresh','password_change','mfa_challenge','passkey_enrolled','passkey_removed')),
  ip TEXT,
  user_agent TEXT,
  device_label TEXT,
  location_hint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.session_activity TO authenticated;
GRANT ALL ON public.session_activity TO service_role;
ALTER TABLE public.session_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sessions read" ON public.session_activity FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_internal(auth.uid()));
CREATE POLICY "own sessions write" ON public.session_activity FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 5. Insurance triage partner API pushes
CREATE TABLE public.partner_api_pushes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.insurance_leads(id) ON DELETE CASCADE,
  partner_code TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_payload JSONB,
  response_status INT,
  response_body JSONB,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed','acknowledged')),
  sent_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE ON public.partner_api_pushes TO authenticated;
GRANT ALL ON public.partner_api_pushes TO service_role;
ALTER TABLE public.partner_api_pushes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "internal only read" ON public.partner_api_pushes FOR SELECT TO authenticated USING (public.is_internal(auth.uid()));
CREATE POLICY "internal only write" ON public.partner_api_pushes FOR INSERT TO authenticated WITH CHECK (public.is_internal(auth.uid()));
CREATE POLICY "internal only update" ON public.partner_api_pushes FOR UPDATE TO authenticated USING (public.is_internal(auth.uid()));

-- 6. Regulated copy audit
CREATE TABLE public.regulated_copy_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surface TEXT NOT NULL,
  route_path TEXT NOT NULL,
  domain TEXT NOT NULL CHECK (domain IN ('insurance','funeral','tax','legal','medical','immigration','benefits')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','needs_revision','blocked')),
  findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  reviewer_user_id UUID,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.regulated_copy_audit TO authenticated;
GRANT ALL ON public.regulated_copy_audit TO service_role;
ALTER TABLE public.regulated_copy_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "internal read audit" ON public.regulated_copy_audit FOR SELECT TO authenticated USING (public.is_internal(auth.uid()));
CREATE POLICY "internal write audit" ON public.regulated_copy_audit FOR ALL TO authenticated USING (public.is_internal(auth.uid())) WITH CHECK (public.is_internal(auth.uid()));

-- Seed initial regulated surfaces so the audit page has something to review
INSERT INTO public.regulated_copy_audit (surface, route_path, domain) VALUES
  ('Insurance triage','/portal/insurance-triage','insurance'),
  ('DELA referral flow','/portal/dela','insurance'),
  ('Bereavement cover landing','/bereavement-cover','funeral'),
  ('Group cover intake','/group-cover','funeral'),
  ('Funeral cover plans','/insurance','funeral'),
  ('Tax lead intake','/tax','tax'),
  ('Complaints procedure','/legal/complaints','legal'),
  ('Insurance landing page','/insurance','insurance');

-- Triggers to keep updated_at fresh
CREATE TRIGGER trg_community_posts_updated BEFORE UPDATE ON public.community_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_member_referrals_updated BEFORE UPDATE ON public.member_referrals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_regulated_copy_audit_updated BEFORE UPDATE ON public.regulated_copy_audit FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Increment reply_count on community_posts
CREATE OR REPLACE FUNCTION public.bump_post_reply_count() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.community_posts SET reply_count = reply_count + 1, updated_at = now() WHERE id = NEW.post_id;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_bump_reply_count AFTER INSERT ON public.community_replies FOR EACH ROW EXECUTE FUNCTION public.bump_post_reply_count();
