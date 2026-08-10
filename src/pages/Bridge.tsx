import { useMemo, useState } from "react";
import { ArrowLeftRight, Link2, ShieldCheck, Timer } from "lucide-react";
import { LAYERS } from "@/data/layers";
import { num, pct, assessAml } from "@/lib/sovereign";

type Chain = { id: string; name: string; passphrase: string; horizon: string; finalitySec: number; confirmations: number };

const CHAINS: Chain[] = [
  { id: "pi-mainnet", name: "Pi Mainnet", passphrase: "Pi Network", horizon: "api.mainnet.minepi.com", finalitySec: 5, confirmations: 1 },
  { id: "pi-testnet", name: "Pi Testnet", passphrase: "Pi Testnet", horizon: "api.testnet.minepi.com", finalitySec: 5, confirmations: 1 },
  { id: "stellar-testnet", name: "Stellar Testnet", passphrase: "Test SDF Network ; September 2015", horizon: "horizon-testnet.stellar.org", finalitySec: 5, confirmations: 1 },
  { id: "stellar-public", name: "Stellar Public", passphrase: "Public Global Stellar Network ; September 2015", horizon: "horizon.stellar.org", finalitySec: 5, confirmations: 1 },
];

/** PiRC-210 bridge fee schedule: 8 bps corridor fee + fixed relayer cost. */
const CORRIDOR_BPS = 8;
const RELAYER_PI = 0.0003;

