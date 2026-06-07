import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CONTRACT_REGISTRY, PIRC_STANDARDS } from "@/lib/pirc-data";
import { FileCode2, Search, Factory } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/contracts")({
  head: () => ({ meta: [
    { title: "Smart Contracts — PiRC" },
    { name: "description", content: "320+ audited Soroban contract templates and 300+ PiRC standards." },
  ] }),
  component: ContractsPage,
});

const statusColor: Record<string, string> = {
  Active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  Deploying: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  Audited: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
  Sunset: "bg-secondary text-muted-foreground",
};

function ContractsPage() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"contracts" | "standards">("contracts");

  const contracts = useMemo(
    () => CONTRACT_REGISTRY.filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.id.toLowerCase().includes(q.toLowerCase()) || c.family.toLowerCase().includes(q.toLowerCase())),
    [q],
  );
  const standards = useMemo(
    () => PIRC_STANDARDS.filter((s) => !q || s.title.toLowerCase().includes(q.toLowerCase()) || s.id.toLowerCase().includes(q.toLowerCase()) || s.category.toLowerCase().includes(q.toLowerCase())),
    [q],
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge variant="outline" className="gold-border text-gold mb-3"><Factory className="h-3 w-3 mr-1" /> Smart Contract Factory</Badge>
            <h1 className="text-3xl font-bold text-foreground">Contracts & Standards</h1>
            <p className="text-muted-foreground text-sm mt-2">{CONTRACT_REGISTRY.length} Soroban contract modules · {PIRC_STANDARDS.length} PiRC standards · MiCAR aligned.</p>
          </div>
          <div className="flex gap-2">
            <Button variant={tab === "contracts" ? "default" : "outline"} size="sm" onClick={() => setTab("contracts")} className={tab === "contracts" ? "bg-gradient-gold text-gold-foreground" : "gold-border"}>Contracts</Button>
            <Button variant={tab === "standards" ? "default" : "outline"} size="sm" onClick={() => setTab("standards")} className={tab === "standards" ? "bg-gradient-gold text-gold-foreground" : "gold-border"}>Standards</Button>
          </div>
        </header>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tab === "contracts" ? "Search contracts…" : "Search standards…"} className="pl-9" />
        </div>

        {tab === "contracts" ? (
          <Card className="glass border-0 overflow-hidden">
            <div className="overflow-x-auto max-h-[640px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background/80 backdrop-blur">
                  <tr className="text-left text-xs text-muted-foreground border-b border-border/40">
                    <th className="p-3">ID</th><th className="p-3">Name</th><th className="p-3">Family</th><th className="p-3">Status</th><th className="p-3">TVL</th><th className="p-3">Audit</th><th className="p-3">Network</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.slice(0, 200).map((c) => (
                    <tr key={c.id} className="border-b border-border/20 hover:bg-secondary/30">
                      <td className="p-3 font-mono text-xs text-muted-foreground">{c.id}</td>
                      <td className="p-3 text-foreground">{c.name}</td>
                      <td className="p-3"><Badge variant="outline" className="gold-border text-gold text-[10px]">{c.family}</Badge></td>
                      <td className="p-3"><Badge variant="outline" className={`text-[10px] ${statusColor[c.status]}`}>{c.status}</Badge></td>
                      <td className="p-3 font-mono text-xs text-foreground">{c.tvl}</td>
                      <td className="p-3 text-xs">{c.audit}</td>
                      <td className="p-3 text-xs text-muted-foreground">{c.network}</td>
                      <td className="p-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => toast.success(`Queued deploy: ${c.id}`)}>Deploy</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 text-xs text-muted-foreground border-t border-border/20">Showing {Math.min(contracts.length, 200)} of {contracts.length}</div>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {standards.slice(0, 120).map((s) => (
              <Card key={s.id} className="glass border-0 p-5 hover:shadow-[var(--shadow-glow)] transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-gold">{s.id}</span>
                  <Badge variant="outline" className="text-[10px]">{s.status}</Badge>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <FileCode2 className="h-4 w-4 text-gold" />
                  <h3 className="font-semibold text-foreground text-sm">{s.title}</h3>
                </div>
                <Badge variant="outline" className="gold-border text-gold text-[10px] mb-2">{s.category}</Badge>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.summary}</p>
              </Card>
            ))}
            <div className="col-span-full text-center text-xs text-muted-foreground">Showing {Math.min(standards.length, 120)} of {standards.length}</div>
          </div>
        )}
      </div>
    </Layout>
  );
}
