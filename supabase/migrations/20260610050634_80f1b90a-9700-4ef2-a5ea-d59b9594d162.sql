DROP POLICY IF EXISTS "View orders by memo or owner" ON public.service_orders;
CREATE POLICY "Users can view own orders" ON public.service_orders FOR SELECT TO authenticated USING (user_uid = (auth.jwt() ->> 'sub'));
REVOKE SELECT ON public.service_orders FROM anon;
GRANT SELECT ON public.service_orders TO authenticated;
GRANT ALL ON public.service_orders TO service_role;

DROP POLICY IF EXISTS "Read events" ON public.service_payment_events;
CREATE POLICY "Users can view events for own orders" ON public.service_payment_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.service_orders o WHERE o.id = service_payment_events.order_id AND o.user_uid = (auth.jwt() ->> 'sub')));
REVOKE SELECT ON public.service_payment_events FROM anon;
GRANT SELECT ON public.service_payment_events TO authenticated;
GRANT ALL ON public.service_payment_events TO service_role;