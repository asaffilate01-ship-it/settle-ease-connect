
REVOKE ALL ON FUNCTION public.is_channel_member(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_channel_member(UUID, UUID) FROM anon;
-- Keep it callable by RLS (postgres) and internal service_role only.
GRANT EXECUTE ON FUNCTION public.is_channel_member(UUID, UUID) TO service_role;
