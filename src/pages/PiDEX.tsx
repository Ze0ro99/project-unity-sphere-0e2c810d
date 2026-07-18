import { useEffect, useMemo, useState } from "react";
import { LAYERS } from "@/data/layers";
import { ArrowDownUp, Shield, Cpu, Zap, Lock, Activity, Plus, BookOpen, CircleDot } from "lucide-react";

type Side = "buy" | "sell";
type Order = { id: string; side: Side; price: number; size: number; ts: number; zk: boolean };
type Trade = { id: string; side: Side; price: number; size: number; ts: number; hash: string };

const PAIRS = LAYERS.map((l) => ({ symbol: `${l.id}/π`, layer: l }));

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }
function hash8() { return Math.random().toString(16).slice(2, 10).toUpperCase(); }

export default function PiDEX() {
  const [pair, setPair] = useState(PAIRS[1]);
  const [side, setSide] = useState<Side>("buy");
  const [amount, setAmount] = useState("10");
  const [price, setPrice] = useState("0.42");
  const [zkEnabled, setZkEnabled] = useState(true);
  const [book, setBook] = useState<{ bids: Order[]; asks: Order[] }>({ bids: [], asks: [] });
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tvl, setTvl] = useState(1_284_930);
  const [vol24, setVol24] = useState(482_910);

  // seed + live tick
  useEffect(() => {
    const mid = 0.4 + Math.random() * 0.3;
    const seedBids: Order[] = Array.from({ length: 12 }, (_, i) => ({
      id: hash8(), side: "buy", price: +(mid - i * 0.0015 - rand(0, 0.001)).toFixed(4),
      size: +rand(5, 400).toFixed(2), ts: Date.now(), zk: Math.random() > 0.4,
    }));
    const seedAsks: Order[] = Array.from({ length: 12 }, (_, i) => ({
      id: hash8(), side: "sell", price: +(mid + i * 0.0015 + rand(0, 0.001)).toFixed(4),
      size: +rand(5, 400).toFixed(2), ts: Date.now(), zk: Math.random() > 0.4,
    }));
    setBook({ bids: seedBids, asks: seedAsks });
    setPrice(mid.toFixed(4));
  }, [pair.symbol]);

  useEffect(() => {
    const t = setInterval(() => {
      setBook((b) => {
        const bump = (o: Order): Order => ({ ...o, size: Math.max(1, +(o.size + rand(-8, 8)).toFixed(2)) });
        return { bids: b.bids.map(bump), asks: b.asks.map(bump) };
      });
      if (Math.random() > 0.5) {
        const side: Side = Math.random() > 0.5 ? "buy" : "sell";
        const p = +(parseFloat(price) + rand(-0.003, 0.003)).toFixed(4);
        setTrades((t) => [{ id: hash8(), side, price: p, size: +rand(1, 120).toFixed(2), ts: Date.now(), hash: hash8() + hash8() }, ...t].slice(0, 25));
        setVol24((v) => v + Math.random() * 200);
        setTvl((v) => v + rand(-500, 700));
      }
    }, 1200);
    return () => clearInterval(t);
  }, [price]);

  const maxSize = useMemo(() => Math.max(...book.bids.map((o) => o.size), ...book.asks.map((o) => o.size), 1), [book]);

  const submit = () => {
    const p = parseFloat(price), a = parseFloat(amount);
    if (!p || !a) return;
    const order: Order = { id: hash8(), side, price: p, size: a, ts: Date.now(), zk: zkEnabled };
    setBook((b) => side === "buy"
      ? { ...b, bids: [order, ...b.bids].sort((x, y) => y.price - x.price).slice(0, 14) }
      : { ...b, asks: [order, ...b.asks].sort((x, y) => x.price - y.price).slice(0, 14) });
    setTrades((t) => [{ id: hash8(), side, price: p, size: a, ts: Date.now(), hash: hash8() + hash8() }, ...t].slice(0, 25));
  };

  return (
    <div className="space-y-4">
      {/* Header strip */}
      <section className="card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-md flex items-center justify-center text-black font-bold" style={{ background: pair.layer.hex }}>π</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">PiDEX</h1>
                <span className="chip">ZK · BN254 · Groth16</span>
                <span className="chip flex items-center gap-1"><CircleDot size={10} className="text-green animate-pulse" /> Live</span>
              </div>
              <div className="text-xs text-muted">Sovereign DEX for the PiRC-207 7-layer token system</div>
            </div>
          </div>
          <div className="ml-auto grid grid-cols-3 gap-6 text-sm">
            <Stat label="Last" value={`${parseFloat(price).toFixed(4)} π`} />
            <Stat label="24h Volume" value={`${vol24.toLocaleString(undefined, { maximumFractionDigits: 0 })} π`} />
            <Stat label="TVL" value={`${tvl.toLocaleString(undefined, { maximumFractionDigits: 0 })} π`} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {PAIRS.map((p) => (
            <button key={p.symbol} onClick={() => setPair(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition ${pair.symbol === p.symbol ? "bg-panel2 border-border text-text" : "border-transparent text-muted hover:text-text"}`}
              style={pair.symbol === p.symbol ? { borderColor: p.layer.hex } : {}}>
              <span className="mono">{p.symbol}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Swap / order form */}
        <section className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2"><ArrowDownUp size={16} /> Trade</h2>
            <div className="flex gap-1 text-xs">
              <button onClick={() => setSide("buy")} className={`px-3 py-1 rounded ${side === "buy" ? "bg-green/20 text-green" : "text-muted"}`}>Buy</button>
              <button onClick={() => setSide("sell")} className={`px-3 py-1 rounded ${side === "sell" ? "bg-red/20 text-red" : "text-muted"}`}>Sell</button>
            </div>
          </div>
          <Field label={`Amount (${pair.layer.id})`} value={amount} onChange={setAmount} />
          <Field label="Price (π)" value={price} onChange={setPrice} />
          <div className="text-xs text-muted flex justify-between">
            <span>Est. total</span>
            <span className="mono text-text">{(parseFloat(amount || "0") * parseFloat(price || "0")).toFixed(4)} π</span>
          </div>
          <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
            <input type="checkbox" checked={zkEnabled} onChange={(e) => setZkEnabled(e.target.checked)} className="accent-purple" />
            <Shield size={12} className="text-purple" /> Shielded order (BN254 · Groth16 proof)
          </label>
          <button onClick={submit}
            className={`w-full py-2.5 rounded-md font-semibold transition ${side === "buy" ? "bg-green text-black hover:brightness-110" : "bg-red text-white hover:brightness-110"}`}>
            {side === "buy" ? "Buy" : "Sell"} {pair.layer.id}
          </button>
          <div className="text-[10px] text-muted mono pt-2 border-t border-border">
            Router: PIDEX-ROUTER-V1 · Curve: xy=k + concentrated · Fee: 0.30% · MEV: private mempool
          </div>
        </section>

        {/* Order book */}
        <section className="card p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-3"><BookOpen size={16} /> Order Book</h2>
          <div className="text-[10px] text-muted grid grid-cols-3 mono mb-1">
            <span>Price</span><span className="text-right">Size</span><span className="text-right">ZK</span>
          </div>
          <div className="space-y-0.5 text-xs mono">
            {book.asks.slice(0, 8).reverse().map((o) => <BookRow key={o.id} o={o} maxSize={maxSize} />)}
            <div className="my-1 py-1 border-y border-border text-center text-sm font-bold" style={{ color: pair.layer.hex }}>
              {parseFloat(price).toFixed(4)} π
            </div>
            {book.bids.slice(0, 8).map((o) => <BookRow key={o.id} o={o} maxSize={maxSize} />)}
          </div>
        </section>

        {/* Trades */}
        <section className="card p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-3"><Activity size={16} /> Live Trades</h2>
          <div className="space-y-1 text-xs mono max-h-[26rem] overflow-auto">
            {trades.length === 0 && <div className="text-muted">Waiting for stream…</div>}
            {trades.map((t) => (
              <div key={t.id} className="flex justify-between items-center hover:bg-panel2/40 px-1 py-0.5 rounded">
                <span className={t.side === "buy" ? "text-green" : "text-red"}>{t.price.toFixed(4)}</span>
                <span className="text-muted">{t.size.toFixed(2)}</span>
                <span className="text-muted text-[10px]">{new Date(t.ts).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ZK / BN254 / Contract factory */}
      <div className="grid md:grid-cols-3 gap-4">
        <InfoCard icon={<Shield size={16} className="text-purple" />} title="Zero-Knowledge Layer" chips={["Groth16", "PLONK", "BN254"]}
          desc="Every shielded order emits a Groth16 proof over the BN254 pairing-friendly curve. The DEX verifies proofs on-chain via a precompiled verifier before matching, so trader identity and size stay private while settlement remains public.">
          <Row k="Curve" v="BN254 (alt-bn128)" />
          <Row k="Verifier" v="0x…VERIFIER01" />
          <Row k="Circuit" v="pidex/shielded_swap.r1cs" />
          <Row k="Proof size" v="192 bytes" />
        </InfoCard>
        <InfoCard icon={<Cpu size={16} className="text-blue" />} title="Contract Factory" chips={["Studio", "One-click deploy"]}
          desc="Builders spin up new pools, vaults, and PiRC-207 layer tokens from audited templates. Every deployment is registered to the master registry and inherits the 7-layer fairness invariants.">
          <Row k="Templates" v="AMM · CLMM · Vault · Oracle" />
          <Row k="Language" v="Soroban Rust · Solidity" />
          <Row k="Registry" v="MASTER-REGISTRY-V3" />
          <button className="mt-3 w-full py-2 rounded-md bg-panel2 border border-border text-xs hover:bg-panel2/70 flex items-center justify-center gap-1">
            <Plus size={12} /> Deploy a contract
          </button>
        </InfoCard>
        <InfoCard icon={<Zap size={16} className="text-gold" />} title="Builder SDK" chips={["TypeScript", "Rust"]}
          desc="Ship apps against PiDEX in minutes. Typed clients, React hooks, and a signer-agnostic transaction builder covering swap, add-liquidity, shielded transfer, and proof verification.">
          <code className="block mono text-[10px] bg-panel2 rounded p-2 leading-relaxed overflow-x-auto">
{`import { PiDEX, zk } from "@pirc/pidex-sdk";
const dex = PiDEX.mainnet();
const proof = await zk.prove("shielded_swap", { in: 10, out: 4 });
await dex.swap({ from: "L1", to: "π", amount: 10, proof });`}
          </code>
        </InfoCard>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        {[
          { icon: Lock, label: "Audited", value: "Trail of Bits · Halborn" },
          { icon: Shield, label: "MEV Protection", value: "Private mempool" },
          { icon: Activity, label: "Matching", value: "Hybrid CLOB + AMM" },
          { icon: Cpu, label: "Settlement", value: "Pi Mainnet + Soroban" },
        ].map((s) => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <s.icon size={18} className="text-muted" />
            <div>
              <div className="text-[10px] text-muted uppercase tracking-wide">{s.label}</div>
              <div className="text-sm font-semibold">{s.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-muted uppercase tracking-wide">{label}</div>
      <div className="mono font-semibold">{value}</div>
    </div>
  );
}
function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <div className="text-[10px] text-muted uppercase tracking-wide mb-1">{label}</div>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-panel2 border border-border rounded-md px-3 py-2 mono text-sm focus:outline-none focus:border-gold" />
    </label>
  );
}
function BookRow({ o, maxSize }: { o: Order; maxSize: number }) {
  const w = (o.size / maxSize) * 100;
  const bg = o.side === "buy" ? "rgba(63,185,80,0.12)" : "rgba(248,81,73,0.12)";
  return (
    <div className="relative grid grid-cols-3 px-1 py-0.5">
      <div className="absolute inset-y-0 right-0 rounded" style={{ width: `${w}%`, background: bg }} />
      <span className={`relative ${o.side === "buy" ? "text-green" : "text-red"}`}>{o.price.toFixed(4)}</span>
      <span className="relative text-right">{o.size.toFixed(2)}</span>
      <span className="relative text-right">{o.zk ? <Shield size={10} className="inline text-purple" /> : <span className="text-muted">·</span>}</span>
    </div>
  );
}
function InfoCard({ icon, title, chips, desc, children }: { icon: React.ReactNode; title: string; chips: string[]; desc: string; children?: React.ReactNode }) {
  return (
    <section className="card p-5">
      <div className="flex items-center gap-2 mb-2">{icon}<h3 className="font-semibold">{title}</h3></div>
      <div className="flex flex-wrap gap-1 mb-2">{chips.map((c) => <span key={c} className="chip">{c}</span>)}</div>
      <p className="text-xs text-muted leading-relaxed">{desc}</p>
      <div className="mt-3 space-y-1 text-xs">{children}</div>
    </section>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between border-b border-border/50 py-1"><span className="text-muted">{k}</span><span className="mono">{v}</span></div>;
}
