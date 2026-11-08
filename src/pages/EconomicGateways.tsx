import { Boxes, CheckCircle2, CircleAlert, ShieldCheck } from "lucide-react";
import { useI18n } from "@/i18n";
import { useMarketIndex } from "@/lib/market-index";
import { isCanonicalUsdQuote } from "@/lib/economics";

type GateState = "PASS" | "STALE" | "UNVERIFIED";

function GateCard({ id, title, description, state, evidence }: {
  id: string;
  title: string;
  description: string;
  state: GateState;
  evidence: string;
}) {
  const { t } = useI18n();
  const Icon = state === "PASS" ? CheckCircle2 : state === "STALE" ? CircleAlert : ShieldCheck;
  const label = state === "PASS" ? t("gate.status.pass") : state === "STALE" ? t("gate.status.stale") : t("gate.status.unverified");
  return (
    <section id={id} className="rounded-xl border border-border bg-panel/60 p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-panel2 border border-border flex items-center justify-center text-gold"><Icon size={18} /></span>
          <h2 className="font-semibold">{title}</h2>
        </div>
        <span className="chip">{label}</span>
      </div>
      <p className="text-sm text-muted">{description}</p>
      <p className="text-xs mono text-muted">{evidence}</p>
    </section>
  );
}

export default function EconomicGateways() {
  const { t } = useI18n();
  const market = useMarketIndex();
  const fresh = market.ts > 0 && Date.now() - market.ts <= 30_000;
  const sourceQuorum = fresh && market.index?.trusted === true && (market.index?.sources ?? 0) >= 3;
  const marketPass = sourceQuorum && isCanonicalUsdQuote(market.index);
  const marketState: GateState = marketPass ? "PASS" : sourceQuorum ? "UNVERIFIED" : "STALE";
  const marketEvidence = market.index
    ? isCanonicalUsdQuote(market.index)
      ? `${market.index.sources}/${market.index.totalSources} venues · ${market.index.deviationBps.toFixed(1)} bps · verified USD-normalized quote`
      : `${market.index.sources}/${market.index.totalSources} venues · PI/USDT reference only · USD parity not normalized`
    : "No accepted market quote";
  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-border bg-panel/60 p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-green flex items-center justify-center text-black"><Boxes size={20} /></span>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{t("nav.economicGates")}</h1>
            <p className="text-sm text-muted">{t("economics.liveFeedNote")}</p>
          </div>
        </div>
      </header>
      <GateCard id="market-data" title={t("gate.marketData.title")} description={t("gate.marketData.desc")} state={marketState} evidence={marketEvidence} />
      <GateCard id="utility-commerce" title={t("gate.utility.title")} description={t("gate.utility.desc")} state="UNVERIFIED" evidence="No verified merchant catalogue / fulfilment evidence feed is connected." />
      <GateCard id="velocity-liquidity" title={t("gate.velocity.title")} description={t("gate.velocity.desc")} state="UNVERIFIED" evidence="Raw event inbox is not a reconciled settlement or liquidity measurement." />
      <GateCard id="solvency-settlement" title={t("gate.solvency.title")} description={t("gate.solvency.desc")} state="UNVERIFIED" evidence="No verified reserve attestation, liability ledger and finality read-back feed is connected." />
      <p className="text-xs text-muted">A PASS on the market-data gateway only validates the displayed market quote. It does not authorize wallet signing, token issuance, payments, swaps, REF creation or settlement. All financial writes remain Testnet-only and fail closed.</p>
    </div>
  );
}
