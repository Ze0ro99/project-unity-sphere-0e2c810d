import { useMemo, useState } from "react";
import { Vote, Landmark, KeyRound, CheckCircle2, XCircle } from "lucide-react";
import { LAYERS, ISSUER, MASTER_REGISTRY } from "@/data/layers";
import { verifyStrKey } from "@/lib/strkey";
import { num, pct, creditCeiling, PARITY } from "@/lib/sovereign";

type Proposal = {
  id: string;
  title: string;
  standard: string;
  body: string;
  for: number;
  against: number;
  quorum: number;
  status: "active" | "passed" | "rejected";
  endsIn: string;
};

const SEED: Proposal[] = [
  { id: "PIP-207-14", title: "Raise L4 Blue liquidity guardrail to 12% depth floor", standard: "PiRC-215", body: "Bind the liquidity_controller floor to 12% of layer TVL so AMM routing cannot drain the settlement corridor during volatility.", for: 61_200, against: 8_400, quorum: 50_000, status: "active", endsIn: "2d 14h" },
  { id: "PIP-251-03", title: "Tighten quadratic breaker ceiling from 800 to 650 bps", standard: "PiRC-251", body: "Reduce the halt threshold after three TWAP dislocations were observed on L3 Orange settlement.", for: 34_100, against: 29_900, quorum: 50_000, status: "active", endsIn: "5d 02h" },
  { id: "PIP-213-08", title: "Admit tokenised eyewear RWA batch to L1 Gold reserve", standard: "PiRC-213", body: "Accept the verified RWA batch (spec/rwa_auth_schema_v0.3) as reserve collateral at a 70% haircut.", for: 88_700, against: 4_100, quorum: 50_000, status: "passed", endsIn: "closed" },
  { id: "PIP-800-02", title: "Activate on-chain BN254 pairing once protocol v25 lands", standard: "PiRC-800", body: "Flip the bn254 feature flag on the verifier contract and retire commitment-mode attestation.", for: 12_400, against: 41_800, quorum: 50_000, status: "rejected", endsIn: "closed" },
];

const SIGNERS = [
  { name: "Registry Keeper", weight: 1, key: MASTER_REGISTRY },
  { name: "Reserve Custodian", weight: 1, key: LAYERS[1].address },
  { name: "Liquidity Controller", weight: 1, key: LAYERS[4].address },
  { name: "Governance Matrix", weight: 1, key: LAYERS[6].address },
  { name: "Sovereign Issuer", weight: 1, key: ISSUER },
];
const THRESHOLD = 3;

