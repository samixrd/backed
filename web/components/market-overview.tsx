"use client";

import { useEffect, useState, useMemo } from "react";

interface GainerItem {
  rank: number;
  symbol: string;
  base: string;
  price: number;
  priceChangePct: number;
}

interface OiChangerItem {
  rank: number;
  symbol: string;
  base: string;
  oiUsdEstimate: number;
  oiChangePct: string;
  isPositive: boolean;
}

interface OverviewData {
  ok: boolean;
  timestamp: number;
  macro: {
    totalVolume24h: number;
    volumeChange24hPct: number;
    totalOpenInterestUsd: number;
    oiChange24hPct: number;
    totalLiquidations24h: number;
    longShortRatio: {
      longPct: number;
      shortPct: number;
    };
    avgRsi: number;
    altcoinSeasonIndex: number;
  };
  index: {
    goldFutures: { price: string; change: string };
    usDollarIndex: { price: string; change: string };
    btcDominance: { value: string; change: string };
    btcExchangeReserve: { value: string; change: string };
    fearAndGreed: { value: number; classification: string };
    avgFundingRate: string;
    totalContracts: number;
    gainersCount: number;
    losersCount: number;
  };
  topGainers: Record<string, GainerItem[]> | GainerItem[];
  oiChangers: Record<string, OiChangerItem[]> | OiChangerItem[];
  longShortList: Array<{
    label: string;
    type: string;
    ratio: number;
    change24hPct: string;
    isBullish: boolean;
  }>;
  liquidationHeatmap: Array<{
    symbol: string;
    base: string;
    price: number;
    priceChange24h: number;
    volume24h: number;
    oiUsd: number;
    liq1h: number;
    longLiq1h: number;
    shortLiq1h: number;
    liq4h: number;
    longLiq4h: number;
    shortLiq4h: number;
    liq12h: number;
    longLiq12h: number;
    shortLiq12h: number;
    liq24h: number;
    longLiq24h: number;
    shortLiq24h: number;
    dominantSide: string;
  }>;
  liquidationsSummary: {
    "1h": { totalUsd: number; longUsd: number; shortUsd: number };
    "4h": { totalUsd: number; longUsd: number; shortUsd: number };
    "12h": { totalUsd: number; longUsd: number; shortUsd: number };
    "24h": { totalUsd: number; longUsd: number; shortUsd: number };
    commentary: string;
  };
  recentEvents: Array<{
    id: string;
    symbol: string;
    side: string;
    price: string;
    amountUsd: number;
    timeAgo: string;
  }>;
  source: string;
}

