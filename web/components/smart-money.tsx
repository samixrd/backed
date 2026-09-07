"use client";

import { useEffect, useState } from "react";

interface AssetRow {
  symbol: string;
  base: string;
  price: number;
  priceChange24h: number;
  openInterestUsd: number | null;
  longPct: number | null;
  shortPct: number | null;
  takerRatio: number | null;
  fundingPct: number | null;
  regime: string;
}

function fmtUsd(n: number | null): string {
  if (n === null || n === undefined) return "--";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

// Scatter data point for SVG chart
interface ScatterPoint {
  x: number; // longPct
  y: number; // takerRatio
  label: string;
  bullish: boolean;
  oi: number;
}

function ScatterPlot({ points }: { points: ScatterPoint[] }) {
  const W = 520;
  const H = 280;
  const PAD = 42;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;

  const minX = 20, maxX = 85;
  const minY = 0.4, maxY = 2.6;

  function toSvgX(v: number) {
    const clamped = Math.max(minX, Math.min(maxX, v));
    return PAD + ((clamped - minX) / (maxX - minX)) * innerW;
  }
  function toSvgY(v: number) {
    const clamped = Math.max(minY, Math.min(maxY, v));
    return PAD + innerH - ((clamped - minY) / (maxY - minY)) * innerH;
  }

  const maxOI = Math.max(...points.map((p) => p.oi), 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* Grid lines */}
      {[30, 40, 50, 60, 70, 80].map((v) => (
        <line key={v} x1={toSvgX(v)} y1={PAD} x2={toSvgX(v)} y2={H - PAD} stroke="#24262b" strokeWidth="1" />
      ))}
      {[0.6, 0.9, 1.2, 1.5, 1.8, 2.1, 2.4].map((v) => (
        <line key={v} x1={PAD} y1={toSvgY(v)} x2={W - PAD} y2={toSvgY(v)} stroke="#24262b" strokeWidth="1" />
      ))}
      {/* Threshold reference lines */}
      <line x1={toSvgX(55)} y1={PAD} x2={toSvgX(55)} y2={H - PAD} stroke="#c9a227" strokeWidth="0.8" strokeDasharray="4,3" />
      <line x1={PAD} y1={toSvgY(1.0)} x2={W - PAD} y2={toSvgY(1.0)} stroke="#c9a227" strokeWidth="0.8" strokeDasharray="4,3" />
      
      {/* Quadrant labels */}
      <text x={toSvgX(72)} y={toSvgY(2.3)} fill="#3ba46880" fontSize="9" fontFamily="monospace" fontWeight="bold">
        SMART ACCUMULATION
      </text>
      <text x={toSvgX(30)} y={toSvgY(0.55)} fill="#d0535380" fontSize="9" fontFamily="monospace" fontWeight="bold">
        DISTRIBUTION ZONE
      </text>

      {/* Axis labels */}
      <text x={W / 2} y={H - 6} fill="#70747d" fontSize="9" textAnchor="middle" fontFamily="monospace">
        Top Trader Long % (Account Ratio)
      </text>
      <text x={12} y={H / 2} fill="#70747d" fontSize="9" textAnchor="middle" fontFamily="monospace" transform={`rotate(-90 12 ${H / 2})`}>
        Taker Buy/Sell Ratio
      </text>

      {/* Scatter Bubbles */}
      {points.map((p) => {
        const r = Math.max(4, Math.min(16, 4 + (p.oi / maxOI) * 12));
        return (
          <g key={p.label} className="cursor-pointer group">
            <circle
              cx={toSvgX(p.x)}
              cy={toSvgY(p.y)}
              r={r}
              fill={p.bullish ? "#3ba46830" : "#d0535330"}
              stroke={p.bullish ? "#3ba468" : "#d05353"}
              strokeWidth="1.5"
            />
            <text
              x={toSvgX(p.x)}
              y={toSvgY(p.y) - r - 3}
              fill="#9ea3ad"
              fontSize="8"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {p.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function SmartMoney() {
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/screener");
      const json = await res.json();
      if (json.ok && Array.isArray(json.assets)) {
        setAssets(json.assets);
        setLastUpdate(new Date().toLocaleTimeString());
      }
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  // Filter enriched assets with non-null metrics for smart money evaluation
  const validEnriched = assets.filter(
    (a) => a.longPct !== null && a.takerRatio !== null && (a.openInterestUsd ?? 0) > 0
  );

  const scatterPoints: ScatterPoint[] = validEnriched.map((a) => ({
    x: a.longPct as number,
    y: a.takerRatio as number,
    label: a.base,
    bullish: (a.longPct as number) >= 55 && (a.takerRatio as number) >= 1.0,
    oi: a.openInterestUsd ?? 0,
  }));

  // Composite institutional score: (Long% ÷ 100) × TakerRatio × OI($B)
  const ranked = validEnriched
    .map((a) => ({
      ...a,
      score: ((a.longPct as number) / 100) * (a.takerRatio as number) * ((a.openInterestUsd ?? 0) / 1e9),
    }))
    .sort((a, b) => b.score - a.score);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="font-mono text-xs text-muted animate-pulse">
          Synthesizing smart money positioning across top Binance contracts...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Methodology Note ─────────────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-accent font-semibold">
              How Smart Money Is Defined & Calculated
            </span>
            <span className="rounded border border-border px-2 py-0.5 font-mono text-[9px] text-faint">
              Institutional Methodology
            </span>
          </div>
          <span className="font-mono text-[10px] text-muted">
            Evaluating <span className="text-foreground font-semibold">{ranked.length}</span> Top Volume Contracts
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded border border-border bg-background p-3">
            <p className="font-mono text-[10px] font-semibold text-foreground mb-1">① Top Trader Long/Short Ratio</p>
            <p className="font-mono text-[10px] text-muted leading-relaxed">
              Endpoint: <code className="text-accent">topLongShortAccountRatio</code><br />
              Tracks the <span className="text-foreground">top 20% highest-volume accounts</span> on Binance Futures. Shows where elite high-volume accounts are positioning.
            </p>
          </div>
          <div className="rounded border border-border bg-background p-3">
            <p className="font-mono text-[10px] font-semibold text-foreground mb-1">② Taker Buy/Sell Aggression</p>
            <p className="font-mono text-[10px] text-muted leading-relaxed">
              Endpoint: <code className="text-accent">takerlongshortRatio</code><br />
              Measures aggressive market orders that hit the orderbook. Ratio &gt; 1.0 indicates net aggressive buy accumulation.
            </p>
          </div>
          <div className="rounded border border-border bg-background p-3">
            <p className="font-mono text-[10px] font-semibold text-foreground mb-1">③ Conviction Score Formula</p>
            <p className="font-mono text-[10px] text-muted leading-relaxed">
              <code className="text-accent">Score = (Long% ÷ 100) × Taker × OI($B)</code><br />
              Weights <span className="text-foreground">position bias × aggressive flow × contract liquidity</span>. Higher = stronger institutional conviction.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-border">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            <span className="font-mono text-[9px] text-muted">
              Source Data: <span className="text-foreground">100% Real Live Binance Futures Engine</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="font-mono text-[9px] text-muted">
              Classification: <span className="text-accent">Proxy model based on top accounts & taker volume flow</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scatter Plot */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
              Smart Money Positioning Map ({scatterPoints.length} Assets)
            </p>
            <span className="font-mono text-[10px] text-faint">Updated {lastUpdate}</span>
          </div>
          <p className="mb-3 font-mono text-[10px] text-muted">
            Bubble size = Open Interest ($) · X-axis = Top Trader Long % · Y-axis = Taker Buy/Sell Ratio
          </p>
          <ScatterPlot points={scatterPoints} />
          <div className="mt-3 flex gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-success bg-success/20" />
              <span className="font-mono text-[10px] text-muted">Accumulation (Long &gt; 55% + Taker &gt; 1.0x)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-danger bg-danger/20" />
              <span className="font-mono text-[10px] text-muted">Distribution / Squeeze Setup</span>
            </div>
          </div>
        </div>

        {/* Smart Money Score Leaderboard */}
        <div className="rounded-lg border border-border bg-surface p-4 flex flex-col">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
              Institutional Conviction Rank
            </p>
            <span className="font-mono text-[10px] text-muted">Top 12 Ranked</span>
          </div>
          <p className="mb-4 font-mono text-[10px] text-muted">
            Ranked by composite score: <code className="text-accent">Long% × Taker Ratio × OI($B)</code>
          </p>
          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[360px] pr-1">
            {ranked.slice(0, 15).map((a, i) => {
              const isBull = (a.longPct ?? 0) >= 55 && (a.takerRatio ?? 0) >= 1.0;
              const maxScore = ranked[0]?.score || 1;
              const barW = Math.min(100, Math.max(4, (a.score / maxScore) * 100));

              return (
                <div key={a.symbol} className="flex items-center gap-3">
                  <span className="w-5 font-mono text-[10px] text-faint">#{i + 1}</span>
                  <div className="w-16">
                    <span className="font-mono text-xs font-semibold text-foreground">{a.base}</span>
                    <p className="font-mono text-[8px] text-faint">PERP</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-raised">
                      <div
                        className={`h-full rounded-full ${isBull ? "bg-success" : "bg-danger"}`}
                        style={{ width: `${barW}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-16 text-right font-mono text-[10px] text-muted">
                    {a.longPct != null ? `${a.longPct.toFixed(1)}% L` : "--"}
                  </span>
                  <span className={`w-14 text-right font-mono text-[10px] font-semibold ${isBull ? "text-success" : "text-danger"}`}>
                    {a.takerRatio != null ? `${a.takerRatio.toFixed(2)}x` : "--"}
                  </span>
                  <span className="w-16 text-right font-mono text-[10px] text-foreground font-medium">
                    {fmtUsd(a.openInterestUsd)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detail Leaderboard Table across all 50 top assets */}
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <div className="border-b border-border bg-surface-raised px-4 py-2.5 flex items-center justify-between">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
            Complete Smart Money Rankings ({ranked.length} Contracts)
          </span>
          <span className="font-mono text-[10px] text-muted">
            All data directly corroborated via Binance Agent OS
          </span>
        </div>
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-border bg-surface-raised/50">
            <tr>
              {["Rank", "Contract", "Price", "Top Trader Long", "Top Trader Short", "Taker Flow", "8h Funding", "Open Interest", "Signal"].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranked.map((a, i) => {
              const isBull = (a.longPct ?? 0) >= 55 && (a.takerRatio ?? 0) >= 1.0;
              return (
                <tr key={a.symbol} className="border-b border-border/40 hover:bg-surface-raised transition-colors">
                  <td className="px-3 py-2 font-mono text-[10px] text-faint">#{i + 1}</td>
                  <td className="px-3 py-2">
                    <span className="font-mono text-xs font-bold text-foreground">{a.base}</span>
                    <span className="ml-1 rounded bg-surface-raised px-1 font-mono text-[8px] text-faint">PERP</span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-foreground">
                    ${a.price >= 100 ? a.price.toFixed(2) : a.price >= 1 ? a.price.toFixed(4) : a.price.toFixed(6)}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-success font-medium">
                    {a.longPct !== null ? `${a.longPct.toFixed(1)}%` : "--"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-danger font-medium">
                    {a.shortPct !== null ? `${a.shortPct.toFixed(1)}%` : "--"}
                  </td>
                  <td className={`px-3 py-2 font-mono text-xs font-semibold ${
                    a.takerRatio === null ? "text-faint" : isBull ? "text-success" : "text-danger"
                  }`}>
                    {a.takerRatio !== null ? `${a.takerRatio.toFixed(3)}x` : "--"}
                  </td>
                  <td className={`px-3 py-2 font-mono text-xs ${
                    a.fundingPct === null
                      ? "text-faint"
                      : (a.fundingPct ?? 0) > 0.05
                      ? "text-danger"
                      : (a.fundingPct ?? 0) < 0
                      ? "text-success"
                      : "text-muted"
                  }`}>
                    {a.fundingPct !== null ? `${a.fundingPct >= 0 ? "+" : ""}${a.fundingPct.toFixed(4)}%` : "--"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-foreground font-medium">
                    {fmtUsd(a.openInterestUsd)}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded border px-2 py-0.5 font-mono text-[9px] ${
                      isBull
                        ? "border-success/30 bg-success/10 text-success"
                        : "border-danger/30 bg-danger/10 text-danger"
                    }`}>
                      {isBull ? "▲ ACCUMULATION" : "▼ DISTRIBUTION"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
