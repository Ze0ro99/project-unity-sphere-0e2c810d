import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JUSTICE_CASES } from "@/lib/pirc-data";
import { Scale, Lock, ShieldCheck, AlertOctagon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/justice")({
  head: () => ({ meta: [
    { title: "Divine Justice Engine — PiRC" },
    { name: "description", content: "Wallet freezing, recovery and restorative jurisprudence for the Pi ecosystem." },
  ] }),
  component: JusticePage,
});

const statusBadge: Record<string, string> = {
  Frozen: "bg-destructive/20 text-destructive border-destructive/40",
  "Under Review": "bg-amber-500/20 text-amber-400 border-amber-500/40",
  Recovered: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  Released: "bg-secondary text-muted-foreground",
};

function JusticePage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 space-y-6">
        <header>
          <Badge variant="outline" className="gold-border text-gold mb-3"><Scale className="h-3 w-3 mr-1" /> PiRC-13 · PiRC-260</Badge>
          <h1 className="text-3xl font-bold text-foreground">Divine Justice Engine</h1>
          <p className="text-muted-foreground text-sm mt-2">Forensic multi-sig, 6-month liquidity locks, biometric re-verification and restorative jurisprudence.</p>
        </header>

        <div className="grid md:grid-cols-4 gap-3">
          {[
            { icon: AlertOctagon, label: "Active Freezes", value: "12" },
            { icon: ShieldCheck, label: "Recovered (30d)", value: "π 84,210" },
            { icon: Lock, label: "Liquidity Locked", value: "π 1.2M" },
            { icon: Scale, label: "Cases Resolved", value: "1,894" },
          ].map((s) => (
            <Card key={s.label} className="glass border-0 p-5">
              <s.icon className="h-5 w-5 text-gold" />
              <div className="mt-2 text-xs text-muted-foreground">{s.label}</div>
              <div className="text-xl font-bold text-foreground">{s.value}</div>
            </Card>
          ))}
        </div>

        <Card className="glass border-0 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Case Queue</h2>
            <Button size="sm" variant="outline" className="gold-border" onClick={() => toast.info("Multi-sig signing requires Pi Browser")}>Sign Multi-Sig</Button>
          </div>
          <div className="space-y-2">
            {JUSTICE_CASES.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-3 p-3 rounded-lg hover:bg-secondary/40">
                <div className="font-mono text-xs text-muted-foreground w-28">{c.id}</div>
                <div className="text-sm text-foreground flex-1 min-w-[120px]">{c.wallet}</div>
                <Badge variant="outline" className={statusBadge[c.status]}>{c.status}</Badge>
                <div className="text-xs text-muted-foreground w-20">{c.priority}</div>
                <div className="text-sm text-gold font-mono w-28 text-right">{c.amount}</div>
                <div className="text-xs text-muted-foreground w-14 text-right">{c.opened}</div>
                <Button size="sm" variant="ghost" onClick={() => toast.success(`Opened case ${c.id}`)}>Open</Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
