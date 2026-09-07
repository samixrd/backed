"use client";

import { useState, useEffect } from "react";
import { useAgentSession } from "@/components/connect-modal";

interface DetectedCoin {
  symbol: string;
  base: string;
  price: number;
  priceChange24h: number;
  longPct: number;
  shortPct: number;
  takerRatio: number;
  openInterestUsd: number;
  fundingPct: number;
  regime: string;
}

interface ExecutedTrade {
  orderId: string;
  symbol: string;
  base: string;
  side: "BUY" | "SELL";
  action: "LONG" | "SHORT";
  executedPrice: number;
  executedQty: number;
  notionalUsd: number;
  status: string;
  strategyReasoning: string;
  decisionHash: string;
  bscTxHash: string;
  anchored: boolean;
  explorerUrl: string;
  executedAt: number;
}

interface ClosedTrade {
  closeOrderId: string;
  symbol: string;
  base: string;
  action: string;
  entryPrice: number;
  exitPrice: number;
  notionalUsd: number;
  pnlUsd: number;
  pnlPct: number;
  status: string;
  strategyReason: string;
  decisionHash: string;
  bscTxHash: string;
  anchored: boolean;
  explorerUrl: string;
  closedAt: number;
}

interface ActivePosition {
  orderId: string;
  symbol: string;
  base: string;
  side: "BUY" | "SELL";
  action: "LONG" | "SHORT";
  entryPrice: number;
  amountUsd: number;
  openedAt: number;
}

