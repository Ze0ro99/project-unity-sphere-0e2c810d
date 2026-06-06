import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import Decimal from "decimal.js";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pickaxe, Droplet, Rocket, Crown, Activity, Globe,
  Calculator, Layers, Gem,
} from "lucide-react";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip,
} from "recharts";
import { Asset, AssetCategory, generateMockAssets, formatHugeNumber } from "@/lib/wealth";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Wealth Core — PiRC Earth & Space Resources" },
      { name: "description", content: "Real-time valuation engine for Earth and extraterrestrial assets — gold, oil, diamonds, antiquities and asteroid mining." },
      { property: "og:title", content: "PiRC Wealth Core" },
      { property: "og:description", content: "Global & extraterrestrial asset revaluation engine." },
    ],
  }),
  component: ResourcesPage,
});

const ICONS: Record<AssetCategory, typeof Pickaxe> = {
  EARTH_MINERALS: Pickaxe,
  EARTH_ENERGY: Droplet,
  SPACE_METALS: Rocket,
  ARTIFACTS: Crown,
  GEMSTONES: Gem,
};

function ResourcesPage() {
  const { t } = useTranslation();
  const [assets, setAssets] = useState<Asset[]>(() => generateMockAssets());
  const [cycle, setCycle] = useState(0);
  const [expansion, setExpansion] = useState(0);
  const [trend, setTrend] = useState<{ name: string; value: number }[]>(
    Array.from({ length: 8 }, (_, i) => ({ name: `C${i}`, value: 200 + i * 80 })),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setAssets((prev) => prev.map((a) => ({ ...a, totalValue: a.totalValue.mul(a.growthRate) })));
      setCycle((c) => c + 1);
      setExpansion((p) => p + Math.floor(Math.random() * 1_000_000));
      setTrend((prev) => {
        const next = [...prev.slice(1), { name: `C${prev[prev.length - 1].name.slice(1)}`, value: prev[prev.length - 1].value * (1 + Math.random() * 0.08) }];
        return next.map((d, i) => ({ ...d, name: `C${cycle + i}` }));
      });
    }, 2200);
    return () => clearInterval(id);
  }, [cycle]);

  const total = assets.reduce((acc, a) => acc.add(a.totalValue), new Decimal(0));

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 space-y-8">
        <header className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-end border-b border-border/40 pb-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                {t("resources.title")}
              </span>
            </h1>
            <p className="mt-2 text-muted-foreground font-mono text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              {t("resources.subtitle")}
            </p>
          </div>
          <div className="flex gap-3">
            <Card className="glass border-0 p-3 flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">{t("resources.cycle")}</span>
              <span className="text-lg font-mono text-cyan-400">#{cycle}</span>
            </Card>
            <Card className="glass border-0 p-3 flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">{t("resources.expansion")}</span>
              <span className="text-lg font-mono text-blue-400 flex items-center gap-1">
                <Layers className="w-4 h-4" /> {expansion.toLocaleString()}
              </span>
            </Card>
          </div>
        </header>

        <section className="grid lg:grid-cols-3 gap-5">
          <Card className="glass border-0 p-8 lg:col-span-2 relative overflow-hidden bg-gradient-primary">
            <Calculator className="absolute top-6 right-6 w-28 h-28 opacity-10" />
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
              {t("resources.totalValuation")}
            </div>
            <div className="text-3xl md:text-6xl font-bold tracking-tighter text-gold">
              ${formatHugeNumber(total)}
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-emerald-400 font-mono">
              <Activity className="w-4 h-4 animate-pulse" />
              {t("resources.compounding")}
            </div>
          </Card>

          <Card className="glass border-0 p-6">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
              {t("resources.trend")}
            </div>
            <div className="h-[120px]">
              <ResponsiveContainer>
                <LineChart data={trend}>
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                  <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 pt-4 border-t border-border/40">
              <div className="text-[10px] font-mono uppercase text-muted-foreground">{t("resources.stability")}</div>
              <div className="text-lg font-bold text-emerald-400">99.999%</div>
            </div>
          </Card>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-bold">{t("resources.classifications")}</h2>
            <Badge variant="outline" className="gold-border text-gold text-xs font-mono">HIGH PRECISION</Badge>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {assets.map((a) => {
              const Icon = ICONS[a.category];
              return (
                <Card key={a.id} className="glass border-0 p-6 hover:shadow-[var(--shadow-glow)] transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-11 w-11 rounded-lg bg-gradient-gold text-gold-foreground flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">{a.category.replace("_", " ")}</Badge>
                  </div>
                  <h3 className="font-semibold text-foreground">{a.name}</h3>
                  <div className="mt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between text-muted-foreground"><span>{t("resources.quantity")}</span><span className="text-foreground font-mono">{formatHugeNumber(a.quantity)} {a.unit}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>{t("resources.unitPrice")}</span><span className="text-foreground font-mono">${formatHugeNumber(a.valuationPerUnit)}</span></div>
                    <div className="flex justify-between pt-2 border-t border-border/30">
                      <span className="text-muted-foreground">{t("resources.value")}</span>
                      <span className="text-gold font-bold font-mono">${formatHugeNumber(a.totalValue)}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <Card className="glass border-0 p-4 font-mono text-xs md:text-sm">
          <div className="flex items-center gap-2 mb-2 border-b border-border/40 pb-2">
            <span className="w-2 h-2 rounded-full bg-destructive" />
            <span className="w-2 h-2 rounded-full bg-gold" />
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="ml-2 uppercase tracking-wider text-muted-foreground">{t("resources.log")}</span>
          </div>
          <div className="space-y-1 h-32 overflow-y-auto" dir="ltr">
            <p className="text-cyan-400">&gt; Initializing PiRC Autonomous Core...</p>
            <p>&gt; NASA Deep Space Network API connected.</p>
            <p>&gt; Syncing global commodities indices (Au, Ag, Pt, Pd)...</p>
            <p>&gt; Sharding scaled to depth {expansion.toLocaleString()}.</p>
            <p className="text-emerald-400">&gt; Cycle #{cycle} processed successfully.</p>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
