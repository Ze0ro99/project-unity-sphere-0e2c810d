import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { syncPircRepo, getPircSnapshotStatus } from "@/lib/pirc-sync.functions";
import { CloudDownload, Database, GitBranch, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/import")({
  head: () => ({ meta: [
    { title: "Repository Import — PiRC" },
    { name: "description", content: "Live import status for Ze0ro99/PiRC snapshots and webhook events." },
  ] }),
  component: ImportPage,
});

function ImportPage() {
  const qc = useQueryClient();
  const statusFn = useServerFn(getPircSnapshotStatus);
  const syncFn = useServerFn(syncPircRepo);

  const status = useQuery({
    queryKey: ["pirc-import-status"],
    queryFn: () => statusFn(),
    refetchInterval: 15_000,
  });

  const sync = useMutation({
    mutationFn: () => syncFn(),
    onSuccess: (res) => {
      const ok = res.imported.filter((i) => i.ok).length;
      const fail = res.imported.length - ok;
      toast.success(`Imported ${ok} files${fail ? `, ${fail} failed` : ""}`);
      qc.invalidateQueries({ queryKey: ["pirc-import-status"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const snaps = status.data?.snapshots ?? [];
  const events = status.data?.events ?? [];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge variant="outline" className="gold-border text-gold mb-3">
              <GitBranch className="h-3 w-3 mr-1" /> Ze0ro99/PiRC
            </Badge>
            <h1 className="text-3xl font-bold text-foreground">Repository Import</h1>
            <p className="text-muted-foreground text-sm mt-2 max-w-2xl">
              Webhook receives push events from GitHub and refreshes the canonical PiRC files into the database.
              Trigger a manual sync below if you need an immediate refresh.
            </p>
          </div>
          <Button onClick={() => sync.mutate()} disabled={sync.isPending} className="bg-gold text-black hover:bg-gold/90">
            {sync.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CloudDownload className="h-4 w-4 mr-2" />}
            Sync now
          </Button>
        </header>

        <Card className="glass border-0 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Database className="h-4 w-4 text-gold" /> Snapshots
            </h2>
            <Button size="sm" variant="ghost" onClick={() => status.refetch()}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
          {snaps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No snapshots yet. Click <b>Sync now</b> or push to the repo.</p>
          ) : (
            <div className="divide-y divide-border/40">
              {snaps.map((s) => (
                <div key={s.path} className="py-2.5 flex items-center justify-between text-sm">
                  <div className="font-mono text-foreground truncate">{s.path}</div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{(s.bytes / 1024).toFixed(1)} KB</span>
                    {s.commit_sha && <span className="font-mono">{s.commit_sha.slice(0, 7)}</span>}
                    <span>{new Date(s.fetched_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="glass border-0 p-5">
          <h2 className="font-semibold text-foreground mb-3">Recent webhook events</h2>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No webhook deliveries received yet.</p>
          ) : (
            <div className="divide-y divide-border/40">
              {events.map((e, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="gold-border text-gold text-[10px]">{e.event}</Badge>
                    <span className="text-foreground font-mono text-xs">{e.ref ?? "—"}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {e.head_sha && <span className="font-mono">{e.head_sha.slice(0, 7)}</span>}
                    <span>{new Date(e.received_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="glass border-0 p-5 text-xs text-muted-foreground space-y-2">
          <div><b className="text-foreground">Webhook URL:</b> <code className="text-gold">https://project-unity-sphere.lovable.app/api/public/github-webhook</code></div>
          <div><b className="text-foreground">Secret:</b> stored as <code>GITHUB_WEBHOOK_SECRET</code> in project secrets.</div>
          <div><b className="text-foreground">Files tracked:</b> CONTRACTS_REGISTRY.json · 7_layer_packets.json · sovereign_manifest.json · LIVE_MATRIX_REGISTRY.csv</div>
        </Card>
      </div>
    </Layout>
  );
}
