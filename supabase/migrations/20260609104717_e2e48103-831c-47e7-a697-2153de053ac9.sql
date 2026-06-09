
DROP POLICY IF EXISTS "Anyone can create orders" ON public.service_orders;
REVOKE INSERT, UPDATE ON public.service_orders FROM anon, authenticated;
REVOKE INSERT ON public.service_payment_events FROM anon, authenticated;
