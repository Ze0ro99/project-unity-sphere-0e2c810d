-- OUSD Testnet 1 observability only.
-- No minting, redemption, price peg, or reserve claim is created by this migration.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

CREATE TABLE IF NOT EXISTS private.ousd_contract_registry (
  network_id text PRIMARY KEY CHECK (network_id = 'pi-testnet'),
  status text NOT NULL DEFAULT 'source_only_not_deployed'
    CHECK (status IN ('source_only_not_deployed','deployed_unverified','active_testnet','paused','reconciliation_required')),
  controller_contract_id text,
  token_contract_id text,
  controller_code_hash text,
  token_code_hash text,
  protocol_version integer,
  deployed_ledger bigint,
  deployment_tx_hash text,
  latest_readback_ledger bigint,
  token_supply_atomic numeric(38,0),
  last_readback_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (controller_contract_id IS NULL OR controller_contract_id ~ '^C[A-Z2-7]{55}$'),
  CHECK (token_contract_id IS NULL OR token_contract_id ~ '^C[A-Z2-7]{55}$'),
  CHECK (controller_code_hash IS NULL OR controller_code_hash ~ '^[0-9a-fA-F]{64}$'),
  CHECK (token_code_hash IS NULL OR token_code_hash ~ '^[0-9a-fA-F]{64}$'),
  CHECK (deployment_tx_hash IS NULL OR deployment_tx_hash ~ '^[0-9a-fA-F]{64}$'),
  CHECK (deployed_ledger IS NULL OR deployed_ledger > 0),
  CHECK (latest_readback_ledger IS NULL OR latest_readback_ledger > 0),
  CHECK (token_supply_atomic IS NULL OR token_supply_atomic >= 0)
);

CREATE TABLE IF NOT EXISTS private.ousd_reserve_attestations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id text NOT NULL REFERENCES private.ousd_contract_registry(network_id) ON DELETE RESTRICT,
  controller_contract_id text NOT NULL,
  reserve_id numeric(20,0) NOT NULL CHECK (reserve_id >= 0),
  verifier_address text NOT NULL CHECK (verifier_address ~ '^G[A-Z2-7]{55}$'),
  amount_usd_micros numeric(38,0) NOT NULL CHECK (amount_usd_micros > 0),
  evidence_hash text NOT NULL CHECK (evidence_hash ~ '^[0-9a-fA-F]{64}$'),
  source_kind text NOT NULL DEFAULT 'manual_testnet_fixture'
    CHECK (source_kind IN ('bank_statement_hash','payment_provider_hash','onchain_asset','manual_testnet_fixture','other')),
  source_reference_hash text CHECK (source_reference_hash IS NULL OR source_reference_hash ~ '^[0-9a-fA-F]{64}$'),
  ledger_sequence bigint,
  transaction_hash text CHECK (transaction_hash IS NULL OR transaction_hash ~ '^[0-9a-fA-F]{64}$'),
  verification_status text NOT NULL DEFAULT 'observed'
    CHECK (verification_status IN ('observed','verified','rejected','reconciliation_required')),
  verified_at timestamptz,
  observed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (network_id, controller_contract_id, reserve_id)
);

CREATE TABLE IF NOT EXISTS private.ousd_liabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id text NOT NULL REFERENCES private.ousd_contract_registry(network_id) ON DELETE RESTRICT,
  controller_contract_id text NOT NULL,
  liability_id numeric(20,0) NOT NULL CHECK (liability_id >= 0),
  reserve_id numeric(20,0) NOT NULL CHECK (reserve_id >= 0),
  beneficiary_address text NOT NULL CHECK (beneficiary_address ~ '^G[A-Z2-7]{55}$'),
  amount_usd_micros numeric(38,0) NOT NULL CHECK (amount_usd_micros > 0),
  token_amount_atomic numeric(38,0) NOT NULL CHECK (token_amount_atomic > 0),
  state text NOT NULL CHECK (state IN ('issued','redemption_pending','paid','cancelled')),
  tokens_escrowed boolean NOT NULL DEFAULT false,
  tokens_burned boolean NOT NULL DEFAULT false,
  created_ledger bigint,
  updated_ledger bigint,
  source_event_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (network_id, controller_contract_id, liability_id),
  CHECK (NOT tokens_burned OR (tokens_escrowed AND state = 'paid')),
  CHECK (state <> 'paid' OR tokens_burned)
);

