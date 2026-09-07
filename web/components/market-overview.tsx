"use client";

import { useEffect, useState } from "react";

interface AssetRow {
  rank: number;
  symbol: string;
  base: string;
  price: number;
  priceChange24h: number;
  volume24hUsd: number;
  tradesCount: number;
  openInterestUsd: number | null;
  longPct: number | null;
  takerRatio: number | null;
  fundingPct: number | null;
  regime: string;
  isEnriched: boolean;
}

interface ScreenerData {
  ok: boolean;
  totalAssetsCount: number;
  enrichedCount: number;
  assets: AssetRow[];
  aggregate: {
    totalMarketVolumeUsd: number;
    totalEnrichedOIUsd: number;
    totalGainers: number;
    totalLosers: number;
    bullishCount: number;
    bearishCount: number;
  };
  dataSource: string;
  observedAt: number;
}

function fmtUsd(n: number | null): string {
  if (n === null || n === undefined) return "--";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

// Open Interest Distribution Donut
function OIDonut({ assets }: { assets: AssetRow[] }) {
  const validOI = assets.filter((a) => (a.openInterestUsd ?? 0) > 0);
  const total = validOI.reduce((s, a) => s + (a.openInterestUsd ?? 0), 0) || 1;
  const COLORS = [
    "#c9a227", "#3ba468", "#d05353", "#4f8ef7",
    "#a855f7", "#f97316", "#06b6d4", "#eab308"
  ];
  const top8 = [...validOI].sort((a, b) => (b.openInterestUsd ?? 0) - (a.openInterestUsd ?? 0)).slice(0, 8);

  const R = 68, CX = 90, CY = 90, STROKE = 22;
  const circumference = 2 * Math.PI * R;
  let offset = 0;

  const slices = top8.map((a, i) => {
    const oi = a.openInterestUsd ?? 0;
    const pct = oi / total;
    const dashLen = pct * circumference;
    const slice = { offset, dashLen, color: COLORS[i % COLORS.length], label: a.base, pct, oi };
    offset += dashLen;
    return slice;
  });

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
      <svg viewBox="0 0 180 180" className="h-44 w-44 shrink-0">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1a1c20" strokeWidth={STROKE} />
        {slices.map((s, i) => (
          <circle
            key={i}
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke={s.color}
            strokeWidth={STROKE}
            strokeDasharray={`${s.dashLen} ${circumference - s.dashLen}`}
            strokeDashoffset={-s.offset + circumference * 0.25}
            strokeLinecap="butt"
          />
        ))}
        <text x={CX} y={CY - 6} textAnchor="middle" fill="#9ea3ad" fontSize="9" fontFamily="monospace">
          Top Contracts
        </text>
        <text x={CX} y={CY + 10} textAnchor="middle" fill="#c9a227" fontSize="12" fontFamily="monospace" fontWeight="bold">
          {fmtUsd(total)}
        </text>
      </svg>
      <div className="grid grid-cols-2 gap-x-5 gap-y-2">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
            <span className="font-mono text-xs text-foreground font-medium">{s.label}</span>
            <span className="font-mono text-[10px] text-muted">{(s.pct * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Funding rate heatmap
function FundingHeatmap({ assets }: { assets: AssetRow[] }) {
  const withFunding = assets.filter((a) => a.fundingPct !== null);
  const sorted = [...withFunding].sort((a, b) => (b.fundingPct ?? 0) - (a.fundingPct ?? 0)).slice(0, 16);

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
      {sorted.map((a) => {
        const fp = a.fundingPct ?? 0;
        const isPos = fp >= 0;
        const bg = isPos
          ? `rgba(208,83,83,${Math.min(0.7, 0.12 + Math.abs(fp) * 15)})`
          : `rgba(59,164,104,${Math.min(0.7, 0.12 + Math.abs(fp) * 15)})`;
        return (
          <div
            key={a.symbol}
            className="flex flex-col items-center rounded border border-border/80 p-2 text-center"
            style={{ backgroundColor: bg }}
          >
            <span className="font-mono text-[10px] font-bold text-foreground">{a.base}</span>
            <span className={`font-mono text-[9px] font-semibold ${isPos ? "text-danger" : "text-success"}`}>
              {isPos ? "+" : ""}{fp.toFixed(4)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Taker flow bar chart
function TakerFlowChart({ assets }: { assets: AssetRow[] }) {
  const valid = assets.filter((a) => a.takerRatio !== null).slice(0, 10);
  const maxRatio = Math.max(...valid.map((a) => a.takerRatio ?? 1.0), 2.0);

  return (
    <div className="space-y-2">
      {valid.map((a) => {
        const tr = a.takerRatio ?? 1.0;
        const isBull = tr >= 1.0;
        const bullW = Math.min(100, (tr / maxRatio) * 100);

        return (
          <div key={a.symbol} className="flex items-center gap-3">
            <span className="w-12 font-mono text-[10px] font-semibold text-foreground">{a.base}</span>
            <div className="flex flex-1 items-center gap-1.5">
              <div className="h-3 flex-1 overflow-hidden rounded bg-surface-raised">
                <div
                  className={`h-full rounded ${isBull ? "bg-success" : "bg-danger"}`}
                  style={{ width: `${bullW}%` }}
                />
              </div>
            </div>
            <span className="w-14 text-right font-mono text-[10px] font-bold text-foreground">
              {tr.toFixed(2)}x
            </span>
            <span className={`w-12 text-right font-mono text-[9px] font-semibold ${isBull ? "text-success" : "text-danger"}`}>
              {isBull ? "▲ BUY" : "▼ SELL"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function MarketOverview() {
  const [data, setData] = useState<ScreenerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/screener");
      const json = await res.json();
      if (json.ok) {
        setData(json);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="font-mono text-xs text-muted animate-pulse">
          Ingesting total market intelligence across 700+ Binance contracts...
        </span>
      </div>
    );
  }

  if (!data) return null;

  const totalGainers = data.aggregate.totalGainers;
  const totalLosers = data.aggregate.totalLosers;
  const totalTracked = totalGainers + totalLosers || 1;
  const gainerPct = Math.round((totalGainers / totalTracked) * 100);

  return (
    <div className="space-y-6">
      {/* Top Aggregates */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Total Perpetual Contracts",
            value: `${data.totalAssetsCount} Active`,
            sub: "USDT-M Perpetual Futures",
          },
          {
            label: "24h Binance Futures Liquidity",
            value: fmtUsd(data.aggregate.totalMarketVolumeUsd),
            sub: "Total market 24h trading volume",
          },
          {
            label: "Top 50 Open Interest",
            value: fmtUsd(data.aggregate.totalEnrichedOIUsd),
            sub: "Aggregate locked contracts value",
          },
          {
            label: "Market Breadth (700+ Perps)",
            value: `${gainerPct}% Advancing`,
            sub: `${totalGainers} Gainers / ${totalLosers} Losers`,
          },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-surface px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">{s.label}</p>
            <p className="mt-1 font-mono text-sm font-semibold text-foreground">{s.value}</p>
            <p className="mt-0.5 font-mono text-[9px] text-faint">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Market Breadth Advance/Decline Bar */}
      <div className="rounded-lg border border-border bg-surface px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
            Macro Derivatives Market Breadth ({data.totalAssetsCount} Binance Perps)
          </p>
          <span className="font-mono text-[10px] text-faint">
            {totalGainers} Advancing · {totalLosers} Declining
          </span>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-surface-raised">
          <div className="bg-success transition-all" style={{ width: `${gainerPct}%` }} />
          <div className="bg-danger flex-1" />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[9px]">
          <span className="text-success font-medium">▲ {gainerPct}% Gainers</span>
          <span className="text-danger font-medium">▼ {100 - gainerPct}% Losers</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* OI distribution donut */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
              Open Interest Concentration
            </p>
            <span className="font-mono text-[10px] text-muted">Top 8 Contracts</span>
          </div>
          <p className="mb-4 font-mono text-[10px] text-muted">
            Relative contract weight among highest capitalized perps
          </p>
          <OIDonut assets={data.assets} />
        </div>

        {/* Taker flow */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
              Taker Buy vs Sell Aggression
            </p>
            <span className="font-mono text-[10px] text-muted">Top Volume Contracts</span>
          </div>
          <p className="mb-4 font-mono text-[10px] text-muted">
            Ratio &gt; 1.0 indicates market orders aggressively lifting asks (buyers dominating)
          </p>
          <TakerFlowChart assets={data.assets} />
        </div>
      </div>

      {/* Funding rate heatmap */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
            Funding Rate Divergence Heatmap
          </p>
          <span className="font-mono text-[10px] text-muted">Highest 8h Settlements</span>
        </div>
        <p className="mb-3 font-mono text-[10px] text-muted">
          Red indicates longs paying shorts (long crowded) · Green indicates negative funding (short squeeze vulnerability)
        </p>
        <FundingHeatmap assets={data.assets} />
      </div>
    </div>
  );
}
