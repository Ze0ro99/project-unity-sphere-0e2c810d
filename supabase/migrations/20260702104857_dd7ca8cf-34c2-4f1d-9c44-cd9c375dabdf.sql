-- 1. Pin search_path on both public functions to prevent search-path hijacking.
ALTER FUNCTION public.calculate_timeframe_bucket(timestamp with time zone, chart_timeframe)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.process_transaction_candle_update()
  SET search_path = public, pg_temp;

-- 2. blockchain_transactions_raw: remove public (anon) read; restrict to authenticated users.
DROP POLICY IF EXISTS "Allow Public Tx Read" ON public.blockchain_transactions_raw;
REVOKE SELECT ON public.blockchain_transactions_raw FROM anon;
GRANT SELECT ON public.blockchain_transactions_raw TO authenticated;
CREATE POLICY "Authenticated users can read blockchain transactions"
  ON public.blockchain_transactions_raw
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. service_orders: add owner-scoped INSERT and UPDATE policies so a signed-in
--    user cannot create or mutate rows belonging to another user_uid.
GRANT INSERT, UPDATE ON public.service_orders TO authenticated;

CREATE POLICY "Users can create own orders"
  ON public.service_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (user_uid = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own orders"
  ON public.service_orders
  FOR UPDATE
  TO authenticated
  USING (user_uid = (auth.jwt() ->> 'sub'))
  WITH CHECK (user_uid = (auth.jwt() ->> 'sub'));

-- 4. pirc_webhook_events / raw_contract_factory / raw_ledger: RLS is already on
--    with no SELECT policy => no rows are readable. Make service-role access
--    explicit and revoke everything from anon/authenticated so any accidental
--    future GRANT still can't leak data without a matching policy.
REVOKE ALL ON public.pirc_webhook_events   FROM anon, authenticated;
REVOKE ALL ON public.raw_contract_factory  FROM anon, authenticated;
REVOKE ALL ON public.raw_ledger            FROM anon, authenticated;

GRANT ALL ON public.pirc_webhook_events   TO service_role;
GRANT ALL ON public.raw_contract_factory  TO service_role;
GRANT ALL ON public.raw_ledger            TO service_role;

COMMENT ON TABLE public.pirc_webhook_events IS
  'GitHub webhook payloads. Service-role only. Do NOT add SELECT policies for anon/authenticated.';
COMMENT ON TABLE public.raw_contract_factory IS
  'Contract factory records including kyber_encryption_seal. Service-role only.';
COMMENT ON TABLE public.raw_ledger IS
  'Wallet balances and quantum public keys. Service-role only. Realtime subscribers receive no rows because no SELECT policy exists.';