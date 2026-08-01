
REVOKE EXECUTE ON FUNCTION public.generate_monthly_agent_commissions(date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_monthly_agent_commissions(date) TO service_role;