CREATE TABLE IF NOT EXISTS private.ousd_payout_attestations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id text NOT NULL,
  controller_contract_id text NOT NULL,
  liability_id numeric(20,0) NOT NULL,
  verifier_address text NOT NULL CHECK (verifier_address ~ '^G[A-Z2-7]{55}$'),
  amount_usd_micros numeric(38,0) NOT NULL CHECK (amount_usd_micros > 0),
  evidence_hash text NOT NULL CHECK (evidence_hash ~ '^[0-9a-fA-F]{64}$'),
  transaction_hash text CHECK (transaction_hash IS NULL OR transaction_hash ~ '^[0-9a-fA-F]{64}$'),
  ledger_sequence bigint,
  verification_status text NOT NULL DEFAULT 'observed'
    CHECK (verification_status IN ('observed','verified','rejected','reconciliation_required')),
  observed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (network_id, controller_contract_id, liability_id)
    REFERENCES private.ousd_liabilities(network_id, controller_contract_id, liability_id)
    ON DELETE RESTRICT,
  UNIQUE (network_id, controller_contract_id, evidence_hash)
);

CREATE TABLE IF NOT EXISTS private.ousd_oracle_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id text NOT NULL REFERENCES private.ousd_contract_registry(network_id) ON DELETE RESTRICT,
  base_asset_id text NOT NULL,
  quote_asset_id text NOT NULL,
  price_numerator numeric(38,0) NOT NULL CHECK (price_numerator > 0),
  price_denominator numeric(38,0) NOT NULL CHECK (price_denominator > 0),
  source_id text NOT NULL,
  confidence_bps integer NOT NULL CHECK (confidence_bps BETWEEN 0 AND 10000),
  evidence_hash text CHECK (evidence_hash IS NULL OR evidence_hash ~ '^[0-9a-fA-F]{64}$'),
  verification_status text NOT NULL DEFAULT 'observed'
    CHECK (verification_status IN ('observed','verified','rejected','expired')),
  observed_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > observed_at)
);

CREATE TABLE IF NOT EXISTS private.ousd_pool_snapshots (
  network_id text NOT NULL REFERENCES private.ousd_contract_registry(network_id) ON DELETE RESTRICT,
  pool_id text NOT NULL CHECK (pool_id ~ '^[0-9a-fA-F]{64}$'),
  asset_a_id text NOT NULL,
  reserve_a_atomic numeric(38,0) NOT NULL CHECK (reserve_a_atomic >= 0),
  asset_b_id text NOT NULL,
  reserve_b_atomic numeric(38,0) NOT NULL CHECK (reserve_b_atomic >= 0),
  total_shares numeric(38,0) NOT NULL CHECK (total_shares >= 0),
  fee_bp integer NOT NULL CHECK (fee_bp BETWEEN 0 AND 10000),
  ledger_sequence bigint NOT NULL CHECK (ledger_sequence > 0),
  observed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (network_id, pool_id, ledger_sequence)
);

CREATE INDEX IF NOT EXISTS ousd_reserve_status_idx
  ON private.ousd_reserve_attestations(network_id, verification_status, observed_at DESC);
CREATE INDEX IF NOT EXISTS ousd_liability_state_idx
  ON private.ousd_liabilities(network_id, state, updated_at DESC);
CREATE INDEX IF NOT EXISTS ousd_payout_liability_idx
  ON private.ousd_payout_attestations(network_id, controller_contract_id, liability_id);
