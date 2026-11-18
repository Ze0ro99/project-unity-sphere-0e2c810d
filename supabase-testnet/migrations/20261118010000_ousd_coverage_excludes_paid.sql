-- Correct OUSD coverage accounting: paid-and-burned liabilities consume reserve.
CREATE OR REPLACE VIEW public.ousd_public_status WITH (security_invoker = true) AS
WITH reserve_totals AS (
  SELECT
    network_id,
    controller_contract_id,
    COALESCE(SUM(amount_usd_micros) FILTER (WHERE verification_status = 'verified'), 0)::numeric(38,0)
      AS attestor_verified_reserve_usd_micros,
    MAX(ledger_sequence) FILTER (WHERE verification_status = 'verified') AS latest_verified_reserve_ledger
  FROM private.ousd_reserve_attestations
  GROUP BY network_id, controller_contract_id
),
liability_totals AS (
  SELECT
    network_id,
    controller_contract_id,
    COALESCE(SUM(amount_usd_micros) FILTER (WHERE state IN ('issued','redemption_pending')), 0)::numeric(38,0)
      AS outstanding_usd_micros,
    COALESCE(SUM(amount_usd_micros) FILTER (WHERE state = 'redemption_pending'), 0)::numeric(38,0)
      AS redemption_pending_usd_micros,
    COALESCE(SUM(amount_usd_micros) FILTER (WHERE state = 'paid' AND tokens_burned), 0)::numeric(38,0)
      AS paid_and_burned_usd_micros
  FROM private.ousd_liabilities
  GROUP BY network_id, controller_contract_id
),
accounting AS (
  SELECT
    r.*,
    COALESCE(rt.attestor_verified_reserve_usd_micros, 0)::numeric(38,0) AS gross_verified_reserve,
    COALESCE(lt.outstanding_usd_micros, 0)::numeric(38,0) AS outstanding,
    COALESCE(lt.redemption_pending_usd_micros, 0)::numeric(38,0) AS redemption_pending,
    COALESCE(lt.paid_and_burned_usd_micros, 0)::numeric(38,0) AS paid_and_burned,
    GREATEST(
      COALESCE(rt.attestor_verified_reserve_usd_micros, 0)
        - COALESCE(lt.paid_and_burned_usd_micros, 0),
      0
    )::numeric(38,0) AS backing_reserve,
    rt.latest_verified_reserve_ledger
  FROM private.ousd_contract_registry r
  LEFT JOIN reserve_totals rt
    ON rt.network_id = r.network_id
   AND rt.controller_contract_id = r.controller_contract_id
  LEFT JOIN liability_totals lt
    ON lt.network_id = r.network_id
   AND lt.controller_contract_id = r.controller_contract_id
)
SELECT
  network_id,
  status,
  controller_contract_id,
  token_contract_id,
  controller_code_hash,
  token_code_hash,
  protocol_version,
  deployed_ledger,
  latest_readback_ledger,
  token_supply_atomic,
  gross_verified_reserve::text AS attestor_verified_reserve_usd_micros,
  outstanding::text AS outstanding_usd_micros,
  redemption_pending::text AS redemption_pending_usd_micros,
  paid_and_burned::text AS paid_and_burned_usd_micros,
  latest_verified_reserve_ledger,
  CASE
    WHEN outstanding > 0 THEN (backing_reserve / outstanding)::text
    ELSE NULL
  END AS coverage_ratio,
  CASE
    WHEN status <> 'active_testnet' THEN 'NOT_DEPLOYED_OR_UNVERIFIED'
    WHEN paid_and_burned > gross_verified_reserve THEN 'RECONCILIATION_REQUIRED'
    WHEN gross_verified_reserve = 0 THEN 'NO_VERIFIED_RESERVES'
    WHEN outstanding > 0 AND backing_reserve < outstanding THEN 'UNDERCOLLATERALIZED_TESTNET'
    WHEN outstanding = 0 THEN 'NO_OUTSTANDING_LIABILITIES'
    ELSE 'TESTNET_OBSERVED_NOT_A_REDEMPTION_GUARANTEE'
  END AS operational_state,
  last_readback_at,
  updated_at,
  backing_reserve::text AS backing_reserve_usd_micros
FROM accounting;

REVOKE ALL ON public.ousd_public_status FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.ousd_public_status TO service_role;

COMMENT ON VIEW public.ousd_public_status IS
  'Aggregate-only OUSD Testnet status. Coverage = (verified gross reserve - paid-and-burned liabilities) / outstanding liabilities. Not proof of USD backing or redemption guarantee.';
