import { createServerFn } from "@tanstack/react-start";
import { importAllPirc } from "./pirc-import.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Manually trigger a full import of the PiRC repository snapshots.
// Safe to call anytime — it overwrites by `path`.
export const syncPircRepo = createServerFn({ method: "POST" }).handler(async () => {
  const imported = await importAllPirc();
  return { ok: true, at: new Date().toISOString(), imported };
});

export const getPircSnapshotStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { data: snaps } = await supabaseAdmin
    .from("pirc_snapshots")
    .select("path,commit_sha,bytes,fetched_at")
    .order("fetched_at", { ascending: false });
  const { data: events } = await supabaseAdmin
    .from("pirc_webhook_events")
    .select("event,delivery,ref,head_sha,pusher,received_at")
    .order("received_at", { ascending: false })
    .limit(10);
  return { snapshots: snaps ?? [], events: events ?? [] };
});
