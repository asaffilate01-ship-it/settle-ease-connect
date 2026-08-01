
REVOKE EXECUTE ON FUNCTION public.vault_deputy_can_read(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.vault_deputy_can_read(UUID, UUID, TEXT) TO service_role;