export default function Governance() {
  const [proposals, setProposals] = useState(SEED);
  const [votes, setVotes] = useState<Record<string, "for" | "against">>({});
  const [signed, setSigned] = useState<string[]>([SIGNERS[0].name, SIGNERS[1].name]);
  const power = 1_000;

  const treasury = useMemo(
    () => LAYERS.map((l, i) => ({
      layer: l,
      balance: [412_000, 1_884_000, 96_500, 730_400, 2_140_900, 305_800, 58_200][i],
      locked: [0.12, 0.44, 0.05, 0.21, 0.58, 0.09, 0.31][i],
    })),
    [],
  );
  const totalTreasury = treasury.reduce((s, t) => s + t.balance, 0);

  function castVote(id: string, dir: "for" | "against") {
    if (votes[id]) return;
    setVotes((v) => ({ ...v, [id]: dir }));
    setProposals((ps) =>
      ps.map((p) => (p.id === id ? { ...p, [dir]: p[dir] + power } as Proposal : p)),
    );
  }

  function toggleSign(name: string) {
    setSigned((s) => (s.includes(name) ? s.filter((x) => x !== name) : [...s, name]));
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-panel/60 p-5">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-red to-orange flex items-center justify-center text-black">
            <Landmark size={20} />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Governance & Treasury</h1>
            <p className="text-sm text-muted">
              PiRC-207 multisig keeper set, L6 Red governance matrix voting, and sovereign treasury operations.
            </p>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 space-y-3">
          {proposals.map((p) => {
            const total = p.for + p.against;
            const support = total ? p.for / total : 0;
            const quorumMet = total >= p.quorum;
            return (
              <article key={p.id} className="rounded-xl border border-border bg-panel/60 p-4">
                <div className="flex items-start gap-3">
                  <span className="mono text-[10px] px-1.5 py-0.5 rounded border border-border text-muted shrink-0">{p.id}</span>
                  <div className="flex-1">
                    <h2 className="text-sm font-semibold">{p.title}</h2>
                    <p className="text-xs text-muted mt-1">{p.body}</p>
                  </div>
                  <span className={`text-[10px] mono uppercase px-2 py-0.5 rounded shrink-0 ${
                    p.status === "active" ? "bg-blue/15 text-blue" : p.status === "passed" ? "bg-green/15 text-green" : "bg-red/15 text-red"
                  }`}>{p.status}</span>
                </div>

                <div className="mt-3 h-2 rounded-full bg-panel2 overflow-hidden flex">
                  <div className="h-full bg-green" style={{ width: `${support * 100}%` }} />
                  <div className="h-full bg-red" style={{ width: `${(1 - support) * 100}%` }} />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] mono text-muted">
                  <span className="text-green">For {num(p.for)}</span>
                  <span className="text-red">Against {num(p.against)}</span>
                  <span>Support {pct(support, 1)}</span>
                  <span className={quorumMet ? "text-green" : "text-orange"}>
                    Quorum {num(total)} / {num(p.quorum)}
                  </span>
                  <span>{p.standard}</span>
                  <span className="ml-auto">Ends {p.endsIn}</span>
                </div>

                {p.status === "active" && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => castVote(p.id, "for")}
                      disabled={!!votes[p.id]}
                      className="flex-1 py-1.5 rounded-md text-xs font-semibold bg-green/15 text-green border border-green/30 hover:bg-green/25 disabled:opacity-40 transition"
                    >
                      {votes[p.id] === "for" ? "Voted for" : `Vote for · ${num(power)} L6`}
                    </button>
                    <button
                      onClick={() => castVote(p.id, "against")}
                      disabled={!!votes[p.id]}
                      className="flex-1 py-1.5 rounded-md text-xs font-semibold bg-red/15 text-red border border-red/30 hover:bg-red/25 disabled:opacity-40 transition"
                    >
                      {votes[p.id] === "against" ? "Voted against" : `Vote against · ${num(power)} L6`}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </section>

        <section className="space-y-4">
          <div className="rounded-xl border border-border bg-panel/60 p-4">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <KeyRound size={15} className="text-gold" /> Keeper multisig · {signed.length}-of-{SIGNERS.length}
            </h2>
            <ul className="space-y-2 text-xs">
              {SIGNERS.map((s) => {
                const check = verifyStrKey(s.key);
                const on = signed.includes(s.name);
                return (
                  <li key={s.name} className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSign(s.name)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md border transition ${
                        on ? "border-green/40 bg-green/10 text-green" : "border-border text-muted hover:text-text"
                      }`}
                    >
                      {on ? <CheckCircle2 size={12} /> : <XCircle size={12} />} {on ? "Signed" : "Pending"}
                    </button>
                    <div className="min-w-0">
                      <div className="truncate">{s.name}</div>
                      <div className={`mono text-[10px] truncate ${check.valid ? "text-muted" : "text-red"}`}>
                        {check.valid ? `${s.key.slice(0, 6)}…${s.key.slice(-4)}` : `invalid key — ${check.reason}`}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className={`mt-3 text-xs mono ${signed.length >= THRESHOLD ? "text-green" : "text-orange"}`}>
              {signed.length >= THRESHOLD
                ? `Threshold met (${THRESHOLD}) — execution authorised`
                : `Needs ${THRESHOLD - signed.length} more signature(s)`}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-panel/60 p-4">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><Vote size={15} className="text-gold" /> Treasury vaults</h2>
            <ul className="space-y-2 text-xs">
              {treasury.map((t) => (
                <li key={t.layer.id}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: t.layer.hex }} />
                    <span>{t.layer.id} {t.layer.name}</span>
                    <span className="ml-auto mono">{num(t.balance)}</span>
                  </div>
                  <div className="h-1 mt-1 rounded-full bg-panel2 overflow-hidden">
                    <div className="h-full" style={{ width: `${t.locked * 100}%`, background: t.layer.hex }} />
                  </div>
                  <div className="text-[10px] text-muted mono">{pct(t.locked, 0)} locked in vault</div>
                </li>
              ))}
            </ul>
            <dl className="mt-3 pt-3 border-t border-border/60 text-xs space-y-1 mono">
              <div className="flex justify-between"><dt className="text-muted">Total treasury</dt><dd>{num(totalTreasury)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Credit ceiling</dt><dd>{num(creditCeiling(totalTreasury))} π</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Parity target</dt><dd className="text-gold">{PARITY.toLocaleString()}</dd></div>
            </dl>
          </div>
        </section>
      </div>
    </div>
  );
}
