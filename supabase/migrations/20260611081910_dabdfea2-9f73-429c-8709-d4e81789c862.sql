DROP POLICY IF EXISTS "Anyone can read webhook events" ON public.pirc_webhook_events;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.pirc_webhook_events FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.pirc_webhook_events FROM authenticated;
GRANT ALL ON public.pirc_webhook_events TO service_role;