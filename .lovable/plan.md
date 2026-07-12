# Beistand backend rollout — staged plan

Lovable Cloud is now enabled. Delivering everything in one turn would rush the schema and destabilize the app. Instead, four ordered stages. Each stage is self-contained: the app stays fully usable after every stage.

## Stage 1 — Auth foundation (this turn)

- Public `/auth` route: email + password sign-in / sign-up, plus Google (managed OAuth).
- Move all `/app/*` and `/portal/*` routes under `src/routes/_authenticated/`. Public marketing routes stay top-level.
- `profiles` table (id → `auth.users`, full_name, preferred_language, city, avatar_url) with auto-insert trigger on signup.
- `app_role` enum (`family`, `case_manager`, `funeral_director`, `mosque`, `church`, `temple`, `hospital`, `admin`) + `user_roles` table + `has_role()` security-definer function. Default role on signup: `family`.
- Header avatar reflects real session; sign-out clears cache and returns to `/auth`.
- Role switcher in Settings writes to `user_roles` (dev convenience; admin-only in Stage 4).

## Stage 2 — Persistent case & document data

- Tables: `cases`, `case_tasks`, `case_stakeholders`, `case_timeline_events`, `documents`, `document_shares`, `benefits_assessments`, `checklist_progress`. All scoped by `user_id` / owning family with RLS.
- Storage bucket `documents` (private) + signed-URL fetching.
- Replace mock data in `app.cases.*`, `app.documents`, `app.benefits`, `app.checklists` with real queries via `createServerFn` + `requireSupabaseAuth`.
- Cache with TanStack Query; loaders under `_authenticated/` prefetch.

## Stage 3 — AI Assistant wired to Lovable AI Gateway

- Server route `src/routes/api/chat.ts` streaming through `openai/gpt-5.5` (default) with a Beistand system prompt: bilingual (EN/DE/UR), German bureaucracy expert, cites laws (SGB II, AufenthG, etc.), refuses legal-binding advice.
- `useChat` client on `/app/assistant` with markdown rendering, thread persistence in `chat_threads` + `chat_messages` tables.
- Language selector; tool calls for "check benefit eligibility" and "find nearby provider" (calls existing server fns).

## Stage 4 — Remaining portals

- `_authenticated/portal.case-manager` (queue of assigned family cases, escalation, notes).
- `_authenticated/portal.mosque` / `.church` / `.temple` (ritual availability, funeral referrals inbox, donation ledger).
- `_authenticated/portal.hospital` (deceased intake form, family contact handoff, morgue capacity).
- `_authenticated/portal.admin` (user list, role grants via `has_role('admin')` gate, provider verification queue, platform metrics).
- Route gates: each portal's `beforeLoad` calls `has_role(role)`; unauthorized → `/app`.

## Technical notes

- All new tables get explicit `GRANT` + RLS + policies in the same migration; roles never live on `profiles`.
- Server fns live in `src/lib/*.functions.ts`; admin client only inside `.handler()` bodies via `await import`.
- No mock-data deletion until the corresponding table is live — feature parity per stage.
- Design system and existing UI untouched; only wiring changes.

I'll execute Stage 1 immediately after you approve this plan, then continue through Stage 4 in follow-up turns so each stage can be reviewed.
