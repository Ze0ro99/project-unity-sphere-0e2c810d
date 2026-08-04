import { useEffect, useRef } from "react";
import type { Candle } from "@/lib/exchange";

/** Japanese candlestick chart with volume histogram, drawn on canvas. */
export default function CandleChart({
  candles,
  height = 380,
  accent = "#ffb020",
}: {
  candles: Candle[];
  height?: number;
  accent?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const box = wrap.current;
    if (!cv || !box || candles.length === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = box.clientWidth;
    const h = height;
    cv.width = w * dpr;
    cv.height = h * dpr;
    cv.style.width = `${w}px`;
    cv.style.height = `${h}px`;
    const g = cv.getContext("2d");
    if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);

    const padR = 62;
    const volH = 64;
    const priceH = h - volH - 18;
    const data = candles.slice(-Math.min(candles.length, Math.floor((w - padR) / 7)));
    const hi = Math.max(...data.map((c) => c.h));
    const lo = Math.min(...data.map((c) => c.l));
    const span = hi - lo || hi * 0.01;
    const top = hi + span * 0.08;
    const bot = lo - span * 0.08;
    const y = (p: number) => ((top - p) / (top - bot)) * priceH + 8;
    const cw = (w - padR) / data.length;
    const maxV = Math.max(...data.map((c) => c.v), 1);

    // grid + axis
    g.font = "10px JetBrains Mono, monospace";
    g.textBaseline = "middle";
    for (let i = 0; i <= 5; i++) {
      const py = 8 + (priceH / 5) * i;
      const val = top - ((top - bot) / 5) * i;
      g.strokeStyle = "rgba(36,48,73,0.7)";
      g.beginPath();
      g.moveTo(0, py);
      g.lineTo(w - padR, py);
      g.stroke();
      g.fillStyle = "#7d8ba6";
      g.fillText(val.toFixed(val < 1 ? 5 : 3), w - padR + 8, py);
    }

    data.forEach((c, i) => {
      const x = i * cw;
      const cx = x + cw / 2;
      const up = c.c >= c.o;
      const col = up ? "#3fb950" : "#f85149";

      // volume
      const vh = (c.v / maxV) * (volH - 8);
      g.fillStyle = up ? "rgba(63,185,80,0.28)" : "rgba(248,81,73,0.28)";
      g.fillRect(x + 1, h - 14 - vh, Math.max(1, cw - 2), vh);

      // wick
      g.strokeStyle = col;
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(Math.round(cx) + 0.5, y(c.h));
      g.lineTo(Math.round(cx) + 0.5, y(c.l));
      g.stroke();

      // body
      const yo = y(c.o);
      const yc = y(c.c);
      const bh = Math.max(1, Math.abs(yc - yo));
      g.fillStyle = col;
      g.fillRect(x + 1, Math.min(yo, yc), Math.max(1, cw - 2), bh);
    });

    // last price marker
    const last = data[data.length - 1];
    const ly = y(last.c);
    g.setLineDash([4, 4]);
    g.strokeStyle = accent;
    g.beginPath();
    g.moveTo(0, ly);
    g.lineTo(w - padR, ly);
    g.stroke();
    g.setLineDash([]);
    g.fillStyle = accent;
    g.fillRect(w - padR + 2, ly - 8, padR - 4, 16);
    g.fillStyle = "#0a0e17";
    g.fillText(last.c.toFixed(last.c < 1 ? 5 : 3), w - padR + 6, ly);
  }, [candles, height, accent]);

  return (
    <div ref={wrap} className="w-full">
      <canvas ref={ref} />
    </div>
  );
}
