DROP POLICY IF EXISTS "Authenticated users can read snapshots" ON public.pirc_snapshots;
DROP POLICY IF EXISTS "Authenticated users can read blockchain transactions" ON public.blockchain_transactions_raw;
REVOKE SELECT ON public.pirc_snapshots FROM authenticated, anon;
REVOKE SELECT ON public.blockchain_transactions_raw FROM authenticated, anon;
GRANT ALL ON public.pirc_snapshots TO service_role;
GRANT ALL ON public.blockchain_transactions_raw TO service_role;