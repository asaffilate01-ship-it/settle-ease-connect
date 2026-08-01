-- Fix privilege escalation findings from security scan:
-- 1. agents: drop the unrestricted self-update policy so only the safe self-update and admin policies remain.
-- 2. member_referrals: restrict self-updates to non-financial/non-status fields; staff keep full update access.

-- AGENTS
DROP POLICY IF EXISTS "Agents update own profile" ON public.agents;

-- MEMBER REFERRALS
DROP POLICY IF EXISTS "own referrals update" ON public.member_referrals;

-- Staff/internal can update any referral field.
CREATE POLICY "internal referrals update"
  ON public.member_referrals
  FOR UPDATE
  TO authenticated
  USING (is_internal(auth.uid()))
  WITH CHECK (is_internal(auth.uid()));

-- Referrers can only update safe fields. The WITH CHECK ensures financial/status
-- columns stay identical to the existing row, preventing self-approving rewards.
CREATE POLICY "own referrals update safe"
  ON public.member_referrals
  FOR UPDATE
  TO authenticated
  USING (referrer_user_id = auth.uid())
  WITH CHECK (
    referrer_user_id = auth.uid()
    AND status = (SELECT status FROM public.member_referrals m WHERE m.id = member_referrals.id)
    AND reward_type = (SELECT reward_type FROM public.member_referrals m WHERE m.id = member_referrals.id)
    AND reward_value_eur = (SELECT reward_value_eur FROM public.member_referrals m WHERE m.id = member_referrals.id)
    AND rewarded_at IS NOT DISTINCT FROM (SELECT rewarded_at FROM public.member_referrals m WHERE m.id = member_referrals.id)
  );
