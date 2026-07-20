DROP POLICY IF EXISTS "Anyone can read snapshots" ON public.pirc_snapshots;
CREATE POLICY "Authenticated users can read snapshots" ON public.pirc_snapshots FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.pirc_snapshots FROM anon;