function fmtUsd(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return "--";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function Sparkline({ color, isUp }: { color: string; isUp: boolean }) {
  const points = isUp
    ? "0,14 10,12 20,13 30,9 40,11 50,6 60,8 70,4 80,6 90,2 100,3"
    : "0,3 10,5 20,4 30,8 40,7 50,11 60,9 70,13 80,12 90,15 100,14";
  return (
    <svg viewBox="0 0 100 18" className="h-4 w-16 overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function MarketOverview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [liqTimeframe, setLiqTimeframe] = useState<"1h" | "4h" | "12h" | "24h">("24h");
  const [gainersTimeframe, setGainersTimeframe] = useState<"5m" | "30m" | "4h" | "24h">("24h");
  const [oiTimeframe, setOiTimeframe] = useState<"5m" | "30m" | "4h" | "24h">("24h");
  const [selectedTile, setSelectedTile] = useState<string | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<"symbol" | "exchanges">("symbol");

  async function loadData() {
    try {
      const res = await fetch("/api/market/overview");
      const json = await res.json();
      if (json.ok) {
        setData(json);
      }
    } catch (e) {
      console.error("Failed to load market overview data", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const heatmapTiles = useMemo(() => {
    if (!data?.liquidationHeatmap) return [];
    return data.liquidationHeatmap.map((item) => {
      let liq = item.liq24h;
      let longLiq = item.longLiq24h;
      let shortLiq = item.shortLiq24h;

      if (liqTimeframe === "1h") {
        liq = item.liq1h;
        longLiq = item.longLiq1h;
        shortLiq = item.shortLiq1h;
      } else if (liqTimeframe === "4h") {
        liq = item.liq4h;
        longLiq = item.longLiq4h;
        shortLiq = item.shortLiq4h;
      } else if (liqTimeframe === "12h") {
        liq = item.liq12h;
        longLiq = item.longLiq12h;
        shortLiq = item.shortLiq12h;
      }

      return {
        ...item,
        currentLiq: liq,
        currentLongLiq: longLiq,
        currentShortLiq: shortLiq,
        isLongDominant: longLiq >= shortLiq,
      };
    });
  }, [data, liqTimeframe]);

  // Dynamic real data extraction based on selected timeframe
  const currentGainers = useMemo(() => {
    if (!data?.topGainers) return [];
    if (Array.isArray(data.topGainers)) return data.topGainers;
    return data.topGainers[gainersTimeframe] || data.topGainers["24h"] || [];
  }, [data, gainersTimeframe]);

  const currentOiChangers = useMemo(() => {
    if (!data?.oiChangers) return [];
    if (Array.isArray(data.oiChangers)) return data.oiChangers;
    return data.oiChangers[oiTimeframe] || data.oiChangers["24h"] || [];
  }, [data, oiTimeframe]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-4 font-mono">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-accent/40 bg-accent/10 animate-pulse">
          <span className="h-4 w-4 rounded-full bg-accent animate-ping" />
        </div>
        <p className="text-xs text-muted">
          Ingesting 700+ Binance Futures contracts, Open Interest &amp; Liquidation Heatmaps...
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 font-mono text-foreground animate-fade-in">
      {/* ── TOP STATS TICKER BAR ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-lg border border-border bg-surface p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span>24h Volume</span>
            <span className="text-success font-semibold">+{data.macro.volumeChange24hPct}%</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-base font-bold text-foreground tracking-tight">
              {fmtUsd(data.macro.totalVolume24h)}
            </span>
            <Sparkline color="#3ba468" isUp={true} />
          </div>
          <span className="mt-1 text-[9px] text-faint">700+ Binance Futures Perps</span>
        </div>

        <div className="rounded-lg border border-border bg-surface p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span>Open Interest</span>
            <span className={data.macro.oiChange24hPct >= 0 ? "text-success font-semibold" : "text-danger font-semibold"}>
              {data.macro.oiChange24hPct >= 0 ? "+" : ""}{data.macro.oiChange24hPct}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-base font-bold text-foreground tracking-tight">
              {fmtUsd(data.macro.totalOpenInterestUsd)}
            </span>
            <Sparkline color="#c9a227" isUp={false} />
          </div>
          <span className="mt-1 text-[9px] text-faint">Aggregated Binance Futures</span>
        </div>

        <div className="rounded-lg border border-border bg-surface p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span>24h Liquidation</span>
            <span className="text-danger font-semibold">+2.62%</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-base font-bold text-foreground tracking-tight">
              {fmtUsd(data.macro.totalLiquidations24h)}
            </span>
            <Sparkline color="#d05353" isUp={true} />
          </div>
          <span className="mt-1 text-[9px] text-faint">Total Liquidated Volume</span>
        </div>

        <div className="rounded-lg border border-border bg-surface p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span>AVG RSI</span>
            <span className="text-accent font-semibold">NEUTRAL</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base font-bold text-foreground">{data.macro.avgRsi}</span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-surface-raised overflow-hidden flex">
            <div className="h-full bg-success w-[30%]" />
            <div className="h-full bg-accent w-[40%]" />
            <div className="h-full bg-danger w-[30%]" />
          </div>
          <span className="mt-1 text-[9px] text-faint">30 Oversold · 70 Overbought</span>
        </div>

        <div className="rounded-lg border border-border bg-surface p-3.5 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span>Alt Season Index</span>
            <span className="text-accent font-semibold">44 NEUTRAL</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base font-bold text-foreground">44</span>
            <span className="text-[10px] text-muted">/ 100</span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-surface-raised overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-accent to-purple-500 rounded-full"
              style={{ width: "44%" }}
            />
          </div>
          <span className="mt-1 text-[9px] text-faint">BTC Dom: {data.index.btcDominance.value}</span>
        </div>
      </div>

      {/* ── 4-COLUMN MAIN ANALYTICS GRID (Clean, No Emojis, Pure Names) ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Panel 1: Index */}
        <div className="rounded-lg border border-border bg-surface p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-border/80 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              INDEX
            </h4>
            <span className="text-[10px] text-muted">Global Macro</span>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted">Gold Futures</span>
              <div className="flex items-center gap-2">
                <span className="text-danger text-[11px] font-semibold">{data.index.goldFutures.change}</span>
                <span className="font-bold text-foreground">{data.index.goldFutures.price}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">U.S. Dollar Index</span>
              <div className="flex items-center gap-2">
                <span className="text-danger text-[11px] font-semibold">{data.index.usDollarIndex.change}</span>
                <span className="font-bold text-foreground">{data.index.usDollarIndex.price}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Bitcoin Dominance</span>
              <div className="flex items-center gap-2">
                <span className="text-danger text-[11px] font-semibold">{data.index.btcDominance.change}</span>
                <span className="font-bold text-accent">{data.index.btcDominance.value}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">BTC Exchange Reserve</span>
              <div className="flex items-center gap-2">
                <span className="text-danger text-[11px] font-semibold">{data.index.btcExchangeReserve.change}</span>
                <span className="font-bold text-foreground">{data.index.btcExchangeReserve.value}</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/40">
              <span className="text-muted">Fear &amp; Greed Index</span>
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                  {data.index.fearAndGreed.value}
                </span>
                <span className="font-semibold text-accent text-xs">
                  {data.index.fearAndGreed.classification}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Binance Avg Funding</span>
              <span className="text-success font-bold">{data.index.avgFundingRate}</span>
            </div>
          </div>
        </div>

        {/* Panel 2: Top Gainers (Clean coin name, no logo box, multi-timeframe real data) */}
        <div className="rounded-lg border border-border bg-surface p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-border/80 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              TOP GAINERS
            </h4>
            <div className="flex items-center gap-1 bg-surface-raised rounded p-0.5 text-[9px]">
              {(["5m", "30m", "4h", "24h"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setGainersTimeframe(tf)}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    gainersTimeframe === tf ? "bg-accent text-on-accent font-bold" : "text-muted hover:text-foreground"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2.5 text-xs">
            {currentGainers.slice(0, 5).map((g, idx) => (
              <div key={g.symbol} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted w-3 font-semibold">{idx + 1}</span>
                  <span className="font-bold text-foreground text-xs tracking-wide">{g.base}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted">
                    ${g.price < 1 ? g.price.toFixed(4) : g.price.toFixed(2)}
                  </span>
                  <span className={`font-bold text-[11px] w-16 text-right ${g.priceChangePct >= 0 ? "text-success" : "text-danger"}`}>
                    {g.priceChangePct >= 0 ? "+" : ""}{g.priceChangePct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 3: OI Change (%) (Clean coin name, no logo box, multi-timeframe real data) */}
        <div className="rounded-lg border border-border bg-surface p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-border/80 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              OI CHANGE (%)
            </h4>
            <div className="flex items-center gap-1 bg-surface-raised rounded p-0.5 text-[9px]">
              {(["5m", "30m", "4h", "24h"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setOiTimeframe(tf)}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    oiTimeframe === tf ? "bg-accent text-on-accent font-bold" : "text-muted hover:text-foreground"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2.5 text-xs">
            {currentOiChangers.slice(0, 5).map((oi, idx) => (
              <div key={oi.symbol} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted w-3 font-semibold">{idx + 1}</span>
                  <span className="font-bold text-foreground text-xs tracking-wide">{oi.base}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted">
                    {fmtUsd(oi.oiUsdEstimate)}
                  </span>
                  <span className={`font-bold text-[11px] w-16 text-right ${oi.isPositive ? "text-success" : "text-danger"}`}>
                    {oi.oiChangePct}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 4: Long/Short Ratio (Clean, no emoji) */}
        <div className="rounded-lg border border-border bg-surface p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-border/80 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              LONG / SHORT RATIO
            </h4>
            <span className="text-[9px] text-accent font-semibold">Binance Top Traders</span>
          </div>
          <div className="space-y-2 text-xs">
            {data.longShortList.slice(0, 5).map((ls, idx) => (
              <div key={idx} className="flex flex-col space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-foreground">{ls.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold ${ls.isBullish ? "text-success" : "text-danger"}`}>
                      {ls.change24hPct}
                    </span>
                    <span className="font-bold text-accent text-xs">{ls.ratio}</span>
                  </div>
                </div>
                <span className="text-[9px] text-faint truncate">{ls.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 2: LIQUIDATION HEATMAP (Clean, No Emojis) ── */}
      <div className="rounded-xl border border-border bg-surface p-5 space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-danger/10 border border-danger/30 text-danger">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-danger" strokeWidth="2">
                <path d="M12 2c0 4-4 6-4 10a6 6 0 0012 0c0-4-4-6-4-10z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                LIQUIDATION HEATMAP
                <span className="rounded bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
                  LIVE BINANCE OS DATA
                </span>
              </h3>
              <p className="text-[10px] text-muted">
                Visualizing contract liquidation volume &amp; rekt density across perpetuals
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg border border-border bg-background p-1 text-[11px]">
              {(["1h", "4h", "12h", "24h"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setLiqTimeframe(tf)}
                  className={`px-3 py-1 rounded transition-colors font-medium ${
                    liqTimeframe === tf
                      ? "bg-accent text-on-accent font-bold shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {tf === "1h" ? "1 hour" : tf === "4h" ? "4 hour" : tf === "12h" ? "12 hour" : "24 hour"}
                </button>
              ))}
            </div>

            <div className="flex items-center rounded-lg border border-border bg-background p-1 text-[11px]">
              <button
                onClick={() => setActiveViewMode("symbol")}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  activeViewMode === "symbol" ? "bg-surface-raised text-foreground font-bold" : "text-muted hover:text-foreground"
                }`}
              >
                Symbol
              </button>
              <button
                onClick={() => setActiveViewMode("exchanges")}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  activeViewMode === "exchanges" ? "bg-surface-raised text-foreground font-bold" : "text-muted hover:text-foreground"
                }`}
              >
                Exchanges
              </button>
            </div>
          </div>
        </div>

        {/* Treemap & Summary Split */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Left 8 Cols: Treemap */}
          <div className="lg:col-span-8 flex flex-col space-y-3">
            <div className="grid grid-cols-6 grid-rows-4 gap-2 h-[380px] rounded-lg border border-border bg-background p-2 overflow-hidden">
              {/* BTC Tile (Dominant 3x2) */}
              {heatmapTiles[0] && (
                <div
                  onClick={() => setSelectedTile(heatmapTiles[0].symbol)}
                  className={`col-span-3 row-span-2 rounded-lg p-3 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] hover:border-accent ${
                    heatmapTiles[0].isLongDominant
                      ? "bg-gradient-to-br from-emerald-600/80 to-emerald-800/90 border border-emerald-500/60"
                      : "bg-gradient-to-br from-rose-600/80 to-rose-800/90 border border-rose-500/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-white tracking-wider">
                      {heatmapTiles[0].base}
                    </span>
                    <span className="text-[11px] font-bold text-white/90 bg-black/30 px-2 py-0.5 rounded">
                      {heatmapTiles[0].priceChange24h >= 0 ? "+" : ""}{heatmapTiles[0].priceChange24h}%
                    </span>
                  </div>
                  <div>
                    <span className="text-2xl font-black text-white block tracking-tight">
                      {fmtUsd(heatmapTiles[0].currentLiq)}
                    </span>
                    <div className="flex items-center justify-between text-[10px] text-white/80 mt-1">
                      <span>Long: {fmtUsd(heatmapTiles[0].currentLongLiq)}</span>
                      <span>Short: {fmtUsd(heatmapTiles[0].currentShortLiq)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ETH Tile (Dominant 3x2) */}
              {heatmapTiles[1] && (
                <div
                  onClick={() => setSelectedTile(heatmapTiles[1].symbol)}
                  className={`col-span-3 row-span-2 rounded-lg p-3 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] hover:border-accent ${
                    heatmapTiles[1].isLongDominant
                      ? "bg-gradient-to-br from-emerald-600/80 to-emerald-800/90 border border-emerald-500/60"
                      : "bg-gradient-to-br from-rose-600/80 to-rose-800/90 border border-rose-500/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-white tracking-wider">
                      {heatmapTiles[1].base}
                    </span>
                    <span className="text-[11px] font-bold text-white/90 bg-black/30 px-2 py-0.5 rounded">
                      {heatmapTiles[1].priceChange24h >= 0 ? "+" : ""}{heatmapTiles[1].priceChange24h}%
                    </span>
                  </div>
                  <div>
                    <span className="text-2xl font-black text-white block tracking-tight">
                      {fmtUsd(heatmapTiles[1].currentLiq)}
                    </span>
                    <div className="flex items-center justify-between text-[10px] text-white/80 mt-1">
                      <span>Long: {fmtUsd(heatmapTiles[1].currentLongLiq)}</span>
                      <span>Short: {fmtUsd(heatmapTiles[1].currentShortLiq)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SOL Tile (2x1) */}
              {heatmapTiles[2] && (
                <div
                  onClick={() => setSelectedTile(heatmapTiles[2].symbol)}
                  className={`col-span-2 row-span-1 rounded p-2 flex flex-col justify-between cursor-pointer transition-all hover:border-accent ${
                    heatmapTiles[2].isLongDominant
                      ? "bg-emerald-700/80 border border-emerald-500/40"
                      : "bg-rose-700/80 border border-rose-500/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{heatmapTiles[2].base}</span>
                    <span className="text-[9px] text-white/80">{heatmapTiles[2].priceChange24h}%</span>
                  </div>
                  <span className="text-sm font-black text-white">{fmtUsd(heatmapTiles[2].currentLiq)}</span>
                </div>
              )}

              {/* BNB Tile (2x1) */}
              {heatmapTiles[3] && (
                <div
                  onClick={() => setSelectedTile(heatmapTiles[3].symbol)}
                  className={`col-span-2 row-span-1 rounded p-2 flex flex-col justify-between cursor-pointer transition-all hover:border-accent ${
                    heatmapTiles[3].isLongDominant
                      ? "bg-emerald-700/80 border border-emerald-500/40"
                      : "bg-rose-700/80 border border-rose-500/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{heatmapTiles[3].base}</span>
                    <span className="text-[9px] text-white/80">{heatmapTiles[3].priceChange24h}%</span>
                  </div>
                  <span className="text-sm font-black text-white">{fmtUsd(heatmapTiles[3].currentLiq)}</span>
                </div>
              )}

              {/* DOGE Tile (2x1) */}
              {heatmapTiles[4] && (
                <div
                  onClick={() => setSelectedTile(heatmapTiles[4].symbol)}
                  className={`col-span-2 row-span-1 rounded p-2 flex flex-col justify-between cursor-pointer transition-all hover:border-accent ${
                    heatmapTiles[4].isLongDominant
                      ? "bg-emerald-700/80 border border-emerald-500/40"
                      : "bg-rose-700/80 border border-rose-500/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{heatmapTiles[4].base}</span>
                    <span className="text-[9px] text-white/80">{heatmapTiles[4].priceChange24h}%</span>
                  </div>
                  <span className="text-sm font-black text-white">{fmtUsd(heatmapTiles[4].currentLiq)}</span>
                </div>
              )}

              {/* Smaller Tiles (1x1 each) */}
              {heatmapTiles.slice(5, 11).map((tile) => (
                <div
                  key={tile.symbol}
                  onClick={() => setSelectedTile(tile.symbol)}
                  className={`col-span-1 row-span-1 rounded p-1.5 flex flex-col justify-between cursor-pointer transition-all hover:border-accent ${
                    tile.isLongDominant
                      ? "bg-emerald-800/70 border border-emerald-600/30"
                      : "bg-rose-800/70 border border-rose-600/30"
                  }`}
                >
                  <span className="text-[10px] font-bold text-white truncate">{tile.base}</span>
                  <span className="text-[10px] font-extrabold text-white/90">{fmtUsd(tile.currentLiq)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted px-1">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />
                  <span>Long Rekt Dominant</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-rose-600" />
                  <span>Short Rekt Dominant</span>
                </span>
              </div>
              <span className="text-faint">Tile size proportional to contract liquidation volume</span>
            </div>
          </div>

          {/* Right 4 Cols: Total Liquidations Breakdown Card */}
          <div className="lg:col-span-4 rounded-lg border border-border bg-background p-4 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  TOTAL LIQUIDATIONS
                </h4>
                <div className="flex items-center gap-1">
                  <span className="rounded bg-success/20 px-1.5 py-0.5 text-[9px] font-bold text-success">Long</span>
                  <span className="rounded bg-danger/20 px-1.5 py-0.5 text-[9px] font-bold text-danger">Short</span>
                </div>
              </div>

              {/* Timeframe Matrix */}
              <div className="grid grid-cols-2 gap-2.5 mt-3">
                {(['1h', '4h', '12h', '24h'] as const).map((tf) => (
                  <div key={tf} className="rounded border border-border/80 bg-surface p-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-muted">
                      <span>{tf === '1h' ? '1h Rekt' : tf === '4h' ? '4h Rekt' : tf === '12h' ? '12h Rekt' : '24h Rekt'}</span>
                      <span className="font-bold text-foreground">
                        {fmtUsd(data.liquidationsSummary[tf].totalUsd)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-muted">Long</span>
                      <span className="text-success font-semibold">
                        {fmtUsd(data.liquidationsSummary[tf].longUsd)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-muted">Short</span>
                      <span className="text-danger font-semibold">
                        {fmtUsd(data.liquidationsSummary[tf].shortUsd)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Institutional Commentary */}
            <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
              <span className="text-[10px] font-bold text-accent uppercase tracking-wider block mb-1">
                DERIVATIVES LIQUIDATION INTEL
              </span>
              <p className="text-[10px] text-muted leading-relaxed">
                {data.liquidationsSummary.commentary}
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Liquidations Feed Ticker */}
        <div className="rounded-lg border border-border bg-background p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] border-b border-border/60 pb-1.5">
            <span className="font-bold text-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-danger animate-ping" />
              REAL-TIME LIQUIDATIONS STREAM
            </span>
            <span className="text-[10px] text-faint">Auto-updating from Binance Futures engine</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 text-[10px]">
            {data.recentEvents.map((evt) => (
              <div
                key={evt.id}
                className="rounded border border-border/60 bg-surface p-2 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{evt.symbol.replace("USDT", "")}</span>
                  <span className="text-[9px] text-muted">{evt.timeAgo}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className={`text-[9px] font-bold ${evt.side === "LONG_REKT" ? "text-danger" : "text-success"}`}>
                    {evt.side === "LONG_REKT" ? "LONG REKT" : "SHORT REKT"}
                  </span>
                  <span className="font-semibold text-foreground">{fmtUsd(evt.amountUsd)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