export default function Bridge() {
  const [from, setFrom] = useState("pi-mainnet");
  const [to, setTo] = useState("stellar-testnet");
  const [asset, setAsset] = useState("GOLD");
  const [amount, setAmount] = useState(500);
  const [log, setLog] = useState<{ ts: number; text: string; tone: string }[]>([]);

  const src = CHAINS.find((c) => c.id === from)!;
  const dst = CHAINS.find((c) => c.id === to)!;
  const corridorFee = (amount * CORRIDOR_BPS) / 10_000;
  const received = Math.max(0, amount - corridorFee - RELAYER_PI);
  const etaSec = src.finalitySec * src.confirmations + dst.finalitySec * dst.confirmations + 6;

  const aml = useMemo(
    () => assessAml({
      notionalPi: amount,
      counterpartyAgeDays: 120,
      crossChain: true,
      shielded: false,
      sanctionedJurisdiction: false,
      velocity24h: 4,
    }),
    [amount],
  );

  const push = (text: string, tone = "text-muted") =>
    setLog((l) => [{ ts: Date.now(), text, tone }, ...l].slice(0, 40));

  function simulate() {
    if (from === to) return push("Source and destination chains must differ.", "text-red");
    if (amount <= RELAYER_PI) return push("Amount below relayer cost.", "text-red");
    push(`1/5 Lock ${num(amount)} ${asset} in vault on ${src.name}`, "text-blue");
    push(`2/5 Attest lock — ${src.confirmations} confirmation(s), passphrase "${src.passphrase}"`, "text-muted");
    push(`3/5 AML screen: band ${aml.band.toUpperCase()} · score ${aml.score}`, aml.requiresEdd ? "text-orange" : "text-green");
    push(`4/5 Relay proof to ${dst.name} keeper set (3-of-5 multisig)`, "text-muted");
    push(`5/5 Mint ${num(received)} ${asset} on ${dst.name} · ETA ${etaSec}s`, "text-green");
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-panel/60 p-5">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue to-green flex items-center justify-center text-black">
            <ArrowLeftRight size={20} />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Cross-Chain Bridge</h1>
            <p className="text-sm text-muted">
              PiRC-210 lock-and-mint corridors between Pi and Stellar networks, screened by the PiRC-211.5 compliance gateway.
            </p>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 rounded-xl border border-border bg-panel/60 p-4 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs text-muted">
              From chain
              <select value={from} onChange={(e) => setFrom(e.target.value)}
                className="mt-1 w-full bg-panel2 border border-border rounded-md px-2 py-2 text-sm text-text">
                {CHAINS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="text-xs text-muted">
              To chain
              <select value={to} onChange={(e) => setTo(e.target.value)}
                className="mt-1 w-full bg-panel2 border border-border rounded-md px-2 py-2 text-sm text-text">
                {CHAINS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="text-xs text-muted">
              Asset
              <select value={asset} onChange={(e) => setAsset(e.target.value)}
                className="mt-1 w-full bg-panel2 border border-border rounded-md px-2 py-2 text-sm text-text">
                <option value="PI">π (native)</option>
                {LAYERS.map((l) => <option key={l.id} value={l.name.toUpperCase()}>{l.name.toUpperCase()} · {l.role}</option>)}
              </select>
            </label>
            <label className="text-xs text-muted">
              Amount
              <input type="number" min={0} step={0.0001} value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="mt-1 w-full bg-panel2 border border-border rounded-md px-2 py-2 text-sm text-text mono" />
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="rounded-lg border border-border bg-panel2/30 px-3 py-2">
              <div className="text-muted">Corridor fee</div>
              <div className="mono">{num(corridorFee, 4)} · {CORRIDOR_BPS} bps</div>
            </div>
            <div className="rounded-lg border border-border bg-panel2/30 px-3 py-2">
              <div className="text-muted">Relayer</div>
              <div className="mono">{RELAYER_PI} π</div>
            </div>
            <div className="rounded-lg border border-border bg-panel2/30 px-3 py-2">
              <div className="text-muted">You receive</div>
              <div className="mono text-green">{num(received, 4)} {asset}</div>
            </div>
            <div className="rounded-lg border border-border bg-panel2/30 px-3 py-2">
              <div className="text-muted flex items-center gap-1"><Timer size={11} /> ETA</div>
              <div className="mono">{etaSec}s</div>
            </div>
          </div>

          <button onClick={simulate}
            className="w-full py-2.5 rounded-md bg-gradient-to-r from-gold to-orange text-black font-semibold text-sm hover:opacity-90 transition">
            Route transfer through corridor
          </button>

          <div className="rounded-lg border border-border bg-panel2/20 p-3 max-h-64 overflow-auto">
            {log.length === 0 ? (
              <p className="text-xs text-muted">Corridor log is empty — route a transfer to trace the lock → attest → relay → mint lifecycle.</p>
            ) : (
              <ul className="text-xs mono space-y-1">
                {log.map((l, i) => (
                  <li key={i} className={l.tone}>
                    <span className="text-muted">{new Date(l.ts).toLocaleTimeString()} </span>{l.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-xl border border-border bg-panel/60 p-4">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><ShieldCheck size={15} className="text-gold" /> Compliance pre-check</h2>
            <div className="text-xs space-y-1.5">
              <div className="flex justify-between"><span className="text-muted">Risk score</span><span className="mono">{aml.score}/100</span></div>
              <div className="flex justify-between"><span className="text-muted">Band</span>
                <span className={`mono uppercase ${aml.band === "low" ? "text-green" : aml.band === "medium" ? "text-yellow" : "text-red"}`}>{aml.band}</span>
              </div>
              <div className="flex justify-between"><span className="text-muted">EDD required</span><span className="mono">{aml.requiresEdd ? "Yes" : "No"}</span></div>
              <p className="text-muted pt-2 border-t border-border/60">{aml.micarArticle}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-panel/60 p-4">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><Link2 size={15} className="text-gold" /> Corridor endpoints</h2>
            <ul className="text-xs space-y-2">
              {CHAINS.map((c) => (
                <li key={c.id} className="border-b border-border/60 pb-2 last:border-0">
                  <div className="font-semibold">{c.name}</div>
                  <div className="mono text-muted break-all">{c.horizon}</div>
                  <div className="mono text-muted">finality ~{c.finalitySec}s · {pct(1 / (c.confirmations + 1), 0)} reorg budget</div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
