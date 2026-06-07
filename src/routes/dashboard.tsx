import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowDownLeft, ArrowUpRight, Repeat, Coins, CheckCircle2, TrendingUp, Layers, Scale, GitBranch, FileCode2 } from "lucide-react";
import { authenticatePi } from "@/lib/pi-sdk";
import { useState } from "react";
import { toast } from "sonner";
import { FAIRNESS_TIERS, OMNI_LAYERS, CONTRACT_REGISTRY, PIRC_STANDARDS } from "@/lib/pirc-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — PiRC" }, { name: "description", content: "Your unified Pi Network command center." }] }),
  component: Dashboard,
});

const actions = [
  { key: "send", icon: ArrowUpRight },
  { key: "receive", icon: ArrowDownLeft },
  { key: "swap", icon: Repeat },
  { key: "stake", icon: Coins },
] as const;

function Dashboard() {
  const { t } = useTranslation();
  const [user, setUser] = useState<string | null>(null);

  const connect = async () => {
    const res = await authenticatePi();
    if (res) {
      setUser(res.user.username);
      toast.success(`Connected as @${res.user.username}`);
    } else {
      toast.info("Open in Pi Browser to connect a live wallet. Showing demo data.");
      setUser("demo_pioneer");
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("dashboard.welcome")}{user ? `, @${user}` : ""}</h1>
            <p className="text-muted-foreground text-sm mt-1">{t("tagline")}</p>
          </div>
          {!user && (
            <Button onClick={connect} className="bg-gradient-gold text-gold-foreground font-semibold">
              {t("cta.connect")}
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          <Card className="glass border-0 p-6 lg:col-span-2 bg-gradient-primary">
            <div className="text-sm text-muted-foreground">{t("dashboard.balance")}</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-5xl font-bold text-gold">π 12,480.32</span>
              <Badge variant="outline" className="gold-border text-gold gap-1"><TrendingUp className="h-3 w-3" /> +4.8%</Badge>
            </div>
            <div className="mt-6 grid grid-cols-4 gap-3">
              {actions.map(({ key, icon: Icon }) => (
                <button key={key} className="flex flex-col items-center gap-2 rounded-xl p-3 hover:bg-secondary/50 transition-colors">
                  <span className="h-10 w-10 rounded-full bg-gradient-gold text-gold-foreground flex items-center justify-center">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-xs text-foreground/90">{t(`dashboard.${key}`)}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="glass border-0 p-6">
            <div className="text-sm text-muted-foreground mb-3">{t("dashboard.network")}</div>
            <div className="flex items-center gap-2 text-emerald-400 mb-4">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">{t("dashboard.operational")}</span>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ["Mainnet", "99.99%"],
                ["Testnet", "100.00%"],
                ["SDK Gateway", "99.97%"],
                ["Soroban RPC", "99.95%"],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between text-muted-foreground">
                  <span>{label}</span>
                  <span className="text-foreground">{val}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="glass border-0 p-6 mt-5">
          <div className="text-sm text-muted-foreground mb-4">{t("dashboard.recent")}</div>
          <div className="space-y-2">
            {[
              { type: "send", to: "GD...A7XQ", amount: "-12.50", time: "2h" },
              { type: "receive", to: "GA...K4MN", amount: "+ 84.00", time: "5h" },
              { type: "stake", to: "Vault #221", amount: "-100.00", time: "1d" },
              { type: "receive", to: "GC...PL3R", amount: "+ 25.40", time: "2d" },
            ].map((tx, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/40">
                <div className="flex items-center gap-3">
                  <span className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
                    {tx.type === "send" ? <ArrowUpRight className="h-4 w-4 text-destructive" /> :
                     tx.type === "receive" ? <ArrowDownLeft className="h-4 w-4 text-emerald-400" /> :
                     <Coins className="h-4 w-4 text-gold" />}
                  </span>
                  <div>
                    <div className="text-sm text-foreground capitalize">{tx.type}</div>
                    <div className="text-xs text-muted-foreground">{tx.to}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">π {tx.amount}</div>
                  <div className="text-xs text-muted-foreground">{tx.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
