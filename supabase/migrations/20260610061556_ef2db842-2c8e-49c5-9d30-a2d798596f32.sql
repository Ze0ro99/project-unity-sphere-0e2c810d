
CREATE TABLE public.pirc_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path text NOT NULL UNIQUE,
  commit_sha text,
  content jsonb,
  raw_text text,
  bytes integer NOT NULL DEFAULT 0,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pirc_snapshots TO anon, authenticated;
GRANT ALL ON public.pirc_snapshots TO service_role;

ALTER TABLE public.pirc_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read snapshots"
  ON public.pirc_snapshots FOR SELECT
  USING (true);

CREATE TABLE public.pirc_webhook_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event text NOT NULL,
  delivery text,
  ref text,
  head_sha text,
  pusher text,
  payload jsonb,
  received_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pirc_webhook_events TO anon, authenticated;
GRANT ALL ON public.pirc_webhook_events TO service_role;

ALTER TABLE public.pirc_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read webhook events"
  ON public.pirc_webhook_events FOR SELECT
  USING (true);
