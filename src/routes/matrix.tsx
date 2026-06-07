import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { OMNI_LAYERS, FAIRNESS_TIERS } from "@/lib/pirc-data";
import { Activity, Layers, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/matrix")({
  head: () => ({ meta: [
    { title: "7-Layer Omni-Matrix — PiRC" },
    { name: "description", content: "Real-time topology of the 7-layer PiRC Omni-Sovereign network." },
  ] }),
  component: MatrixPage,
});

const healthColor: Record<string, string> = {
  Optimal: "text-emerald-400",
  Good: "text-cyan-400",
  Warning: "text-amber-400",
  Critical: "text-destructive",
};

function MatrixPage() {
  const { t } = useTranslation();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 space-y-8">
        <header>
          <Badge variant="outline" className="gold-border text-gold mb-3"><Layers className="h-3 w-3 mr-1" /> Omni-Sovereign</Badge>
          <h1 className="text-3xl font-bold text-foreground">{t("matrix.title", "7-Layer Omni-Matrix")}</h1>
          <p className="text-muted-foreground text-sm mt-2">{t("matrix.subtitle", "Live topology of the unified PiRC architecture — color-coded execution logic across all seven sovereign layers.")}</p>
        </header>

        <div className="grid lg:grid-cols-7 gap-3">
          {OMNI_LAYERS.map((l) => (
            <Card key={l.id} className="glass border-0 p-4 hover:shadow-[var(--shadow-glow)] transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">{l.id}</span>
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.color }} />
              </div>
              <div className="font-semibold text-foreground">{l.layer}</div>
              <div className={`text-xs mt-1 ${healthColor[l.health]}`}>● {l.health}</div>
              <div className="mt-3 text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between"><span>Nodes</span><span className="text-foreground">{(l.nodeCount + (tick % 9)).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Vol</span><span className="text-foreground">{l.volume}</span></div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="glass border-0 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-5 w-5 text-gold" />
            <h2 className="font-semibold text-foreground">7-Tier Fairness Standard</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {FAIRNESS_TIERS.map((tier) => (
              <div key={tier.tier} className="p-4 rounded-lg bg-secondary/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-gradient-gold text-gold-foreground flex items-center justify-center text-xs font-bold">{tier.tier}</span>
                    <span className="font-medium text-foreground">{tier.name}</span>
                  </div>
                  <span className="text-xs text-gold font-mono">{(tier.weight * 100).toFixed(0)}%</span>
                </div>
                <Progress value={tier.weight * 100} className="h-1.5 mb-2" />
                <p className="text-xs text-muted-foreground leading-relaxed">{tier.description}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass border-0 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-5 w-5 text-gold" />
            <h2 className="font-semibold text-foreground">Layer Detail</h2>
          </div>
          <div className="space-y-2">
            {OMNI_LAYERS.map((l) => (
              <div key={l.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/40">
                <span className="h-8 w-8 rounded-md flex items-center justify-center text-xs font-bold text-background" style={{ backgroundColor: l.color }}>{l.id}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{l.layer}</div>
                  <div className="text-xs text-muted-foreground">{l.description}</div>
                </div>
                <span className={`text-xs ${healthColor[l.health]}`}>{l.health}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
