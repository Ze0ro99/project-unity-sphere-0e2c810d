import { AlertTriangle, Blocks, Code2, Fingerprint, KeyRound, LockKeyhole, ShoppingBag, Wallet } from "lucide-react";

const ITEMS = [
  {
    id: "composer", title: "Contract Composer", icon: Code2, status: "DISABLED — APPROVED PIPELINE REQUIRED",
    detail: "Describe a function and generate a draft only from version-pinned, approved Soroban templates. Compilation, ABI validation, unit/property tests, static analysis, SBOM and human review must pass before a Testnet deployment can be requested.",
  },
  {
    id: "raw-factory", title: "RAW Factory", icon: Blocks, status: "SPECIFICATION / SCAFFOLD ONLY",
    detail: "The current RAW flow does not independently verify physical title, custody, certified-device signatures or inspection evidence, and does not deploy a verified contract. No physical asset or factory output is marked live here.",
  },
  {
    id: "registry", title: "Contract Registry", icon: Fingerprint, status: "READ-ONLY REFERENCES — DEPLOYMENT UNVERIFIED",
    detail: "A contract becomes verified only after Pi Testnet network identity, deployment transaction, contract ID, WASM code hash, initialized state, issuer/admin and metadata are independently read back and recorded.",
  },
  {
    id: "subscriptions", title: "PIRC-2 Subscription Gateway", icon: Wallet, status: "SCAFFOLD ABI — NOT TESTNET VERIFIED",
    detail: "The current subscription crate exposes initialize, mint, transfer, subscribe(user, plan), balance_of and ping. Service registration, token allowances, recurring process charges, cancellation/expiry lifecycle and the documented events are not implemented in the active ABI.",
  },
  {
    id: "marketplace", title: "Contract Marketplace", icon: ShoppingBag, status: "NOT IMPLEMENTED",
    detail: "No verified developer-to-developer listing, ownership/licence transfer, escrow, payment settlement, security review or dispute process is connected. Listings and purchases are therefore unavailable.",
  },
  {
    id: "quantum", title: "Post-Quantum Security", icon: KeyRound, status: "CRYPTO-AGILITY PLAN — NOT ON-CHAIN VERIFIED",
    detail: "ML-KEM / ML-DSA / SLH-DSA evaluation and hybrid migration are off-chain design work. The current Soroban contract path does not prove post-quantum signature verification; no quantum-secured claim is made.",
  },
];

export default function DeveloperStudio() {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-panel/60 p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-orange flex items-center justify-center text-black"><Code2 size={20} /></span>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Developer Studio / Contract Gateway</h1>
            <p className="text-sm text-muted">One governed entry point for contract creation, RAW evidence, subscriptions, registry and marketplace capabilities.</p>
          </div>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-400/5 p-3 text-sm text-amber-200">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <p>This gateway reports implementation evidence, not aspirational capability. Unavailable functions remain disabled; no generated or sample data is presented as live Testnet state.</p>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <article id={item.id} key={item.id} className="rounded-xl border border-border bg-panel/60 p-4">
              <div className="flex items-center gap-2">
                <Icon size={17} className="text-[#d8b56d]" />
                <h2 className="font-semibold">{item.title}</h2>
              </div>
              <p className="mt-3 text-[11px] font-semibold tracking-wide text-amber-300">{item.status}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{item.detail}</p>
            </article>
          );
        })}
      </section>

      <section className="rounded-xl border border-border bg-panel/60 p-4">
        <div className="flex items-center gap-2 font-semibold"><LockKeyhole size={16} /> Deployment release gate</div>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>Validate the request against a versioned capability and template registry.</li>
          <li>Build deterministic WASM and record its SHA-256 hash, ABI and dependency SBOM.</li>
          <li>Pass unit, authorization, property/fuzz, static-analysis and resource-budget tests.</li>
          <li>Require independent human/governance approval and an authorized Testnet-only deployment workflow.</li>
          <li>Read back transaction, contract ID, WASM hash, admin/issuer and initialized state before registry activation.</li>
        </ol>
        <p className="mt-3 text-xs text-muted">Mainnet writes, automatic signing, arbitrary WASM deployment and self-approval remain disabled.</p>
      </section>
    </div>
  );
}
