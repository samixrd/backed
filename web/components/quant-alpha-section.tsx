"use client";

import { useState, useEffect } from "react";

interface TradeSetup {
  entryRange: [number, number];
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskRewardRatio: string;
  expectedValuePct: number;
}

interface Workflows {
  claudeCode: string;
  pythonSnippet: string;
  mcpToolCall: string;
}

interface AlphaSignal {
  symbol: string;
  base: string;
  price: number;
  change24h: number;
  volume24h: number;
  openInterestUsd: number;
  topTraderLongPct: number;
  topTraderShortPct: number;
  takerRatio: number;
  fundingPct: number;
  basisSpreadPct: number;
  vpinScore: number;
  marginBeta: number;
  quadrant: string;
  modelType: string;
  modelLabel: string;
  side: "BUY" | "SELL";
  action: string;
  confidence: number;
  winProbability: number;
  thesis: string;
  tradeSetup: TradeSetup;
  workflows: Workflows;
}

function fmtUsd(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

function getQuadrantBadge(quad: string) {
  switch (quad) {
    case "Q1_CAPITAL_EXPANSION":
      return { label: "Q1 Capital Expansion (Price ▲ · OI ▲)", color: "text-success bg-success/10 border-success/30" };
    case "Q2_SHORT_COVERING_EXHAUSTION":
      return { label: "Q2 Short Covering (Price ▲ · OI ▼)", color: "text-accent bg-accent/10 border-accent/30" };
    case "Q3_INSTITUTIONAL_SHORTING":
      return { label: "Q3 Short Initiation (Price ▼ · OI ▲)", color: "text-danger bg-danger/10 border-danger/30" };
    case "Q4_LIQUIDATION_FLUSH_BOTTOM":
      return { label: "Q4 Liquidation Flush (Price ▼ · OI ▼)", color: "text-success bg-success/10 border-success/30" };
    default:
      return { label: "Equilibrium Flow", color: "text-muted bg-surface border-border" };
  }
}

export function QuantAlphaSection() {
  const [signals, setSignals] = useState<AlphaSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>("ALL");
  const [selectedSignal, setSelectedSignal] = useState<AlphaSignal | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [workflowTab, setWorkflowTab] = useState<"claude" | "python" | "mcp">("claude");

  async function loadSignals(isManual = false) {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/alpha/signals");
      const json = await res.json();
      if (json.ok && Array.isArray(json.signals)) {
        setSignals(json.signals);
        if (json.signals.length > 0 && (!selectedSignal || isManual)) {
          setSelectedSignal(json.signals[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load alpha signals", err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }

  useEffect(() => {
    loadSignals();
    // 60-second interval: optimal for free-tier rate-limits & serverless cache
    const interval = setInterval(() => loadSignals(false), 60000);
    return () => clearInterval(interval);
  }, []);

  function handleCopy(text: string, key: string) {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  }

  const filteredSignals = signals.filter((s) => {
    if (filter === "ALL") return true;
    return s.modelType === filter;
  });

  const active = selectedSignal || signals[0] || null;

  return (
    <div className="space-y-6 font-mono">
      {/* ── Section Header: Quant Firm Alpha Engine ── */}
      <div className="rounded-xl border border-border bg-surface p-5 sm:p-6 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent" />
            </span>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Institutional Quant Alpha &amp; Execution Workflows
              </h2>
              <p className="text-[11px] text-muted">
                VPIN Toxicity · Margin Beta ($\beta$) · OI Velocity Matrix · Non-Custodial Workflows
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent">
              Zero Custody
            </span>
            <button
              onClick={() => loadSignals(true)}
              disabled={refreshing}
              className="rounded border border-border bg-surface-raised px-2.5 py-1 text-[10px] text-muted hover:border-accent hover:text-accent transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Click to manually refresh alpha signals from Binance"
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-3 w-3 stroke-current fill-none ${refreshing ? "animate-spin text-accent" : ""}`}
                strokeWidth="2"
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l6 6" />
              </svg>
              <span>{refreshing ? "Syncing..." : "Sync (60s Auto)"}</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-muted leading-relaxed">
          BACKED operates as an institutional quantitative intelligence oracle on Binance Agent OS. We do <strong className="text-foreground">NOT</strong> buy, sell, or hold assets. Our quantitative engine continuously scans 718 perpetual contracts across 4 algorithmic pillars: <strong className="text-accent">VPIN Flow Toxicity</strong>, <strong className="text-accent">Top Trader Margin Beta ($\beta$)</strong>, <strong className="text-accent">4-Quadrant OI Velocity</strong>, and <strong className="text-accent">Spot-Futures Basis Dislocation</strong>. Dispatch mathematical trade setups to external agents (Claude Code, Cursor, Grok, Hermes, Python) for autonomous execution on your own exchange accounts.
        </p>
      </div>

      {/* ── Filter Buttons ── */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-2 text-xs">
        <span className="text-[11px] text-muted uppercase tracking-wider mr-2">Alpha Model:</span>
        {[
          { id: "ALL", label: "All Quant Signals" },
          { id: "FLOW_ABSORPTION", label: "Informed Flow Absorption" },
          { id: "NEGATIVE_FUNDING_SQUEEZE", label: "Negative Funding Squeeze" },
          { id: "WHALE_EXIT_TRAP", label: "Whale Distribution Trap" },
          { id: "LIQUIDATION_FLUSH_REVERSAL", label: "Liquidation Bottom" },
          { id: "MOMENTUM_EXPANSION", label: "Momentum Expansion" },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFilter(btn.id)}
            className={`px-3 py-1 rounded text-[11px] font-semibold transition-colors border ${
              filter === btn.id
                ? "border-accent text-accent bg-accent/10"
                : "border-border/60 text-muted hover:text-foreground hover:border-border"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* ── Main Layout: Signal Grid on Left / Deep Dive & Workflow on Right ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Quant Alpha Signal Cards */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted px-1">
            <span className="uppercase tracking-wider">Detected Quant Signals ({filteredSignals.length})</span>
            <span>Sorted by Conviction Score</span>
          </div>

          {loading && signals.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface p-8 text-center text-xs text-muted">
              Calculating VPIN flow toxicity and open interest velocity across 718 contracts...
            </div>
          ) : filteredSignals.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface p-8 text-center text-xs text-muted">
              No active signals matching this filter right now. Monitoring live orderflow...
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[760px] overflow-y-auto pr-1">
              {filteredSignals.map((sig) => {
                const isSelected = active?.symbol === sig.symbol;
                const isLong = sig.side === "BUY";
                return (
                  <div
                    key={sig.symbol}
                    onClick={() => setSelectedSignal(sig)}
                    className={`cursor-pointer rounded-lg border p-3.5 transition-all ${
                      isSelected
                        ? "border-accent bg-accent/5 shadow-md shadow-accent/5"
                        : "border-border bg-surface hover:border-border-raised hover:bg-surface-raised"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground tracking-wide">
                          {sig.symbol}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            isLong
                              ? "bg-success/20 text-success border border-success/30"
                              : "bg-danger/20 text-danger border border-danger/30"
                          }`}
                        >
                          {sig.action}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted">Score:</span>
                        <span className="text-xs font-bold text-accent">{sig.confidence}%</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-muted line-clamp-2 leading-relaxed mb-2.5">
                      {sig.thesis}
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-border/40 pt-2 text-[10px]">
                      <div>
                        <span className="text-muted block">Mark Price</span>
                        <span className="font-semibold text-foreground">${sig.price.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted block">VPIN Toxicity</span>
                        <span className="font-semibold text-accent">{sig.vpinScore ?? "0.24"}</span>
                      </div>
                      <div>
                        <span className="text-muted block">Top Trader Margin</span>
                        <span className="font-semibold text-foreground">{sig.topTraderLongPct}% L</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Deep Quant Inspector & Non-Custodial Execution Workflow */}
        <div className="lg:col-span-7 space-y-4">
          {active ? (
            <>
              {/* Selected Contract Header & Metrics */}
              <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3.5">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-bold text-foreground tracking-wide">
                        {active.symbol}
                      </h3>
                      <span className="text-xs font-semibold text-muted">
                        ${active.price.toLocaleString()}
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          active.change24h >= 0 ? "text-success" : "text-danger"
                        }`}
                      >
                        {active.change24h >= 0 ? "+" : ""}{active.change24h.toFixed(2)}%
                      </span>
                    </div>
                    <span className="text-[10px] text-muted">
                      Quant Alpha Model: <strong className="text-accent">{active.modelLabel}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded bg-accent/20 border border-accent/40 px-2.5 py-1 text-xs font-bold text-accent">
                      {active.confidence}% Conviction Score
                    </span>
                  </div>
                </div>

                {/* 4-Quadrant Velocity State Badge */}
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <span className="text-[10px] text-muted uppercase tracking-wider">Velocity Regime:</span>
                  <span className={`rounded border px-2.5 py-0.5 text-[11px] font-bold ${getQuadrantBadge(active.quadrant).color}`}>
                    {getQuadrantBadge(active.quadrant).label}
                  </span>
                </div>

                {/* Hardcore Quantitative Microstructure Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="rounded border border-border bg-surface-raised p-2.5">
                    <span className="text-[10px] text-muted block mb-0.5">VPIN Flow Toxicity</span>
                    <div className="font-bold text-accent text-sm">
                      {active.vpinScore ?? "0.25"}
                    </div>
                    <span className="text-[9px] text-muted">Informed order probability</span>
                  </div>

                  <div className="rounded border border-border bg-surface-raised p-2.5">
                    <span className="text-[10px] text-muted block mb-0.5">Top Trader Margin Beta</span>
                    <div className={`font-bold text-sm ${active.marginBeta >= 0 ? "text-success" : "text-danger"}`}>
                      {active.marginBeta >= 0 ? `+${active.marginBeta}` : active.marginBeta}
                    </div>
                    <span className="text-[9px] text-muted">
                      {active.topTraderLongPct}% Long / {active.topTraderShortPct}% Short
                    </span>
                  </div>

                  <div className="rounded border border-border bg-surface-raised p-2.5">
                    <span className="text-[10px] text-muted block mb-0.5">Taker CVD Ratio</span>
                    <div className={`font-bold text-sm ${active.takerRatio >= 1.0 ? "text-success" : "text-danger"}`}>
                      {active.takerRatio}x
                    </div>
                    <span className="text-[9px] text-muted">
                      {active.takerRatio >= 1.0 ? "Aggressive Buyer Dominance" : "Aggressive Seller Pressure"}
                    </span>
                  </div>

                  <div className="rounded border border-border bg-surface-raised p-2.5">
                    <span className="text-[10px] text-muted block mb-0.5">Basis &amp; Funding (8h)</span>
                    <div className={`font-bold text-sm ${active.fundingPct < 0 ? "text-success" : "text-foreground"}`}>
                      {active.fundingPct > 0 ? "+" : ""}{active.fundingPct}%
                    </div>
                    <span className="text-[9px] text-muted">
                      Basis: {active.basisSpreadPct}%
                    </span>
                  </div>
                </div>

                {/* Quantitative Rationale / Edge Thesis */}
                <div className="rounded border border-border bg-surface-raised p-3 text-xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-accent tracking-wider block">
                    Institutional Edge Thesis
                  </span>
                  <p className="text-muted leading-relaxed">
                    {active.thesis}
                  </p>
                </div>
              </div>

              {/* Actionable Quant Execution Parameters (Non-Custodial Blueprint) */}
              <div className="rounded-xl border border-accent/30 bg-accent/5 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-accent/20 pb-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-accent">
                      Non-Custodial Execution Blueprint
                    </h4>
                    <p className="text-[10px] text-muted">
                      Optimized risk-adjusted parameters for external agent execution
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-success/10 border border-success/30 px-2 py-0.5 text-[10px] font-bold text-success">
                      EV: +{active.tradeSetup.expectedValuePct}%
                    </span>
                    <span className="text-xs font-bold text-foreground font-mono">
                      R:R {active.tradeSetup.riskRewardRatio}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="rounded border border-border bg-surface p-2.5">
                    <span className="text-[10px] text-muted block">Entry Limit Zone</span>
                    <span className="font-bold text-foreground">
                      ${active.tradeSetup.entryRange[0]} – ${active.tradeSetup.entryRange[1]}
                    </span>
                  </div>
                  <div className="rounded border border-danger/30 bg-danger/5 p-2.5">
                    <span className="text-[10px] text-danger block">Hard Invalidation (SL)</span>
                    <span className="font-bold text-danger">
                      ${active.tradeSetup.stopLoss}
                    </span>
                  </div>
                  <div className="rounded border border-success/30 bg-success/5 p-2.5">
                    <span className="text-[10px] text-success block">Target 1 (Liquidity Pool)</span>
                    <span className="font-bold text-success">
                      ${active.tradeSetup.takeProfit1}
                    </span>
                  </div>
                  <div className="rounded border border-success/30 bg-success/5 p-2.5">
                    <span className="text-[10px] text-success block">Target 2 (Fair Value Reversion)</span>
                    <span className="font-bold text-success">
                      ${active.tradeSetup.takeProfit2}
                    </span>
                  </div>
                </div>

                {/* External Agent Dispatch Workflows */}
                <div className="space-y-2 pt-2 border-t border-accent/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                      Execute in Your Agent Runtime
                    </span>
                    <div className="flex gap-1">
                      {(["claude", "python", "mcp"] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setWorkflowTab(tab)}
                          className={`px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                            workflowTab === tab
                              ? "bg-accent text-on-accent font-bold"
                              : "bg-surface text-muted hover:text-foreground"
                          }`}
                        >
                          {tab === "claude" ? "Claude Code" : tab === "python" ? "Python / CCXT" : "MCP Tool"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {workflowTab === "claude" && (
                    <div className="relative rounded border border-border bg-background p-2.5">
                      <pre className="text-[11px] text-accent overflow-x-auto select-all pr-16 whitespace-pre-wrap">
                        {active.workflows.claudeCode}
                      </pre>
                      <button
                        onClick={() => handleCopy(active.workflows.claudeCode, "claude")}
                        className="absolute top-2 right-2 rounded border border-accent/30 bg-accent/10 px-2 py-0.5 text-[9px] font-bold text-accent hover:bg-accent hover:text-on-accent transition-colors"
                      >
                        {copiedKey === "claude" ? "Copied ✓" : "Copy Prompt"}
                      </button>
                    </div>
                  )}

                  {workflowTab === "python" && (
                    <div className="relative rounded border border-border bg-background p-2.5">
                      <pre className="text-[11px] text-accent overflow-x-auto select-all pr-16 whitespace-pre-wrap">
                        {active.workflows.pythonSnippet}
                      </pre>
                      <button
                        onClick={() => handleCopy(active.workflows.pythonSnippet, "python")}
                        className="absolute top-2 right-2 rounded border border-accent/30 bg-accent/10 px-2 py-0.5 text-[9px] font-bold text-accent hover:bg-accent hover:text-on-accent transition-colors"
                      >
                        {copiedKey === "python" ? "Copied ✓" : "Copy Code"}
                      </button>
                    </div>
                  )}

                  {workflowTab === "mcp" && (
                    <div className="relative rounded border border-border bg-background p-2.5">
                      <pre className="text-[11px] text-accent overflow-x-auto select-all pr-16 whitespace-pre-wrap">
                        {active.workflows.mcpToolCall}
                      </pre>
                      <button
                        onClick={() => handleCopy(active.workflows.mcpToolCall, "mcp")}
                        className="absolute top-2 right-2 rounded border border-accent/30 bg-accent/10 px-2 py-0.5 text-[9px] font-bold text-accent hover:bg-accent hover:text-on-accent transition-colors"
                      >
                        {copiedKey === "mcp" ? "Copied ✓" : "Copy Tool Call"}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-12 text-center text-xs text-muted">
              Select a signal on the left to inspect quantitative microstructure metrics and agent execution workflows.
            </div>
          )}
        </div>
      </div>

      {/* ── Hardcore Quant Strategies Mathematical Rationale ── */}
      <div className="rounded-xl border border-border bg-surface p-5 space-y-4 text-xs">
        <div className="border-b border-border pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            How Quantitative Desks Exploit Binance Futures Microstructure
          </h3>
          <p className="text-[10px] text-muted mt-0.5">
            The statistical edge behind BACKED's continuous 718-contract surveillance engine
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-surface-raised p-3.5 space-y-2">
            <span className="text-[11px] font-bold text-accent uppercase tracking-wider block">
              1. VPIN &amp; Taker Imbalance
            </span>
            <p className="text-muted leading-relaxed text-[11px]">
              VPIN measures the probability of informed trading volume. Passive market makers get adversely selected when informed capital aggresses. When Taker Buy/Sell ratio &gt; 1.20x during consolidation, institutions are absorbing limit orderbooks prior to markup.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface-raised p-3.5 space-y-2">
            <span className="text-[11px] font-bold text-accent uppercase tracking-wider block">
              2. Top Trader Margin Beta ($\beta$)
            </span>
            <p className="text-muted leading-relaxed text-[11px]">
              The top 20% margin-collateralized accounts on Binance yield strong positive alpha. When retail crowd is crowded long (&gt;65%) but Top Trader margin beta drops negative ($\beta &lt; -1.0$), whales are using retail liquidity to exit.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface-raised p-3.5 space-y-2">
            <span className="text-[11px] font-bold text-accent uppercase tracking-wider block">
              3. 4-Quadrant Velocity Matrix
            </span>
            <p className="text-muted leading-relaxed text-[11px]">
              Price action without Open Interest delta is uncalibrated noise. Price UP + OI UP confirms genuine capital expansion. Price UP + OI DOWN isolates short covering exhaustion. Price DOWN + OI DOWN detects liquidation cascade bottoms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
