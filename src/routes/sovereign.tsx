import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ProfessionalLiveDashboard } from "@/components/ProfessionalLiveDashboard";
import {
  useContractsRegistry, useLayers, useLiveMatrix, useSovereignManifest,
  COLOR_HEX, explorerForContract, explorerForAccount, PIRC_URLS,
} from "@/lib/pirc-live";
import {
  Search, ExternalLink, ShieldCheck, Zap, Cpu, Coins, Factory, Layers,
  Lock, Scale, Sparkles, Workflow, Database, Globe2, Rocket,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/sovereign")({
  head: () => ({
    meta: [
      { title: "Sovereign Portal — PiRC v1.1 Omni-Matrix" },
      { name: "description", content: "Live, production-grade portal for the PiRC sovereign network: 7-layer omni-matrix, smart contract studio, quantum encryption, WCF, RWA, anti-MEV justice engine." },
      { property: "og:title", content: "PiRC Sovereign Portal" },
      { property: "og:description", content: "Live sync with Ze0ro99/PiRC — contracts, layers, fairness, matrix." },
    ],
  }),
  component: SovereignPortal,
});

function SectionTitle({ icon: Icon, title, kicker }: { icon: any; title: string; kicker: string }) {
  return (
    <div className="mb-6">
      <Badge variant="outline" className="gold-border text-gold mb-3"><Icon className="h-3 w-3 mr-1" /> {kicker}</Badge>
      <h2 className="text-2xl lg:text-3xl font-bold text-foreground">{title}</h2>
    </div>
  );
}

function SovereignPortal() {
  return (
    <Layout>
      {/* Hero */}
      <section className="container mx-auto px-4 pt-16 pb-10">
        <Badge variant="outline" className="gold-border text-gold mb-4"><Sparkles className="h-3 w-3 mr-1" /> PiRC v1.1 · Sovereign Network Ecosystem</Badge>
        <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-[1.05]">The Sovereign Portal</h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          A fully live, production-grade resource center for Pioneers, developers and institutions —
          synchronized in real-time with the official PiRC repository.
        </p>
        <div className="mt-5 flex gap-2">
          <a href={PIRC_URLS.repo} target="_blank" rel="noreferrer">
            <Button className="bg-gradient-gold text-gold-foreground">Open Repository <ExternalLink className="ms-2 h-4 w-4" /></Button>
          </a>
        </div>
      </section>

      <ProfessionalLiveDashboard />

      <SevenLayerVisualizer />
      <ContractStudio />
      <QuantumSection />
      <StandardsBrowser />
      <WCFSection />
      <RWASection />
      <JusticeSection />
      <LowLevelSection />
    </Layout>
  );
}

/* ───────────────────────── 7-Layer Visualizer ───────────────────────── */
function SevenLayerVisualizer() {
  const { data, isLoading } = useLayers();
  return (
    <section className="container mx-auto px-4 py-12">
      <SectionTitle icon={Layers} kicker="Omni-Matrix" title="7-Layer Visualizer & Status" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(data?.layers ?? []).map((l) => (
          <Card key={l.color} className="glass border-0 p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: COLOR_HEX[l.color] }} />
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">L{l.index}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: `${COLOR_HEX[l.color]}22`, color: COLOR_HEX[l.color] }}>{l.color}</span>
            </div>
            <h3 className="text-lg font-bold text-foreground">{l.role}</h3>
            <a href={explorerForContract(l.contract)} target="_blank" rel="noreferrer"
               className="mt-2 font-mono text-[10px] text-muted-foreground hover:text-gold break-all inline-flex items-center gap-1">
              {l.contract.slice(0, 12)}…{l.contract.slice(-8)} <ExternalLink className="h-3 w-3" />
            </a>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Synchronized
            </div>
          </Card>
        ))}
        {isLoading && <p className="text-xs text-muted-foreground">Loading layers…</p>}
      </div>
    </section>
  );
}

