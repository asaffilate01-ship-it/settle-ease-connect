-- Fix privilege escalation findings from security scan:
-- 1. agents: drop the unrestricted self-update policy so only the safe self-update and admin policies remain.
-- 2. member_referrals: add a BEFORE UPDATE trigger that locks financial/status fields for non-internal users.

-- AGENTS
DROP POLICY IF EXISTS "Agents update own profile" ON public.agents;

-- MEMBER REFERRALS
DROP POLICY IF EXISTS "own referrals update" ON public.member_referrals;

-- Internal users can update any referral field.
CREATE POLICY "internal referrals update"
  ON public.member_referrals
  FOR UPDATE
  TO authenticated
  USING (is_internal(auth.uid()))
  WITH CHECK (is_internal(auth.uid()));

-- Referrers can still update their own referral row, but the trigger below
-- prevents them from changing financial/status columns.
CREATE POLICY "own referrals update safe"
  ON public.member_referrals
  FOR UPDATE
  TO authenticated
  USING (referrer_user_id = auth.uid())
  WITH CHECK (referrer_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.member_referrals_self_update_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Internal users can change anything.
  IF public.is_internal(auth.uid()) THEN
    RETURN NEW;
  END IF;

  -- The referrer is allowed to update, but not the locked columns.
  IF NEW.referrer_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Only the referrer or staff can update a referral';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Referrers cannot change referral status';
  END IF;
  IF NEW.reward_type IS DISTINCT FROM OLD.reward_type THEN
    RAISE EXCEPTION 'Referrers cannot change reward type';
  END IF;
  IF NEW.reward_value_eur IS DISTINCT FROM OLD.reward_value_eur THEN
    RAISE EXCEPTION 'Referrers cannot change reward value';
  END IF;
  IF NEW.rewarded_at IS DISTINCT FROM OLD.rewarded_at THEN
    RAISE EXCEPTION 'Referrers cannot mark a referral as rewarded';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_member_referrals_self_update_guard ON public.member_referrals;
CREATE TRIGGER trg_member_referrals_self_update_guard
  BEFORE UPDATE ON public.member_referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.member_referrals_self_update_guard();