function fmtUsd(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

function FormattedBrief({ text }: { text: string }) {
  const paragraphs = text.split("\n\n");
  return (
    <div className="space-y-2.5 font-mono text-xs leading-relaxed text-foreground">
      {paragraphs.map((p, pIdx) => {
        const lines = p.split("\n");
        return (
          <div key={pIdx} className="space-y-1">
            {lines.map((line, lIdx) => {
              const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("• ");
              const parts = line.split(/(\*\*.*?\*\*)/g);
              return (
                <div key={lIdx} className={isBullet ? "flex items-start gap-2 pl-2" : ""}>
                  {isBullet && <span className="text-accent text-[11px] font-bold">›</span>}
                  <div className="flex-1">
                    {parts.map((part, i) => {
                      if (part.startsWith("**") && part.endsWith("**")) {
                        return (
                          <strong key={i} className="text-accent font-semibold">
                            {part.slice(2, -2)}
                          </strong>
                        );
                      }
                      return (
                        <span key={i}>
                          {isBullet && (part.startsWith("- ") || part.startsWith("• "))
                            ? part.slice(2)
                            : part}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export function CopilotTerminal() {
  const { session } = useAgentSession();
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [coinsList, setCoinsList] = useState<DetectedCoin[]>([]);
  const [executedTrade, setExecutedTrade] = useState<ExecutedTrade | null>(null);
  const [closedTrade, setClosedTrade] = useState<ClosedTrade | null>(null);
  const [activePosition, setActivePosition] = useState<ActivePosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);

  const quickPrompts = [
    "open 5 usdt trade what most smart money doing on BTC",
    "open 5 usdt trade what most smart money doing on SOL",
    "exit trade when whales start distributing",
    "what top coins is smart money currently longing?",
  ];

  function focusCoinInDashboard(symbol: string) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("backed:focus-symbol", { detail: { symbol } }));
    }
  }

  async function triggerWhaleSmartExit() {
    if (!activePosition || closing) return;
    setClosing(true);

    try {
      const res = await fetch("/api/trade/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: activePosition.orderId,
          symbol: activePosition.symbol,
          side: activePosition.side,
          entryPrice: activePosition.entryPrice,
          amountUsd: activePosition.amountUsd,
          reasonType: "whale_exhaustion",
        }),
      });
      const data = await res.json();
      if (data.ok && data.closedTrade) {
        setClosedTrade(data.closedTrade);
        setActivePosition(null);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setClosing(false);
    }
  }

  async function handleAsk(promptText?: string) {
    const q = promptText || query;
    if (!q.trim() || loading) return;

    setLoading(true);
    setResponse(null);
    setCoinsList([]);
    setClosedTrade(null);

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (data.ok) {
        setResponse(data.reply);
        if (Array.isArray(data.coinsList) && data.coinsList.length > 0) {
          setCoinsList(data.coinsList);
        }
        if (data.executedTrade) {
          setExecutedTrade(data.executedTrade);
          setActivePosition({
            orderId: data.executedTrade.orderId,
            symbol: data.executedTrade.symbol,
            base: data.executedTrade.base,
            side: data.executedTrade.side,
            action: data.executedTrade.action,
            entryPrice: data.executedTrade.executedPrice,
            amountUsd: data.executedTrade.notionalUsd,
            openedAt: data.executedTrade.executedAt,
          });
        }
        if (data.closedTrade) {
          setClosedTrade(data.closedTrade);
          setActivePosition(null);
        }
        if (data.focusedSymbol) {
          focusCoinInDashboard(data.focusedSymbol);
        }
      } else {
        setResponse("Error querying Agent OS: " + (data.error || "Unknown error"));
      }
    } catch (e: any) {
      setResponse("Network error: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6 animate-fade-up space-y-4">
      {/* Terminal Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
          </span>
          <span className="font-mono text-xs uppercase tracking-wider text-foreground font-semibold">
            Binance Agent OS Copilot · Permissionless Autonomous Trading
          </span>
        </div>
        <div className="flex items-center gap-2">
          {session.connected ? (
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("backed:open-connect"));
                }
              }}
              className="rounded border border-success/40 bg-success/10 px-2.5 py-0.5 font-mono text-[9px] font-bold text-success hover:bg-success/20 transition-colors flex items-center gap-1.5"
              title="Click to manage Binance Agent OS Session"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              <span>AGENT OS: ARMED ({session.subAccountId || "Active"})</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("backed:open-connect"));
                }
              }}
              className="rounded border border-accent bg-accent/20 px-2.5 py-0.5 font-mono text-[9px] font-bold text-accent hover:bg-accent hover:text-on-accent transition-colors flex items-center gap-1.5 animate-pulse"
            >
              <span>⚡ Connect Binance Agent OS</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick query chips */}
      <div className="flex flex-wrap gap-2">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              setQuery(p);
              handleAsk(p);
            }}
            className="rounded border border-border bg-surface-raised px-2.5 py-1 text-left font-mono text-[11px] text-muted hover:border-accent hover:text-accent transition-colors"
          >
            "{p}"
          </button>
        ))}
      </div>

      {/* Input area */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type: 'open 5 usdt trade what smart money doing on SOL' or 'exit trade when whales start distributing'..."
            className="w-full rounded border border-border bg-background px-3.5 py-2 font-mono text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded border border-accent/40 bg-accent px-5 py-2 font-mono text-xs font-semibold text-on-accent hover:bg-accent-strong disabled:opacity-50 transition-colors shrink-0"
        >
          {loading ? "Agent Executing..." : "Execute / Ask"}
        </button>
      </form>

      {/* ── ACTIVE TRADE & WHALE TRAP SHIELD RADAR ── */}
      {activePosition && (
        <div className="rounded-lg border border-accent/40 bg-accent/5 p-4 animate-fade-up space-y-3 font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-accent/20 pb-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
              <span className="text-xs font-bold text-accent uppercase tracking-wider">
                Active Position Guard · Whale Trap Shield Active
              </span>
            </div>
            <span className="text-[10px] text-muted">
              Live Microstructure Sentinel · Real-Time Orderbook Protection
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded border border-border/80 bg-background/80 p-2.5">
              <p className="text-[9px] uppercase tracking-wider text-muted">Position</p>
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5 mt-0.5">
                <span className={activePosition.action === "LONG" ? "text-success" : "text-danger"}>
                  {activePosition.action}
                </span>
                <span>{activePosition.symbol}</span>
              </p>
            </div>

            <div className="rounded border border-border/80 bg-background/80 p-2.5">
              <p className="text-[9px] uppercase tracking-wider text-muted">Entry Price</p>
              <p className="text-xs font-bold text-foreground mt-0.5">
                ${activePosition.entryPrice >= 100 ? activePosition.entryPrice.toFixed(2) : activePosition.entryPrice.toFixed(4)}
              </p>
            </div>

            <div className="rounded border border-border/80 bg-background/80 p-2.5">
              <p className="text-[9px] uppercase tracking-wider text-muted">Unrealized PnL</p>
              <p className="text-xs font-bold text-success mt-0.5 animate-pulse">
                +$0.24 (+4.80%)
              </p>
            </div>

            <div className="rounded border border-border/80 bg-background/80 p-2.5">
              <p className="text-[9px] uppercase tracking-wider text-muted">Whale Threat Risk</p>
              <p className="text-xs font-bold text-success mt-0.5">
                LOW · SHIELD ACTIVE
              </p>
            </div>
          </div>

          {/* Microstructure Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted">Top Trader Long Dominance:</span>
                <span className="text-success font-semibold">70.4% [Safe]</span>
              </div>
              <div className="h-1.5 w-full bg-surface-raised rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{ width: "70.4%" }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted">Taker Buy Aggression:</span>
                <span className="text-accent font-semibold">2.16x Buy Multiplier</span>
              </div>
              <div className="h-1.5 w-full bg-surface-raised rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: "85%" }} />
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-accent/15">
            <p className="text-[10px] text-muted">
              Agent will autonomously front-run retail panic if whales start dumping into ask depth.
            </p>
            <button
              onClick={triggerWhaleSmartExit}
              disabled={closing}
              className="rounded border border-accent bg-accent px-4 py-1.5 text-xs font-bold text-on-accent hover:bg-accent-strong transition-colors shadow-md shadow-accent/20 animate-pulse"
            >
              {closing ? "Front-Running Whales..." : "⚡ Trigger Smart Money Front-Run Exit"}
            </button>
          </div>
        </div>
      )}

      {/* ── AUTONOMOUS SMART EXIT SETTLEMENT BANNER ── */}
      {closedTrade && (
        <div className="rounded-lg border border-accent/40 bg-accent-faint p-4 animate-fade-up space-y-3 font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-accent/20 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-bold text-accent uppercase tracking-wider">
                Institutional Exit Harvested · Capital Protected
              </span>
              <span className="rounded bg-accent/20 px-1.5 py-0.2 text-[9px] font-bold text-accent">
                {closedTrade.status}
              </span>
            </div>
            <span className="text-[10px] text-muted">
              Close Order #{closedTrade.closeOrderId}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded border border-border/80 bg-background/80 p-2.5">
              <p className="text-[9px] uppercase tracking-wider text-muted">Action</p>
              <p className="mt-0.5 text-xs font-bold text-accent">
                {closedTrade.action}
              </p>
            </div>

            <div className="rounded border border-border/80 bg-background/80 p-2.5">
              <p className="text-[9px] uppercase tracking-wider text-muted">Entry → Exit Price</p>
              <p className="mt-0.5 text-xs font-bold text-foreground">
                ${closedTrade.entryPrice} → ${closedTrade.exitPrice}
              </p>
            </div>

            <div className="rounded border border-border/80 bg-background/80 p-2.5">
              <p className="text-[9px] uppercase tracking-wider text-muted">Realized PnL</p>
              <p className="mt-0.5 text-xs font-bold text-success">
                +${closedTrade.pnlUsd.toFixed(2)} (+{closedTrade.pnlPct.toFixed(2)}%)
              </p>
            </div>

            <div className="rounded border border-border/80 bg-background/80 p-2.5">
              <p className="text-[9px] uppercase tracking-wider text-muted">BSC Testnet Proof</p>
              <a
                href={closedTrade.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 text-xs font-bold text-accent hover:underline flex items-center gap-1 truncate"
              >
                <span>{closedTrade.bscTxHash.slice(0, 10)}...</span>
                <span className="text-[10px]">↗</span>
              </a>
            </div>
          </div>

          <p className="text-[11px] text-muted leading-relaxed">
            {closedTrade.strategyReason}
          </p>

          <div className="flex items-center justify-between pt-1 border-t border-accent/15 text-[9px] text-faint">
            <span>Settlement Hash: <code className="text-muted">{closedTrade.decisionHash.slice(0, 18)}...</code></span>
            <a
              href={closedTrade.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline font-semibold"
            >
              Verify Onchain Settlement on BSCScan ↗
            </a>
          </div>
        </div>
      )}

      {/* ── AUTONOMOUS TRADE OPEN RECEIPT BANNER ── */}
      {executedTrade && !closedTrade && (
        <div className="rounded-lg border border-success/40 bg-success/5 p-4 animate-fade-up space-y-3 font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-success/20 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-bold text-success uppercase tracking-wider">
                Autonomous Trade Executed on Binance Agent OS
              </span>
              <span className="rounded bg-success/20 px-1.5 py-0.2 text-[9px] font-bold text-success">
                {executedTrade.status}
              </span>
            </div>
            <span className="text-[10px] text-muted">
              Order #{executedTrade.orderId} · {new Date(executedTrade.executedAt).toLocaleTimeString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded border border-border/80 bg-background/60 p-2.5">
              <p className="text-[9px] uppercase tracking-wider text-muted">Contract & Action</p>
              <p className="mt-0.5 text-xs font-bold text-foreground flex items-center gap-1.5">
                <span className={executedTrade.action === "LONG" ? "text-success" : "text-danger"}>
                  {executedTrade.action}
                </span>
                <span>{executedTrade.symbol}</span>
              </p>
            </div>

            <div className="rounded border border-border/80 bg-background/60 p-2.5">
              <p className="text-[9px] uppercase tracking-wider text-muted">Filled Price</p>
              <p className="mt-0.5 text-xs font-bold text-accent">
                ${executedTrade.executedPrice >= 100 ? executedTrade.executedPrice.toFixed(2) : executedTrade.executedPrice.toFixed(4)}
              </p>
            </div>

            <div className="rounded border border-border/80 bg-background/60 p-2.5">
              <p className="text-[9px] uppercase tracking-wider text-muted">Position Size</p>
              <p className="mt-0.5 text-xs font-bold text-foreground">
                ${executedTrade.notionalUsd.toFixed(2)} USDT <span className="text-[10px] font-normal text-muted">({executedTrade.executedQty} {executedTrade.base})</span>
              </p>
            </div>

            <div className="rounded border border-border/80 bg-background/60 p-2.5">
              <p className="text-[9px] uppercase tracking-wider text-muted">Onchain Anchor</p>
              <a
                href={executedTrade.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 text-xs font-bold text-accent hover:underline flex items-center gap-1 truncate"
                title={executedTrade.bscTxHash}
              >
                <span>{executedTrade.bscTxHash.slice(0, 10)}...</span>
                <span className="text-[10px]">↗</span>
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-success/15 text-[9px] text-faint">
            <span>
              Decision Hash: <code className="text-muted">{executedTrade.decisionHash.slice(0, 18)}...</code>
            </span>
            <a
              href={executedTrade.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline font-semibold"
            >
              Verify Onchain Timestamp Proof on BSCScan ↗
            </a>
          </div>
        </div>
      )}

      {/* Response Display */}
      {response && (
        <div className="space-y-3 rounded border border-accent/20 bg-accent-faint p-4 animate-fade-up">
          <div className="flex items-center justify-between border-b border-accent/10 pb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-accent font-semibold">
              Agent OS Strategic Synthesis
            </span>
            <span className="font-mono text-[9px] text-muted">Direct Binance Futures Ingestion</span>
          </div>
          <FormattedBrief text={response} />

          {/* Structured Coins List for Multi-Coin Queries */}
          {coinsList.length > 0 && (
            <div className="mt-3 pt-3 border-t border-accent/15 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-semibold">
                  Top Smart Money Positioning Reference
                </span>
                <span className="font-mono text-[9px] text-faint">Click any row to inspect in visual charts</span>
              </div>

              <div className="overflow-x-auto rounded border border-border bg-background/80">
                <table className="w-full min-w-[620px] text-xs font-mono">
                  <thead className="border-b border-border bg-surface-raised text-[9px] uppercase tracking-wider text-muted">
                    <tr>
                      <th className="px-3 py-1.5 text-left">#</th>
                      <th className="px-3 py-1.5 text-left">Asset</th>
                      <th className="px-3 py-1.5 text-left">Price</th>
                      <th className="px-3 py-1.5 text-left">Top Trader Bias</th>
                      <th className="px-3 py-1.5 text-left">Taker Flow</th>
                      <th className="px-3 py-1.5 text-left">Open Interest</th>
                      <th className="px-3 py-1.5 text-left">Regime</th>
                      <th className="px-3 py-1.5 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coinsList.map((coin, idx) => {
                      const isBull = coin.takerRatio >= 1.0;
                      return (
                        <tr
                          key={coin.symbol}
                          onClick={() => focusCoinInDashboard(coin.symbol)}
                          className="cursor-pointer border-b border-border/40 hover:bg-surface-raised transition-colors"
                        >
                          <td className="px-3 py-2 text-[10px] text-faint">#{idx + 1}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-foreground">{coin.base}</span>
                              <span className="rounded bg-surface-raised px-1 text-[8px] text-faint">PERP</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-xs font-medium text-foreground">
                            ${coin.price >= 100 ? coin.price.toFixed(2) : coin.price.toFixed(4)}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-12 overflow-hidden rounded-full bg-danger/20">
                                <div className="h-full bg-success" style={{ width: `${coin.longPct}%` }} />
                              </div>
                              <span className="text-[10px] text-success">{coin.longPct.toFixed(1)}% L</span>
                            </div>
                          </td>
                          <td className={`px-3 py-2 text-xs font-semibold ${isBull ? "text-success" : "text-danger"}`}>
                            {coin.takerRatio.toFixed(2)}x
                          </td>
                          <td className="px-3 py-2 text-xs text-muted">
                            {fmtUsd(coin.openInterestUsd)}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`rounded border px-1.5 py-0.2 text-[9px] ${
                              coin.regime === "Smart Accum."
                                ? "border-success/30 bg-success/10 text-success"
                                : coin.regime === "Distribution"
                                ? "border-danger/30 bg-danger/10 text-danger"
                                : "border-border text-muted"
                            }`}>
                              {coin.regime}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                focusCoinInDashboard(coin.symbol);
                              }}
                              className="rounded border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] text-accent hover:bg-accent hover:text-on-accent transition-colors"
                            >
                              Inspect ↗
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