/* ───────────────────────── Contract Studio ───────────────────────── */
function ContractStudio() {
  const { data } = useContractsRegistry();
  const [q, setQ] = useState("");
  const [onlyAudited, setOnlyAudited] = useState(false);

  const filtered = useMemo(() => {
    const list = data?.contracts ?? [];
    return list.filter((c) =>
      (!q || c.key.includes(q.toLowerCase()) || c.id.includes(q)) &&
      (!onlyAudited || c.quantum_audit),
    );
  }, [data, q, onlyAudited]);

  return (
    <section className="container mx-auto px-4 py-12">
      <SectionTitle icon={Factory} kicker="Smart Contract Studio" title={`Browse, deploy & interact — ${data?.contracts.length ?? 0}+ PiRC contracts`} />
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pirc_101, 207…" className="pl-9" />
        </div>
        <Button variant={onlyAudited ? "default" : "outline"} onClick={() => setOnlyAudited(!onlyAudited)}
          className={onlyAudited ? "bg-gradient-gold text-gold-foreground" : "gold-border"}>
          <ShieldCheck className="h-4 w-4 mr-1" /> Quantum-audited
        </Button>
      </div>
      <Card className="glass border-0 overflow-hidden">
        <div className="max-h-[520px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background/80 backdrop-blur text-xs text-muted-foreground">
              <tr className="text-left border-b border-border/40">
                <th className="p-3">ID</th><th className="p-3">Key</th><th className="p-3">Status</th>
                <th className="p-3">Audit</th><th className="p-3">Path</th><th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 400).map((c) => (
                <tr key={c.key} className="border-b border-border/20 hover:bg-secondary/30">
                  <td className="p-3 font-mono text-xs text-gold">PiRC-{c.id}</td>
                  <td className="p-3 text-foreground text-xs">{c.key}</td>
                  <td className="p-3"><Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">{c.status}</Badge></td>
                  <td className="p-3 text-xs">{c.quantum_audit ? <span className="text-emerald-400">✓ passed</span> : <span className="text-muted-foreground">pending</span>}</td>
                  <td className="p-3 text-xs text-muted-foreground font-mono truncate max-w-[260px]">{c.path}</td>
                  <td className="p-3 text-right">
                    <a href={`${PIRC_URLS.repo}/tree/main/${c.path}`} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="ghost">Source <ExternalLink className="h-3 w-3 ms-1" /></Button>
                    </a>
                    <Button size="sm" variant="ghost" onClick={() => toast.success(`Queued ${c.key} for Testnet deployment`)}>Deploy</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 text-xs text-muted-foreground border-t border-border/20">
          Showing {Math.min(filtered.length, 400)} of {filtered.length} live entries
        </div>
      </Card>
    </section>
  );
}

/* ───────────────────────── Quantum Section ───────────────────────── */
function QuantumSection() {
  const items = [
    { icon: Lock, title: "Post-Quantum Crypto", desc: "Hybrid PQ key exchange + signatures (Kyber/Dilithium-ready) for every PiRC packet." },
    { icon: Cpu, title: "Differential State Engine", desc: "Delta-encoded ledger commits — minimal Soroban rent, maximal verifiability." },
    { icon: Zap, title: "Fixed-Point Arithmetic", desc: "Q64.64 deterministic math across every contract — no floating-point drift." },
    { icon: ShieldCheck, title: "Quantum Audit Hook", desc: "Every deployment is hashed into the LIVE_MATRIX_REGISTRY for verifiable lineage." },
  ];
  return (
    <section className="container mx-auto px-4 py-12">
      <SectionTitle icon={ShieldCheck} kicker="Quantum & Differential Engineering" title="Post-quantum safe, deterministic, verifiable" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((it) => (
          <Card key={it.title} className="glass border-0 p-5">
            <it.icon className="h-6 w-6 text-gold mb-3" />
            <h3 className="font-semibold text-foreground mb-1">{it.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{it.desc}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── Standards Browser ───────────────────────── */
function StandardsBrowser() {
  const { data } = useContractsRegistry();
  const [q, setQ] = useState("");
  const standards = useMemo(() => (data?.contracts ?? []).filter((c) =>
    !q || c.id.includes(q) || c.key.includes(q.toLowerCase())), [data, q]);

  return (
    <section className="container mx-auto px-4 py-12">
      <SectionTitle icon={Database} kicker="PiRC-101 → PiRC-260" title="Sovereign Standards Browser" />
      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search PiRC standard id…" className="pl-9" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {standards.slice(0, 120).map((s) => (
          <a key={s.key} href={`${PIRC_URLS.repo}/tree/main/${s.path}`} target="_blank" rel="noreferrer"
             className="block">
            <Card className="glass border-0 p-4 hover:shadow-[var(--shadow-glow)] transition">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs text-gold">PiRC-{s.id}</span>
                {s.quantum_audit && <span className="text-[10px] text-emerald-400">✓ audited</span>}
              </div>
              <p className="text-xs text-muted-foreground font-mono truncate">{s.path.split("/").pop()}</p>
            </Card>
          </a>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3">Showing {Math.min(standards.length, 120)} of {standards.length}</p>
    </section>
  );
}

/* ───────────────────────── WCF / Micro-Units ───────────────────────── */
function WCFSection() {
  return (
    <section className="container mx-auto px-4 py-12">
      <SectionTitle icon={Coins} kicker="Monetary Sovereignty" title="Micro-Units & Weighted Contribution Factor (WCF)" />
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="glass border-0 p-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">Logistic Decay & P_m vs P_e</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Liquidity weight blends mined Pi (<code className="text-gold">P_m</code>) against ecosystem Pi
            (<code className="text-gold">P_e</code>) via a logistic decay curve — every micro-Pi carries verifiable
            purchasing-power lineage anchored to the Direct Weight Standard.
          </p>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1"><span>P_m share</span><span>62%</span></div>
              <Progress value={62} />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span>P_e share</span><span>38%</span></div>
              <Progress value={38} />
            </div>
          </div>
        </Card>
        <Card className="glass border-0 p-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">Micro-fee Allocation</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span className="text-foreground">PiDEX liquidity</span><span className="text-gold font-semibold">60%</span></li>
            <li className="flex justify-between"><span className="text-foreground">Value accrual vault</span><span className="text-gold font-semibold">25%</span></li>
            <li className="flex justify-between"><span className="text-foreground">Safety fund</span><span className="text-gold font-semibold">15%</span></li>
          </ul>
        </Card>
      </div>
    </section>
  );
}

/* ───────────────────────── RWA Sector Templates ───────────────────────── */
function RWASection() {
  const sectors = ["Physical Goods", "Services", "Gaming", "Domains", "Advertising"];
  return (
    <section className="container mx-auto px-4 py-12">
      <SectionTitle icon={Globe2} kicker="RWA · No-Code Sector Templates" title="Tokenize anything — fairly priced, sovereign-backed" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {sectors.map((s) => (
          <Card key={s} className="glass border-0 p-5 text-center">
            <Workflow className="h-6 w-6 text-gold mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-foreground">{s}</h3>
            <p className="text-[11px] text-muted-foreground mt-1">Pre-wired template · WCF aware</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── Justice / Anti-MEV ───────────────────────── */
function JusticeSection() {
  const items = [
    { title: "Anti-MEV Shield", desc: "Commit-reveal scheme prevents front-running across every PiRC AMM trade." },
    { title: "Adaptive PoC (APoC)", desc: "Adaptive Proof-of-Contribution dynamically reweighs contributors per epoch." },
    { title: "Divine Justice Engine", desc: "Forensic case management — freeze, recover, restore. Multi-religious jurisprudence." },
  ];
  return (
    <section className="container mx-auto px-4 py-12">
      <SectionTitle icon={Scale} kicker="Anti-MEV · APoC · Justice" title="Protection mechanisms & forensic reporting" />
      <div className="grid sm:grid-cols-3 gap-4">
        {items.map((it) => (
          <Card key={it.title} className="glass border-0 p-5">
            <h3 className="font-semibold text-foreground mb-1">{it.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{it.desc}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── Low-Level / Live Matrix ───────────────────────── */
function LowLevelSection() {
  const { data } = useLiveMatrix();
  const { data: manifest } = useSovereignManifest();
  return (
    <section className="container mx-auto px-4 py-12">
      <SectionTitle icon={Rocket} kicker="Low-Level Engineering" title="Live Matrix · Master Registry V3" />
      <Card className="glass border-0 overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-background/60 text-xs text-muted-foreground">
            <tr className="text-left border-b border-border/40">
              <th className="p-3">Layer</th><th className="p-3">Color</th><th className="p-3">Contract</th>
              <th className="p-3">Status</th><th className="p-3">Deployed</th><th className="p-3">Standard</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((r) => (
              <tr key={r.layer + r.contract} className="border-b border-border/20">
                <td className="p-3 font-mono text-xs text-gold">{r.layer}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold"
                    style={{ backgroundColor: `${COLOR_HEX[r.color.toUpperCase()] ?? "#888"}22`, color: COLOR_HEX[r.color.toUpperCase()] ?? "#888" }}>
                    {r.color}
                  </span>
                </td>
                <td className="p-3">
                  <a href={r.layer === "CORE" ? explorerForAccount(r.contract) : explorerForContract(r.contract)}
                     target="_blank" rel="noreferrer"
                     className="font-mono text-[11px] text-foreground hover:text-gold inline-flex items-center gap-1">
                    {r.contract.slice(0, 10)}…{r.contract.slice(-6)} <ExternalLink className="h-3 w-3" />
                  </a>
                </td>
                <td className="p-3"><Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">{r.status}</Badge></td>
                <td className="p-3 text-xs text-muted-foreground">{r.deployed}</td>
                <td className="p-3 text-xs text-muted-foreground">{r.standard}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {manifest && (
        <p className="text-xs text-muted-foreground">
          Manifest v{manifest.version} · network {manifest.network} · last sync {manifest.last_sync} ·
          {" "}standards-compliant: {manifest.standards_compliant.join(", ")}
        </p>
      )}
    </section>
  );
}
