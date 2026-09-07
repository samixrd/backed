"use client";

import { useEffect, useState, useMemo } from "react";

interface AssetRow {
  rank: number;
  symbol: string;
  base: string;
  price: number;
  priceChange24h: number;
  volume24hUsd: number;
  tradesCount: number;
  high24h: number;
  low24h: number;
  openInterestUsd: number | null;
  longPct: number | null;
  shortPct: number | null;
  takerBuyUsd: number | null;
  takerSellUsd: number | null;
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
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtCount(n: number): string {
  if (!n) return "--";
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

function fmtPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(4);
  return n.toFixed(6);
}

const REGIME_COLOR: Record<string, string> = {
  "Smart Accum.":  "text-success border-success/20 bg-success/5",
  "Mild Bullish":  "text-accent border-accent/20 bg-accent/5",
  "Neutral":       "text-muted border-border bg-transparent",
  "Trapped Longs": "text-yellow-400 border-yellow-400/20 bg-yellow-400/5",
  "Squeeze Watch": "text-orange-400 border-orange-400/20 bg-orange-400/5",
  "Distribution":  "text-danger border-danger/20 bg-danger/5",
  "Active Perp":   "text-faint border-border/60 bg-transparent",
};

type SortCol = "rank" | "price" | "priceChange24h" | "volume24hUsd" | "tradesCount" | "openInterestUsd" | "longPct" | "takerRatio" | "fundingPct";
type FilterMode = "all" | "top50" | "smart" | "gainers" | "losers" | "highvol";

export function TokenScreener() {
  const [data, setData] = useState<ScreenerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [sortCol, setSortCol] = useState<SortCol>("volume24hUsd");
  const [sortAsc, setSortAsc] = useState(false);
  const [pageSize, setPageSize] = useState(50);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  async function load() {
    try {
      const res = await fetch("/api/screener");
      const json = await res.json();
      if (json.ok) {
        setData(json);
        setError(null);
        setLastUpdate(new Date().toLocaleTimeString());
      } else {
        setError(json.error ?? "Failed to fetch screener data");
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 25000);
    return () => clearInterval(t);
  }, []);

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortAsc((v) => !v);
    else {
      setSortCol(col);
      setSortAsc(col === "rank"); // default rank ascending, other metrics descending
    }
  }

  // Filter and sort items
  const filteredAndSorted = useMemo(() => {
    if (!data) return [];
    let items = [...data.assets];

    // 1. Text Search
    if (search.trim()) {
      const q = search.trim().toUpperCase();
      items = items.filter((a) => a.symbol.includes(q) || a.base.includes(q));
    }

    // 2. Filter Category
    if (filterMode === "top50") {
      items = items.filter((a) => a.isEnriched);
    } else if (filterMode === "smart") {
      items = items.filter((a) => a.regime === "Smart Accum." || (a.longPct ?? 0) >= 65);
    } else if (filterMode === "gainers") {
      items = items.filter((a) => a.priceChange24h > 0);
    } else if (filterMode === "losers") {
      items = items.filter((a) => a.priceChange24h < 0);
    } else if (filterMode === "highvol") {
      items = items.filter((a) => a.volume24hUsd >= 100_000_000);
    }

    // 3. Sort
    items.sort((a, b) => {
      const va = (a[sortCol] as number | null) ?? -Infinity;
      const vb = (b[sortCol] as number | null) ?? -Infinity;
      return sortAsc ? va - vb : vb - va;
    });

    return items;
  }, [data, search, filterMode, sortCol, sortAsc]);

  const displayedAssets = useMemo(() => {
    return filteredAndSorted.slice(0, pageSize);
  }, [filteredAndSorted, pageSize]);

