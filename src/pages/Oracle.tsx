import { useCallback, useEffect, useRef, useState } from "react";
import { Radio, RefreshCw, ShieldCheck, AlertTriangle, Coins, Globe2 } from "lucide-react";
import {
  FEEDS,
  readAllFeeds,
  fetchPiVenues,
  aggregate,
  purchasingPower,
  piPurchasingPower,
  type FeedRound,
  type VenueQuote,
  type Aggregate,
  type PurchasingPower,
} from "@/lib/oracle";
import { useI18n } from "@/i18n";

const REFRESH_MS = 30_000;

function fmt(n: number, digits = 4) {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const d = abs >= 1000 ? 2 : abs >= 1 ? digits : 6;
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function age(sec: number) {
  if (!Number.isFinite(sec)) return "—";
  if (sec < 60) return `${Math.round(sec)}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}m`;
  return `${(sec / 3600).toFixed(1)}h`;
}

export default function Oracle() {
  const { t } = useI18n();
  const [rounds, setRounds] = useState<FeedRound[]>([]);
  const [venues, setVenues] = useState<VenueQuote[]>([]);
  const [agg, setAgg] = useState<Aggregate | null>(null);
  const [pp, setPp] = useState<PurchasingPower | null>(null);
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState<number>(0);
  const abort = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setLoading(true);
    try {
      const [r, v] = await Promise.all([
        readAllFeeds(ctrl.signal),
        fetchPiVenues(ctrl.signal).catch(() => [] as VenueQuote[]),
      ]);
      if (ctrl.signal.aborted) return;
      const a = aggregate(v);
      setRounds(r);
      setVenues(v);
      setAgg(a);
      setPp(purchasingPower(r, a.price));
      setUpdated(Date.now());
    } catch {
      /* transient network failure — retained last snapshot */
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      clearInterval(id);
      abort.current?.abort();
    };
  }, [load]);

  const liveFeeds = rounds.filter((r) => !r.error && !r.stale).length;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-panel/60 p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-orange flex items-center justify-center text-black">
            <Radio size={20} />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("oracle.title")}</h1>
            <p className="text-sm text-muted">{t("oracle.subtitle")}</p>
          </div>
          <button
            onClick={load}
            className="ml-auto flex items-center gap-2 text-xs mono px-3 py-2 rounded-md border border-border hover:bg-panel2 transition"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            {t("oracle.refresh")}
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Stat label={t("oracle.feedsLive")} value={`${liveFeeds} / ${FEEDS.length}`} />
          <Stat label={t("oracle.piMedian")} value={agg ? `$${fmt(agg.price, 4)}` : "—"} />
          <Stat label={t("oracle.deviation")} value={agg ? `${agg.deviationBps.toFixed(1)} bps` : "—"} />
          <Stat
            label={t("oracle.updated")}
            value={updated ? new Date(updated).toLocaleTimeString() : "—"}
          />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-panel/60 overflow-hidden">
        <header className="px-4 py-3 border-b border-border flex items-center gap-2 text-sm mono uppercase tracking-widest text-muted">
          <ShieldCheck size={14} /> {t("oracle.feeds")}
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted">
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2 font-medium">{t("oracle.pair")}</th>
                <th className="text-right px-4 py-2 font-medium">{t("oracle.answer")}</th>
                <th className="text-right px-4 py-2 font-medium">{t("oracle.round")}</th>
                <th className="text-right px-4 py-2 font-medium">{t("oracle.age")}</th>
                <th className="text-right px-4 py-2 font-medium">{t("oracle.status")}</th>
              </tr>
            </thead>
            <tbody className="mono">
              {(rounds.length ? rounds : FEEDS.map((def) => ({ def } as FeedRound))).map((r) => (
                <tr key={r.def.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-2">
                    <div className="font-semibold">{r.def.pair}</div>
                    <div className="text-[10px] text-muted uppercase">{r.def.category}</div>
                  </td>
                  <td className="px-4 py-2 text-right">{fmt(r.answer)}</td>
                  <td className="px-4 py-2 text-right text-muted text-xs">
                    {r.roundId ? `…${String(r.roundId).slice(-8)}` : "—"}
                  </td>
                  <td className="px-4 py-2 text-right text-muted">{age(r.ageSec)}</td>
                  <td className="px-4 py-2 text-right">
                    <Badge
                      ok={!!r.roundId && !r.stale && !r.error}
                      label={r.error ? t("oracle.error") : r.stale ? t("oracle.stale") : r.roundId ? t("oracle.fresh") : "…"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-panel/60 p-4">
          <header className="flex items-center gap-2 text-sm mono uppercase tracking-widest text-muted mb-3">
            <Globe2 size={14} /> {t("oracle.venues")}
          </header>
          <div className="space-y-2">
            {venues.length === 0 && <div className="text-xs text-muted">{t("oracle.noVenues")}</div>}
            {venues.map((v) => (
              <div key={v.venue} className="flex items-center justify-between text-sm mono">
                <span className="text-muted">{v.venue}</span>
                <span className="flex items-center gap-2">
                  {v.ok ? `$${fmt(v.price, 4)}` : "—"}
                  <Badge ok={v.ok} label={v.ok ? "OK" : t("oracle.down")} />
                </span>
              </div>
            ))}
          </div>
          {agg && (
            <div className="mt-4 pt-3 border-t border-border text-xs flex items-center gap-2">
              {agg.trusted ? (
                <ShieldCheck size={14} className="text-green" />
              ) : (
                <AlertTriangle size={14} className="text-orange" />
              )}
              <span className="text-muted">
                {agg.trusted ? t("oracle.quorumOk") : t("oracle.quorumFail")} · {agg.sources} src ·{" "}
                {agg.deviationBps.toFixed(1)} bps
              </span>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-panel/60 p-4">
          <header className="flex items-center gap-2 text-sm mono uppercase tracking-widest text-muted mb-3">
            <Coins size={14} /> {t("oracle.power")}
          </header>
          {pp ? (
            <div className="grid grid-cols-2 gap-3 text-sm mono">
              <Stat label="PPI" value={fmt(pp.ppi, 4)} />
              <Stat label={t("oracle.basket")} value={`$${fmt(pp.basketUsd, 2)}`} />
              <Stat label={t("oracle.goldGrams")} value={fmt(pp.goldGrams, 5)} />
              <Stat label={t("oracle.silverGrams")} value={fmt(pp.silverGrams, 4)} />
              <Stat label="π → EUR" value={fmt(pp.eur, 4)} />
              <Stat label="π → JPY" value={fmt(pp.jpy, 2)} />
              <Stat label="π → CNY" value={fmt(pp.cny, 4)} />
              <Stat label={t("oracle.realYield")} value={`${fmt(pp.realYieldBps, 1)} bps`} />
              <Stat label={t("oracle.coverage")} value={`${(pp.coverage * 100).toFixed(0)}%`} />
              <Stat label={t("oracle.piPower")} value={fmt(piPurchasingPower(pp), 4)} />
            </div>
          ) : (
            <div className="text-xs text-muted">…</div>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-border bg-panel/60 p-4 text-xs text-muted leading-relaxed">
        <div className="mono uppercase tracking-widest mb-2">{t("oracle.contracts")}</div>
        <ul className="space-y-1 mono">
          <li>contracts/chainlink_consumer/PiRCChainlinkConsumer.sol — AggregatorV3 + heartbeat guard</li>
          <li>contracts/pirc_oracle/src/lib.rs — Soroban median aggregator (PiRC-214)</li>
          <li>contracts/PiRC214Oracle.sol — registry-gated price registry</li>
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-panel2/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className="mono text-sm font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`text-[10px] mono px-2 py-0.5 rounded-full border ${
        ok ? "border-green/40 text-green" : "border-orange/40 text-orange"
      }`}
    >
      {label}
    </span>
  );
}
