CREATE TABLE public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  message text not null,
  language text not null default 'en',
  page text,
  status text not null default 'new',
  handled_by uuid references auth.users(id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now()
);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can send a contact message" ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "staff read contact messages" ON public.contact_messages FOR SELECT TO authenticated USING (public.is_internal(auth.uid()));
CREATE POLICY "staff update contact messages" ON public.contact_messages FOR UPDATE TO authenticated USING (public.is_internal(auth.uid())) WITH CHECK (public.is_internal(auth.uid()));

CREATE TABLE public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('export','deletion')),
  reason text,
  status text not null default 'pending' check (status in ('pending','in_progress','completed','rejected','cancelled')),
  processed_by uuid references auth.users(id) on delete set null,
  processed_at timestamptz,
  staff_notes text,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT ON public.privacy_requests TO authenticated;
GRANT UPDATE ON public.privacy_requests TO authenticated;
GRANT ALL ON public.privacy_requests TO service_role;
ALTER TABLE public.privacy_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members create own privacy requests" ON public.privacy_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "members read own privacy requests" ON public.privacy_requests FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_internal(auth.uid()));
CREATE POLICY "staff update privacy requests" ON public.privacy_requests FOR UPDATE TO authenticated USING (public.is_internal(auth.uid())) WITH CHECK (public.is_internal(auth.uid()));
CREATE INDEX idx_privacy_requests_user ON public.privacy_requests(user_id, created_at DESC);