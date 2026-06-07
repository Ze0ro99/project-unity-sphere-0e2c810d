import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Coins, Gauge, Sparkles, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/monetary")({
  head: () => ({ meta: [
    { title: "Sovereign Monetary Standard — PiRC" },
    { name: "description", content: "QWF, IPPR and $REF token primitives for the PiRC economy." },
  ] }),
  component: MonetaryPage,
});

function MonetaryPage() {
  const [ref, setRef] = useState("100");
  const ippr = 2_248_000;
  const qwf = 10_000_000;
  const phi = 1.618;

  const mint = () => {
    const n = Number(ref);
    if (!n || n <= 0) return toast.error("Enter a valid amount");
    toast.success(`Queued mint: ${n} $REF (mock — wire to /v1/vault/mint_ref)`);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 space-y-6">
        <header>
          <Badge variant="outline" className="gold-border text-gold mb-3"><Sparkles className="h-3 w-3 mr-1" /> PiRC-101</Badge>
          <h1 className="text-3xl font-bold text-foreground">Sovereign Monetary Standard</h1>
          <p className="text-muted-foreground text-sm mt-2">Quantum Wealth Factor (QWF), Internal Purchasing Power Reference (IPPR), and $REF settlement token primitives.</p>
        </header>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="glass border-0 p-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><Gauge className="h-4 w-4" /> IPPR</div>
            <div className="mt-2 text-3xl font-bold text-gold">${ippr.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">USD per mined Pi · medianized</div>
          </Card>
          <Card className="glass border-0 p-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><Coins className="h-4 w-4" /> QWF Cap</div>
            <div className="mt-2 text-3xl font-bold text-foreground">{qwf.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">Sovereign Multiplier ceiling</div>
          </Card>
          <Card className="glass border-0 p-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><ShieldAlert className="h-4 w-4" /> Φ Guardrail</div>
            <div className="mt-2 text-3xl font-bold text-foreground">{phi}</div>
            <div className="text-xs text-emerald-400 mt-1">● Active · 15% circuit-breaker</div>
          </Card>
        </div>

        <Card className="glass border-0 p-6">
          <h2 className="font-semibold text-foreground mb-4">Mint $REF Settlement Token</h2>
          <p className="text-sm text-muted-foreground mb-4">USD-priced, Pi-collateralized. Calls <code className="text-gold">/v1/vault/mint_ref</code> on the PiRC oracle gateway.</p>
          <div className="flex gap-2 max-w-md">
            <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Amount in $REF" />
            <Button onClick={mint} className="bg-gradient-gold text-gold-foreground font-semibold">Mint</Button>
          </div>
        </Card>

        <Card className="glass border-0 p-6">
          <h2 className="font-semibold text-foreground mb-3">Oracle Health</h2>
          <div className="grid md:grid-cols-4 gap-3 text-sm">
            {[
              ["Sources", "12"],
              ["Median Δ", "0.21%"],
              ["Last Sync", "8s ago"],
              ["Breaker", "Armed"],
            ].map(([k, v]) => (
              <div key={k} className="p-3 rounded-lg bg-secondary/40">
                <div className="text-xs text-muted-foreground">{k}</div>
                <div className="font-mono text-foreground mt-1">{v}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
