import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitBranch, Network, Activity, Zap, Github, ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/alpha-hub")({
  head: () => ({
    meta: [
      { title: "Alpha Hub — PiRC Ecosystem Topology" },
      { name: "description", content: "Unified routing across the PiRC ecosystem: core API, Alpha Node and Earth Grid." },
      { property: "og:title", content: "PiRC Alpha Hub" },
      { property: "og:description", content: "V3 Pipeline interconnect for the PiRC Universal Network." },
    ],
  }),
  component: AlphaHubPage,
});

const NODES = [
  { id: "core_api", name: "PiRC Core API", role: "Core Hub", url: "https://github.com/Ze0ro99/PiRC", color: "from-amber-400 to-yellow-600" },
  { id: "alpha_node", name: "PiRC Alpha Hub", role: "Alpha Node", url: "https://github.com/Ze0ro99/PiRC-Alpha-Hub", color: "from-cyan-400 to-blue-600" },
  { id: "earth_grid", name: "Earth Grid", role: "Resources", url: "https://github.com/Ze0ro99/Organizing-the-Earth-s-resources-", color: "from-emerald-400 to-teal-600" },
];

const ROUTES = [
  { route: "pirc-alpha-gateway", target: "PiRC", status: "active" },
  { route: "pirc-earth-bridge", target: "Earth Grid", status: "active" },
  { route: "pirc-mainnet-sync", target: "Pi Mainnet", status: "syncing" },
  { route: "pirc-soroban-relay", target: "Soroban RPC", status: "active" },
];

function AlphaHubPage() {
  const { t } = useTranslation();
  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 space-y-8">
        <header className="border-b border-border/40 pb-6">
          <Badge variant="outline" className="gold-border text-gold mb-3">v3.1.0 · Interconnected</Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{t("alpha.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("alpha.subtitle")}</p>
        </header>

        <section className="grid lg:grid-cols-3 gap-5">
          {NODES.map((n) => (
            <Card key={n.id} className="glass border-0 p-6 relative overflow-hidden">
              <div className={`absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gradient-to-br ${n.color} opacity-20 blur-2xl`} />
              <div className="flex items-center justify-between mb-4">
                <Network className="h-6 w-6 text-gold" />
                <Badge variant="outline" className="text-[10px]">{n.role}</Badge>
              </div>
              <h3 className="font-bold text-lg text-foreground">{n.name}</h3>
              <code className="text-xs text-muted-foreground font-mono block mt-2 truncate">{n.url.replace("https://github.com/", "")}</code>
              <a href={n.url} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline" className="mt-4 w-full gold-border gap-2">
                  <Github className="h-3.5 w-3.5" /> View Repo
                </Button>
              </a>
            </Card>
          ))}
        </section>

        <section className="grid lg:grid-cols-2 gap-5">
          <Card className="glass border-0 p-6">
            <div className="flex items-center gap-2 mb-4">
              <GitBranch className="h-5 w-5 text-gold" />
              <h2 className="font-semibold text-foreground">{t("alpha.routing")}</h2>
            </div>
            <div className="space-y-2">
              {ROUTES.map((r) => (
                <div key={r.route} className="flex items-center justify-between p-3 rounded-lg bg-secondary/40">
                  <div>
                    <div className="font-mono text-sm text-foreground">{r.route}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <ArrowRight className="h-3 w-3" /> {r.target}
                    </div>
                  </div>
                  <Badge variant="outline" className={r.status === "active" ? "border-emerald-500/40 text-emerald-400" : "border-amber-500/40 text-amber-400"}>
                    {r.status === "active" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Activity className="h-3 w-3 mr-1 animate-pulse" />}
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="glass border-0 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-gold" />
              <h2 className="font-semibold text-foreground">{t("alpha.pipeline")}</h2>
            </div>
            <ol className="space-y-3">
              {["Core logic published from PiRC", "Sync pipeline normalizes routing topology", "Alpha Node ingests + verifies signatures", "Earth Grid revalues resources per cycle", "Mainnet relay broadcasts state"].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 h-7 w-7 rounded-full bg-gradient-gold text-gold-foreground flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <span className="text-sm text-foreground/90 pt-1">{step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-5 pt-4 border-t border-border/40 text-xs text-muted-foreground font-mono">
              Last synced · 2026-05-15T11:36:46Z
            </div>
          </Card>
        </section>
      </div>
    </Layout>
  );
}