CREATE INDEX IF NOT EXISTS ousd_oracle_pair_idx
  ON private.ousd_oracle_observations(network_id, base_asset_id, quote_asset_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS ousd_pool_observed_idx
  ON private.ousd_pool_snapshots(network_id, observed_at DESC);

ALTER TABLE private.ousd_contract_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.ousd_reserve_attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.ousd_liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.ousd_payout_attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.ousd_oracle_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.ousd_pool_snapshots ENABLE ROW LEVEL SECURITY;

ALTER TABLE private.ousd_contract_registry FORCE ROW LEVEL SECURITY;
ALTER TABLE private.ousd_reserve_attestations FORCE ROW LEVEL SECURITY;
ALTER TABLE private.ousd_liabilities FORCE ROW LEVEL SECURITY;
ALTER TABLE private.ousd_payout_attestations FORCE ROW LEVEL SECURITY;
ALTER TABLE private.ousd_oracle_observations FORCE ROW LEVEL SECURITY;
ALTER TABLE private.ousd_pool_snapshots FORCE ROW LEVEL SECURITY;

CREATE POLICY ousd_registry_service_role_only ON private.ousd_contract_registry
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY ousd_reserves_service_role_only ON private.ousd_reserve_attestations
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY ousd_liabilities_service_role_only ON private.ousd_liabilities
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY ousd_payouts_service_role_only ON private.ousd_payout_attestations
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY ousd_oracle_service_role_only ON private.ousd_oracle_observations
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY ousd_pools_service_role_only ON private.ousd_pool_snapshots
  FOR ALL TO service_role USING (true) WITH CHECK (true);

REVOKE ALL ON TABLE
  private.ousd_contract_registry,
  private.ousd_reserve_attestations,
  private.ousd_liabilities,
  private.ousd_payout_attestations,
  private.ousd_oracle_observations,
  private.ousd_pool_snapshots
FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  private.ousd_contract_registry,
  private.ousd_reserve_attestations,
  private.ousd_liabilities,
  private.ousd_payout_attestations,
  private.ousd_oracle_observations,
  private.ousd_pool_snapshots
TO service_role;

INSERT INTO private.ousd_contract_registry (network_id, status)
VALUES ('pi-testnet', 'source_only_not_deployed')
ON CONFLICT (network_id) DO NOTHING;

CREATE OR REPLACE VIEW public.ousd_public_status AS
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
)
SELECT
  r.network_id,
  r.status,
  r.controller_contract_id,
  r.token_contract_id,
  r.controller_code_hash,
  r.token_code_hash,
  r.protocol_version,
  r.deployed_ledger,
  r.latest_readback_ledger,
  r.token_supply_atomic,
  COALESCE(rt.attestor_verified_reserve_usd_micros, 0)::text AS attestor_verified_reserve_usd_micros,
  COALESCE(lt.outstanding_usd_micros, 0)::text AS outstanding_usd_micros,
  COALESCE(lt.redemption_pending_usd_micros, 0)::text AS redemption_pending_usd_micros,
  COALESCE(lt.paid_and_burned_usd_micros, 0)::text AS paid_and_burned_usd_micros,
  rt.latest_verified_reserve_ledger,
  CASE
    WHEN COALESCE(lt.outstanding_usd_micros, 0) > 0
      THEN (COALESCE(rt.attestor_verified_reserve_usd_micros, 0) / lt.outstanding_usd_micros)::text
    ELSE NULL
  END AS coverage_ratio,
  CASE
    WHEN r.status <> 'active_testnet' THEN 'NOT_DEPLOYED_OR_UNVERIFIED'
    WHEN COALESCE(rt.attestor_verified_reserve_usd_micros, 0) = 0 THEN 'NO_VERIFIED_RESERVES'
    WHEN COALESCE(lt.outstanding_usd_micros, 0) = 0 THEN 'NO_OUTSTANDING_LIABILITIES'
    ELSE 'TESTNET_OBSERVED_NOT_A_REDEMPTION_GUARANTEE'
  END AS operational_state,
  r.last_readback_at,
  r.updated_at
FROM private.ousd_contract_registry r
LEFT JOIN reserve_totals rt
  ON rt.network_id = r.network_id
 AND rt.controller_contract_id = r.controller_contract_id
LEFT JOIN liability_totals lt
  ON lt.network_id = r.network_id
 AND lt.controller_contract_id = r.controller_contract_id;

REVOKE ALL ON public.ousd_public_status FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.ousd_public_status TO service_role;

COMMENT ON TABLE private.ousd_contract_registry IS
  'Pi Testnet OUSD source/deployment registry. Source-only until contract IDs and readback are independently verified.';
COMMENT ON TABLE private.ousd_reserve_attestations IS
  'Private reserve attestation metadata. Stores hashes and integer USD micros, never raw bank documents.';
COMMENT ON TABLE private.ousd_liabilities IS
  'Private OUSD testnet liability index. Mirrors contract state; never a source of truth over Soroban readback.';
COMMENT ON TABLE private.ousd_payout_attestations IS
  'Private payout attestation metadata; evidence hashes are references, not proof of external settlement.';
COMMENT ON TABLE private.ousd_oracle_observations IS
  'Private rational-price observations; no floating-point values and no automatic peg authority.';
COMMENT ON TABLE private.ousd_pool_snapshots IS
  'Private read-only Horizon liquidity-pool snapshots with integer atomic reserves.';
COMMENT ON VIEW public.ousd_public_status IS
  'Aggregate-only status for the OUSD Testnet dashboard. Not proof of USD backing or a redemption guarantee.';
