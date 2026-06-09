
-- Service catalog (public read)
CREATE TABLE public.service_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  min_price_pi NUMERIC(20,7) NOT NULL,
  duration_hours INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_catalog TO anon, authenticated;
GRANT ALL ON public.service_catalog TO service_role;
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view catalog" ON public.service_catalog FOR SELECT USING (active = true);

-- Service orders
CREATE TABLE public.service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_uid TEXT NOT NULL,
  pi_username TEXT,
  service_id TEXT NOT NULL REFERENCES public.service_catalog(id),
  amount_pi NUMERIC(20,7) NOT NULL,
  app_url TEXT,
  deposit_memo TEXT NOT NULL UNIQUE,
  receiver_address TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'testnet',
  status TEXT NOT NULL DEFAULT 'pending',
  txid TEXT,
  expires_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.service_orders TO anon, authenticated;
GRANT ALL ON public.service_orders TO service_role;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View orders by memo or owner" ON public.service_orders FOR SELECT USING (true);
CREATE POLICY "Anyone can create orders" ON public.service_orders FOR INSERT WITH CHECK (true);

-- Payment audit events
CREATE TABLE public.service_payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.service_payment_events TO anon, authenticated;
GRANT ALL ON public.service_payment_events TO service_role;
ALTER TABLE public.service_payment_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read events" ON public.service_payment_events FOR SELECT USING (true);

-- Seed catalog
INSERT INTO public.service_catalog (id, name, description, min_price_pi, duration_hours, category) VALUES
('test_hosting_24h', '24h Test Hosting', 'Low-friction onboarding tier. Host any app URL for 24 hours.', 0.0003, 24, 'hosting'),
('integration_review', 'Integration Review', 'One-time PiRC integration review by the sovereign team.', 0.05, 0, 'review'),
('app_integration_30d', 'App Integration Slot', 'Dedicated integration slot in the Sovereign Portal for 30 days.', 1.0, 720, 'integration'),
('sovereign_endpoint_30d', 'Sovereign Endpoint Access', 'Production endpoint access on the Sovereign Portal for 30 days.', 5.0, 720, 'endpoint'),
('premium_monitoring_30d', 'Premium Monitoring', 'Full real-time monitoring + alerting for 30 days.', 10.0, 720, 'monitoring'),
('custom', 'Custom Service', 'Pay-what-you-want. Duration scales with amount.', 0.0003, 24, 'custom');

CREATE INDEX idx_service_orders_memo ON public.service_orders(deposit_memo);
CREATE INDEX idx_service_orders_user ON public.service_orders(user_uid);
CREATE INDEX idx_service_orders_status ON public.service_orders(status);
