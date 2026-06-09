import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CandlestickChart } from "@/components/CandlestickChart";
import { usePiPrice, usePiOhlc, usePiExchanges, type CandleRange } from "@/lib/pi-horizon";
import { useState } from "react";
import { TrendingUp, TrendingDown, ExternalLink, Activity, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/markets")({
  head: () => ({ meta: [
    { title: "Markets — PiRC" },
    { name: "description", content: "Live Pi Network price, candlestick chart and exchange tickers." },
  ] }),
  component: MarketsPage,
});

function MarketsPage() {
  const [range, setRange] = useState<CandleRange>("7");
  const price = usePiPrice();
  const candles = usePiOhlc(range);
  const exchanges = usePiExchanges();

  const change = price.data?.usd_24h_change ?? 0;
  const up = change >= 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-gold" /> Pi Markets
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time aggregated price · TradingView candlesticks</p>
          </div>
          <div className="flex items-end gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">PI / USD</div>
              <div className="text-3xl font-bold text-gold">${price.data?.usd?.toFixed(4) ?? "—"}</div>
            </div>
            <Badge variant="outline" className={`gap-1 ${up ? "text-emerald-400 border-emerald-400/40" : "text-destructive border-destructive/40"}`}>
              {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} {change.toFixed(2)}%
            </Badge>
          </div>
        </div>

        <Card className="glass border-0 p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5 text-gold" /> Live OHLC · auto-refresh 60s
            </div>
            <Tabs value={range} onValueChange={(v) => setRange(v as CandleRange)}>
              <TabsList className="bg-secondary/40">
                <TabsTrigger value="1">1D</TabsTrigger>
                <TabsTrigger value="7">7D</TabsTrigger>
                <TabsTrigger value="30">30D</TabsTrigger>
                <TabsTrigger value="90">90D</TabsTrigger>
                <TabsTrigger value="365">1Y</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {candles.isLoading ? (
            <div className="h-[360px] flex items-center justify-center text-muted-foreground text-sm">Loading chart…</div>
          ) : candles.error ? (
            <div className="h-[360px] flex items-center justify-center text-destructive text-sm">Chart data temporarily unavailable</div>
          ) : (
            <CandlestickChart data={candles.data ?? []} />
          )}
        </Card>

        <div className="grid sm:grid-cols-3 gap-4 mb-5">
          <Card className="glass border-0 p-4">
            <div className="text-xs text-muted-foreground">24h Volume</div>
            <div className="text-xl font-bold text-foreground mt-1">
              ${price.data?.usd_24h_vol ? Math.round(price.data.usd_24h_vol).toLocaleString() : "—"}
            </div>
          </Card>
          <Card className="glass border-0 p-4">
            <div className="text-xs text-muted-foreground">Market Cap</div>
            <div className="text-xl font-bold text-foreground mt-1">
              ${price.data?.usd_market_cap ? Math.round(price.data.usd_market_cap).toLocaleString() : "—"}
            </div>
          </Card>
          <Card className="glass border-0 p-4">
            <div className="text-xs text-muted-foreground">Exchanges Tracked</div>
            <div className="text-xl font-bold text-foreground mt-1">{exchanges.data?.length ?? 0}</div>
          </Card>
        </div>

        <Card className="glass border-0 p-5">
          <h2 className="font-semibold text-foreground mb-3">Exchange Tickers</h2>
          <div className="divide-y divide-border/40">
            {(exchanges.data ?? []).slice(0, 20).map((t, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="gold-border text-gold text-[10px]">{t.market.name}</Badge>
                  <span className="text-foreground">{t.base}/{t.target}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-foreground font-mono">${t.converted_last.usd.toFixed(4)}</span>
                  <span className="text-muted-foreground hidden sm:inline">vol ${Math.round(t.volume).toLocaleString()}</span>
                  {t.trade_url && (
                    <a href={t.trade_url} target="_blank" rel="noreferrer" className="text-gold hover:underline inline-flex items-center gap-1">
                      Trade <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
            {!exchanges.isLoading && (exchanges.data?.length ?? 0) === 0 && (
              <div className="py-6 text-center text-muted-foreground text-sm">No exchange data available.</div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
