-- Durable, service-role-only inbox and cursor for Pi Testnet Soroban contract events.
-- Raw events are evidence records; they are not settlement-state proof.
CREATE TABLE IF NOT EXISTS public.pirc_soroban_event_cursors (
 network_id text NOT NULL, contract_id text NOT NULL,
 start_ledger bigint NOT NULL CHECK (start_ledger > 0),
 paging_cursor text, latest_ledger bigint, last_event_id text,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (network_id, contract_id)
);
CREATE TABLE IF NOT EXISTS public.pirc_soroban_event_inbox (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 network_id text NOT NULL, contract_id text NOT NULL, event_id text NOT NULL,
 paging_token text, ledger_sequence bigint NOT NULL CHECK (ledger_sequence > 0),
 transaction_hash text, event_type text NOT NULL, topics text[] NOT NULL DEFAULT '{}',
 raw_event jsonb NOT NULL,
 ingest_status text NOT NULL DEFAULT 'observed'
   CHECK (ingest_status IN ('observed','decoded','quarantined','reconciliation_required')),
 observed_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (network_id, contract_id, event_id)
);
CREATE INDEX IF NOT EXISTS pirc_soroban_event_inbox_period_scan
 ON public.pirc_soroban_event_inbox (network_id, contract_id, ledger_sequence, event_id);
ALTER TABLE public.pirc_soroban_event_cursors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pirc_soroban_event_inbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pirc_soroban_event_cursors FROM anon, authenticated;
REVOKE ALL ON public.pirc_soroban_event_inbox FROM anon, authenticated;
GRANT ALL ON public.pirc_soroban_event_cursors TO service_role;
GRANT ALL ON public.pirc_soroban_event_inbox TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.pirc_soroban_event_inbox_id_seq TO service_role;
COMMENT ON TABLE public.pirc_soroban_event_cursors IS 'Durable Soroban RPC getEvents cursor. Service-role only; one active poller per network/contract is required.';
COMMENT ON TABLE public.pirc_soroban_event_inbox IS 'Idempotent raw Soroban event inbox. Observed events are not proof of finalized settlement; contract read-back is required.';
