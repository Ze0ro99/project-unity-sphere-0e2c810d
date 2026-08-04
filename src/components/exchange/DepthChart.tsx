import { useEffect, useRef } from "react";
import type { BookLevel } from "@/lib/exchange";

/** Cumulative depth chart (AMM + CLOB liquidity), canvas rendered. */
export default function DepthChart({
  bids,
  asks,
  height = 140,
}: {
  bids: BookLevel[];
  asks: BookLevel[];
  height?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const box = wrap.current;
    if (!cv || !box || bids.length === 0 || asks.length === 0) return;
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

    const maxTotal = Math.max(bids[bids.length - 1].total, asks[asks.length - 1].total);
    const half = w / 2;

    const draw = (levels: BookLevel[], dir: -1 | 1, stroke: string, fill: string) => {
      g.beginPath();
      g.moveTo(half, h);
      levels.forEach((l, i) => {
        const x = half + dir * ((i + 1) / levels.length) * half;
        const y = h - (l.total / maxTotal) * (h - 10);
        g.lineTo(x, y);
      });
      g.lineTo(half + dir * half, h);
      g.closePath();
      g.fillStyle = fill;
      g.fill();
      g.strokeStyle = stroke;
      g.lineWidth = 1.5;
      g.stroke();
    };

    draw(bids, -1, "#3fb950", "rgba(63,185,80,0.16)");
    draw(asks, 1, "#f85149", "rgba(248,81,73,0.16)");

    g.strokeStyle = "rgba(125,139,166,0.4)";
    g.setLineDash([3, 3]);
    g.beginPath();
    g.moveTo(half, 0);
    g.lineTo(half, h);
    g.stroke();
    g.setLineDash([]);
  }, [bids, asks, height]);

  return (
    <div ref={wrap} className="w-full">
      <canvas ref={ref} />
    </div>
  );
}
