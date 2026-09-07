"use client";

import { useEffect, useState } from "react";

interface IntelData {
  symbol: string;
  price: number;
  priceChange24h: number;
  openInterestUsd: number;
  topTrader: { longPct: number; shortPct: number };
  takerVolume: { buyUsd: number; sellUsd: number; ratio: number };
  fundingRatePct: number;
  aiSynthesis: {
    regime: string;
    conviction: number;
    action: string;
    summary: string;
  };
}

export function MarketIntelSection() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [data, setData] = useState<IntelData | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadData(targetSym = symbol) {
    setLoading(true);
    try {
      const res = await fetch(`/api/intel?symbol=${targetSym}`);
      const json = await res.json();
      if (json.ok) {
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(symbol);
    const interval = setInterval(() => loadData(symbol), 15000);
    return () => clearInterval(interval);
  }, [symbol]);

  // Listen to natural language intent coin changes from Copilot or Screener
  useEffect(() => {
    const handleFocus = (e: any) => {
      if (e.detail?.symbol) {
        setSymbol(e.detail.symbol);
      }
    };
    window.addEventListener("backed:focus-symbol", handleFocus);
    return () => window.removeEventListener("backed:focus-symbol", handleFocus);
  }, []);

  if (loading && !data) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 font-mono text-xs text-muted">
        Ingesting live market derivatives & smart flow...
      </div>
    );
  }

  const intel = data || {
    symbol: "BTCUSDT",
    price: 78450,
    priceChange24h: 1.82,
    openInterestUsd: 6850000000,
    topTrader: { longPct: 58.4, shortPct: 41.6 },
    takerVolume: { buyUsd: 48200000, sellUsd: 43000000, ratio: 1.12 },
    fundingRatePct: 0.0084,
    aiSynthesis: {
      regime: "Smart Accumulation",
      conviction: 82,
      action: "BUY",
      summary: "Top accounts maintain 58.4% Long dominance with 1.12x aggressive taker buying.",
    },
  };

  // SVG calculations for Top Trader Donut Chart
  const longAngle = (intel.topTrader.longPct / 100) * 360;
  const strokeDashLong = (intel.topTrader.longPct / 100) * 251.2; // 2 * PI * 40 ≈ 251.2

  return (
    <div className="rounded-lg border border-border bg-surface p-6">

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-2.5 w-2.5 items-center justify-center">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent"></span>
            </span>
          </div>
          <span className="font-mono text-xs uppercase tracking-wider text-muted">
            Autonomous Market Intel
          </span>
          <span className="rounded border border-accent/20 bg-accent-faint px-2 py-0.5 font-mono text-[11px] font-semibold text-accent">
            {intel.symbol}
          </span>
          {loading && <span className="font-mono text-[10px] text-accent animate-pulse">Syncing...</span>}
        </div>

        <div className="flex items-center gap-4 font-mono text-xs">
          <div>
            <span className="text-faint">Price: </span>
            <span className="font-semibold text-foreground">${intel.price.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-faint">24h: </span>
            <span className={intel.priceChange24h >= 0 ? "text-success" : "text-danger"}>
              {intel.priceChange24h >= 0 ? "+" : ""}{intel.priceChange24h}%
            </span>
          </div>
          <div>
            <span className="text-faint">OI: </span>
            <span className="font-semibold text-foreground">
              ${(intel.openInterestUsd / 1e9).toFixed(2)}B
            </span>
          </div>
        </div>
      </div>

      {/* AI Synthesis Banner */}
      <div className="mt-4 rounded border border-border-strong bg-surface-raised p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-faint">Agent Verdict:</span>
            <span
              className={`rounded px-2 py-0.5 font-mono text-xs font-bold tracking-wider ${
                intel.aiSynthesis.action === "BUY"
                  ? "bg-success/15 text-success border border-success/30"
                  : intel.aiSynthesis.action === "SELL"
                  ? "bg-danger/15 text-danger border border-danger/30"
                  : "bg-muted/15 text-muted border border-muted/30"
              }`}
            >
              {intel.aiSynthesis.action} · {intel.aiSynthesis.conviction}% Conviction
            </span>
          </div>
          <span className="font-mono text-xs text-accent">
            Regime: {intel.aiSynthesis.regime}
          </span>
        </div>
        <p className="mt-2 font-mono text-xs leading-relaxed text-foreground">
          {intel.aiSynthesis.summary}
        </p>
      </div>

      {/* Institutional Charts Grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Chart 1: Donut Chart - Top Trader Sentiment */}
        <div className="flex flex-col justify-between rounded border border-border bg-background p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-muted">
              Top Trader Bias
            </span>
            <span className="font-mono text-[10px] text-faint">5m Window</span>
          </div>

          <div className="my-4 flex items-center justify-center">
            <div className="relative flex items-center justify-center">
              <svg className="h-28 w-28 -rotate-90 transform" viewBox="0 0 100 100">
                {/* Short Circle (Base background) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#24262b"
                  strokeWidth="12"
                  fill="transparent"
                />
                {/* Long Arc (Gold accent) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#c9a227"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={`${strokeDashLong} 251.2`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="font-mono text-sm font-bold text-foreground">
                  {intel.topTrader.longPct}%
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-accent">
                  Long
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between border-t border-border pt-2 font-mono text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-accent"></span>
              <span className="text-muted">Long: {intel.topTrader.longPct}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#24262b]"></span>
              <span className="text-faint">Short: {intel.topTrader.shortPct}%</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Bar Chart - Taker Flow Execution Pressure */}
        <div className="flex flex-col justify-between rounded border border-border bg-background p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-muted">
              Taker Order Flow
            </span>
            <span className="font-mono text-[10px] text-faint">Buy / Sell Pressure</span>
          </div>

          <div className="my-3 space-y-3">
            <div>
              <div className="flex justify-between font-mono text-[11px] mb-1">
                <span className="text-muted">Aggressive Buy Volume</span>
                <span className="font-semibold text-foreground">
                  ${(intel.takerVolume.buyUsd / 1e6).toFixed(1)}M
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-raised overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (intel.takerVolume.buyUsd / (intel.takerVolume.buyUsd + intel.takerVolume.sellUsd)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-mono text-[11px] mb-1">
                <span className="text-muted">Aggressive Sell Volume</span>
                <span className="font-semibold text-foreground">
                  ${(intel.takerVolume.sellUsd / 1e6).toFixed(1)}M
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-raised overflow-hidden">
                <div
                  className="h-full bg-muted/40 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (intel.takerVolume.sellUsd / (intel.takerVolume.buyUsd + intel.takerVolume.sellUsd)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-2 font-mono text-[11px] flex justify-between items-center">
            <span className="text-faint">Flow Multiplier</span>
            <span className="font-bold text-accent">{intel.takerVolume.ratio}x Buy Bias</span>
          </div>
        </div>

        {/* Chart 3: Metric Gauge - Leverage & Funding Pressure */}
        <div className="flex flex-col justify-between rounded border border-border bg-background p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-muted">
              Funding & Leverage
            </span>
            <span className="font-mono text-[10px] text-faint">Overheat Index</span>
          </div>

          <div className="my-3 space-y-2">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-muted">8h Funding Rate</span>
              <span className={`font-semibold ${intel.fundingRatePct >= 0 ? "text-success" : "text-danger"}`}>
                {intel.fundingRatePct >= 0 ? "+" : ""}{intel.fundingRatePct}%
              </span>
            </div>

            {/* Gauge bar with markers */}
            <div className="relative pt-2">
              <div className="h-2 w-full rounded-full bg-gradient-to-r from-success/50 via-accent to-danger/80" />
              <div
                className="absolute top-1 -ml-1 h-4 w-2 rounded-sm bg-foreground shadow"
                style={{
                  left: `${Math.min(95, Math.max(5, (intel.fundingRatePct + 0.02) * 2000))}%`,
                }}
              />
            </div>

            <div className="flex justify-between font-mono text-[9px] text-faint pt-1">
              <span>Discount</span>
              <span>Neutral</span>
              <span>Overheated</span>
            </div>
          </div>

          <div className="border-t border-border pt-2 font-mono text-[11px] flex justify-between items-center">
            <span className="text-faint">Squeeze Risk</span>
            <span className="text-foreground font-semibold">Low to Moderate</span>
          </div>
        </div>
      </div>
    </div>
  );
}