  const ColHeader = ({ label, col }: { label: string; col: SortCol }) => (
    <th
      className="cursor-pointer select-none px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-muted hover:text-foreground transition-colors"
      onClick={() => handleSort(col)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {sortCol === col ? (
          <span className="text-accent">{sortAsc ? "▲" : "▼"}</span>
        ) : (
          <span className="text-border">↕</span>
        )}
      </div>
    </th>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="h-6 w-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-xs text-muted animate-pulse">
          Ingesting 700+ live perpetual contracts from Binance Futures...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger/5 p-6">
        <p className="font-mono text-xs text-danger">API Error: {error}</p>
        <button onClick={load} className="mt-3 rounded border border-border px-3 py-1 font-mono text-xs text-foreground">
          Retry Ingestion
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Top Market Metrics Bar ── */}
      {data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-surface px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Available Perps</p>
              <span className="flex h-2 w-2 rounded-full bg-success animate-ping" />
            </div>
            <p className="mt-1 font-mono text-base font-bold text-foreground">
              {data.totalAssetsCount} <span className="text-xs font-normal text-muted">Contracts</span>
            </p>
            <p className="mt-0.5 font-mono text-[9px] text-faint">Binance Agent OS Native</p>
          </div>

          <div className="rounded-lg border border-border bg-surface px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">24h Futures Volume</p>
            <p className="mt-1 font-mono text-base font-bold text-accent">
              {fmtUsd(data.aggregate.totalMarketVolumeUsd)}
            </p>
            <p className="mt-0.5 font-mono text-[9px] text-faint">Total 24h market liquidity</p>
          </div>

          <div className="rounded-lg border border-border bg-surface px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Top 50 Open Interest</p>
            <p className="mt-1 font-mono text-base font-bold text-foreground">
              {fmtUsd(data.aggregate.totalEnrichedOIUsd)}
            </p>
            <p className="mt-0.5 font-mono text-[9px] text-faint">Active locked contracts</p>
          </div>

          <div className="rounded-lg border border-border bg-surface px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Market Breadth</p>
            <p className="mt-1 font-mono text-base font-bold text-foreground">
              <span className="text-success">{data.aggregate.totalGainers}</span> / <span className="text-danger">{data.aggregate.totalLosers}</span>
            </p>
            <p className="mt-0.5 font-mono text-[9px] text-faint">Gainers vs Losers</p>
          </div>
        </div>
      )}

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border bg-surface p-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search 700+ coins (e.g. BTC, ETH, SOL, DOGE, GOLD, PEPE)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-border bg-background px-3 py-1.5 font-mono text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground font-mono text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: `All (${data?.totalAssetsCount ?? 0})` },
            { id: "top50", label: "Top 50 Derivatives" },
            { id: "smart", label: "Smart Money" },
            { id: "gainers", label: "Gainers" },
            { id: "losers", label: "Losers" },
            { id: "highvol", label: ">$100M Vol" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id as FilterMode)}
              className={`rounded px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                filterMode === tab.id
                  ? "border border-accent/40 bg-accent/15 text-accent font-semibold"
                  : "border border-border text-muted hover:border-border/80 hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results Info Bar ── */}
      <div className="flex items-center justify-between px-1">
        <span className="font-mono text-[10px] text-muted">
          Showing <span className="text-foreground font-semibold">{displayedAssets.length}</span> of{" "}
          <span className="text-foreground font-semibold">{filteredAndSorted.length}</span> matching contracts
          {search && ` for "${search}"`}
        </span>
        <span className="font-mono text-[10px] text-faint">
          Live Feed · Auto-refresh 25s · {lastUpdate}
        </span>
      </div>

      {/* ── Master Screener Table ── */}
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[1020px] text-sm">
          <thead className="border-b border-border bg-surface-raised">
            <tr>
              <ColHeader label="#" col="rank" />
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-muted">Contract</th>
              <ColHeader label="Price" col="price" />
              <ColHeader label="24h %" col="priceChange24h" />
              <ColHeader label="Volume 24h" col="volume24hUsd" />
              <ColHeader label="Trades" col="tradesCount" />
              <ColHeader label="Open Interest" col="openInterestUsd" />
              <ColHeader label="Top Trader L%" col="longPct" />
              <ColHeader label="Taker Flow" col="takerRatio" />
              <ColHeader label="8h Funding" col="fundingPct" />
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-muted">Regime</th>
            </tr>
          </thead>
          <tbody>
            {displayedAssets.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center font-mono text-xs text-muted">
                  No contracts found matching "{search}". Try searching another symbol.
                </td>
              </tr>
            ) : (
              displayedAssets.map((row, i) => {
                const isPos = row.priceChange24h >= 0;
                const isBull = (row.takerRatio ?? 0) >= 1.0;
                const lp = row.longPct;

                return (
                  <tr
                    key={row.symbol}
                    className={`border-b border-border/40 transition-colors hover:bg-surface-raised ${
                      i % 2 !== 0 ? "bg-background/20" : ""
                    }`}
                  >
                    {/* Rank */}
                    <td className="px-3 py-2.5 font-mono text-[10px] text-faint">
                      #{row.rank}
                    </td>

                    {/* Contract Base */}
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-foreground hover:text-accent transition-colors">
                            {row.base}
                          </span>
                          <span className="rounded border border-border/80 bg-surface-raised px-1 py-0.5 font-mono text-[8px] text-accent/80 font-medium">
                            PERP
                          </span>
                        </div>
                        <span className="font-mono text-[9px] text-faint tracking-tight">{row.symbol}</span>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-3 py-2.5 font-mono text-xs font-medium text-foreground">
                      ${fmtPrice(row.price)}
                    </td>

                    {/* 24h Change */}
                    <td className={`px-3 py-2.5 font-mono text-xs font-semibold ${isPos ? "text-success" : "text-danger"}`}>
                      {isPos ? "+" : ""}{row.priceChange24h.toFixed(2)}%
                    </td>

                    {/* 24h Volume */}
                    <td className="px-3 py-2.5 font-mono text-xs text-muted">
                      {fmtUsd(row.volume24hUsd)}
                    </td>

                    {/* Trades Count */}
                    <td className="px-3 py-2.5 font-mono text-xs text-muted">
                      {fmtCount(row.tradesCount)}
                    </td>

                    {/* Open Interest */}
                    <td className="px-3 py-2.5 font-mono text-xs text-foreground">
                      {fmtUsd(row.openInterestUsd)}
                    </td>

                    {/* Top Trader Long % */}
                    <td className="px-3 py-2.5">
                      {lp !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-danger/30">
                            <div className="h-full rounded-full bg-success" style={{ width: `${lp}%` }} />
                          </div>
                          <span className="font-mono text-[10px] text-success font-medium">{lp.toFixed(1)}%</span>
                        </div>
                      ) : (
                        <span className="font-mono text-[10px] text-faint">--</span>
                      )}
                    </td>

                    {/* Taker Ratio */}
                    <td className={`px-3 py-2.5 font-mono text-xs font-semibold ${
                      row.takerRatio === null ? "text-faint" : isBull ? "text-success" : "text-danger"
                    }`}>
                      {row.takerRatio !== null ? `${row.takerRatio.toFixed(3)}x` : "--"}
                    </td>

                    {/* 8h Funding Rate */}
                    <td className={`px-3 py-2.5 font-mono text-xs ${
                      row.fundingPct === null
                        ? "text-faint"
                        : (row.fundingPct ?? 0) > 0.05
                        ? "text-danger"
                        : (row.fundingPct ?? 0) < 0
                        ? "text-success"
                        : "text-muted"
                    }`}>
                      {row.fundingPct !== null ? `${row.fundingPct >= 0 ? "+" : ""}${row.fundingPct.toFixed(4)}%` : "--"}
                    </td>

                    {/* Regime */}
                    <td className="px-3 py-2.5">
                      <span className={`rounded border px-2 py-0.5 font-mono text-[9px] ${
                        REGIME_COLOR[row.regime] ?? REGIME_COLOR["Active Perp"]
                      }`}>
                        {row.regime}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination / Show More ── */}
      {filteredAndSorted.length > pageSize && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPageSize((prev) => Math.min(prev + 50, filteredAndSorted.length))}
            className="rounded border border-border bg-surface px-4 py-2 font-mono text-xs text-foreground hover:border-accent hover:text-accent transition-colors"
          >
            Show Next 50 Contracts ({displayedAssets.length} of {filteredAndSorted.length})
          </button>
          <button
            onClick={() => setPageSize(filteredAndSorted.length)}
            className="rounded border border-border bg-surface-raised px-4 py-2 font-mono text-xs text-muted hover:text-foreground transition-colors"
          >
            Show All ({filteredAndSorted.length})
          </button>
        </div>
      )}

      {/* Footer methodology watermark */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-faint font-mono text-[9px]">
        <span>
          Data Pipeline: Binance Agent OS · Direct ingestion from Binance Futures Public API (`fapi.binance.com`)
        </span>
        <span>
          Cryptographically Anchored on BNB Smart Chain (BSC Testnet)
        </span>
      </div>
    </div>
  );
}
