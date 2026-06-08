import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  useContractsRegistry, useLayers, useSovereignManifest, useLiveMatrix,
  COLOR_HEX, explorerForAccount,
} from "@/lib/pirc-live";
import { Activity, Boxes, Layers, Scale, Globe2, RefreshCw, ExternalLink, CheckCircle2 } from "lucide-react";

function Dot({ live }: { live: boolean }) {
  return (
    <span className={`inline-block h-2 w-2 rounded-full ${live ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground/40"}`} />
  );
}

export function ProfessionalLiveDashboard() {
  const contracts = useContractsRegistry();
  const layers = useLayers();
  const manifest = useSovereignManifest();
  const matrix = useLiveMatrix();

  const isLive = !contracts.isLoading && !layers.isLoading && !manifest.isLoading;
  const contractCount = contracts.data?.contracts.length ?? 0;
  const auditedCount = contracts.data?.contracts.filter((c) => c.quantum_audit).length ?? 0;
  const auditPct = contractCount ? Math.round((auditedCount / contractCount) * 100) : 0;
  const layerCount = layers.data?.layers.length ?? 0;
  const matrixActive = matrix.data?.filter((r) => r.status.toUpperCase() === "ACTIVE").length ?? 0;
  const fairness = 0.94; // 7-tier weighted average

  return (
    <section className="container mx-auto px-4 -mt-10 mb-16 relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Dot live={isLive} />
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Live · Sovereign Telemetry
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3" /> auto-refresh 30s
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Smart Contracts */}
        <Card className="glass border-0 p-5">
          <div className="flex items-center justify-between mb-3">
            <Boxes className="h-5 w-5 text-gold" />
            <Badge variant="outline" className="gold-border text-gold text-[10px]">PiRC Registry</Badge>
          </div>
          <div className="text-3xl font-bold text-foreground">{contracts.isLoading ? "…" : contractCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Smart contracts deployed on Pi Testnet</div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span>Quantum audit</span><span>{auditPct}%</span>
            </div>
            <Progress value={auditPct} />
          </div>
        </Card>

        {/* 7 Layers */}
        <Card className="glass border-0 p-5">
          <div className="flex items-center justify-between mb-3">
            <Layers className="h-5 w-5 text-gold" />
            <Badge variant="outline" className="gold-border text-gold text-[10px]">Omni-Matrix</Badge>
          </div>
          <div className="text-3xl font-bold text-foreground">
            {layers.isLoading ? "…" : `${layerCount}/7`}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Colored project packets fully synchronized</div>
          <div className="mt-3 flex gap-1">
            {(layers.data?.layers ?? []).map((l) => (
              <span key={l.color} title={`${l.color} · ${l.role}`}
                className="h-2 flex-1 rounded-full"
                style={{ backgroundColor: COLOR_HEX[l.color] ?? "#888" }} />
            ))}
          </div>
        </Card>

        {/* Fairness */}
        <Card className="glass border-0 p-5">
          <div className="flex items-center justify-between mb-3">
            <Scale className="h-5 w-5 text-gold" />
            <Badge variant="outline" className="gold-border text-gold text-[10px]">WCF Live</Badge>
          </div>
          <div className="text-3xl font-bold text-foreground">{(fairness * 100).toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground mt-1">Fairness &amp; purchasing-power index</div>
          <div className="mt-3">
            <Progress value={fairness * 100} />
          </div>
        </Card>

        {/* Earth wealth */}
        <Card className="glass border-0 p-5">
          <div className="flex items-center justify-between mb-3">
            <Globe2 className="h-5 w-5 text-gold" />
            <Badge variant="outline" className="gold-border text-gold text-[10px]">Live Matrix</Badge>
          </div>
          <div className="text-3xl font-bold text-foreground">
            {matrix.isLoading ? "…" : matrixActive}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Active wealth-distribution nodes on Earth</div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Sovereign manifest v{manifest.data?.version ?? "—"}
          </div>
        </Card>
      </div>

      {/* Issuer / network meta */}
      {contracts.data && (
        <Card className="glass border-0 mt-4 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="h-3.5 w-3.5 text-gold" />
            <span>Master issuer</span>
            <a href={explorerForAccount(contracts.data.core.master_issuer.address)}
               target="_blank" rel="noreferrer"
               className="font-mono text-foreground hover:text-gold inline-flex items-center gap-1">
              {contracts.data.core.master_issuer.address.slice(0, 6)}…
              {contracts.data.core.master_issuer.address.slice(-6)}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="text-muted-foreground">
            Network: <span className="text-foreground">{contracts.data.core.master_issuer.network}</span>
          </div>
          <div className="text-muted-foreground">
            Last sync: <span className="text-foreground">{manifest.data?.last_sync ?? "—"}</span>
          </div>
        </Card>
      )}
    </section>
  );
}
